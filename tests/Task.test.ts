import { Task } from '../src/core/Task';

describe('Task', () => {
    it('should create a task with default properties', () => {
        const mockFn = jest.fn();
        const task = new Task(mockFn);

        expect(task.status).toBe('pending');
        expect(task.getTags()).toEqual([]);
        expect(task.getName()).toBe('mockConstructor'); // Jest mock functions have this name
    });

    it('should create a task with configuration', () => {
        const taskFn = jest.fn().mockResolvedValue(undefined);
        const config = {
            prevId: 'some-id',
            tags: ['tag1', 'tag2'],
        };
        const task = new Task(taskFn, config);

        expect(task.getPrevId()).toBe('some-id');
        expect(task.getTags()).toEqual(['tag1', 'tag2']);
    });

    it('should handle anonymous functions', () => {
        const task = new Task(async () => {});
        expect(task.getName()).toBe('anonymous');
    });

    it('should increment tries when addTry is called', () => {
        const task = new Task(jest.fn().mockResolvedValue(undefined));

        expect(task.getTries()).toBe(0);
        task.addTry();
        expect(task.getTries()).toBe(1);
        task.addTry();
        expect(task.getTries()).toBe(2);
    });

    it('should change status methods', () => {
        const task = new Task(jest.fn().mockResolvedValue(undefined));

        expect(task.status).toBe('pending');

        task.running();
        expect(task.status).toBe('running');

        task.fail();
        expect(task.status).toBe('failed');

        task.skip();
        expect(task.status).toBe('skipped');

        task.pending();
        expect(task.status).toBe('pending');
    });

    it('should set and get error', () => {
        const task = new Task(jest.fn().mockResolvedValue(undefined));
        const error = new Error('Test error');

        expect(task.getError()).toBeNull();

        task.setError(error);
        expect(task.getError()).toBe(error);
    });

    it('should update time when updateTime is called', async () => {
        const task = new Task(jest.fn().mockResolvedValue(undefined));
        const initialTime = task.updatedAt;

        // Wait a bit to ensure different timestamp
        await new Promise(resolve => setTimeout(resolve, 10));
        task.updateTime();

        expect(task.updatedAt.getTime()).toBeGreaterThan(initialTime.getTime());
    });

    describe('run method', () => {
        it('should execute the task function and set status to completed', async () => {
            const taskFn = jest.fn().mockResolvedValue(undefined);
            const task = new Task(taskFn);

            await task.run();

            expect(taskFn).toHaveBeenCalledTimes(1);
            expect(task.status).toBe('completed');
        });

        it('should set status to failed and throw error when task function throws', async () => {
            const error = new Error('Task failed');
            const taskFn = jest.fn().mockRejectedValue(error);
            const task = new Task(taskFn);

            await expect(task.run()).rejects.toThrow('Task failed');
            expect(task.status).toBe('failed');
        });

        it('should handle async task functions', async () => {
            let executed = false;
            const taskFn = async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                executed = true;
            };
            const task = new Task(taskFn);

            await task.run();

            expect(executed).toBe(true);
            expect(task.status).toBe('completed');
        });
    });
});
