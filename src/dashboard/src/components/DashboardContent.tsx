import TaskTable from './TaskTable';
import SidePanel from './SidePanel';
import type { Task, TaskStatus } from '../types';

interface DashboardContentProps {
    tasks: Task[];
    selectedTask: Task | null;
    setSelectedTask: (task: Task | null) => void;
    hoveredTaskId: string;
    setHoveredTaskId: (id: string) => void;
    filterStatus: TaskStatus | null;
    filterTags: string[];
    setFilterTags: (tags: string[]) => void;
    searchTerm: string;
}

export default function DashboardContent({
    tasks,
    selectedTask,
    setSelectedTask,
    hoveredTaskId,
    setHoveredTaskId,
    filterStatus,
    filterTags,
    setFilterTags,
    searchTerm,
}: DashboardContentProps) {
    return (
        <div className="flex gap-6 w-full">
            <div className="w-full">
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
            </div>
            
            <div className="">
                <SidePanel 
                    task={selectedTask} 
                    setTask={setSelectedTask} 
                    tasks={tasks} 
                />
            </div>
        </div>
    );
}
