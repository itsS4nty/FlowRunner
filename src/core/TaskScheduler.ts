import { Task } from './Task';
import { TaskStateManager } from './TaskStateManager';

interface SchedulerConfig {
    concurrency: number;
    maxTries: number;
    backoff: number;
    onTaskComplete: (taskId: string) => void;
    onTaskFail: (task: Task, error: unknown) => void;
    onAbortChain: (taskId: string) => void;
    onTaskRetry: (task: Task) => void;
    onTaskFinish: (task: Task) => void;
    getState: () => TaskStateManager;
}

export class TaskScheduler {
    private concurrency: number;
    private maxTries: number;
    private backoff: number;
    private runningTasks = 0;
    private pendingTasks: Set<string> = new Set();
    private taskMap: Map<string, Task> = new Map();

    private onTaskComplete;
    private onTaskFail;
    private onAbortChain;
    private onTaskRetry;
    private onTaskFinish;
    private getState;

    constructor(config: SchedulerConfig) {
        this.concurrency = config.concurrency;
        this.maxTries = config.maxTries;
        this.backoff = config.backoff;
        this.onTaskComplete = config.onTaskComplete;
        this.onTaskFail = config.onTaskFail;
        this.onAbortChain = config.onAbortChain;
        this.onTaskRetry = config.onTaskRetry;
        this.onTaskFinish = config.onTaskFinish;
        this.getState = config.getState;
    }

    enqueue(task: Task) {
        this.taskMap.set(task.getId(), task);
        this.pendingTasks.add(task.getId());
    }

    trySchedule() {
        if (this.runningTasks >= this.concurrency) return;

        for (const taskId of Array.from(this.pendingTasks)) {
            if (this.runningTasks >= this.concurrency) break;
            const task = this.taskMap.get(taskId);
            if (task && this.canRun(task)) {
                this.pendingTasks.delete(taskId);
                this.runTask(task);
            } else if (task && this.shouldSkipTask(task)) {
                task.skip();
                this.getState().markSkipped(task.getId());
                this.onAbortChain(task.getId());
            }
        }
    }

    private canRun(task: Task): boolean {
        const prevId = task.getPrevId();
        return !prevId || this.getState().isCompleted(prevId);
    }

    private shouldSkipTask(task: Task): boolean {
        const prevId = task.getPrevId();
        if (!prevId) return false;

        const prevTask = this.taskMap.get(prevId);
        if (!prevTask) return false;

        return (
            prevTask.getTries() >= this.maxTries &&
            (prevTask.status === 'failed' || prevTask.status === 'skipped')
        );
    }

    private async runTask(task: Task) {
        this.runningTasks++;
        task.addTry();
        task.running();

        try {
            await task.run();
            this.onTaskComplete(task.getId());
        } catch (err) {
            if (task.getTries() >= this.maxTries) {
                task.fail();
                this.onAbortChain(task.getId());
            } else {
                setTimeout(() => {
                    this.onTaskRetry(task);
                    this.pendingTasks.add(task.getId());
                    this.trySchedule();
                }, this.backoff);
            }

            const error = {
                message: err instanceof Error ? err.message : 'Unknown error',
                stack: err instanceof Error ? err.stack : undefined,
                name: err instanceof Error ? err.name : undefined,
            };
            this.onTaskFail(task, error);
        } finally {
            this.onTaskFinish(task);
            this.runningTasks--;
        }
    }
}
