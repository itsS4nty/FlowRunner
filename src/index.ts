export { FlowRunner } from './core/FlowRunner';
export { Task } from './core/Task';

// Demo usage (can be removed in production)
import { Task } from './core/Task';
import { FlowRunner } from './core/FlowRunner';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const runner = new FlowRunner({ concurrency: 2, maxTries: 2, backoff: 1000 });

const task1Fn = async () => {
    console.log('Task 1 started');
    await sleep(2000);
    console.log('Task 1 completed');
};
const task1 = new Task(task1Fn, {
    tags: ['tag1', 'tag2'],
});
runner.start();

const task2 = new Task(
    async () => {
        console.log('Task 2 started');
        await sleep(1000);
        console.log('Task 2 completed');
    },
    {
        prevId: task1.getId(),
    },
);

const task3 = new Task(
    async () => {
        console.log('Task 3 started');
        await sleep(3000);
        console.log('Task 3 completed');
    },
    {
        prevId: task1.getId(),
    },
);

const task4 = new Task(
    async () => {
        console.log('Task 4 started');
        await sleep(5000);
        throw new Error('Task 4 failed');
    },
    {
        prevId: task1.getId(),
        tags: ['tag3'],
    },
);
const task5 = new Task(
    async () => {
        console.log('Task 5 started');
        await sleep(3000);
        console.log('Task 5 completed');
    },
    {
        prevId: task1.getId(),
        tags: ['tag3'],
    },
);
const task6 = new Task(
    async () => {
        console.log('Task 6 started');
        await sleep(3000);
        console.log('Task 6 completed');
    },
    {
        prevId: task1.getId(),
        tags: ['tag3'],
    },
);

runner.addTask(task1);
runner.addTask(task2);
runner.addTask(task3);
runner.addTask(task4);
runner.addTask(task5);
runner.addTask(task6);

setTimeout(() => {
    const task7 = new Task(
        async () => {
            console.log('Task 7 started');
            await sleep(1000);
            console.log('Task 7 completed');
        },
        {
            prevId: task4.getId(),
        },
    );
    runner.addTask(task7);
}, 20000);

// Puedes seguir añadiendo tareas dinámicamente:

// setInterval(() => {
//     const fn1 = async () => {
//         console.log('Dynamic Task 1 started');
//         await sleep(1000);
//         console.log('Dynamic Task 1 completed');
//     };
//     const dynamicTask1 = new Task(fn1);
//     const fn2 = async () => {
//         console.log('Dynamic Task 2 started');
//         await sleep(1000);
//         console.log('Dynamic Task 2 completed');
//     };
//     const dynamicTask2 = new Task(fn2);
//     const fn3 = async () => {
//         console.log('Dynamic Task 3 started');
//         await sleep(1000);
//         console.log('Dynamic Task 3 completed');
//     };
//     const dynamicTask3 = new Task(fn3, task4.getId());
//     runner.addTask(dynamicTask1);
//     runner.addTask(dynamicTask2);
//     runner.addTask(dynamicTask3);
// }, 5000);
