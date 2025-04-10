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
        <div className="bg-white shadow rounded-lg">
            <table className="table-fixed w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 border-l-4 border-gray-50">
                    <tr>
                        <th className="px-4 py-2 text-left font-semibold w-40">Name</th>
                        <th className="px-4 py-2 text-left font-semibold w-72">ID</th>
                        <th className="px-4 py-2 text-left font-semibold w-72">Prev</th>
                        <th className="px-4 py-2 text-left font-semibold w-20">Status</th>
                        <th className="px-4 py-2 text-left font-semibold w-16">Tries</th>
                        <th className="relative px-4 py-2 text-left font-semibold w-30">
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
                        <th className="px-4 py-2 text-left font-semibold w-52">Updated At</th>
                        <th className="px-4 py-2 text-left font-semibold w-12"></th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTasks.map(task => (
                        <tr
                            key={task.id}
                            className={`
                hover:bg-gray-50 cursor-pointer border-l-4 border-transparent
                ${getHighlightClass(task)}
                ${hoveredTaskId === task.prevId ? '!border-purple-500' : ''}
                ${tasks.find(t => t.id === hoveredTaskId)?.prevId === task.id ? '!border-indigo-500' : ''}
              `}
                            onClick={() => setSelectedTask(task)}
                            onMouseEnter={() => setHoveredTaskId(task.id)}
                            onMouseLeave={() => setHoveredTaskId('none')}>
                            <td className="px-4 py-2">
                                {task.name}
                                {selectedTask && task.id === selectedTask.prevId && (
                                    <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                                        Parent
                                    </span>
                                )}
                                {selectedTask && task.prevId === selectedTask.id && (
                                    <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                        Child
                                    </span>
                                )}
                            </td>
                            <td className="px-4 py-2 break-all">{task.id}</td>
                            <td className="px-4 py-2 break-all">{task.prevId || '-'}</td>
                            <td className="px-4 py-2">
                                <StatusBadge status={task.status} />
                            </td>
                            <td className="px-4 py-2">{task.tries}</td>
                            <td className="px-4 py-2">
                                {task.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="inline-block bg-gray-100 text-gray-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">
                                        {tag}
                                    </span>
                                ))}
                            </td>
                            <td className="px-4 py-2">{task.updatedAt.toLocaleString()}</td>
                            <td className="px-4 py-2">
                                <button
                                    className="cursor-pointer p-2 rounded-full text-white transition"
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
    );
}
