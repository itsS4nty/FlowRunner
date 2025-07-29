import { FlowRunner } from '../src/core/FlowRunner';
import { Task } from '../src/core/Task';

// Mock the DashboardGateway to avoid socket.io in tests
jest.mock('../src/core/DashboardGateway', () => {
    return {
        DashboardGateway: jest.fn().mockImplementation(() => ({
            sendData: jest.fn(),
            registerHandler: jest.fn(),
            close: jest.fn(),
        })),
    };
});

describe('FlowRunner', () => {
    let flowRunner: FlowRunner;
    let port: number;

    beforeEach(() => {
        port = 3000 + Math.floor(Math.random() * 1000); // Random port to avoid conflicts
        flowRunner = new FlowRunner({ concurrency: 2, maxTries: 2, backoff: 100 }, port);
    });

    afterEach(() => {
        flowRunner.close();
        jest.clearAllMocks();
    });

    describe('initialization', () => {
        it('should create a flowrunner with default config', () => {
            const defaultFlowRunner = new FlowRunner(undefined, port + 1);
            expect(defaultFlowRunner).toBeInstanceOf(FlowRunner);
            defaultFlowRunner.close();
        });

        it('should create a flowrunner with custom config', () => {
            const customFlowRunner = new FlowRunner({
                concurrency: 5,
                maxTries: 5,
                backoff: 2000,
            }, port + 2);
            expect(customFlowRunner).toBeInstanceOf(FlowRunner);
            customFlowRunner.close();
        });
    });

    describe('task management', () => {
        it('should add a task', () => {
            const taskFn = jest.fn().mockResolvedValue(undefined);
            const task = new Task(taskFn);

            flowRunner.addTask(task);

            const allTasks = flowRunner.getAllTasks();
            expect(allTasks).toHaveLength(1);
            expect(allTasks[0].id).toBe(task.getId());
        });

        it('should get all tasks', () => {
            const task1 = new Task(jest.fn().mockResolvedValue(undefined));
            const task2 = new Task(jest.fn().mockResolvedValue(undefined));

            flowRunner.addTask(task1);
            flowRunner.addTask(task2);

            const allTasks = flowRunner.getAllTasks();
            expect(allTasks).toHaveLength(2);
        });

        it('should get stats', () => {
            const task = new Task(jest.fn().mockResolvedValue(undefined));
            flowRunner.addTask(task);

            const stats = flowRunner.getStats();
            expect(stats).toHaveProperty('runningTasks');
            expect(stats).toHaveProperty('completedTasks');
            expect(stats).toHaveProperty('pendingTasks');
            expect(stats).toHaveProperty('failedTasks');
            expect(stats).toHaveProperty('skippedTasks');
            expect(stats.pendingTasks).toBe(1);
        });
    });

    describe('task execution', () => {
        it('should start and execute tasks', async () => {
            const taskFn = jest.fn().mockResolvedValue(undefined);
            const task = new Task(taskFn);

            flowRunner.addTask(task);
            flowRunner.start();

            // Wait for task execution
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(taskFn).toHaveBeenCalled();
        });

        it('should not execute tasks before start is called', async () => {
            const taskFn = jest.fn().mockResolvedValue(undefined);
            const task = new Task(taskFn);

            flowRunner.addTask(task);

            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(taskFn).not.toHaveBeenCalled();
        });

        it('should execute tasks added after start', async () => {
            flowRunner.start();

            const taskFn = jest.fn().mockResolvedValue(undefined);
            const task = new Task(taskFn);

            flowRunner.addTask(task);

            // Wait for task execution
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(taskFn).toHaveBeenCalled();
        });
    });

    describe('task dependencies', () => {
        it('should execute dependent tasks in order', async () => {
            const executionOrder: string[] = [];

            const parentTaskFn = jest.fn().mockImplementation(async () => {
                executionOrder.push('parent');
                await new Promise(resolve => setTimeout(resolve, 50));
            });

            const childTaskFn = jest.fn().mockImplementation(async () => {
                executionOrder.push('child');
            });

            const parentTask = new Task(parentTaskFn);
            const childTask = new Task(childTaskFn, { prevId: parentTask.getId() });

            flowRunner.addTask(parentTask);
            flowRunner.addTask(childTask);
            flowRunner.start();

            // Wait for both tasks to complete
            await new Promise(resolve => setTimeout(resolve, 200));

            expect(executionOrder).toEqual(['parent', 'child']);
        }, 1000);
    });

    describe('task retry functionality', () => {
        it('should retry a task', async () => {
            const taskFn = jest.fn().mockResolvedValue(undefined);
            const task = new Task(taskFn);

            flowRunner.addTask(task);
            flowRunner.start();

            // Wait for initial execution
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(taskFn).toHaveBeenCalledTimes(1);

            // Retry the task
            flowRunner.reRunTask(task.getId());

            // Wait for retry execution
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(taskFn).toHaveBeenCalledTimes(2);
        });

        it('should throw error when trying to retry non-existent task', () => {
            expect(() => {
                flowRunner.reRunTask('non-existent-id');
            }).toThrow('Task with ID non-existent-id not found');
        });

        it('should retry dependent tasks when parent is retried', async () => {
            const parentTaskFn = jest.fn().mockResolvedValue(undefined);
            const childTaskFn = jest.fn().mockResolvedValue(undefined);

            const parentTask = new Task(parentTaskFn);
            const childTask = new Task(childTaskFn, { prevId: parentTask.getId() });

            flowRunner.addTask(parentTask);
            flowRunner.addTask(childTask);
            flowRunner.start();

            // Wait for initial execution
            await new Promise(resolve => setTimeout(resolve, 150));

            expect(parentTaskFn).toHaveBeenCalledTimes(1);
            expect(childTaskFn).toHaveBeenCalledTimes(1);

            // Retry parent task
            flowRunner.reRunTask(parentTask.getId());

            // Wait for retry execution
            await new Promise(resolve => setTimeout(resolve, 150));

            expect(parentTaskFn).toHaveBeenCalledTimes(2);
            expect(childTaskFn).toHaveBeenCalledTimes(2);
        });
    });

    describe('error handling', () => {
        it('should handle task failures gracefully', async () => {
            const error = new Error('Task failed');
            const taskFn = jest.fn().mockRejectedValue(error);
            const task = new Task(taskFn);

            flowRunner.addTask(task);
            flowRunner.start();

            // Wait for task execution and retries
            await new Promise(resolve => setTimeout(resolve, 300));

            const stats = flowRunner.getStats();
            expect(stats.failedTasks).toBe(1);

            const allTasks = flowRunner.getAllTasks();
            expect(allTasks[0].status).toBe('failed');
            expect(allTasks[0].error).toBeDefined();
        });

        it('should skip dependent tasks when parent fails', async () => {
            const parentTaskFn = jest.fn().mockRejectedValue(new Error('Parent failed'));
            const childTaskFn = jest.fn().mockResolvedValue(undefined);

            const parentTask = new Task(parentTaskFn);
            const childTask = new Task(childTaskFn, { prevId: parentTask.getId() });

            flowRunner.addTask(parentTask);
            flowRunner.addTask(childTask);
            flowRunner.start();

            // Wait for execution and retries
            await new Promise(resolve => setTimeout(resolve, 400));

            expect(childTaskFn).not.toHaveBeenCalled();

            const allTasks = flowRunner.getAllTasks();
            const childTaskData = allTasks.find(t => t.id === childTask.getId());
            expect(childTaskData?.status).toBe('skipped');
        });
    });

    describe('multiple starts', () => {
        it('should not start multiple times', async () => {
            const taskFn = jest.fn().mockResolvedValue(undefined);
            const task = new Task(taskFn);

            flowRunner.addTask(task);
            flowRunner.start();
            flowRunner.start(); // Should be ignored
            flowRunner.start(); // Should be ignored

            // Wait for execution
            await new Promise(resolve => setTimeout(resolve, 100));

            expect(taskFn).toHaveBeenCalledTimes(1);
        });
    });
});
