import { useEffect, useState } from 'react';
import { socket } from '../lib/socket';
import type { Task, Stats } from '../types';

export interface UseTaskSocketReturn {
    stats: Stats;
    tasks: Task[];
    isConnected: boolean;
}

export function useTaskSocket(): UseTaskSocketReturn {
    const [stats, setStats] = useState<Stats>({
        runningTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        failedTasks: 0,
        skippedTasks: 0,
    });
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);
        const handleStatsUpdate = (data: Stats) => setStats(data);
        const handleTasksUpdate = (data: Task[]) => setTasks(data);

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('tasks:data', handleStatsUpdate);
        socket.on('tasks:all', handleTasksUpdate);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('tasks:data', handleStatsUpdate);
            socket.off('tasks:all', handleTasksUpdate);
        };
    }, []);

    return { stats, tasks, isConnected };
}
