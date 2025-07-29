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

// Integration tests that test the entire system working together
describe('Integration Tests', () => {
    let flowRunner: FlowRunner;
    let port: number;

    beforeEach(() => {
        port = 4000 + Math.floor(Math.random() * 1000); // Random port to avoid conflicts
        flowRunner = new FlowRunner({ concurrency: 2, maxTries: 2, backoff: 50, dashboardPort: port });
    });

    afterEach(() => {
        flowRunner.close();
    });

    describe('End-to-end task execution', () => {
        it('should execute a complex workflow with dependencies', async () => {
            const executionLog: string[] = [];

            // Create a workflow: A -> B, C (B and C depend on A)
            const taskA = new Task(async () => {
                executionLog.push('A-start');
                await new Promise(resolve => setTimeout(resolve, 50));
                executionLog.push('A-end');
            }, { tags: ['workflow'] });

            const taskB = new Task(async () => {
                executionLog.push('B-start');
                await new Promise(resolve => setTimeout(resolve, 30));
                executionLog.push('B-end');
            }, { prevId: taskA.getId(), tags: ['workflow'] });

            const taskC = new Task(async () => {
                executionLog.push('C-start');
                await new Promise(resolve => setTimeout(resolve, 20));
                executionLog.push('C-end');
            }, { prevId: taskA.getId(), tags: ['workflow'] });

            // Add tasks in random order to test dependency resolution
            flowRunner.addTask(taskB);
            flowRunner.addTask(taskC);
            flowRunner.addTask(taskA);
            flowRunner.start();

            // Wait for all tasks to complete
            await new Promise(resolve => setTimeout(resolve, 300));

            // Verify execution order
            expect(executionLog[0]).toBe('A-start');
            expect(executionLog[1]).toBe('A-end');

            // B and C should start after A ends (order between B and C is not guaranteed)
            const indexBStart = executionLog.indexOf('B-start');
            const indexCStart = executionLog.indexOf('C-start');
            const indexAEnd = executionLog.indexOf('A-end');

            expect(indexBStart).toBeGreaterThan(indexAEnd);
            expect(indexCStart).toBeGreaterThan(indexAEnd);

            // Verify all tasks completed
            const stats = flowRunner.getStats();
            expect(stats.completedTasks).toBe(3);
            expect(stats.failedTasks).toBe(0);
            expect(stats.skippedTasks).toBe(0);
        }, 1000);

        it('should handle failure cascade correctly', async () => {
            const executionLog: string[] = [];

            // Create workflow where parent fails
            const parentTask = new Task(async () => {
                executionLog.push('parent-executed');
                throw new Error('Parent task failed');
            });

            const childTask1 = new Task(async () => {
                executionLog.push('child1-executed');
            }, { prevId: parentTask.getId() });

            const childTask2 = new Task(async () => {
                executionLog.push('child2-executed');
            }, { prevId: parentTask.getId() });

            flowRunner.addTask(parentTask);
            flowRunner.addTask(childTask1);
            flowRunner.addTask(childTask2);
            flowRunner.start();

            // Wait for execution and retries
            await new Promise(resolve => setTimeout(resolve, 300));

            // Parent should have been executed (and retried)
            expect(executionLog.filter(log => log === 'parent-executed').length).toBe(2); // maxTries = 2

            // Children should not have been executed
            expect(executionLog).not.toContain('child1-executed');
            expect(executionLog).not.toContain('child2-executed');

            // Verify final state
            const allTasks = flowRunner.getAllTasks();
            const parentTaskData = allTasks.find(t => t.id === parentTask.getId());
            const child1TaskData = allTasks.find(t => t.id === childTask1.getId());
            const child2TaskData = allTasks.find(t => t.id === childTask2.getId());

            expect(parentTaskData?.status).toBe('failed');
            expect(child1TaskData?.status).toBe('skipped');
            expect(child2TaskData?.status).toBe('skipped');

            const stats = flowRunner.getStats();
            expect(stats.failedTasks).toBe(1);
            expect(stats.skippedTasks).toBe(2);
        });

        it('should retry tasks and update statistics correctly', async () => {
            let attempts = 0;
            const task = new Task(async () => {
                attempts++;
                if (attempts === 1) {
                    throw new Error('First attempt fails');
                }
                // Second attempt succeeds
            });

            flowRunner.addTask(task);
            flowRunner.start();

            // Wait for initial execution and retry
            await new Promise(resolve => setTimeout(resolve, 300));

            expect(attempts).toBe(2);

            const stats = flowRunner.getStats();
            expect(stats.completedTasks).toBe(1);
            // Note: The task may be counted as failed during the first attempt
            // but should end up as completed after retry

            const allTasks = flowRunner.getAllTasks();
            const taskData = allTasks.find(t => t.id === task.getId());
            expect(taskData?.status).toBe('completed');
            expect(taskData?.tries).toBe(2);
        });

        it('should handle concurrent task execution correctly', async () => {
            const executionLog: { taskId: string; timestamp: number }[] = [];

            // Create multiple independent tasks
            const tasks = Array.from({ length: 5 }, (_, i) =>
                new Task(async () => {
                    executionLog.push({ taskId: `task-${i}`, timestamp: Date.now() });
                    await new Promise(resolve => setTimeout(resolve, 50));
                })
            );

            tasks.forEach(task => flowRunner.addTask(task));
            flowRunner.start();

            // Wait for all tasks to complete
            await new Promise(resolve => setTimeout(resolve, 500));

            // Verify all tasks executed
            expect(executionLog).toHaveLength(5);

            // With concurrency of 2, first two tasks should start almost simultaneously
            const sortedLogs = executionLog.sort((a, b) => a.timestamp - b.timestamp);
            const timeDiff = sortedLogs[1].timestamp - sortedLogs[0].timestamp;
            expect(timeDiff).toBeLessThan(50); // Should start within 50ms of each other

            const stats = flowRunner.getStats();
            expect(stats.completedTasks).toBe(5);
        }, 1000);
    });

    describe('Task re-running scenarios', () => {
        it('should re-run a completed task successfully', async () => {
            let executionCount = 0;
            const task = new Task(async () => {
                executionCount++;
            });

            flowRunner.addTask(task);
            flowRunner.start();

            // Wait for initial execution
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(executionCount).toBe(1);

            // Re-run the task
            flowRunner.reRunTask(task.getId());

            // Wait for re-execution
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(executionCount).toBe(2);

            const stats = flowRunner.getStats();
            expect(stats.completedTasks).toBe(1); // Should still be 1 as it's the same task
        });

        it('should re-run failed task and dependent tasks', async () => {
            let parentAttempts = 0;
            let childExecutions = 0;

            const parentTask = new Task(async () => {
                parentAttempts++;
                if (parentAttempts <= 2) { // Fail first 2 attempts (initial + 1 retry)
                    throw new Error('Parent fails');
                }
                // Succeed on 3rd attempt (manual retry)
            });

            const childTask = new Task(async () => {
                childExecutions++;
            }, { prevId: parentTask.getId() });

            flowRunner.addTask(parentTask);
            flowRunner.addTask(childTask);
            flowRunner.start();

            // Wait for initial attempts
            await new Promise(resolve => setTimeout(resolve, 200));

            expect(parentAttempts).toBe(2); // Initial + 1 retry
            expect(childExecutions).toBe(0); // Should not execute due to parent failure

            // Manually retry the parent task
            flowRunner.reRunTask(parentTask.getId());

            // Wait for retry execution
            await new Promise(resolve => setTimeout(resolve, 200));

            expect(parentAttempts).toBe(3); // Now succeeds
            expect(childExecutions).toBe(1); // Should execute after parent succeeds

            const stats = flowRunner.getStats();
            expect(stats.completedTasks).toBe(2);
            expect(stats.failedTasks).toBe(0);
        });
    });

    describe('Complex dependency chains', () => {
        it('should handle deep dependency chains', async () => {
            const executionOrder: string[] = [];

            // Create chain: A -> B -> C -> D
            const taskA = new Task(async () => {
                executionOrder.push('A');
            });

            const taskB = new Task(async () => {
                executionOrder.push('B');
            }, { prevId: taskA.getId() });

            const taskC = new Task(async () => {
                executionOrder.push('C');
            }, { prevId: taskB.getId() });

            const taskD = new Task(async () => {
                executionOrder.push('D');
            }, { prevId: taskC.getId() });

            // Add in reverse order
            flowRunner.addTask(taskD);
            flowRunner.addTask(taskC);
            flowRunner.addTask(taskB);
            flowRunner.addTask(taskA);
            flowRunner.start();

            // Wait for execution
            await new Promise(resolve => setTimeout(resolve, 300));

            expect(executionOrder).toEqual(['A', 'B', 'C', 'D']);

            const stats = flowRunner.getStats();
            expect(stats.completedTasks).toBe(4);
        });

        it('should handle diamond dependency pattern', async () => {
            const executionOrder: string[] = [];

            // Create diamond: A -> B, C -> D (D depends on both B and C)
            const taskA = new Task(async () => {
                executionOrder.push('A');
                await new Promise(resolve => setTimeout(resolve, 50));
            });

            const taskB = new Task(async () => {
                executionOrder.push('B');
                await new Promise(resolve => setTimeout(resolve, 30));
            }, { prevId: taskA.getId() });

            const taskC = new Task(async () => {
                executionOrder.push('C');
                await new Promise(resolve => setTimeout(resolve, 20));
            }, { prevId: taskA.getId() });

            // Note: Current implementation doesn't support multiple dependencies
            // So we create D to depend only on B, but this shows the limitation
            const taskD = new Task(async () => {
                executionOrder.push('D');
            }, { prevId: taskB.getId() });

            flowRunner.addTask(taskA);
            flowRunner.addTask(taskB);
            flowRunner.addTask(taskC);
            flowRunner.addTask(taskD);
            flowRunner.start();

            await new Promise(resolve => setTimeout(resolve, 300));

            // A should execute first
            expect(executionOrder[0]).toBe('A');

            // B and C should execute after A (order not guaranteed)
            const indexB = executionOrder.indexOf('B');
            const indexC = executionOrder.indexOf('C');
            const indexA = executionOrder.indexOf('A');

            expect(indexB).toBeGreaterThan(indexA);
            expect(indexC).toBeGreaterThan(indexA);

            // D should execute after B
            const indexD = executionOrder.indexOf('D');
            expect(indexD).toBeGreaterThan(indexB);
        }, 1000);
    });
});
