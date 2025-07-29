import { Task } from './Task';
import { TaskScheduler } from './TaskScheduler';
import { TaskStateManager } from './TaskStateManager';
import { DashboardGateway } from './DashboardGateway';

type CONFIG = {
    concurrency: number;
    maxTries: number;
    backoff: number;
};
const DEFAULT_CONFIG: CONFIG = {
    concurrency: 1,
    maxTries: 3,
    backoff: 1000,
};

export class FlowRunner {
    private scheduler: TaskScheduler;
    private state: TaskStateManager;
    private isStarted = false;
    private io: DashboardGateway;

    constructor(_config?: Partial<CONFIG>, dashboardPort?: number) {
        const config: CONFIG = { ...DEFAULT_CONFIG, ..._config };
        this.io = new DashboardGateway(() => ({
            allTasks: this.getAllTasks(),
            stats: this.getStats(),
        }), dashboardPort);
        this.io.registerHandler('task:retry', (taskId: string) => {
            this._reRunTask(taskId);
        });
        this.state = new TaskStateManager();
        this.scheduler = new TaskScheduler({
            ...config,
            onTaskComplete: (taskId: string) => {
                this.state.markCompleted(taskId);
                this.scheduler.trySchedule();
                this.sendDataThroughSocket();
            },
            onTaskFail: (task, error) => {
                this.state.markFailed(task.getId(), error);
                this.sendDataThroughSocket();
            },
            onAbortChain: (taskId: string) => {
                const dependents = this.state.getDependents(taskId);
                for (const task of dependents) {
                    task.skip();
                    task.updateTime();
                    this.state.markSkipped(task.getId());
                }
                this.sendDataThroughSocket();
            },
            onTaskRetry: task => {
                task.running();
                this.sendDataThroughSocket();
            },
            onTaskFinish: task => {
                task.updateTime();
                this.sendDataThroughSocket();
            },
            getState: () => this.state,
        });
    }

    private sendDataThroughSocket() {
        this.io.sendData('tasks:all', this.getAllTasks());
        this.io.sendData('tasks:data', this.getStats());
    }

    addTask(task: Task) {
        this.state.registerTask(task);
        this.scheduler.enqueue(task);

        if (this.isStarted) this.scheduler.trySchedule();
        this.sendDataThroughSocket();
    }

    getStats() {
        return this.state.getStats();
    }

    getAllTasks() {
        return this.state.getAllTasks();
    }

    public reRunTask(taskId: string) {
        this._reRunTask(taskId, false);
    }

    private _reRunTask(taskId: string, force = false) {
        const task = this.state.getTaskById(taskId);
        if (!task) throw new Error(`Task with ID ${taskId} not found`);

        if (!force && task.status === 'skipped') return;

        this.state.deleteTask(taskId);
        this.state.registerTask(task);

        task.pending();
        task.updateTime();
        this.scheduler.enqueue(task);
        this.scheduler.trySchedule();
        this.sendDataThroughSocket();

        const dependents = this.state.getDependents(taskId);
        for (const dependent of dependents) {
            this._reRunTask(dependent.getId(), true);
        }
    }

    start() {
        if (this.isStarted) return;
        this.isStarted = true;
        this.scheduler.trySchedule();
    }

    close() {
        this.io.close();
    }
}
