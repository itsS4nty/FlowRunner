import { Task } from './Task';

export class TaskStateManager {
    private completedTasks: Map<string, boolean> = new Map();
    private failedTasks: Set<string> = new Set();
    private skippedTasks: Set<string> = new Set();
    private taskMap: Map<string, Task> = new Map();

    registerTask(task: Task) {
        this.taskMap.set(task.getId(), task);
    }

    markCompleted(taskId: string) {
        this.completedTasks.set(taskId, true);
    }

    markFailed(taskId: string, error: unknown) {
        this.addError(taskId, error);
        this.completedTasks.set(taskId, false);
        this.failedTasks.add(taskId);
    }

    markSkipped(taskId: string) {
        this.skippedTasks.add(taskId);
    }

    isCompleted(taskId: string): boolean {
        return this.completedTasks.get(taskId) === true;
    }

    private addError(taskId: string, error: unknown) {
        this.taskMap.get(taskId)?.setError(error);
    }

    getStats() {
        return {
            completedTasks: Array.from(this.completedTasks.values()).filter(v => v).length,
            failedTasks: this.failedTasks.size,
            skippedTasks: this.skippedTasks.size,
            pendingTasks: this.getPendingTasks().length,
            runningTasks: this.getRunningTasks().length,
        };
    }

    getDetailedStats() {
        return {
            completedTasks: Array.from(this.completedTasks.entries()).filter(([, c]) => c),
            failedTasks: Array.from(this.failedTasks),
            skippedTasks: Array.from(this.skippedTasks),
            pendingTasks: this.getPendingTasks(),
            allTasks: this.getAllTasks(),
        };
    }

    getAllTasks() {
        return Array.from(this.taskMap.entries())
            .map(([id, task]) => ({
                id,
                name: task.getName(),
                prevId: task.getPrevId(),
                tries: task.getTries(),
                status: task.status,
                updatedAt: task.updatedAt,
                error: task.getError(),
                tags: task.getTags(),
            }))
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }

    getPendingTasks(): string[] {
        return Array.from(this.taskMap.entries())
            .filter(([, task]) => task.status === 'pending')
            .map(([id]) => id);
    }

    getRunningTasks(): string[] {
        return Array.from(this.taskMap.entries())
            .filter(([, task]) => task.status === 'running')
            .map(([id]) => id);
    }

    getDependents(taskId: string): Task[] {
        return Array.from(this.taskMap.values()).filter(task => task.getPrevId() === taskId);
    }

    getTaskById(taskId: string): Task | undefined {
        return this.taskMap.get(taskId);
    }

    deleteTask(taskId: string) {
        this.completedTasks.delete(taskId);
        this.failedTasks.delete(taskId);
        this.skippedTasks.delete(taskId);
        this.taskMap.delete(taskId);
    }
}
