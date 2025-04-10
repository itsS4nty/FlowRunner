import { v4 } from 'uuid';

interface TaskConfig {
    prevId?: string;
    tags?: string[];
    priority?: number;
}

export class Task {
    private taskFn: () => Promise<void>;
    private fnName: string;
    private id: string;
    private prevId: string | null = null;
    private tries: number = 0;
    updatedAt: Date;
    private err: unknown = null;
    private tags: string[] = [];

    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' = 'pending';

    constructor(taskFn: () => Promise<void>, config?: TaskConfig) {
        this.taskFn = taskFn;
        this.fnName = taskFn.name || 'anonymous';
        this.id = v4();
        this.prevId = config?.prevId ?? null;
        this.updatedAt = new Date();
        this.tags = config?.tags ?? [];
    }

    public get() {
        return this;
    }
    public getId() {
        return this.id;
    }
    public getPrevId() {
        return this.prevId;
    }
    public addTry() {
        this.tries++;
    }
    public getTries() {
        return this.tries;
    }
    public fail() {
        this.status = 'failed';
    }
    public skip() {
        this.status = 'skipped';
    }
    public running() {
        this.status = 'running';
    }
    public pending() {
        this.status = 'pending';
    }
    public setError(err: unknown) {
        this.err = err;
    }
    public getError() {
        return this.err;
    }
    public updateTime() {
        this.updatedAt = new Date();
    }
    public getName() {
        return this.fnName;
    }
    public getTags() {
        return this.tags;
    }

    async run() {
        try {
            await this.taskFn();
            this.status = 'completed';
        } catch (error) {
            this.status = 'failed';
            throw error;
        }
    }
}
