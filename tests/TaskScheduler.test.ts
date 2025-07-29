import { TaskScheduler } from '../src/core/TaskScheduler';
import { TaskStateManager } from '../src/core/TaskStateManager';
import { Task } from '../src/core/Task';

describe('TaskScheduler', () => {
    let scheduler: TaskScheduler;
    let stateManager: TaskStateManager;
    let mockCallbacks: {
        onTaskComplete: jest.Mock;
        onTaskFail: jest.Mock;
        onAbortChain: jest.Mock;
        onTaskRetry: jest.Mock;
        onTaskFinish: jest.Mock;
    };

    beforeEach(() => {
        stateManager = new TaskStateManager();
        mockCallbacks = {
            onTaskComplete: jest.fn(),
            onTaskFail: jest.fn(),
            onAbortChain: jest.fn(),
            onTaskRetry: jest.fn(),
            onTaskFinish: jest.fn(),
        };

        scheduler = new TaskScheduler({
            concurrency: 2,
            maxTries: 3,
            backoff: 100,
            ...mockCallbacks,
            getState: () => stateManager,
        });
    });

    describe('task enqueueing', () => {
        it('should enqueue a task', () => {
            const task = new Task(jest.fn().mockResolvedValue(undefined));

            scheduler.enqueue(task);

            // No direct way to check pending tasks, but we can verify via trySchedule behavior
            expect(() => scheduler.trySchedule()).not.toThrow();
        });
    });

    describe('task scheduling', () => {
        it('should run independent tasks immediately when under concurrency limit', async () => {
            const taskFn1 = jest.fn().mockResolvedValue(undefined);
            const taskFn2 = jest.fn().mockResolvedValue(undefined);
            const task1 = new Task(taskFn1);
            const task2 = new Task(taskFn2);

            stateManager.registerTask(task1);
            stateManager.registerTask(task2);

            scheduler.enqueue(task1);
            scheduler.enqueue(task2);

            scheduler.trySchedule();

            // Wait for async execution
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(taskFn1).toHaveBeenCalled();
            expect(taskFn2).toHaveBeenCalled();
        });

        it('should respect concurrency limit', async () => {
            // Create 3 slow tasks (scheduler has concurrency of 2)
            const taskFn1 = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 200)));
            const taskFn2 = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 200)));
            const taskFn3 = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 200)));

            const task1 = new Task(taskFn1);
            const task2 = new Task(taskFn2);
            const task3 = new Task(taskFn3);

            stateManager.registerTask(task1);
            stateManager.registerTask(task2);
            stateManager.registerTask(task3);

            scheduler.enqueue(task1);
            scheduler.enqueue(task2);
            scheduler.enqueue(task3);

            scheduler.trySchedule();

            // Wait a bit, but not long enough for tasks to complete
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(taskFn1).toHaveBeenCalled();
            expect(taskFn2).toHaveBeenCalled();
            expect(taskFn3).not.toHaveBeenCalled(); // Should wait due to concurrency limit
        }, 1000);

        it('should wait for dependencies before running tasks', async () => {
            const parentTaskFn = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
            const childTaskFn = jest.fn().mockResolvedValue(undefined);

            const parentTask = new Task(parentTaskFn);
            const childTask = new Task(childTaskFn, { prevId: parentTask.getId() });

            stateManager.registerTask(parentTask);
            stateManager.registerTask(childTask);

            scheduler.enqueue(parentTask);
            scheduler.enqueue(childTask);

            scheduler.trySchedule();

            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(parentTaskFn).toHaveBeenCalled();
            expect(childTaskFn).not.toHaveBeenCalled(); // Should wait for parent
        });

        it('should run dependent tasks after parent completes', async () => {
            const parentTaskFn = jest.fn().mockResolvedValue(undefined);
            const childTaskFn = jest.fn().mockResolvedValue(undefined);

            const parentTask = new Task(parentTaskFn);
            const childTask = new Task(childTaskFn, { prevId: parentTask.getId() });

            stateManager.registerTask(parentTask);
            stateManager.registerTask(childTask);

            scheduler.enqueue(parentTask);
            scheduler.enqueue(childTask);

            scheduler.trySchedule();

            // Wait for parent to complete
            await new Promise(resolve => setTimeout(resolve, 50));

            // Mark parent as completed in state manager
            stateManager.markCompleted(parentTask.getId());

            // Try to schedule again
            scheduler.trySchedule();

            // Wait for child to run
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(childTaskFn).toHaveBeenCalled();
        });
    });

    describe('error handling and retries', () => {
        it('should retry failed tasks up to maxTries', async () => {
            let attempts = 0;
            const taskFn = jest.fn().mockImplementation(() => {
                attempts++;
                if (attempts < 3) {
                    throw new Error('Task failed');
                }
                return Promise.resolve();
            });

            const task = new Task(taskFn);
            stateManager.registerTask(task);

            scheduler.enqueue(task);
            scheduler.trySchedule();

            // Wait for retries to happen
            await new Promise(resolve => setTimeout(resolve, 500));

            expect(taskFn).toHaveBeenCalledTimes(3);
            expect(task.getTries()).toBe(3);
        }, 1000);

        it('should call onTaskFail callback when task fails', async () => {
            const error = new Error('Task failed');
            const taskFn = jest.fn().mockRejectedValue(error);
            const task = new Task(taskFn);

            stateManager.registerTask(task);
            scheduler.enqueue(task);
            scheduler.trySchedule();

            await new Promise(resolve => setTimeout(resolve, 150));

            expect(mockCallbacks.onTaskFail).toHaveBeenCalledWith(
                task,
                expect.objectContaining({
                    message: 'Task failed',
                    name: 'Error',
                })
            );
        });

        it('should call onAbortChain when task exceeds maxTries', async () => {
            const taskFn = jest.fn().mockRejectedValue(new Error('Always fails'));
            const task = new Task(taskFn);

            stateManager.registerTask(task);
            scheduler.enqueue(task);
            scheduler.trySchedule();

            // Wait for all retries to complete
            await new Promise(resolve => setTimeout(resolve, 500));

            expect(mockCallbacks.onAbortChain).toHaveBeenCalledWith(task.getId());
        }, 1000);
    });

    describe('task lifecycle callbacks', () => {
        it('should call onTaskComplete when task succeeds', async () => {
            const taskFn = jest.fn().mockResolvedValue(undefined);
            const task = new Task(taskFn);

            stateManager.registerTask(task);
            scheduler.enqueue(task);
            scheduler.trySchedule();

            await new Promise(resolve => setTimeout(resolve, 50));

            expect(mockCallbacks.onTaskComplete).toHaveBeenCalledWith(task.getId());
        });

        it('should call onTaskFinish for both successful and failed tasks', async () => {
            const successTask = new Task(jest.fn().mockResolvedValue(undefined));
            const failTask = new Task(jest.fn().mockRejectedValue(new Error('fail')));

            stateManager.registerTask(successTask);
            stateManager.registerTask(failTask);

            scheduler.enqueue(successTask);
            scheduler.enqueue(failTask);
            scheduler.trySchedule();

            await new Promise(resolve => setTimeout(resolve, 150));

            expect(mockCallbacks.onTaskFinish).toHaveBeenCalledWith(successTask);
            expect(mockCallbacks.onTaskFinish).toHaveBeenCalledWith(failTask);
        });

        it('should call onTaskRetry when retrying a task', async () => {
            let attempts = 0;
            const taskFn = jest.fn().mockImplementation(() => {
                attempts++;
                if (attempts === 1) {
                    throw new Error('First attempt fails');
                }
                return Promise.resolve();
            });

            const task = new Task(taskFn);
            stateManager.registerTask(task);

            scheduler.enqueue(task);
            scheduler.trySchedule();

            await new Promise(resolve => setTimeout(resolve, 250));

            expect(mockCallbacks.onTaskRetry).toHaveBeenCalledWith(task);
        });
    });
});
