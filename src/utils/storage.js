const QUOTE_STORAGE_KEY = 'tell_quote_current';
const QUOTES_LIST_KEY = 'tell_quotes_list';
const MAX_STORAGE_SIZE = 4.5 * 1024 * 1024; // 4.5MB (leave buffer for 5MB limit)

// Validate quote data structure
function isValidQuote(quote) {
    if (!quote || typeof quote !== 'object') return false;

    // Required fields
    if (typeof quote.quoteNumber !== 'string') return false;
    if (!Array.isArray(quote.sections)) return false;

    // Validate sections structure
    for (const section of quote.sections) {
        if (!section || typeof section !== 'object') return false;
        if (typeof section.name !== 'string') return false;
        if (!Array.isArray(section.subsections)) return false;

        // Validate subsections
        for (const subsection of section.subsections) {
            if (!subsection || typeof subsection !== 'object') return false;
            if (!Array.isArray(subsection.items)) return false;
        }
    }

    return true;
}

// Check localStorage quota before saving
function checkStorageQuota(data) {
    const size = new Blob([JSON.stringify(data)]).size;
    if (size > MAX_STORAGE_SIZE) {
        console.warn(`Storage quota warning: ${(size / 1024 / 1024).toFixed(2)}MB exceeds limit`);
        return false;
    }
    return true;
}

// Save current quote
export function saveQuote(quote) {
    try {
        if (!isValidQuote(quote)) {
            console.error('Invalid quote structure, cannot save');
            return false;
        }
        if (!checkStorageQuota(quote)) {
            console.error('Quote too large for localStorage');
            return false;
        }
        localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(quote));
        return true;
    } catch (e) {
        console.error('Failed to save quote:', e);
        // Handle QuotaExceededError
        if (e.name === 'QuotaExceededError') {
            console.error('localStorage quota exceeded');
        }
        return false;
    }
}

// Load current quote
export function loadQuote() {
    try {
        const saved = localStorage.getItem(QUOTE_STORAGE_KEY);
        if (!saved) return null;

        const quote = JSON.parse(saved);

        // Validate loaded quote structure
        if (!isValidQuote(quote)) {
            console.warn('Loaded quote has invalid structure, returning null');
            return null;
        }

        return quote;
    } catch (e) {
        console.error('Failed to load quote:', e);
        return null;
    }
}

// Clear current quote
export function clearQuote() {
    try {
        localStorage.removeItem(QUOTE_STORAGE_KEY);
        return true;
    } catch (e) {
        console.error('Failed to clear quote:', e);
        return false;
    }
}

// Save quote to history
export function saveQuoteToHistory(quote) {
    try {
        const list = loadQuotesList();
        const existingIndex = list.findIndex(q => q.quoteNumber === quote.quoteNumber);

        const quoteWithMeta = {
            ...quote,
            savedAt: new Date().toISOString(),
        };

        if (existingIndex >= 0) {
            list[existingIndex] = quoteWithMeta;
        } else {
            list.unshift(quoteWithMeta);
        }

        // Keep only last 50 quotes
        const trimmedList = list.slice(0, 50);
        localStorage.setItem(QUOTES_LIST_KEY, JSON.stringify(trimmedList));
        return true;
    } catch (e) {
        console.error('Failed to save quote to history:', e);
        return false;
    }
}

// Load quotes list
export function loadQuotesList() {
    try {
        const saved = localStorage.getItem(QUOTES_LIST_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error('Failed to load quotes list:', e);
        return [];
    }
}

// Delete quote from history
export function deleteQuoteFromHistory(quoteNumber) {
    try {
        const list = loadQuotesList();
        const filtered = list.filter(q => q.quoteNumber !== quoteNumber);
        localStorage.setItem(QUOTES_LIST_KEY, JSON.stringify(filtered));
        return true;
    } catch (e) {
        console.error('Failed to delete quote from history:', e);
        return false;
    }
}

// Generate new quote number
// prefix defaults to 'QT' but should be passed from settings.quoteDefaults.quotePrefix
export function generateQuoteNumber(prefix = 'QT') {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}-${year}-${random}`;
}

// Generate new invoice number
export function generateInvoiceNumber(prefix = 'INV') {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}-${year}-${random}`;
}
