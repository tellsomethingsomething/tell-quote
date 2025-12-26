import React, { useEffect, useState } from 'react';
import {
    File, FileText, Image, Table, Presentation, Archive,
    Download, Trash2, MoreVertical, Tag, Search, Filter,
    ExternalLink, Edit2, Link2, Clock, User, FolderOpen
} from 'lucide-react';
import { useDocumentStore, getFileTypeConfig, formatFileSize, DOCUMENT_TAGS } from '../../store/documentStore';
import DocumentUploader from './DocumentUploader';

// File icon mapping
const FILE_ICONS = {
    pdf: FileText,
    doc: FileText,
    docx: FileText,
    xls: Table,
    xlsx: Table,
    ppt: Presentation,
    pptx: Presentation,
    png: Image,
    jpg: Image,
    jpeg: Image,
    gif: Image,
    svg: Image,
    webp: Image,
    zip: Archive,
    rar: Archive,
};

function getFileIcon(filename) {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    return FILE_ICONS[ext] || File;
}

// Document Card
function DocumentCard({ document, onDownload, onDelete, onEdit, compact = false }) {
    const [showMenu, setShowMenu] = useState(false);
    const config = getFileTypeConfig(document.filename);
    const Icon = getFileIcon(document.filename);

    if (compact) {
        return (
            <div className="flex items-center gap-3 p-2 bg-dark-card rounded-lg border border-dark-border hover:border-gray-600 group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.bgColor}`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{document.filename}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(document.file_size)}</p>
                </div>
                <button
                    onClick={() => onDownload(document.id)}
                    className="p-1.5 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Download className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="bg-dark-card border border-dark-border rounded-lg p-4 hover:border-gray-600 transition-all group">
            <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.bgColor}`}>
                    <Icon className={`w-6 h-6 ${config.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate mb-1">{document.filename}</h4>

                    {document.description && (
                        <p className="text-sm text-gray-400 line-clamp-2 mb-2">{document.description}</p>
                    )}

                    {/* Tags */}
                    {document.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                            {document.tags.map(tagId => {
                                const tag = DOCUMENT_TAGS.find(t => t.id === tagId);
                                return tag ? (
                                    <span key={tagId} className={`px-2 py-0.5 text-xs rounded-full ${tag.color}`}>
                                        {tag.label}
                                    </span>
                                ) : null;
                            })}
                        </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{formatFileSize(document.file_size)}</span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(document.created_at).toLocaleDateString()}
                        </span>
                        {document.version > 1 && (
                            <span className="text-brand-primary">v{document.version}</span>
                        )}
                    </div>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1.5 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>

                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-0 top-8 w-40 bg-dark-card border border-dark-border rounded-lg shadow-xl z-20 py-1">
                                <button
                                    onClick={() => {
                                        onDownload(document.id);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-border/50 flex items-center gap-2"
                                >
                                    <Download className="w-3.5 h-3.5" /> Download
                                </button>
                                <button
                                    onClick={() => {
                                        onEdit(document);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-border/50 flex items-center gap-2"
                                >
                                    <Edit2 className="w-3.5 h-3.5" /> Edit Details
                                </button>
                                <button
                                    onClick={() => {
                                        onDelete(document);
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
        </div>
    );
}

// Edit Document Modal
function EditDocumentModal({ document, onSave, onClose }) {
    const [description, setDescription] = useState(document.description || '');
    const [selectedTags, setSelectedTags] = useState(document.tags || []);

    const toggleTag = (tagId) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(t => t !== tagId)
                : [...prev, tagId]
        );
    };

    const handleSave = () => {
        onSave(document.id, { description, tags: selectedTags });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card border border-dark-border rounded-xl w-full max-w-md">
                <div className="p-4 border-b border-dark-border">
                    <h3 className="text-lg font-semibold text-white">Edit Document</h3>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Filename</label>
                        <p className="text-white">{document.filename}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-brand-primary focus:outline-none"
                            placeholder="Add a description..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                        <div className="flex flex-wrap gap-2">
                            {DOCUMENT_TAGS.map(tag => (
                                <button
                                    key={tag.id}
                                    onClick={() => toggleTag(tag.id)}
                                    className={`px-3 py-1 text-sm rounded-full border transition-all ${
                                        selectedTags.includes(tag.id)
                                            ? `${tag.color} border-transparent`
                                            : 'border-dark-border text-gray-400 hover:text-white hover:border-gray-500'
                                    }`}
                                >
                                    {tag.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-4 border-t border-dark-border">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-300 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

// Main Document List Component
export default function DocumentList({
    entityType,
    entityId,
    showUploader = true,
    compact = false,
    maxDisplay = null,
}) {
    const {
        documents,
        isLoading,
        loadDocumentsForEntity,
        downloadDocument,
        updateDocument,
        deleteDocument,
        getFilteredDocuments,
        setSearchQuery,
        setTagFilter,
        searchQuery,
        tagFilter,
    } = useDocumentStore();

    const [showUploadSection, setShowUploadSection] = useState(false);
    const [editingDocument, setEditingDocument] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        if (entityType && entityId) {
            loadDocumentsForEntity(entityType, entityId);
        }
    }, [entityType, entityId]);

    const filteredDocs = getFilteredDocuments();
    const displayDocs = maxDisplay ? filteredDocs.slice(0, maxDisplay) : filteredDocs;

    const handleSaveEdit = async (docId, updates) => {
        await updateDocument(docId, updates);
        setEditingDocument(null);
    };

    const confirmDelete = async () => {
        if (deleteConfirm) {
            await deleteDocument(deleteConfirm.id);
            setDeleteConfirm(null);
        }
    };

    // Compact inline list
    if (compact) {
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" />
                        Documents ({documents.length})
                    </h4>
                    {showUploader && (
                        <DocumentUploader
                            entityLinks={{ [`${entityType}_id`]: entityId }}
                            compact
                            onUploadComplete={() => loadDocumentsForEntity(entityType, entityId)}
                        />
                    )}
                </div>

                {isLoading ? (
                    <div className="text-sm text-gray-400">Loading...</div>
                ) : documents.length === 0 ? (
                    <p className="text-sm text-gray-500">No documents attached</p>
                ) : (
                    <div className="space-y-1">
                        {displayDocs.map(doc => (
                            <DocumentCard
                                key={doc.id}
                                document={doc}
                                onDownload={downloadDocument}
                                onDelete={setDeleteConfirm}
                                onEdit={setEditingDocument}
                                compact
                            />
                        ))}
                        {maxDisplay && documents.length > maxDisplay && (
                            <button className="text-sm text-brand-primary hover:underline">
                                View all {documents.length} documents
                            </button>
                        )}
                    </div>
                )}

                {/* Delete Confirmation */}
                {deleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-dark-card border border-dark-border rounded-xl p-6 max-w-md">
                            <h3 className="text-lg font-semibold text-white mb-2">Delete Document?</h3>
                            <p className="text-gray-400 mb-6">
                                Are you sure you want to delete "{deleteConfirm.filename}"? This action cannot be undone.
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

    // Full document list
    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    Documents
                    <span className="text-sm font-normal text-gray-400">({documents.length})</span>
                </h3>
                {showUploader && (
                    <button
                        onClick={() => setShowUploadSection(!showUploadSection)}
                        className="px-3 py-1.5 text-sm bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 flex items-center gap-2"
                    >
                        <File className="w-4 h-4" />
                        {showUploadSection ? 'Hide Uploader' : 'Add Documents'}
                    </button>
                )}
            </div>

            {/* Upload Section */}
            {showUploadSection && showUploader && (
                <div className="bg-dark-card/50 border border-dark-border rounded-xl p-4">
                    <DocumentUploader
                        entityLinks={{ [`${entityType}_id`]: entityId }}
                        onUploadComplete={() => {
                            loadDocumentsForEntity(entityType, entityId);
                            setShowUploadSection(false);
                        }}
                    />
                </div>
            )}

            {/* Filters */}
            {documents.length > 0 && (
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white text-sm focus:border-brand-primary focus:outline-none"
                            placeholder="Search documents..."
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setTagFilter(null)}
                            className={`px-2 py-1 text-xs rounded ${
                                !tagFilter
                                    ? 'bg-brand-primary text-white'
                                    : 'bg-dark-border text-gray-400 hover:text-white'
                            }`}
                        >
                            All
                        </button>
                        {DOCUMENT_TAGS.slice(0, 4).map(tag => (
                            <button
                                key={tag.id}
                                onClick={() => setTagFilter(tagFilter === tag.id ? null : tag.id)}
                                className={`px-2 py-1 text-xs rounded ${
                                    tagFilter === tag.id
                                        ? 'bg-brand-primary text-white'
                                        : 'bg-dark-border text-gray-400 hover:text-white'
                                }`}
                            >
                                {tag.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Document Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                </div>
            ) : filteredDocs.length === 0 ? (
                <div className="text-center py-12 bg-dark-card/30 rounded-xl border border-dark-border border-dashed">
                    <FolderOpen className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <h4 className="text-white font-medium mb-1">
                        {documents.length === 0 ? 'No documents yet' : 'No matching documents'}
                    </h4>
                    <p className="text-sm text-gray-400 mb-4">
                        {documents.length === 0
                            ? 'Upload files to attach them to this record'
                            : 'Try adjusting your search or filters'
                        }
                    </p>
                    {documents.length === 0 && showUploader && (
                        <button
                            onClick={() => setShowUploadSection(true)}
                            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90"
                        >
                            Upload Documents
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {displayDocs.map(doc => (
                        <DocumentCard
                            key={doc.id}
                            document={doc}
                            onDownload={downloadDocument}
                            onDelete={setDeleteConfirm}
                            onEdit={setEditingDocument}
                        />
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {editingDocument && (
                <EditDocumentModal
                    document={editingDocument}
                    onSave={handleSaveEdit}
                    onClose={() => setEditingDocument(null)}
                />
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-dark-card border border-dark-border rounded-xl p-6 max-w-md">
                        <h3 className="text-lg font-semibold text-white mb-2">Delete Document?</h3>
                        <p className="text-gray-400 mb-6">
                            Are you sure you want to delete "{deleteConfirm.filename}"? This action cannot be undone.
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
