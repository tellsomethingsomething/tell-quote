import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useKitStore, KIT_STATUS, KIT_STATUS_CONFIG, KIT_CONDITION, KIT_CONDITION_CONFIG, DEFAULT_CATEGORIES } from '../store/kitStore';
import { useRateCardStore } from '../store/rateCardStore';
import { formatCurrency } from '../utils/currency';

// Stats Card Component
function StatsCard({ stats }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            <div className="card text-center p-3">
                <div className="text-2xl font-bold text-brand-teal">{stats.totalItems}</div>
                <div className="text-xs text-gray-500">Total Items</div>
            </div>
            <div className="card text-center p-3">
                <div className="text-2xl font-bold text-green-400">{stats.availableCount}</div>
                <div className="text-xs text-gray-500">Available</div>
            </div>
            <div className="card text-center p-3">
                <div className="text-2xl font-bold text-blue-400">{stats.onJobCount}</div>
                <div className="text-xs text-gray-500">On Job</div>
            </div>
            <div className="card text-center p-3">
                <div className="text-2xl font-bold text-amber-400">{formatCurrency(stats.totalValue, 'USD').split('.')[0]}</div>
                <div className="text-xs text-gray-500">Total Value</div>
            </div>
            <div className="card text-center p-3">
                <div className="text-2xl font-bold text-emerald-400">{formatCurrency(stats.totalRevenue, 'USD').split('.')[0]}</div>
                <div className="text-xs text-gray-500">Revenue</div>
            </div>
            <div className="card text-center p-3">
                <div className={`text-2xl font-bold ${stats.needsMaintenance > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                    {stats.needsMaintenance}
                </div>
                <div className="text-xs text-gray-500">Need Attention</div>
            </div>
        </div>
    );
}

// Category icon component
function CategoryIcon({ category, size = 'md' }) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };

    const iconPaths = {
        video: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
        aperture: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        mic: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',
        headphones: 'M3 18v-6a9 9 0 0118 0v6',
        monitor: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
        grid: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
        wifi: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0',
        battery: 'M5 10h10a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 012-2zm12 2h2',
        sun: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
        tv: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2z',
        package: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
        tool: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
        network: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
        cable: 'M13 10V3L4 14h7v7l9-11h-7z',
        maximize: 'M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4',
        box: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
        'more-horizontal': 'M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z',
    };

    const cat = DEFAULT_CATEGORIES.find(c => c.name === category || c.id === category);
    const iconPath = iconPaths[cat?.icon] || iconPaths.box;
    const color = cat?.color || '#6B7280';

    return (
        <div className={`${sizeClasses[size]} rounded`} style={{ color }}>
            <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
            </svg>
        </div>
    );
}

// Kit Item Row Component
function KitItemRow({ item, onEdit, onDelete, children, isChild = false }) {
    const [expanded, setExpanded] = useState(false);
    const statusConfig = KIT_STATUS_CONFIG[item.status] || KIT_STATUS_CONFIG.available;
    const conditionConfig = KIT_CONDITION_CONFIG[item.condition] || KIT_CONDITION_CONFIG.good;

    return (
        <>
            <tr
                className={`border-b border-dark-border hover:bg-white/5 transition-colors cursor-pointer ${isChild ? 'bg-dark-bg/30' : ''}`}
                onClick={() => setExpanded(!expanded)}
            >
                <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                        {isChild && <span className="text-gray-600 pl-4">└</span>}
                        <CategoryIcon category={item.categoryName} size="sm" />
                        <div>
                            <span className="font-mono text-sm text-brand-teal">{item.kitId}</span>
                            {item.childCount > 0 && (
                                <span className="ml-2 text-xs bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded">
                                    {item.childCount} items
                                </span>
                            )}
                        </div>
                    </div>
                </td>
                <td className="px-3 py-2">
                    <div>
                        <span className="text-sm text-gray-200">{item.name}</span>
                        {item.manufacturer && (
                            <span className="text-xs text-gray-500 ml-2">{item.manufacturer}</span>
                        )}
                    </div>
                    {item.model && (
                        <div className="text-xs text-gray-500">{item.model}</div>
                    )}
                </td>
                <td className="px-3 py-2 hidden sm:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded ${statusConfig.bg} ${statusConfig.color}`}>
                        {statusConfig.label}
                    </span>
                </td>
                <td className="px-3 py-2 hidden md:table-cell">
                    <span className="text-xs text-gray-400">{item.location || '-'}</span>
                </td>
                <td className="px-3 py-2 hidden lg:table-cell text-right">
                    {item.dayRate ? (
                        <span className="text-sm text-gray-300">{formatCurrency(item.dayRate, item.rateCurrency || 'USD')}</span>
                    ) : (
                        <span className="text-xs text-gray-600">-</span>
                    )}
                </td>
                <td className="px-3 py-2 hidden xl:table-cell text-right">
                    {item.currentValue || item.purchasePrice ? (
                        <span className="text-sm text-gray-400">
                            {formatCurrency(item.currentValue || item.purchasePrice, item.purchaseCurrency || 'USD')}
                        </span>
                    ) : (
                        <span className="text-xs text-gray-600">-</span>
                    )}
                </td>
                <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                            className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
                            title="Edit"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                            className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                            title="Delete"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>

            {/* Expanded Details */}
            {expanded && (
                <tr className="bg-dark-bg/50">
                    <td colSpan={7} className="px-4 py-3">
                        <div className="flex gap-4">
                            {/* Image thumbnail */}
                            {item.imageUrl && (
                                <div className="w-24 h-24 rounded-lg overflow-hidden border border-dark-border flex-shrink-0">
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <label className="text-xs text-gray-500">Serial Number</label>
                                <p className="text-gray-300 font-mono">{item.serialNumber || '-'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Quantity</label>
                                <p className="text-gray-300">
                                    <span className={item.quantityAvailable > 0 ? 'text-green-400' : 'text-red-400'}>
                                        {item.quantityAvailable || 0}
                                    </span>
                                    <span className="text-gray-500"> / {item.quantity || 1}</span>
                                    <span className="text-gray-600 text-xs ml-1">available</span>
                                </p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Condition</label>
                                <p className={conditionConfig.color}>{conditionConfig.label}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Purchase Date</label>
                                <p className="text-gray-300">{item.purchaseDate || '-'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Age</label>
                                <p className="text-gray-300">{item.ageMonths ? `${item.ageMonths} months` : '-'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Week Rate</label>
                                <p className="text-gray-300">{item.weekRate ? formatCurrency(item.weekRate, item.rateCurrency) : '-'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Month Rate</label>
                                <p className="text-gray-300">{item.monthRate ? formatCurrency(item.monthRate, item.rateCurrency) : '-'}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Total Revenue</label>
                                <p className="text-emerald-400">{formatCurrency(item.totalRevenue || 0, item.rateCurrency || 'USD')}</p>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Days Used</label>
                                <p className="text-gray-300">{item.totalDaysUsed || 0}</p>
                            </div>
                            {item.notes && (
                                <div className="col-span-2 md:col-span-4">
                                    <label className="text-xs text-gray-500">Notes</label>
                                    <p className="text-gray-400">{item.notes}</p>
                                </div>
                            )}
                            {(item.technicalTags?.length > 0 || item.operationalTags?.length > 0) && (
                                <div className="col-span-2 md:col-span-4 flex flex-wrap gap-1">
                                    {item.technicalTags?.map(tag => (
                                        <span key={tag} className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">{tag}</span>
                                    ))}
                                    {item.operationalTags?.map(tag => (
                                        <span key={tag} className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">{tag}</span>
                                    ))}
                                </div>
                            )}
                            </div>
                        </div>
                    </td>
                </tr>
            )}

            {/* Child Items */}
            {expanded && children}
        </>
    );
}

// Image Upload Component
function ImageUpload({ imageUrl, onUpload, onRemove, uploading = false }) {
    const fileInputRef = React.useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image must be less than 5MB');
                return;
            }
            onUpload(file);
        }
    };

    return (
        <div className="flex items-start gap-4">
            {/* Preview */}
            <div className="w-24 h-24 rounded-lg border border-dark-border overflow-hidden bg-dark-bg flex items-center justify-center flex-shrink-0">
                {imageUrl ? (
                    <img src={imageUrl} alt="Kit" className="w-full h-full object-cover" />
                ) : (
                    <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                )}
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-2">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="btn-ghost btn-sm text-xs flex items-center gap-1"
                >
                    {uploading ? (
                        <>
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                        </>
                    ) : (
                        <>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            {imageUrl ? 'Change' : 'Upload'}
                        </>
                    )}
                </button>
                {imageUrl && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="btn-ghost btn-sm text-xs text-red-400 hover:text-red-300"
                    >
                        Remove
                    </button>
                )}
                <span className="text-[10px] text-gray-600">Max 5MB, JPG/PNG</span>
            </div>
        </div>
    );
}

// Add/Edit Kit Modal
function KitModal({ item, categories, locations, onSave, onClose }) {
    const { generateKitId, uploadImage, removeImage } = useKitStore();
    const { items: rateCardItems, sections: rateCardSections } = useRateCardStore();
    const isNew = !item?.id;
    const [uploading, setUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState(item?.imageUrl || null);
    const [pendingFile, setPendingFile] = useState(null);

    // Group rate card items by section for better UX
    const groupedRateCardItems = useMemo(() => {
        const groups = {};
        rateCardItems.forEach(rc => {
            const sectionName = rateCardSections.find(s => s.id === rc.section)?.name || rc.section || 'Other';
            if (!groups[sectionName]) {
                groups[sectionName] = [];
            }
            groups[sectionName].push(rc);
        });
        return groups;
    }, [rateCardItems, rateCardSections]);

    // Handle rate card selection and auto-fill pricing
    const handleRateCardSelect = (rateCardId) => {
        const rc = rateCardItems.find(r => r.id === rateCardId);
        if (rc) {
            // Get SEA pricing as default (USD)
            const seaPricing = rc.currencyPricing?.SEA || rc.pricing?.SEA || {};
            const dayRate = seaPricing.charge?.amount || seaPricing.charge || 0;

            setFormData(prev => ({
                ...prev,
                rateCardItemId: rateCardId,
                dayRate: dayRate.toString(),
                weekRate: (dayRate * 5).toString(), // Standard 5-day week rate
                monthRate: (dayRate * 20).toString(), // Standard 20-day month rate
                rateCurrency: seaPricing.charge?.baseCurrency || 'USD',
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                rateCardItemId: '',
            }));
        }
    };

    const handleImageUpload = async (file) => {
        if (isNew) {
            // For new items, store the file and show preview
            setPendingFile(file);
            setPreviewImage(URL.createObjectURL(file));
        } else {
            // For existing items, upload immediately
            setUploading(true);
            try {
                const result = await uploadImage(item.id, file);
                if (result) {
                    setPreviewImage(result.url);
                }
            } catch (e) {
                alert('Failed to upload image: ' + e.message);
            } finally {
                setUploading(false);
            }
        }
    };

    const handleImageRemove = async () => {
        if (isNew) {
            setPendingFile(null);
            setPreviewImage(null);
        } else if (item?.id) {
            setUploading(true);
            try {
                await removeImage(item.id);
                setPreviewImage(null);
            } catch (e) {
                alert('Failed to remove image: ' + e.message);
            } finally {
                setUploading(false);
            }
        }
    };

    const [formData, setFormData] = useState({
        kitId: item?.kitId || '',
        name: item?.name || '',
        categoryId: item?.categoryId || '',
        manufacturer: item?.manufacturer || '',
        model: item?.model || '',
        serialNumber: item?.serialNumber || '',
        quantity: item?.quantity || 1,
        quantityAvailable: item?.quantityAvailable || item?.quantity || 1,
        purchaseDate: item?.purchaseDate || '',
        purchasePrice: item?.purchasePrice || '',
        purchaseCurrency: item?.purchaseCurrency || 'USD',
        rateCardItemId: item?.rateCardItemId || '',
        dayRate: item?.dayRate || '',
        weekRate: item?.weekRate || '',
        monthRate: item?.monthRate || '',
        rateCurrency: item?.rateCurrency || 'USD',
        location: item?.location || locations[0] || '',
        status: item?.status || 'available',
        condition: item?.condition || 'good',
        parentKitId: item?.parentKitId || '',
        notes: item?.notes || '',
        technicalTags: item?.technicalTags?.join(', ') || '',
        operationalTags: item?.operationalTags?.join(', ') || '',
        jobTypeTags: item?.jobTypeTags?.join(', ') || '',
    });

    // Auto-generate kit ID when category changes (for new items)
    useEffect(() => {
        if (isNew && formData.categoryId && !formData.kitId) {
            const cat = categories.find(c => c.id === formData.categoryId);
            if (cat) {
                generateKitId(cat.name).then(id => {
                    setFormData(prev => ({ ...prev, kitId: id }));
                });
            }
        }
    }, [formData.categoryId, isNew, categories, generateKitId]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = {
            ...formData,
            purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
            rateCardItemId: formData.rateCardItemId || null,
            dayRate: formData.dayRate ? parseFloat(formData.dayRate) : null,
            weekRate: formData.weekRate ? parseFloat(formData.weekRate) : null,
            monthRate: formData.monthRate ? parseFloat(formData.monthRate) : null,
            quantity: parseInt(formData.quantity) || 1,
            quantityAvailable: parseInt(formData.quantityAvailable) || parseInt(formData.quantity) || 1,
            technicalTags: formData.technicalTags.split(',').map(t => t.trim()).filter(Boolean),
            operationalTags: formData.operationalTags.split(',').map(t => t.trim()).filter(Boolean),
            jobTypeTags: formData.jobTypeTags.split(',').map(t => t.trim()).filter(Boolean),
            parentKitId: formData.parentKitId || null,
        };

        // Pass the pending file to parent for upload after save
        onSave(data, pendingFile);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-dark-card border-b border-dark-border p-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-100">
                        {isNew ? 'Add Kit Item' : `Edit ${item.kitId}`}
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Image Upload */}
                    <div className="border-b border-dark-border pb-4">
                        <label className="label mb-2">Photo</label>
                        <ImageUpload
                            imageUrl={previewImage}
                            onUpload={handleImageUpload}
                            onRemove={handleImageRemove}
                            uploading={uploading}
                        />
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Category</label>
                            <select
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value, kitId: isNew ? '' : formData.kitId })}
                                className="input"
                                required
                            >
                                <option value="">Select category...</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Kit ID</label>
                            <input
                                type="text"
                                value={formData.kitId}
                                onChange={(e) => setFormData({ ...formData, kitId: e.target.value })}
                                className="input font-mono"
                                placeholder="CAM-001"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label label-required">Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="input"
                            placeholder="Sony PXW-Z280"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Manufacturer</label>
                            <input
                                type="text"
                                value={formData.manufacturer}
                                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                                className="input"
                                placeholder="Sony"
                            />
                        </div>
                        <div>
                            <label className="label">Model</label>
                            <input
                                type="text"
                                value={formData.model}
                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                className="input"
                                placeholder="PXW-Z280"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Serial Number</label>
                            <input
                                type="text"
                                value={formData.serialNumber}
                                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                                className="input font-mono"
                                placeholder="SN123456789"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="label">Qty Owned</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.quantity}
                                    onChange={(e) => {
                                        const qty = parseInt(e.target.value) || 1;
                                        setFormData(prev => ({
                                            ...prev,
                                            quantity: qty,
                                            quantityAvailable: Math.min(prev.quantityAvailable, qty)
                                        }));
                                    }}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="label">Qty Available</label>
                                <input
                                    type="number"
                                    min="0"
                                    max={formData.quantity}
                                    value={formData.quantityAvailable}
                                    onChange={(e) => setFormData({ ...formData, quantityAvailable: parseInt(e.target.value) || 0 })}
                                    className="input"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Purchase Info */}
                    <div className="border-t border-dark-border pt-4">
                        <h4 className="text-sm font-medium text-gray-400 mb-3">Purchase Info</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="label">Purchase Date</label>
                                <input
                                    type="date"
                                    value={formData.purchaseDate}
                                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="label">Purchase Price</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.purchasePrice}
                                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                                    className="input"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="label">Currency</label>
                                <select
                                    value={formData.purchaseCurrency}
                                    onChange={(e) => setFormData({ ...formData, purchaseCurrency: e.target.value })}
                                    className="input"
                                >
                                    <option value="USD">USD</option>
                                    <option value="GBP">GBP</option>
                                    <option value="EUR">EUR</option>
                                    <option value="MYR">MYR</option>
                                    <option value="THB">THB</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Rates */}
                    <div className="border-t border-dark-border pt-4">
                        <h4 className="text-sm font-medium text-gray-400 mb-3">Hire Rates</h4>

                        {/* Rate Card Link */}
                        <div className="mb-4">
                            <label className="label">Link to Rate Card Item</label>
                            <select
                                value={formData.rateCardItemId}
                                onChange={(e) => handleRateCardSelect(e.target.value)}
                                className="input text-sm"
                            >
                                <option value="">-- Custom pricing (no link) --</option>
                                {Object.entries(groupedRateCardItems).map(([section, items]) => (
                                    <optgroup key={section} label={section}>
                                        {items.map(rc => (
                                            <option key={rc.id} value={rc.id}>
                                                {rc.name} {rc.currencyPricing?.SEA?.charge?.amount ? `(${formatCurrency(rc.currencyPricing.SEA.charge.amount, 'USD')}/day)` : ''}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            {formData.rateCardItemId && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Pricing synced from rate card. Manual edits will override.
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <label className="label">Day Rate</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.dayRate}
                                    onChange={(e) => setFormData({ ...formData, dayRate: e.target.value })}
                                    className="input"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="label">Week Rate</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.weekRate}
                                    onChange={(e) => setFormData({ ...formData, weekRate: e.target.value })}
                                    className="input"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="label">Month Rate</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.monthRate}
                                    onChange={(e) => setFormData({ ...formData, monthRate: e.target.value })}
                                    className="input"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="label">Currency</label>
                                <select
                                    value={formData.rateCurrency}
                                    onChange={(e) => setFormData({ ...formData, rateCurrency: e.target.value })}
                                    className="input"
                                >
                                    <option value="USD">USD</option>
                                    <option value="GBP">GBP</option>
                                    <option value="EUR">EUR</option>
                                    <option value="MYR">MYR</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Status & Location */}
                    <div className="border-t border-dark-border pt-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="label">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="input"
                                >
                                    {Object.entries(KIT_STATUS_CONFIG).map(([key, config]) => (
                                        <option key={key} value={key}>{config.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">Condition</label>
                                <select
                                    value={formData.condition}
                                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                    className="input"
                                >
                                    {Object.entries(KIT_CONDITION_CONFIG).map(([key, config]) => (
                                        <option key={key} value={key}>{config.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">Location</label>
                                <select
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="input"
                                >
                                    {locations.map(loc => (
                                        <option key={loc} value={loc}>{loc}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="border-t border-dark-border pt-4">
                        <h4 className="text-sm font-medium text-gray-400 mb-3">Tags (comma-separated)</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="label text-xs">Technical (4K, SDI, XLR, V-Lock, etc.)</label>
                                <input
                                    type="text"
                                    value={formData.technicalTags}
                                    onChange={(e) => setFormData({ ...formData, technicalTags: e.target.value })}
                                    className="input text-sm"
                                    placeholder="4K, SDI, V-Lock"
                                />
                            </div>
                            <div>
                                <label className="label text-xs">Operational (flight-case, rack-mount, weather-sealed)</label>
                                <input
                                    type="text"
                                    value={formData.operationalTags}
                                    onChange={(e) => setFormData({ ...formData, operationalTags: e.target.value })}
                                    className="input text-sm"
                                    placeholder="flight-case, weather-sealed"
                                />
                            </div>
                            <div>
                                <label className="label text-xs">Job Type (OB, Studio, REMI, Presentation)</label>
                                <input
                                    type="text"
                                    value={formData.jobTypeTags}
                                    onChange={(e) => setFormData({ ...formData, jobTypeTags: e.target.value })}
                                    className="input text-sm"
                                    placeholder="OB, REMI"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="label">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="input resize-none"
                            rows={2}
                            placeholder="Any additional notes..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-dark-border">
                        <button type="button" onClick={onClose} className="btn-ghost">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            {isNew ? 'Add Item' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Main Kit List Page
export default function KitListPage() {
    const {
        items,
        categories,
        locations,
        loading,
        error,
        filters,
        initialize,
        addItem,
        updateItem,
        deleteItem,
        uploadImage,
        getFilteredItems,
        getChildren,
        getStats,
        setFilters,
        clearFilters,
        exportToCSV,
        exportPublicList,
    } = useKitStore();

    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

    useEffect(() => {
        initialize();
    }, [initialize]);

    const filteredItems = useMemo(() => getFilteredItems(), [items, filters]);
    const stats = useMemo(() => getStats(), [items]);

    // Group items by parent for hierarchy
    const groupedItems = useMemo(() => {
        const parents = filteredItems.filter(i => !i.parentKitId);
        return parents;
    }, [filteredItems]);

    const handleAdd = () => {
        setEditItem(null);
        setShowModal(true);
    };

    const handleEdit = (item) => {
        setEditItem(item);
        setShowModal(true);
    };

    const handleSave = async (data, pendingFile) => {
        if (editItem?.id) {
            await updateItem(editItem.id, data);
        } else {
            const newItem = await addItem(data);
            // Upload pending image for new items
            if (pendingFile && newItem?.id) {
                await uploadImage(newItem.id, pendingFile);
            }
        }
        setShowModal(false);
        setEditItem(null);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this item?')) {
            await deleteItem(id);
        }
    };

    if (loading) {
        return (
            <div className="h-[calc(100vh-60px)] flex items-center justify-center">
                <div className="text-gray-400">Loading kit list...</div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-60px)] overflow-y-auto p-3 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-100 flex items-center gap-2">
                        <svg className="w-6 h-6 text-brand-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Kit List
                    </h1>
                    <p className="text-sm text-gray-500">Equipment tracking and management</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Export dropdown */}
                    <div className="relative group">
                        <button className="btn-ghost text-sm flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export
                        </button>
                        <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-dark-card border border-dark-border rounded-lg shadow-xl z-20 min-w-48">
                            <button
                                onClick={() => exportToCSV()}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-dark-bg transition-colors"
                            >
                                Full Kit List (CSV)
                            </button>
                            <button
                                onClick={() => exportToCSV({ includeFinancial: false })}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-dark-bg transition-colors"
                            >
                                Without Financials (CSV)
                            </button>
                            <button
                                onClick={() => exportPublicList()}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-dark-bg transition-colors border-t border-dark-border"
                            >
                                Public Equipment List
                            </button>
                        </div>
                    </div>

                    <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Item
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <p className="text-sm text-red-400 font-medium">Database Setup Required</p>
                            <p className="text-xs text-gray-400 mt-1">{error}</p>
                            {error.includes('kit_items') && (
                                <p className="text-xs text-gray-500 mt-2">
                                    Run the <code className="px-1 py-0.5 bg-dark-bg rounded">supabase-kit-schema.sql</code> file in your Supabase SQL editor to create the required tables.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Stats */}
            <StatsCard stats={stats} />

            {/* Filters */}
            <div className="card mb-6 p-4">
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => setFilters({ search: e.target.value })}
                            className="input pl-10"
                            placeholder="Search by ID, name, model..."
                        />
                    </div>
                    <select
                        value={filters.category || ''}
                        onChange={(e) => setFilters({ category: e.target.value || null })}
                        className="input-sm"
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                    <select
                        value={filters.status || ''}
                        onChange={(e) => setFilters({ status: e.target.value || null })}
                        className="input-sm"
                    >
                        <option value="">All Status</option>
                        {Object.entries(KIT_STATUS_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                        ))}
                    </select>
                    <select
                        value={filters.location || ''}
                        onChange={(e) => setFilters({ location: e.target.value || null })}
                        className="input-sm"
                    >
                        <option value="">All Locations</option>
                        {locations.map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                        ))}
                    </select>
                    {(filters.search || filters.category || filters.status || filters.location) && (
                        <button onClick={clearFilters} className="btn-ghost btn-sm">
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Items Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-dark-bg/50 border-b border-dark-border">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kit ID</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Location</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Day Rate</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Value</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border/50">
                            {groupedItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <svg className="w-12 h-12 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                        <h3 className="text-lg font-medium text-gray-400 mb-2">No equipment found</h3>
                                        <p className="text-sm text-gray-500 mb-4">
                                            {filters.search || filters.category || filters.status || filters.location
                                                ? 'Try adjusting your filters'
                                                : 'Start by adding your first piece of equipment'
                                            }
                                        </p>
                                        <button onClick={handleAdd} className="btn-primary">
                                            Add First Item
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                groupedItems.map(item => (
                                    <KitItemRow
                                        key={item.id}
                                        item={item}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    >
                                        {/* Render children */}
                                        {getChildren(item.id).map(child => (
                                            <KitItemRow
                                                key={child.id}
                                                item={child}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                                isChild
                                            />
                                        ))}
                                    </KitItemRow>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary Footer */}
            <div className="mt-4 text-sm text-gray-500 text-center">
                Showing {filteredItems.length} of {items.length} items
            </div>

            {/* Modal */}
            {showModal && (
                <KitModal
                    item={editItem}
                    categories={categories}
                    locations={locations}
                    onSave={handleSave}
                    onClose={() => { setShowModal(false); setEditItem(null); }}
                />
            )}
        </div>
    );
}
