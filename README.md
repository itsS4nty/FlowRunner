# FlowRunner

A powerful task runner with dependency management, retry mechanisms, and real-time dashboard monitoring.

## Features

- **Dependency Management**: Define task dependencies to control execution order
- **Concurrency Control**: Run multiple tasks simultaneously with configurable limits
- **Retry Logic**: Automatic retry with exponential backoff for failed tasks
- **Real-time Dashboard**: Web interface to monitor task execution and status
- **Task Tagging**: Organize and filter tasks with custom tags
- **Error Handling**: Comprehensive error tracking and reporting

## Table of contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [FlowRunner Class](#flowrunner-class)
  - [Task Class](#task-class)
- [Dashboard](#dashboard)
- [Examples](#examples)



## Installation

```bash
npm install @itss4nty/flowrunner
```

## Quick Start

```typescript
import { FlowRunner, Task } from 'flowrunner';

// Create a runner with custom configuration
const runner = new FlowRunner({ 
    concurrency: 2, 
    maxTries: 3, 
    backoff: 1000 
});

// Start the runner
runner.start();

// Create and add a task
const task = new Task(async () => {
    console.log('Task executed!');
}, { tags: ['example'] });

runner.addTask(task);
```

## API Reference

## FlowRunner Class

Main class for managing task execution.

### `constructor`

```typescript
constructor(config?: Partial<FlowRunnerConfig>)
```

Creates a new FlowRunner instance with optional configuration.

#### Parameters
- `config` (optional): Configuration object to override defaults

#### Configuration Options
- `concurrency`: Maximum number of tasks to run simultaneously (default: `1`)
- `maxTries`: Maximum retry attempts per task (default: `3`)
- `backoff`: Delay in milliseconds before retrying failed tasks (default: `1000`)
- `dashboardPort`: Port for the web dashboard server (default: `3001`)

<hr />

### `start`

```typescript
start(): void
```

Starts the task runner and begins processing queued tasks.

### `addTask`

```typescript
addTask(task: Task): void
```

Adds a task to the execution queue.

#### Parameters
- `task`: A Task instance to be executed

<hr />

### `reRunTask`

```typescript
reRunTask(taskId: string): void
```

Retries a specific task by ID. The task will only retry if its dependencies are satisfied.

#### Parameters
- `taskId`: The unique identifier of the task to retry

<hr />

### `getStats`

```typescript
getStats(): TaskStats
```

Returns current execution statistics.

#### Returns
```typescript
{
    runningTasks: number;
    completedTasks: number;
    pendingTasks: number;
    failedTasks: number;
    skippedTasks: number;
}
```

### `getAllTasks`

```typescript
getAllTasks(): TaskData[]
```

Returns detailed information about all registered tasks.

#### Returns
```typescript
{
    id: string;
    name: string;
    prevId: string | null;
    tries: number;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    updatedAt: Date;
    tags: string[];
    error?: {
        message: string;
        stack?: string;
        name?: string;
    };
}[]
```
<hr />

## Task Class

Represents an individual task with its execution logic and configuration.

### `constructor`

```typescript
constructor(taskFn: Function, options?: TaskOptions)
```

Creates a new Task instance.

#### Parameters
- `taskFn`: The function containing the task logic
- `options`: Optional task configuration
  - `prevId`: ID of the task that must complete before this one runs
  - `tags`: Array of strings for categorizing and filtering tasks

### `getId`

```typescript
getId(): string
```

Returns the unique identifier for this task.

## Dashboard

FlowRunner includes a real-time web dashboard for monitoring task execution. The dashboard displays:

- **Live Statistics**: Real-time counts of pending, running, completed, and failed tasks
- **Task List**: Detailed view of all tasks with status, retry counts, and execution times
- **Dependency Visualization**: Visual representation of task dependencies
- **Error Details**: Stack traces and error information for failed tasks
- **Search and Filtering**: Filter tasks by status, tags, or search terms

The dashboard is automatically available at `http://localhost:3001` when you create a FlowRunner instance. You can customize the port:

```typescript
// Custom dashboard port
const runner = new FlowRunner({ concurrency: 2, dashboardPort: 4000 }); // Dashboard on port 4000
runner.start();
```

The dashboard is served as static assets bundled with the npm package, so no additional setup is required.

## Examples

### Basic Usage

### Basic Usage

Create a runner and add a task:

```typescript
const runner = new FlowRunner({ concurrency: 2, maxTries: 2, backoff: 1000 });
runner.start();

const task1 = new Task(async () => {
    console.log('Task 1 started');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Task 1 completed');
}, {
    tags: ['database', 'migration']
});

runner.addTask(task1);
```

### Task Dependencies

Create tasks that depend on other tasks:

```typescript
const task2 = new Task(async () => {
    console.log('This runs after task1 completes');
}, {
    prevId: task1.getId(),
    tags: ['cleanup']
});

runner.addTask(task2);
```

### Error Handling and Monitoring

```typescript
// Monitor task completion
const stats = runner.getStats();
console.log(`Completed: ${stats.completedTasks}, Failed: ${stats.failedTasks}`);

// Get detailed task information
const allTasks = runner.getAllTasks();
allTasks.forEach(task => {
    if (task.status === 'failed' && task.error) {
        console.error(`Task ${task.id} failed:`, task.error.message);
    }
});

// Retry a specific failed task
runner.reRunTask('task-id-here');
```



