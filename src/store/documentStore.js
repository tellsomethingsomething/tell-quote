import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import logger from '../utils/logger';

// File type configurations
export const FILE_TYPES = {
    // Documents
    pdf: { icon: '📄', color: 'text-red-400', bgColor: 'bg-red-500/10' },
    doc: { icon: '📝', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
    docx: { icon: '📝', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
    xls: { icon: '📊', color: 'text-green-400', bgColor: 'bg-green-500/10' },
    xlsx: { icon: '📊', color: 'text-green-400', bgColor: 'bg-green-500/10' },
    ppt: { icon: '📽️', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
    pptx: { icon: '📽️', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
    txt: { icon: '📄', color: 'text-gray-400', bgColor: 'bg-gray-500/10' },

    // Images
    png: { icon: '🖼️', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
    jpg: { icon: '🖼️', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
    jpeg: { icon: '🖼️', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
    gif: { icon: '🖼️', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
    svg: { icon: '🖼️', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
    webp: { icon: '🖼️', color: 'text-purple-400', bgColor: 'bg-purple-500/10' },

    // Archives
    zip: { icon: '📦', color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
    rar: { icon: '📦', color: 'text-amber-400', bgColor: 'bg-amber-500/10' },

    // Default
    default: { icon: '📎', color: 'text-gray-400', bgColor: 'bg-gray-500/10' },
};

// Document tags
export const DOCUMENT_TAGS = [
    { id: 'contract', label: 'Contract', color: 'bg-blue-500/20 text-blue-300' },
    { id: 'proposal', label: 'Proposal', color: 'bg-purple-500/20 text-purple-300' },
    { id: 'invoice', label: 'Invoice', color: 'bg-green-500/20 text-green-300' },
    { id: 'quote', label: 'Quote', color: 'bg-amber-500/20 text-amber-300' },
    { id: 'brief', label: 'Brief', color: 'bg-purple-500/20 text-purple-300' },
    { id: 'asset', label: 'Asset', color: 'bg-pink-500/20 text-pink-300' },
    { id: 'reference', label: 'Reference', color: 'bg-indigo-500/20 text-indigo-300' },
    { id: 'signed', label: 'Signed', color: 'bg-emerald-500/20 text-emerald-300' },
];

// Storage bucket name
const STORAGE_BUCKET = 'documents';

// Helper to get file extension
export const getFileExtension = (filename) => {
    return filename?.split('.').pop()?.toLowerCase() || '';
};

// Helper to get file type config
export const getFileTypeConfig = (filename) => {
    const ext = getFileExtension(filename);
    return FILE_TYPES[ext] || FILE_TYPES.default;
};

// Helper to format file size
export const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

// Helper to get storage path
const getStoragePath = (userId, entityType, entityId, filename) => {
    const timestamp = Date.now();
    const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${userId}/${entityType}/${entityId}/${timestamp}-${safeName}`;
};

export const useDocumentStore = create(
    subscribeWithSelector((set, get) => ({
        // Data
        documents: [],

        // UI state
        isLoading: false,
        isUploading: false,
        uploadProgress: 0,
        error: null,

        // Filters
        entityFilter: null, // { type: 'client', id: '...' }
        tagFilter: null,
        searchQuery: '',

        // ============================================================
        // INITIALIZATION
        // ============================================================

        initialize: async () => {
            await get().ensureBucketExists();
        },

        // Ensure storage bucket exists
        ensureBucketExists: async () => {
            try {
                const { data, error } = await supabase.storage.getBucket(STORAGE_BUCKET);
                if (error && error.message.includes('not found')) {
                    // Bucket doesn't exist - it should be created via Supabase dashboard or migrations
                    logger.warn('Documents bucket does not exist. Please create it in Supabase dashboard.');
                }
            } catch (error) {
                logger.error('Failed to check bucket:', error);
            }
        },

        // ============================================================
        // DOCUMENT CRUD
        // ============================================================

        loadDocuments: async (options = {}) => {
            set({ isLoading: true, error: null });

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                let query = supabase
                    .from('documents')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                // Apply entity filter
                if (options.clientId) {
                    query = query.eq('client_id', options.clientId);
                }
                if (options.contactId) {
                    query = query.eq('contact_id', options.contactId);
                }
                if (options.opportunityId) {
                    query = query.eq('opportunity_id', options.opportunityId);
                }
                if (options.quoteId) {
                    query = query.eq('quote_id', options.quoteId);
                }

                const { data, error } = await query;

                if (error) throw error;

                set({ documents: data || [], isLoading: false });
                return data || [];
            } catch (error) {
                logger.error('Failed to load documents:', error);
                set({ isLoading: false, error: error.message });
                return [];
            }
        },

        // Load documents for a specific entity
        loadDocumentsForEntity: async (entityType, entityId) => {
            set({ isLoading: true, error: null });

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                const columnName = `${entityType}_id`;

                const { data, error } = await supabase
                    .from('documents')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq(columnName, entityId)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                set({ documents: data || [], isLoading: false, entityFilter: { type: entityType, id: entityId } });
                return data || [];
            } catch (error) {
                logger.error('Failed to load documents for entity:', error);
                set({ isLoading: false, error: error.message });
                return [];
            }
        },

        // Upload a file
        uploadDocument: async (file, entityLinks = {}, metadata = {}) => {
            set({ isUploading: true, uploadProgress: 0, error: null });

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                // Determine entity type for storage path
                const entityType = entityLinks.client_id ? 'clients' :
                                  entityLinks.contact_id ? 'contacts' :
                                  entityLinks.opportunity_id ? 'opportunities' :
                                  entityLinks.quote_id ? 'quotes' : 'general';
                const entityId = entityLinks.client_id || entityLinks.contact_id ||
                                entityLinks.opportunity_id || entityLinks.quote_id || 'unlinked';

                const storagePath = getStoragePath(user.id, entityType, entityId, file.name);

                // Upload to Supabase Storage
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from(STORAGE_BUCKET)
                    .upload(storagePath, file, {
                        cacheControl: '3600',
                        upsert: false,
                    });

                if (uploadError) throw uploadError;

                set({ uploadProgress: 50 });

                // Create document record
                const { data: docData, error: docError } = await supabase
                    .from('documents')
                    .insert({
                        user_id: user.id,
                        filename: file.name,
                        file_type: file.type,
                        file_size: file.size,
                        storage_path: storagePath,
                        client_id: entityLinks.client_id || null,
                        contact_id: entityLinks.contact_id || null,
                        opportunity_id: entityLinks.opportunity_id || null,
                        quote_id: entityLinks.quote_id || null,
                        description: metadata.description || null,
                        tags: metadata.tags || [],
                    })
                    .select()
                    .single();

                if (docError) throw docError;

                set({
                    documents: [docData, ...get().documents],
                    isUploading: false,
                    uploadProgress: 100,
                });

                return { success: true, document: docData };
            } catch (error) {
                logger.error('Failed to upload document:', error);
                set({ isUploading: false, uploadProgress: 0, error: error.message });
                return { success: false, error: error.message };
            }
        },

        // Upload multiple files
        uploadMultipleDocuments: async (files, entityLinks = {}, metadata = {}) => {
            const results = [];
            for (const file of files) {
                const result = await get().uploadDocument(file, entityLinks, metadata);
                results.push(result);
            }
            return results;
        },

        // Get download URL for a document
        getDownloadUrl: async (documentId) => {
            try {
                const doc = get().documents.find(d => d.id === documentId);
                if (!doc) throw new Error('Document not found');

                const { data, error } = await supabase.storage
                    .from(STORAGE_BUCKET)
                    .createSignedUrl(doc.storage_path, 3600); // 1 hour expiry

                if (error) throw error;

                return { success: true, url: data.signedUrl };
            } catch (error) {
                logger.error('Failed to get download URL:', error);
                return { success: false, error: error.message };
            }
        },

        // Download a document
        downloadDocument: async (documentId) => {
            const result = await get().getDownloadUrl(documentId);
            if (result.success) {
                window.open(result.url, '_blank');
            }
            return result;
        },

        // Update document metadata
        updateDocument: async (documentId, updates) => {
            try {
                const { data, error } = await supabase
                    .from('documents')
                    .update({
                        description: updates.description,
                        tags: updates.tags,
                    })
                    .eq('id', documentId)
                    .select()
                    .single();

                if (error) throw error;

                set({
                    documents: get().documents.map(d => d.id === documentId ? data : d),
                });

                return { success: true, document: data };
            } catch (error) {
                logger.error('Failed to update document:', error);
                return { success: false, error: error.message };
            }
        },

        // Link document to entity
        linkDocument: async (documentId, entityType, entityId) => {
            try {
                const columnName = `${entityType}_id`;

                const { data, error } = await supabase
                    .from('documents')
                    .update({ [columnName]: entityId })
                    .eq('id', documentId)
                    .select()
                    .single();

                if (error) throw error;

                set({
                    documents: get().documents.map(d => d.id === documentId ? data : d),
                });

                return { success: true, document: data };
            } catch (error) {
                logger.error('Failed to link document:', error);
                return { success: false, error: error.message };
            }
        },

        // Unlink document from entity
        unlinkDocument: async (documentId, entityType) => {
            try {
                const columnName = `${entityType}_id`;

                const { data, error } = await supabase
                    .from('documents')
                    .update({ [columnName]: null })
                    .eq('id', documentId)
                    .select()
                    .single();

                if (error) throw error;

                set({
                    documents: get().documents.map(d => d.id === documentId ? data : d),
                });

                return { success: true, document: data };
            } catch (error) {
                logger.error('Failed to unlink document:', error);
                return { success: false, error: error.message };
            }
        },

        // Delete document
        deleteDocument: async (documentId) => {
            try {
                const doc = get().documents.find(d => d.id === documentId);
                if (!doc) throw new Error('Document not found');

                // Delete from storage
                const { error: storageError } = await supabase.storage
                    .from(STORAGE_BUCKET)
                    .remove([doc.storage_path]);

                if (storageError) logger.warn('Failed to delete from storage:', storageError);

                // Delete record
                const { error: dbError } = await supabase
                    .from('documents')
                    .delete()
                    .eq('id', documentId);

                if (dbError) throw dbError;

                set({
                    documents: get().documents.filter(d => d.id !== documentId),
                });

                return { success: true };
            } catch (error) {
                logger.error('Failed to delete document:', error);
                return { success: false, error: error.message };
            }
        },

        // ============================================================
        // VERSION MANAGEMENT
        // ============================================================

        // Upload a new version
        uploadNewVersion: async (parentDocumentId, file) => {
            const parent = get().documents.find(d => d.id === parentDocumentId);
            if (!parent) return { success: false, error: 'Parent document not found' };

            // Upload with same entity links
            const result = await get().uploadDocument(file, {
                client_id: parent.client_id,
                contact_id: parent.contact_id,
                opportunity_id: parent.opportunity_id,
                quote_id: parent.quote_id,
            }, {
                description: parent.description,
                tags: parent.tags,
            });

            if (result.success) {
                // Update the new document with version info
                await supabase
                    .from('documents')
                    .update({
                        version: parent.version + 1,
                        parent_document_id: parentDocumentId,
                    })
                    .eq('id', result.document.id);

                // Refresh documents
                await get().loadDocuments();
            }

            return result;
        },

        // Get version history for a document
        getVersionHistory: async (documentId) => {
            try {
                // Find root document
                let doc = get().documents.find(d => d.id === documentId);
                while (doc?.parent_document_id) {
                    const parent = get().documents.find(d => d.id === doc.parent_document_id);
                    if (!parent) break;
                    doc = parent;
                }

                // Get all versions
                const { data, error } = await supabase
                    .from('documents')
                    .select('*')
                    .or(`id.eq.${doc.id},parent_document_id.eq.${doc.id}`)
                    .order('version', { ascending: true });

                if (error) throw error;

                return data || [];
            } catch (error) {
                logger.error('Failed to get version history:', error);
                return [];
            }
        },

        // ============================================================
        // FILTERS & SEARCH
        // ============================================================

        setEntityFilter: (entityType, entityId) => {
            set({ entityFilter: entityType && entityId ? { type: entityType, id: entityId } : null });
        },

        setTagFilter: (tag) => {
            set({ tagFilter: tag });
        },

        setSearchQuery: (query) => {
            set({ searchQuery: query });
        },

        getFilteredDocuments: () => {
            const { documents, entityFilter, tagFilter, searchQuery } = get();

            return documents.filter(doc => {
                // Entity filter
                if (entityFilter) {
                    const columnName = `${entityFilter.type}_id`;
                    if (doc[columnName] !== entityFilter.id) return false;
                }

                // Tag filter
                if (tagFilter && !doc.tags?.includes(tagFilter)) return false;

                // Search filter
                if (searchQuery) {
                    const search = searchQuery.toLowerCase();
                    const filenameMatch = doc.filename?.toLowerCase().includes(search);
                    const descriptionMatch = doc.description?.toLowerCase().includes(search);
                    if (!filenameMatch && !descriptionMatch) return false;
                }

                return true;
            });
        },

        // ============================================================
        // STATS
        // ============================================================

        getDocumentStats: () => {
            const { documents } = get();

            const totalSize = documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0);
            const byType = {};
            const byTag = {};

            documents.forEach(doc => {
                const ext = getFileExtension(doc.filename);
                byType[ext] = (byType[ext] || 0) + 1;

                (doc.tags || []).forEach(tag => {
                    byTag[tag] = (byTag[tag] || 0) + 1;
                });
            });

            return {
                totalCount: documents.length,
                totalSize,
                formattedSize: formatFileSize(totalSize),
                byType,
                byTag,
            };
        },

        // ============================================================
        // CLEANUP
        // ============================================================

        reset: () => {
            set({
                documents: [],
                isLoading: false,
                isUploading: false,
                uploadProgress: 0,
                error: null,
                entityFilter: null,
                tagFilter: null,
                searchQuery: '',
            });
        },
    }))
);

export default useDocumentStore;
