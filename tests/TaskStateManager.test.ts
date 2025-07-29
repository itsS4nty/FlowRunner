import { TaskStateManager } from '../src/core/TaskStateManager';
import { Task } from '../src/core/Task';

describe('TaskStateManager', () => {
    let stateManager: TaskStateManager;
    let mockTask: Task;

    beforeEach(() => {
        stateManager = new TaskStateManager();
        const taskFn = jest.fn().mockResolvedValue(undefined);
        mockTask = new Task(taskFn, { tags: ['test'] });
    });

    describe('task registration', () => {
        it('should register a task', () => {
            stateManager.registerTask(mockTask);

            const allTasks = stateManager.getAllTasks();
            expect(allTasks).toHaveLength(1);
            expect(allTasks[0].id).toBe(mockTask.getId());
        });

        it('should return task by id', () => {
            stateManager.registerTask(mockTask);

            const retrievedTask = stateManager.getTaskById(mockTask.getId());
            expect(retrievedTask).toBe(mockTask);
        });

        it('should return undefined for non-existent task id', () => {
            const retrievedTask = stateManager.getTaskById('non-existent-id');
            expect(retrievedTask).toBeUndefined();
        });
    });

    describe('task completion', () => {
        it('should mark task as completed', () => {
            const taskId = mockTask.getId();
            stateManager.registerTask(mockTask);

            expect(stateManager.isCompleted(taskId)).toBe(false);

            stateManager.markCompleted(taskId);
            expect(stateManager.isCompleted(taskId)).toBe(true);
        });

        it('should track completed tasks in stats', () => {
            stateManager.registerTask(mockTask);
            stateManager.markCompleted(mockTask.getId());

            const stats = stateManager.getStats();
            expect(stats.completedTasks).toBe(1);
        });
    });

    describe('task failure', () => {
        it('should mark task as failed with error', () => {
            const taskId = mockTask.getId();
            const error = new Error('Test error');
            stateManager.registerTask(mockTask);

            stateManager.markFailed(taskId, error);

            expect(stateManager.isCompleted(taskId)).toBe(false);
            expect(mockTask.getError()).toBe(error);

            const stats = stateManager.getStats();
            expect(stats.failedTasks).toBe(1);
        });
    });

    describe('task skipping', () => {
        it('should mark task as skipped', () => {
            const taskId = mockTask.getId();
            stateManager.registerTask(mockTask);

            stateManager.markSkipped(taskId);

            const stats = stateManager.getStats();
            expect(stats.skippedTasks).toBe(1);
        });
    });

    describe('stats calculation', () => {
        it('should return correct stats for empty state', () => {
            const stats = stateManager.getStats();

            expect(stats).toEqual({
                completedTasks: 0,
                failedTasks: 0,
                skippedTasks: 0,
                pendingTasks: 0,
                runningTasks: 0,
            });
        });

        it('should count pending tasks correctly', () => {
            const task1 = new Task(jest.fn());
            const task2 = new Task(jest.fn());

            stateManager.registerTask(task1);
            stateManager.registerTask(task2);

            const stats = stateManager.getStats();
            expect(stats.pendingTasks).toBe(2);
        });

        it('should count running tasks correctly', () => {
            const task1 = new Task(jest.fn());
            const task2 = new Task(jest.fn());

            task1.running();
            task2.running();

            stateManager.registerTask(task1);
            stateManager.registerTask(task2);

            const stats = stateManager.getStats();
            expect(stats.runningTasks).toBe(2);
        });
    });

    describe('task dependencies', () => {
        it('should find dependent tasks', () => {
            const parentTask = new Task(jest.fn());
            const childTask1 = new Task(jest.fn(), { prevId: parentTask.getId() });
            const childTask2 = new Task(jest.fn(), { prevId: parentTask.getId() });
            const independentTask = new Task(jest.fn());

            stateManager.registerTask(parentTask);
            stateManager.registerTask(childTask1);
            stateManager.registerTask(childTask2);
            stateManager.registerTask(independentTask);

            const dependents = stateManager.getDependents(parentTask.getId());
            expect(dependents).toHaveLength(2);
            expect(dependents.map(t => t.getId())).toContain(childTask1.getId());
            expect(dependents.map(t => t.getId())).toContain(childTask2.getId());
        });
    });

    describe('task deletion', () => {
        it('should delete task and clean up state', () => {
            const taskId = mockTask.getId();
            stateManager.registerTask(mockTask);
            stateManager.markCompleted(taskId);
            stateManager.markFailed(taskId, new Error('test'));
            stateManager.markSkipped(taskId);

            expect(stateManager.getAllTasks()).toHaveLength(1);
            expect(stateManager.isCompleted(taskId)).toBe(false); // Should be false because markFailed sets it to false

            stateManager.deleteTask(taskId);

            expect(stateManager.getAllTasks()).toHaveLength(0);
            expect(stateManager.isCompleted(taskId)).toBe(false);
            expect(stateManager.getTaskById(taskId)).toBeUndefined();
        });
    });

    describe('getAllTasks', () => {
        it('should return tasks sorted by updatedAt descending', async () => {
            const task1 = new Task(jest.fn());
            const task2 = new Task(jest.fn());

            stateManager.registerTask(task1);

            // Wait to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 10));
            task2.updateTime();
            stateManager.registerTask(task2);

            const allTasks = stateManager.getAllTasks();
            expect(allTasks[0].id).toBe(task2.getId());
            expect(allTasks[1].id).toBe(task1.getId());
        });

        it('should return tasks with correct format', () => {
            mockTask.addTry();
            mockTask.running();
            mockTask.setError(new Error('test error'));
            stateManager.registerTask(mockTask);

            const allTasks = stateManager.getAllTasks();
            const taskData = allTasks[0];

            expect(taskData).toMatchObject({
                id: mockTask.getId(),
                name: mockTask.getName(),
                prevId: mockTask.getPrevId(),
                tries: 1,
                status: 'running',
                updatedAt: expect.any(Date),
                error: expect.any(Error),
                tags: ['test'],
            });
        });
    });
});
