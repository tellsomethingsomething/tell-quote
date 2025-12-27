import React, { useEffect, useState } from 'react';
import {
    Mail, Plus, Search, Filter, MoreVertical, Edit2, Copy, Trash2,
    Star, Clock, Users, ChevronRight, X, Save, Eye, Code
} from 'lucide-react';
import { useEmailTemplateStore, TEMPLATE_CATEGORIES, DEFAULT_VARIABLES, applyTemplateVariables } from '../store/emailTemplateStore';
import { sanitizeHtml } from '../utils/sanitize';

// Template Card Component
function TemplateCard({ template, onSelect, onEdit, onDuplicate, onDelete }) {
    const [showMenu, setShowMenu] = useState(false);
    const category = TEMPLATE_CATEGORIES[template.category] || TEMPLATE_CATEGORIES.custom;

    return (
        <div
            onClick={() => onSelect(template)}
            className="bg-dark-card border border-dark-border rounded-lg p-4 hover:border-brand-primary/50 cursor-pointer transition-all group"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${category.color}`}>
                        {category.icon} {category.label}
                    </span>
                    {template.is_shared && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/10 text-purple-400">
                            <Users className="w-3 h-3 inline mr-1" />
                            Shared
                        </span>
                    )}
                </div>

                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(!showMenu);
                        }}
                        className="p-1 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>

                    {showMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(false);
                                }}
                            />
                            <div className="absolute right-0 top-6 w-36 bg-dark-card border border-dark-border rounded-lg shadow-xl z-20 py-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(template);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-border/50 flex items-center gap-2"
                                >
                                    <Edit2 className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDuplicate(template);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-border/50 flex items-center gap-2"
                                >
                                    <Copy className="w-3.5 h-3.5" /> Duplicate
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(template);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <h3 className="font-medium text-white mb-1 truncate">{template.name}</h3>
            <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                {template.subject || 'No subject'}
            </p>

            <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {template.use_count} uses
                </div>
                {template.last_used_at && (
                    <span>
                        Last used {new Date(template.last_used_at).toLocaleDateString()}
                    </span>
                )}
            </div>
        </div>
    );
}

// Template Editor Modal
function TemplateEditor({ template, onSave, onClose }) {
    const [form, setForm] = useState({
        name: template?.name || '',
        subject: template?.subject || '',
        body_html: template?.body_html || '',
        category: template?.category || 'custom',
        is_shared: template?.is_shared || false,
    });
    const [showPreview, setShowPreview] = useState(false);
    const [showVariables, setShowVariables] = useState(true);
    const [previewContext, setPreviewContext] = useState({
        clientName: 'Acme Corp',
        contactName: 'John Smith',
        contactFirstName: 'John',
        companyName: 'Your Company',
        projectName: 'Summer Campaign',
        quoteAmount: '$15,000',
        quoteNumber: 'Q-2025-001',
        quoteDueDate: 'January 15, 2025',
        senderName: 'Jane Doe',
        senderEmail: 'jane@example.com',
        todayDate: new Date().toLocaleDateString(),
    });

    const { isSaving } = useEmailTemplateStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSave(form);
    };

    const insertVariable = (varName) => {
        const textarea = document.getElementById('template-body');
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = form.body_html;
            const before = text.substring(0, start);
            const after = text.substring(end);
            const newText = `${before}{{${varName}}}${after}`;
            setForm(prev => ({ ...prev, body_html: newText }));
            // Focus and set cursor position
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + varName.length + 4, start + varName.length + 4);
            }, 0);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-dark-border">
                    <h2 className="text-lg font-semibold text-white">
                        {template ? 'Edit Template' : 'Create Template'}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 ${
                                showPreview
                                    ? 'bg-brand-primary text-white'
                                    : 'bg-dark-border text-gray-300 hover:text-white'
                            }`}
                        >
                            <Eye className="w-4 h-4" />
                            Preview
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex">
                    {/* Editor Panel */}
                    <div className={`flex-1 overflow-y-auto p-4 ${showPreview ? 'w-1/2 border-r border-dark-border' : 'w-full'}`}>
                        <div className="space-y-4">
                            {/* Name and Category Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Template Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-brand-primary focus:outline-none"
                                        placeholder="e.g., Quote Follow-up"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-brand-primary focus:outline-none"
                                    >
                                        {Object.entries(TEMPLATE_CATEGORIES).map(([id, cat]) => (
                                            <option key={id} value={id}>
                                                {cat.icon} {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Subject Line
                                </label>
                                <input
                                    type="text"
                                    value={form.subject}
                                    onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-brand-primary focus:outline-none"
                                    placeholder="e.g., Following up on your {{projectName}} quote"
                                />
                            </div>

                            {/* Variables Helper */}
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setShowVariables(!showVariables)}
                                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
                                >
                                    <Code className="w-4 h-4" />
                                    Insert Variable
                                    <ChevronRight className={`w-4 h-4 transition-transform ${showVariables ? 'rotate-90' : ''}`} />
                                </button>
                                {showVariables && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {DEFAULT_VARIABLES.map(v => (
                                            <button
                                                key={v.name}
                                                type="button"
                                                onClick={() => insertVariable(v.name)}
                                                className="px-2 py-1 text-xs bg-dark-border/50 text-gray-300 rounded hover:bg-brand-primary/20 hover:text-brand-primary"
                                            >
                                                {`{{${v.name}}}`}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Body */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Email Body
                                </label>
                                <textarea
                                    id="template-body"
                                    value={form.body_html}
                                    onChange={(e) => setForm(prev => ({ ...prev, body_html: e.target.value }))}
                                    className="w-full h-64 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-brand-primary focus:outline-none font-mono text-sm resize-none"
                                    placeholder="Enter your email template here...

Use {{variableName}} to insert dynamic content.
Example: Hi {{contactFirstName}},"
                                />
                            </div>

                            {/* Options */}
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.is_shared}
                                        onChange={(e) => setForm(prev => ({ ...prev, is_shared: e.target.checked }))}
                                        className="rounded border-dark-border bg-dark-bg text-brand-primary focus:ring-brand-primary"
                                    />
                                    Share with team
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Preview Panel */}
                    {showPreview && (
                        <div className="w-1/2 overflow-y-auto p-4 bg-dark-bg/50">
                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-400 mb-2">Preview with sample data</h4>
                            </div>

                            <div className="bg-white rounded-lg overflow-hidden">
                                <div className="bg-gray-100 px-4 py-3 border-b">
                                    <p className="text-sm font-medium text-gray-900">
                                        Subject: {applyTemplateVariables(form.subject, previewContext) || '(No subject)'}
                                    </p>
                                </div>
                                <div className="p-4">
                                    <div
                                        className="text-sm text-gray-800 whitespace-pre-wrap"
                                        dangerouslySetInnerHTML={{
                                            __html: sanitizeHtml(
                                                applyTemplateVariables(form.body_html, previewContext)
                                                    .replace(/\n/g, '<br>')
                                            )
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-dark-border">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-300 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving || !form.name}
                        className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Template Selector (for use in compose modals)
export function TemplateSelector({ onSelect, onClose }) {
    const { templates, loadTemplates, getFilteredTemplates, setSearchQuery, setCategoryFilter, categoryFilter, searchQuery } = useEmailTemplateStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTemplates().then(() => setLoading(false));
    }, []);

    const filteredTemplates = getFilteredTemplates();

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-dark-border">
                    <h2 className="text-lg font-semibold text-white">Select Template</h2>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="p-4 border-b border-dark-border space-y-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-brand-primary focus:outline-none"
                            placeholder="Search templates..."
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setCategoryFilter(null)}
                            className={`px-3 py-1 text-sm rounded-full ${
                                !categoryFilter
                                    ? 'bg-brand-primary text-white'
                                    : 'bg-dark-border text-gray-300 hover:text-white'
                            }`}
                        >
                            All
                        </button>
                        {Object.entries(TEMPLATE_CATEGORIES).map(([id, cat]) => (
                            <button
                                key={id}
                                onClick={() => setCategoryFilter(id)}
                                className={`px-3 py-1 text-sm rounded-full ${
                                    categoryFilter === id
                                        ? 'bg-brand-primary text-white'
                                        : 'bg-dark-border text-gray-300 hover:text-white'
                                }`}
                            >
                                {cat.icon} {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Templates List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="text-center py-8 text-gray-400">Loading templates...</div>
                    ) : filteredTemplates.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">No templates found</div>
                    ) : (
                        <div className="space-y-2">
                            {filteredTemplates.map(template => {
                                const category = TEMPLATE_CATEGORIES[template.category] || TEMPLATE_CATEGORIES.custom;
                                return (
                                    <div
                                        key={template.id}
                                        onClick={() => onSelect(template)}
                                        className="p-3 bg-dark-bg rounded-lg hover:bg-dark-border/50 cursor-pointer group flex items-center gap-3"
                                    >
                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${category.color}`}>
                                            {category.icon}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-white truncate">{template.name}</h4>
                                            <p className="text-sm text-gray-400 truncate">{template.subject || 'No subject'}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Main Page Component
export default function EmailTemplatesPage() {
    const {
        templates,
        isLoading,
        loadTemplates,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        duplicateTemplate,
        getFilteredTemplates,
        setSearchQuery,
        setCategoryFilter,
        categoryFilter,
        searchQuery,
        selectedTemplate,
        setSelectedTemplate,
    } = useEmailTemplateStore();

    const [showEditor, setShowEditor] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        loadTemplates();
    }, []);

    const filteredTemplates = getFilteredTemplates();

    const handleSave = async (formData) => {
        if (editingTemplate) {
            const result = await updateTemplate(editingTemplate.id, formData);
            if (result.success) {
                setShowEditor(false);
                setEditingTemplate(null);
            }
        } else {
            const result = await createTemplate(formData);
            if (result.success) {
                setShowEditor(false);
            }
        }
    };

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setShowEditor(true);
    };

    const handleDuplicate = async (template) => {
        await duplicateTemplate(template.id);
    };

    const handleDelete = async (template) => {
        setDeleteConfirm(template);
    };

    const confirmDelete = async () => {
        if (deleteConfirm) {
            await deleteTemplate(deleteConfirm.id);
            setDeleteConfirm(null);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-dark-border">
                <div>
                    <h1 className="text-2xl font-bold text-white">Email Templates</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Create and manage reusable email templates
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingTemplate(null);
                        setShowEditor(true);
                    }}
                    className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    New Template
                </button>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-dark-border bg-dark-card/50">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-brand-primary focus:outline-none"
                            placeholder="Search templates..."
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCategoryFilter(null)}
                            className={`px-3 py-1.5 text-sm rounded-lg ${
                                !categoryFilter
                                    ? 'bg-brand-primary text-white'
                                    : 'bg-dark-border text-gray-300 hover:text-white'
                            }`}
                        >
                            All
                        </button>
                        {Object.entries(TEMPLATE_CATEGORIES).map(([id, cat]) => (
                            <button
                                key={id}
                                onClick={() => setCategoryFilter(id)}
                                className={`px-3 py-1.5 text-sm rounded-lg ${
                                    categoryFilter === id
                                        ? 'bg-brand-primary text-white'
                                        : 'bg-dark-border text-gray-300 hover:text-white'
                                }`}
                            >
                                {cat.icon} {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <Mail className="w-12 h-12 text-gray-500 mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">No templates found</h3>
                        <p className="text-gray-400 mb-4">
                            {searchQuery || categoryFilter
                                ? 'Try adjusting your search or filters'
                                : 'Create your first email template to get started'}
                        </p>
                        {!searchQuery && !categoryFilter && (
                            <button
                                onClick={() => {
                                    setEditingTemplate(null);
                                    setShowEditor(true);
                                }}
                                className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90"
                            >
                                Create Template
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTemplates.map(template => (
                            <TemplateCard
                                key={template.id}
                                template={template}
                                onSelect={setSelectedTemplate}
                                onEdit={handleEdit}
                                onDuplicate={handleDuplicate}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Editor Modal */}
            {showEditor && (
                <TemplateEditor
                    template={editingTemplate}
                    onSave={handleSave}
                    onClose={() => {
                        setShowEditor(false);
                        setEditingTemplate(null);
                    }}
                />
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6 max-w-md">
                        <h3 className="text-lg font-semibold text-white mb-2">Delete Template?</h3>
                        <p className="text-gray-400 mb-6">
                            Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 text-gray-300 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
