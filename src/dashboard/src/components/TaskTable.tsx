import { Task, TaskStatus } from '../types';
import StatusBadge from './StatusBadge';
import RetryIcon from '../assets/icons/RetryIcon';
import { useState } from 'react';
import { socket } from '../lib/socket';

interface Props {
    tasks: Task[];
    selectedTask: Task | null;
    setSelectedTask: (task: Task) => void;
    hoveredTaskId: string;
    setHoveredTaskId: (id: string) => void;
    filterStatus: TaskStatus | null;
    filterTags: string[];
    setFilterTags: (tags: string[]) => void;
    searchTerm: string;
}

export default function TaskTable({
    tasks,
    selectedTask,
    setSelectedTask,
    hoveredTaskId,
    setHoveredTaskId,
    filterStatus,
    filterTags,
    setFilterTags,
    searchTerm,
}: Props) {
    const [showTagDropdown, setShowTagDropdown] = useState(false);

    const filteredTasks = tasks.filter(task => {
        const statusMatch = !filterStatus || task.status === filterStatus;
        const tagsMatch =
            filterTags.length === 0 || filterTags.every(tag => task.tags.includes(tag));
        const searchMatch = task.name.toLowerCase().includes(searchTerm.toLowerCase());
        return statusMatch && tagsMatch && searchMatch;
    });

    const allTags = Array.from(new Set(tasks.flatMap(task => task.tags)));

    const getHighlightClass = (task: Task): string => {
        if (!selectedTask) return '';
        if (task.id === selectedTask.prevId) return '!border-indigo-500';
        if (task.prevId === selectedTask.id) return '!border-purple-500';
        return '';
    };

    return (
        <div className="bg-white shadow rounded-lg overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 border-l-4 border-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold min-w-[120px] w-[15%]">Name</th>
                            <th className="px-4 py-3 text-left font-semibold min-w-[200px] w-[20%]">ID</th>
                            <th className="px-4 py-3 text-left font-semibold min-w-[200px] w-[20%]">Prev</th>
                            <th className="px-4 py-3 text-left font-semibold min-w-[100px] w-[10%]">Status</th>
                            <th className="px-4 py-3 text-left font-semibold min-w-[60px] w-[8%]">Tries</th>
                            <th className="relative px-4 py-3 text-left font-semibold min-w-[100px] w-[12%]">
                                <button
                                    className="hover:text-blue-600 transition cursor-pointer"
                                    onClick={() => setShowTagDropdown(prev => !prev)}>
                                    Tags
                                </button>

                                {showTagDropdown && (
                                    <div className="absolute z-50 mt-2 left-0 bg-white border border-gray-200 rounded shadow-md w-48 p-2">
                                        <div className="text-xs text-gray-500 mb-1">Filter by tags</div>
                                        <div className="flex flex-wrap gap-1">
                                            {allTags.map(tag => {
                                                const selected = filterTags.includes(tag);
                                                return (
                                                    <button
                                                        key={tag}
                                                        onClick={() => {
                                                            const updatedTags = selected
                                                                ? filterTags.filter(t => t !== tag)
                                                                : [...filterTags, tag];
                                                            setFilterTags(updatedTags);
                                                        }}
                                                        className={`text-xs px-2 py-1 rounded-full border transition cursor-pointer
                                                            ${
                                                                selected
                                                                    ? 'bg-blue-100 text-blue-700 border-blue-300'
                                                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                                                            }
                                                        `}>
                                                        {tag}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {filterTags.length > 0 && (
                                            <button
                                                onClick={() => setFilterTags([])}
                                                className="cursor-pointer mt-2 text-xs text-blue-600 hover:underline">
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                )}
                            </th>
                            <th className="px-4 py-3 text-left font-semibold min-w-[160px] w-[10%]">Updated At</th>
                            <th className="px-4 py-3 text-left font-semibold min-w-[60px] w-[5%]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredTasks.map(task => (
                            <tr
                                key={task.id}
                                className={`
                                    hover:bg-gray-50 cursor-pointer border-l-4 border-transparent transition-colors
                                    ${getHighlightClass(task)}
                                    ${hoveredTaskId === task.prevId ? '!border-l-purple-500' : ''}
                                    ${tasks.find(t => t.id === hoveredTaskId)?.prevId === task.id ? '!border-l-indigo-500' : ''}
                                `}
                                onClick={() => setSelectedTask(task)}
                                onMouseEnter={() => setHoveredTaskId(task.id)}
                                onMouseLeave={() => setHoveredTaskId('none')}>
                                <td className="px-4 py-3">
                                    <div className="flex items-center">
                                        <span className="font-medium text-gray-900">{task.name}</span>
                                        {selectedTask && task.id === selectedTask.prevId && (
                                            <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                                parent
                                            </span>
                                        )}
                                        {selectedTask && task.prevId === selectedTask.id && (
                                            <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                                child
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded font-mono break-all">
                                        {task.id}
                                    </code>
                                </td>
                                <td className="px-4 py-3">
                                    {task.prevId ? (
                                        <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded font-mono break-all">
                                            {task.prevId}
                                        </code>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <StatusBadge status={task.status} />
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                        {task.tries}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {task.tags.map(tag => (
                                            <span
                                                key={tag}
                                                className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    {new Date(task.updatedAt).toLocaleDateString()}<br />
                                    <span className="text-xs text-gray-400">
                                        {new Date(task.updatedAt).toLocaleTimeString()}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <button
                                        className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 text-gray-500 hover:text-gray-700"
                                        title="Retry task"
                                        onClick={e => {
                                            e.stopPropagation();
                                            socket.emit('task:retry', task.id);
                                        }}>
                                        <RetryIcon />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
