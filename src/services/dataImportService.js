/**
 * Data Import Service
 * Handles CSV/Excel parsing and import for onboarding
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Expected column mappings for each data type
export const IMPORT_SCHEMAS = {
    clients: {
        required: ['name'],
        optional: ['email', 'phone', 'company', 'address', 'notes', 'website'],
        aliases: {
            name: ['client name', 'client', 'contact name', 'contact'],
            email: ['email address', 'e-mail', 'mail'],
            phone: ['phone number', 'telephone', 'tel', 'mobile'],
            company: ['company name', 'organization', 'org', 'business'],
            address: ['address', 'location', 'street'],
            notes: ['notes', 'comments', 'description'],
            website: ['website', 'url', 'web'],
        },
    },
    crew: {
        required: ['name'],
        optional: ['email', 'phone', 'role', 'day_rate', 'notes', 'skills'],
        aliases: {
            name: ['crew name', 'contact name', 'full name', 'crew member'],
            email: ['email address', 'e-mail', 'mail'],
            phone: ['phone number', 'telephone', 'tel', 'mobile'],
            role: ['role', 'position', 'job title', 'title', 'department'],
            day_rate: ['day rate', 'rate', 'daily rate', 'fee', 'cost'],
            notes: ['notes', 'comments', 'description', 'bio'],
            skills: ['skills', 'expertise', 'specialties'],
        },
    },
    equipment: {
        required: ['name'],
        optional: ['category', 'day_rate', 'quantity', 'serial_number', 'notes', 'condition'],
        aliases: {
            name: ['equipment name', 'item name', 'item', 'gear'],
            category: ['category', 'type', 'group', 'department'],
            day_rate: ['day rate', 'rate', 'daily rate', 'rental', 'cost'],
            quantity: ['quantity', 'qty', 'count', 'amount'],
            serial_number: ['serial number', 'serial', 'sn', 'asset id'],
            notes: ['notes', 'comments', 'description'],
            condition: ['condition', 'status', 'state'],
        },
    },
};

/**
 * Parse CSV content into structured data
 */
export function parseCSV(csvContent) {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return { headers: [], rows: [] };

    // Parse header row
    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());

    // Parse data rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.some(v => v.trim())) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index]?.trim() || '';
            });
            rows.push(row);
        }
    }

    return { headers, rows };
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current);

    return values;
}

/**
 * Map CSV headers to schema fields
 */
export function mapHeaders(headers, dataType) {
    const schema = IMPORT_SCHEMAS[dataType];
    if (!schema) return null;

    const mapping = {};
    const unmapped = [];

    headers.forEach(header => {
        const normalizedHeader = header.toLowerCase().trim();
        let matched = false;

        // Check direct field names
        const allFields = [...schema.required, ...schema.optional];
        for (const field of allFields) {
            if (normalizedHeader === field) {
                mapping[header] = field;
                matched = true;
                break;
            }
        }

        // Check aliases
        if (!matched) {
            for (const [field, aliases] of Object.entries(schema.aliases)) {
                if (aliases.some(alias => normalizedHeader === alias.toLowerCase())) {
                    mapping[header] = field;
                    matched = true;
                    break;
                }
            }
        }

        if (!matched) {
            unmapped.push(header);
        }
    });

    return { mapping, unmapped };
}

/**
 * Validate import data against schema
 */
export function validateImportData(rows, mapping, dataType) {
    const schema = IMPORT_SCHEMAS[dataType];
    if (!schema) return { valid: [], invalid: [], errors: ['Unknown data type'] };

    const valid = [];
    const invalid = [];
    const errors = [];

    // Check if required fields are mapped
    const mappedFields = Object.values(mapping);
    const missingRequired = schema.required.filter(f => !mappedFields.includes(f));

    if (missingRequired.length > 0) {
        errors.push(`Missing required fields: ${missingRequired.join(', ')}`);
        return { valid: [], invalid: rows, errors };
    }

    // Validate each row
    rows.forEach((row, index) => {
        const transformedRow = {};
        let isValid = true;
        const rowErrors = [];

        // Map values to schema fields
        for (const [header, field] of Object.entries(mapping)) {
            transformedRow[field] = row[header] || '';
        }

        // Check required fields have values
        for (const field of schema.required) {
            if (!transformedRow[field]?.trim()) {
                isValid = false;
                rowErrors.push(`Row ${index + 1}: Missing required field "${field}"`);
            }
        }

        // Validate numeric fields
        if (transformedRow.day_rate && transformedRow.day_rate.trim()) {
            const rate = parseFloat(transformedRow.day_rate.replace(/[^0-9.-]/g, ''));
            if (isNaN(rate)) {
                rowErrors.push(`Row ${index + 1}: Invalid day rate "${transformedRow.day_rate}"`);
            } else {
                transformedRow.day_rate = rate;
            }
        }

        if (transformedRow.quantity && transformedRow.quantity.trim()) {
            const qty = parseInt(transformedRow.quantity.replace(/[^0-9]/g, ''), 10);
            if (isNaN(qty)) {
                rowErrors.push(`Row ${index + 1}: Invalid quantity "${transformedRow.quantity}"`);
            } else {
                transformedRow.quantity = qty;
            }
        }

        if (isValid) {
            valid.push(transformedRow);
        } else {
            invalid.push({ row: transformedRow, errors: rowErrors });
            errors.push(...rowErrors);
        }
    });

    return { valid, invalid, errors };
}

/**
 * Import clients to database
 */
export async function importClients(clients, organizationId, userId) {
    if (!isSupabaseConfigured()) {
        return { success: false, error: 'Database not configured', imported: 0 };
    }

    const records = clients.map(client => ({
        organization_id: organizationId,
        created_by: userId,
        name: client.name,
        email: client.email || null,
        phone: client.phone || null,
        company: client.company || null,
        address: client.address || null,
        notes: client.notes || null,
        website: client.website || null,
        status: 'active',
        source: 'import',
    }));

    const { data, error } = await supabase
        .from('clients')
        .insert(records)
        .select();

    if (error) {
        console.error('Error importing clients:', error);
        return { success: false, error: error.message, imported: 0 };
    }

    return { success: true, imported: data.length, data };
}

/**
 * Import crew members to database
 */
export async function importCrew(crew, organizationId, userId) {
    if (!isSupabaseConfigured()) {
        return { success: false, error: 'Database not configured', imported: 0 };
    }

    const records = crew.map(member => ({
        organization_id: organizationId,
        created_by: userId,
        name: member.name,
        email: member.email || null,
        phone: member.phone || null,
        role: member.role || null,
        day_rate: member.day_rate || null,
        notes: member.notes || null,
        skills: member.skills ? member.skills.split(',').map(s => s.trim()) : [],
        status: 'active',
        source: 'import',
    }));

    const { data, error } = await supabase
        .from('crew')
        .insert(records)
        .select();

    if (error) {
        console.error('Error importing crew:', error);
        return { success: false, error: error.message, imported: 0 };
    }

    return { success: true, imported: data.length, data };
}

/**
 * Import equipment to database
 */
export async function importEquipment(equipment, organizationId, userId) {
    if (!isSupabaseConfigured()) {
        return { success: false, error: 'Database not configured', imported: 0 };
    }

    const records = equipment.map(item => ({
        organization_id: organizationId,
        created_by: userId,
        name: item.name,
        category: item.category || 'other',
        day_rate: item.day_rate || null,
        quantity: item.quantity || 1,
        serial_number: item.serial_number || null,
        notes: item.notes || null,
        condition: item.condition || 'good',
        status: 'available',
        source: 'import',
    }));

    const { data, error } = await supabase
        .from('equipment')
        .insert(records)
        .select();

    if (error) {
        console.error('Error importing equipment:', error);
        return { success: false, error: error.message, imported: 0 };
    }

    return { success: true, imported: data.length, data };
}

/**
 * Process file and determine format
 */
export async function processImportFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const content = e.target.result;

            // Check file extension
            const extension = file.name.split('.').pop().toLowerCase();

            if (extension === 'csv' || extension === 'txt') {
                const { headers, rows } = parseCSV(content);
                resolve({ headers, rows, format: 'csv' });
            } else if (extension === 'xlsx' || extension === 'xls') {
                // For Excel files, we'd need a library like xlsx
                // For now, return an error suggesting CSV conversion
                reject(new Error('Excel files are not yet supported. Please convert to CSV format.'));
            } else {
                reject(new Error('Unsupported file format. Please use CSV files.'));
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));

        reader.readAsText(file);
    });
}

/**
 * Generate sample CSV template for download
 */
export function generateTemplate(dataType) {
    const schema = IMPORT_SCHEMAS[dataType];
    if (!schema) return null;

    const headers = [...schema.required, ...schema.optional];
    let csv = headers.join(',') + '\n';

    // Add sample row
    const sampleData = {
        clients: ['Acme Corp', 'john@acme.com', '+1 555 123 4567', 'Acme Corporation', '123 Business Ave', 'Great client, always on time', 'www.acme.com'],
        crew: ['Jane Smith', 'jane@email.com', '+1 555 987 6543', 'Director of Photography', '650', 'Award-winning DP', 'Cinematography, Lighting'],
        equipment: ['RED Komodo', 'Camera Package', '500', '2', 'RK-12345', 'Primary camera', 'Excellent'],
    };

    csv += sampleData[dataType]?.join(',') || '';

    return csv;
}

/**
 * Download template as CSV file
 */
export function downloadTemplate(dataType) {
    const csv = generateTemplate(dataType);
    if (!csv) return;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${dataType}_import_template.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export default {
    IMPORT_SCHEMAS,
    parseCSV,
    mapHeaders,
    validateImportData,
    importClients,
    importCrew,
    importEquipment,
    processImportFile,
    generateTemplate,
    downloadTemplate,
};
