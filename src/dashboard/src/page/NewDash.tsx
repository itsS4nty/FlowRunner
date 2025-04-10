import { useEffect, useState } from 'react';
import StatCards from '../components/StatCards';
import SearchBar from '../components/SearchBar';
import SidePanel from '../components/SidePanel';
import type { Task, Stats, TaskStatus } from '../types';
import TaskTable from '../components/TaskTable';
import { socket } from '../lib/socket';



export default function Dashboard() {
    const [stats, setStats] = useState<Stats>({
        runningTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        failedTasks: 0,
        skippedTasks: 0,
    });
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [hoveredTaskId, setHoveredTaskId] = useState<string>('none');
    const [filterStatus, setFilterStatus] = useState<TaskStatus | null>(null);
    const [filterTags, setFilterTags] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        socket.on('tasks:data', (data: Stats) => setStats(data));
        socket.on('tasks:all', (data: Task[]) => setTasks(data));
        return () => {
            socket.off('tasks:data');
            socket.off('tasks:all');
        };
    }, []);

    const updateFilter = (status: TaskStatus) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setFilterStatus((prev: any) => (prev === status ? null : status));
    };

    return (
        <main className="p-8">
            <h1 className="text-3xl font-bold mb-6">🧠 TaskRunner Dashboard</h1>

            <StatCards stats={stats} filterStatus={filterStatus} updateFilter={updateFilter} />

            <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                setFilterStatus={setFilterStatus}
                setFilterTags={setFilterTags}
            />

            <TaskTable
                tasks={tasks}
                selectedTask={selectedTask}
                setSelectedTask={setSelectedTask}
                hoveredTaskId={hoveredTaskId}
                setHoveredTaskId={setHoveredTaskId}
                filterStatus={filterStatus}
                filterTags={filterTags}
                setFilterTags={setFilterTags}
                searchTerm={searchTerm}
            />

            <SidePanel task={selectedTask} setTask={setSelectedTask} tasks={tasks} />
        </main>
    );
}

// Export socket if needed elsewhere
