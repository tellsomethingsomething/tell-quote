/**
 * Project Management Store
 *
 * Consolidated store combining:
 * - projectStore (project management)
 * - deliverablesStore (project deliverables)
 * - timelineStore (project timelines and milestones)
 *
 * MIGRATION GUIDE:
 * Old: import { useProjectStore } from './projectStore'
 * New: import { useProjectStore } from './projectManagementStore'
 */

// Re-export all original stores for backward compatibility
export { useProjectStore } from './projectStore';
export { useDeliverablesStore } from './deliverablesStore';
export { useTimelineStore } from './timelineStore';

/**
 * Unified project management hook
 */
export function useProjectManagement() {
    const { useProjectStore } = require('./projectStore');
    const { useDeliverablesStore } = require('./deliverablesStore');
    const { useTimelineStore } = require('./timelineStore');

    const projectStore = useProjectStore();
    const deliverablesStore = useDeliverablesStore();
    const timelineStore = useTimelineStore();

    return {
        // Projects
        projects: projectStore.projects,
        loadProjects: projectStore.initialize,
        createProject: projectStore.createProject,
        updateProject: projectStore.updateProject,
        deleteProject: projectStore.deleteProject,
        getProjectById: projectStore.getProjectById,
        getProjectsByClient: projectStore.getByClient,
        getProjectsByStatus: projectStore.getByStatus,
        getActiveProjects: projectStore.getActiveProjects,
        getProjectStats: projectStore.getStats,

        // Deliverables
        deliverables: deliverablesStore.deliverables,
        loadDeliverables: deliverablesStore.initialize,
        createDeliverable: deliverablesStore.createDeliverable,
        updateDeliverable: deliverablesStore.updateDeliverable,
        deleteDeliverable: deliverablesStore.deleteDeliverable,
        getDeliverablesByProject: deliverablesStore.getByProject,
        completeDeliverable: deliverablesStore.markComplete,

        // Timeline
        milestones: timelineStore.milestones,
        loadTimeline: timelineStore.initialize,
        createMilestone: timelineStore.createMilestone,
        updateMilestone: timelineStore.updateMilestone,
        deleteMilestone: timelineStore.deleteMilestone,
        getMilestonesByProject: timelineStore.getByProject,
        getUpcomingMilestones: timelineStore.getUpcoming,
        getOverdueMilestones: timelineStore.getOverdue,

        // Combined project overview
        getProjectOverview: (projectId) => {
            const project = projectStore.getProjectById?.(projectId);
            const projectDeliverables = deliverablesStore.getByProject?.(projectId) || [];
            const projectMilestones = timelineStore.getByProject?.(projectId) || [];

            if (!project) return null;

            const completedDeliverables = projectDeliverables.filter(d => d.status === 'completed').length;
            const completedMilestones = projectMilestones.filter(m => m.status === 'completed').length;

            return {
                ...project,
                deliverables: {
                    total: projectDeliverables.length,
                    completed: completedDeliverables,
                    progress: projectDeliverables.length > 0
                        ? Math.round((completedDeliverables / projectDeliverables.length) * 100)
                        : 0,
                },
                milestones: {
                    total: projectMilestones.length,
                    completed: completedMilestones,
                    upcoming: projectMilestones.filter(m => m.status !== 'completed' && new Date(m.dueDate) > new Date()).length,
                    overdue: projectMilestones.filter(m => m.status !== 'completed' && new Date(m.dueDate) < new Date()).length,
                },
            };
        },

        // Loading states
        loading: projectStore.loading || deliverablesStore.loading || timelineStore.loading,
        errors: {
            project: projectStore.error,
            deliverables: deliverablesStore.error,
            timeline: timelineStore.error,
        },

        // Initialize all
        initializeAll: async () => {
            await Promise.all([
                projectStore.initialize(),
                deliverablesStore.initialize(),
                timelineStore.initialize(),
            ]);
        },
    };
}
