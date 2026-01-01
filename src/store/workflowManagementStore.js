/**
 * Workflow Management Store
 *
 * Consolidated store combining:
 * - taskBoardStore (kanban task boards)
 * - workflowStore (workflow automation)
 * - commercialTasksStore (AI-generated commercial tasks)
 *
 * MIGRATION GUIDE:
 * Old: import { useTaskBoardStore } from './taskBoardStore'
 * New: import { useTaskBoardStore } from './workflowManagementStore'
 */

// Re-export all original stores for backward compatibility
export { useTaskBoardStore } from './taskBoardStore';
export { useWorkflowStore } from './workflowStore';
export { useCommercialTasksStore } from './commercialTasksStore';

/**
 * Unified workflow management hook
 */
export function useWorkflowManagement() {
    const { useTaskBoardStore } = require('./taskBoardStore');
    const { useWorkflowStore } = require('./workflowStore');
    const { useCommercialTasksStore } = require('./commercialTasksStore');

    const taskBoardStore = useTaskBoardStore();
    const workflowStore = useWorkflowStore();
    const commercialTasksStore = useCommercialTasksStore();

    return {
        // Task boards
        tasks: taskBoardStore.tasks,
        boards: taskBoardStore.boards,
        loadTasks: taskBoardStore.initialize,
        createTask: taskBoardStore.createTask,
        updateTask: taskBoardStore.updateTask,
        deleteTask: taskBoardStore.deleteTask,
        moveTask: taskBoardStore.moveTask,
        getTasksByBoard: taskBoardStore.getTasksByBoard,
        getTasksByProject: taskBoardStore.getTasksByProject,
        getTaskStats: taskBoardStore.getStats,

        // Workflows
        workflows: workflowStore.workflows,
        loadWorkflows: workflowStore.initialize,
        createWorkflow: workflowStore.createWorkflow,
        updateWorkflow: workflowStore.updateWorkflow,
        deleteWorkflow: workflowStore.deleteWorkflow,
        triggerWorkflow: workflowStore.triggerWorkflow,
        getActiveWorkflows: workflowStore.getActiveWorkflows,

        // Commercial tasks (AI-generated)
        commercialTasks: commercialTasksStore.tasks,
        loadCommercialTasks: commercialTasksStore.initialize,
        generateCommercialTasks: commercialTasksStore.generateTasks,
        completeCommercialTask: commercialTasksStore.completeTask,
        dismissCommercialTask: commercialTasksStore.dismissTask,

        // Loading states
        loading: taskBoardStore.loading || workflowStore.loading || commercialTasksStore.loading,
        errors: {
            taskBoard: taskBoardStore.error,
            workflow: workflowStore.error,
            commercialTasks: commercialTasksStore.error,
        },

        // Initialize all
        initializeAll: async () => {
            await Promise.all([
                taskBoardStore.initialize(),
                workflowStore.initialize(),
                commercialTasksStore.initialize(),
            ]);
        },
    };
}
