export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface Task {
    id: string;
    name: string;
    prevId: string | null;
    tries: number;
    status: TaskStatus;
    updatedAt: Date;
    tags: string[];
    error?: {
        message: string;
        stack?: string;
        name?: string;
    };
}

export interface Stats {
    runningTasks: number;
    completedTasks: number;
    pendingTasks: number;
    failedTasks: number;
    skippedTasks: number;
}
