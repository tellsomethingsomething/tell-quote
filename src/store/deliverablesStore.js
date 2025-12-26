import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

// Deliverable types
export const DELIVERABLE_TYPES = {
    video_master: { id: 'video_master', label: 'Video Master', icon: '🎬', category: 'video' },
    video_social: { id: 'video_social', label: 'Social Cut', icon: '📱', category: 'video' },
    video_tv: { id: 'video_tv', label: 'TV/Broadcast', icon: '📺', category: 'video' },
    video_web: { id: 'video_web', label: 'Web Version', icon: '🌐', category: 'video' },
    video_bts: { id: 'video_bts', label: 'Behind The Scenes', icon: '🎥', category: 'video' },
    video_teaser: { id: 'video_teaser', label: 'Teaser/Trailer', icon: '▶️', category: 'video' },
    video_interview: { id: 'video_interview', label: 'Interview', icon: '🎤', category: 'video' },
    photo_hero: { id: 'photo_hero', label: 'Hero Stills', icon: '📸', category: 'photo' },
    photo_bts: { id: 'photo_bts', label: 'BTS Photos', icon: '📷', category: 'photo' },
    photo_product: { id: 'photo_product', label: 'Product Shots', icon: '🛍️', category: 'photo' },
    photo_portrait: { id: 'photo_portrait', label: 'Portraits', icon: '🖼️', category: 'photo' },
    audio_master: { id: 'audio_master', label: 'Audio Master', icon: '🎵', category: 'audio' },
    audio_podcast: { id: 'audio_podcast', label: 'Podcast', icon: '🎙️', category: 'audio' },
    audio_vo: { id: 'audio_vo', label: 'Voiceover', icon: '🗣️', category: 'audio' },
    graphics: { id: 'graphics', label: 'Graphics/Titles', icon: '✨', category: 'design' },
    subtitles: { id: 'subtitles', label: 'Subtitles/Captions', icon: '💬', category: 'design' },
    thumbnail: { id: 'thumbnail', label: 'Thumbnail', icon: '🖼️', category: 'design' },
    raw_footage: { id: 'raw_footage', label: 'Raw Footage', icon: '💾', category: 'archive' },
    project_files: { id: 'project_files', label: 'Project Files', icon: '📁', category: 'archive' },
    other: { id: 'other', label: 'Other', icon: '📄', category: 'other' },
};

// Deliverable status
export const DELIVERABLE_STATUS = {
    pending: { id: 'pending', label: 'Pending', color: '#6B7280' },
    in_progress: { id: 'in_progress', label: 'In Progress', color: '#3B82F6' },
    review: { id: 'review', label: 'In Review', color: '#F59E0B' },
    revision: { id: 'revision', label: 'Revision Needed', color: '#EF4444' },
    approved: { id: 'approved', label: 'Approved', color: '#22C55E' },
    delivered: { id: 'delivered', label: 'Delivered', color: '#8B5CF6' },
};

// Format specs
export const VIDEO_FORMATS = {
    '1920x1080': { id: '1920x1080', label: '1920x1080 (16:9 HD)', aspect: '16:9' },
    '3840x2160': { id: '3840x2160', label: '3840x2160 (4K UHD)', aspect: '16:9' },
    '1080x1920': { id: '1080x1920', label: '1080x1920 (9:16 Vertical)', aspect: '9:16' },
    '1080x1080': { id: '1080x1080', label: '1080x1080 (1:1 Square)', aspect: '1:1' },
    '1200x628': { id: '1200x628', label: '1200x628 (Facebook)', aspect: '1.91:1' },
    '1280x720': { id: '1280x720', label: '1280x720 (720p)', aspect: '16:9' },
    'custom': { id: 'custom', label: 'Custom', aspect: 'custom' },
};

export const useDeliverablesStore = create(
    subscribeWithSelector((set, get) => ({
        // State
        deliverables: [],
        loading: false,
        error: null,

        // ============ DELIVERABLE OPERATIONS ============

        loadDeliverables: async (projectId = null) => {
            set({ loading: true, error: null });
            try {
                let query = supabase
                    .from('deliverables')
                    .select('*')
                    .order('due_date', { ascending: true });

                if (projectId) {
                    query = query.eq('project_id', projectId);
                }

                const { data, error } = await query;

                if (error) throw error;
                set({ deliverables: data || [], loading: false });
            } catch (error) {
                console.error('Error loading deliverables:', error);
                set({ error: error.message, loading: false });
            }
        },

        loadProjectDeliverables: async (projectId) => {
            try {
                const { data, error } = await supabase
                    .from('deliverables')
                    .select('*')
                    .eq('project_id', projectId)
                    .order('due_date', { ascending: true });

                if (error) throw error;
                return data || [];
            } catch (error) {
                console.error('Error loading project deliverables:', error);
                return [];
            }
        },

        createDeliverable: async (deliverableData) => {
            try {
                const { data, error } = await supabase
                    .from('deliverables')
                    .insert({
                        project_id: deliverableData.project_id,
                        name: deliverableData.name,
                        type: deliverableData.type || 'other',
                        description: deliverableData.description || '',
                        status: deliverableData.status || 'pending',
                        due_date: deliverableData.due_date || null,
                        assigned_to: deliverableData.assigned_to || null,
                        // Specs
                        format: deliverableData.format || '',
                        resolution: deliverableData.resolution || '',
                        duration: deliverableData.duration || '',
                        codec: deliverableData.codec || '',
                        frame_rate: deliverableData.frame_rate || '',
                        aspect_ratio: deliverableData.aspect_ratio || '',
                        file_size_limit: deliverableData.file_size_limit || '',
                        // Versions
                        current_version: deliverableData.current_version || 1,
                        versions: deliverableData.versions || [],
                        // Delivery
                        delivery_method: deliverableData.delivery_method || '',
                        delivery_url: deliverableData.delivery_url || '',
                        delivered_at: deliverableData.delivered_at || null,
                        // Notes
                        notes: deliverableData.notes || '',
                        client_notes: deliverableData.client_notes || '',
                        internal_notes: deliverableData.internal_notes || '',
                        tags: deliverableData.tags || [],
                    })
                    .select()
                    .single();

                if (error) throw error;
                set(state => ({ deliverables: [...state.deliverables, data] }));
                return data;
            } catch (error) {
                console.error('Error creating deliverable:', error);
                throw error;
            }
        },

        updateDeliverable: async (deliverableId, updates) => {
            try {
                const { data, error } = await supabase
                    .from('deliverables')
                    .update({ ...updates, updated_at: new Date().toISOString() })
                    .eq('id', deliverableId)
                    .select()
                    .single();

                if (error) throw error;
                set(state => ({
                    deliverables: state.deliverables.map(d => d.id === deliverableId ? data : d),
                }));
                return data;
            } catch (error) {
                console.error('Error updating deliverable:', error);
                throw error;
            }
        },

        deleteDeliverable: async (deliverableId) => {
            try {
                const { error } = await supabase
                    .from('deliverables')
                    .delete()
                    .eq('id', deliverableId);

                if (error) throw error;
                set(state => ({
                    deliverables: state.deliverables.filter(d => d.id !== deliverableId),
                }));
            } catch (error) {
                console.error('Error deleting deliverable:', error);
                throw error;
            }
        },

        // ============ VERSION MANAGEMENT ============

        addVersion: async (deliverableId, versionData) => {
            try {
                const { deliverables } = get();
                const deliverable = deliverables.find(d => d.id === deliverableId);
                if (!deliverable) throw new Error('Deliverable not found');

                const versions = deliverable.versions || [];
                const newVersion = {
                    version: versions.length + 1,
                    url: versionData.url || '',
                    notes: versionData.notes || '',
                    uploaded_by: versionData.uploaded_by || null,
                    uploaded_at: new Date().toISOString(),
                    status: versionData.status || 'pending',
                };

                const updatedVersions = [...versions, newVersion];

                const { data, error } = await supabase
                    .from('deliverables')
                    .update({
                        versions: updatedVersions,
                        current_version: newVersion.version,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', deliverableId)
                    .select()
                    .single();

                if (error) throw error;
                set(state => ({
                    deliverables: state.deliverables.map(d => d.id === deliverableId ? data : d),
                }));
                return data;
            } catch (error) {
                console.error('Error adding version:', error);
                throw error;
            }
        },

        // ============ STATUS UPDATES ============

        markAsDelivered: async (deliverableId, deliveryUrl = null) => {
            try {
                const { data, error } = await supabase
                    .from('deliverables')
                    .update({
                        status: 'delivered',
                        delivered_at: new Date().toISOString(),
                        delivery_url: deliveryUrl,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', deliverableId)
                    .select()
                    .single();

                if (error) throw error;
                set(state => ({
                    deliverables: state.deliverables.map(d => d.id === deliverableId ? data : d),
                }));
                return data;
            } catch (error) {
                console.error('Error marking as delivered:', error);
                throw error;
            }
        },

        // ============ HELPERS ============

        getProjectDeliverables: (projectId) => {
            const { deliverables } = get();
            return deliverables.filter(d => d.project_id === projectId);
        },

        getDeliverablesByStatus: (status) => {
            const { deliverables } = get();
            return deliverables.filter(d => d.status === status);
        },

        getOverdueDeliverables: () => {
            const { deliverables } = get();
            const now = new Date();
            return deliverables.filter(d =>
                d.due_date &&
                new Date(d.due_date) < now &&
                !['delivered', 'approved'].includes(d.status)
            );
        },

        getProjectProgress: (projectId) => {
            const { deliverables } = get();
            const projectDeliverables = deliverables.filter(d => d.project_id === projectId);
            if (projectDeliverables.length === 0) return { total: 0, completed: 0, percent: 0 };

            const completed = projectDeliverables.filter(d =>
                ['approved', 'delivered'].includes(d.status)
            ).length;

            return {
                total: projectDeliverables.length,
                completed,
                percent: Math.round((completed / projectDeliverables.length) * 100),
            };
        },

        // ============ BULK OPERATIONS ============

        createFromTemplate: async (projectId, templateType) => {
            const templates = {
                commercial: [
                    { name: 'Master Cut', type: 'video_master', format: '1920x1080' },
                    { name: '30s TVC', type: 'video_tv', format: '1920x1080', duration: '30s' },
                    { name: '15s TVC', type: 'video_tv', format: '1920x1080', duration: '15s' },
                    { name: 'Social 16:9', type: 'video_social', format: '1920x1080' },
                    { name: 'Social 9:16', type: 'video_social', format: '1080x1920' },
                    { name: 'Social 1:1', type: 'video_social', format: '1080x1080' },
                    { name: 'Hero Stills', type: 'photo_hero' },
                    { name: 'BTS Photos', type: 'photo_bts' },
                ],
                corporate: [
                    { name: 'Full Video', type: 'video_master', format: '1920x1080' },
                    { name: 'Highlights Reel', type: 'video_web', format: '1920x1080' },
                    { name: 'Interview Clips', type: 'video_interview' },
                    { name: 'Social Cuts', type: 'video_social', format: '1080x1080' },
                    { name: 'Thumbnail', type: 'thumbnail' },
                ],
                social_campaign: [
                    { name: 'Hero Video', type: 'video_master', format: '1920x1080' },
                    { name: 'Instagram Reels', type: 'video_social', format: '1080x1920' },
                    { name: 'TikTok', type: 'video_social', format: '1080x1920' },
                    { name: 'Facebook', type: 'video_social', format: '1200x628' },
                    { name: 'YouTube', type: 'video_web', format: '1920x1080' },
                    { name: 'Stories', type: 'video_social', format: '1080x1920' },
                ],
                documentary: [
                    { name: 'Full Documentary', type: 'video_master', format: '1920x1080' },
                    { name: 'Trailer', type: 'video_teaser', format: '1920x1080' },
                    { name: 'Social Teaser', type: 'video_social', format: '1080x1080' },
                    { name: 'BTS Featurette', type: 'video_bts', format: '1920x1080' },
                    { name: 'Key Stills', type: 'photo_hero' },
                    { name: 'Subtitles EN', type: 'subtitles' },
                ],
            };

            const template = templates[templateType];
            if (!template) throw new Error('Unknown template type');

            const { createDeliverable } = get();
            const created = [];

            for (const item of template) {
                const deliverable = await createDeliverable({
                    project_id: projectId,
                    ...item,
                });
                created.push(deliverable);
            }

            return created;
        },
    }))
);

// Helper to format due date
export const formatDeliverableDueDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, status: 'overdue' };
    if (diffDays === 0) return { text: 'Due today', status: 'due-today' };
    if (diffDays === 1) return { text: 'Due tomorrow', status: 'due-soon' };
    if (diffDays <= 7) return { text: `Due in ${diffDays}d`, status: 'upcoming' };
    return { text: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), status: 'normal' };
};
