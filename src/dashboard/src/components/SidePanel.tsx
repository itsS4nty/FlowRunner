import { Task } from '../types';
import StatusBadge from './StatusBadge';

interface Props {
    task: Task | null;
    setTask: (task: Task | null) => void;
    tasks: Task[];
}

export default function SidePanel({ task, setTask, tasks }: Props) {
    const getDependents = (taskId: string): Task[] => {
        return tasks.filter(task => task.prevId === taskId);
    };

    const getParent = (task: Task): Task | null => {
        return task.prevId ? tasks.find(t => t.id === task.prevId) ?? null : null;
    };

    return (
        <>
            <div
                className={`fixed inset-0 z-40 transition-opacity bg-black/30 ${
                    task ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setTask(null)}
            />

            <div
                className={`fixed top-0 right-0 w-[800px] h-full bg-white shadow-lg p-6 z-50 overflow-y-auto transform transition-transform duration-300 ease-in-out ${
                    task ? 'translate-x-0' : 'translate-x-full'
                }`}
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Task Info</h2>
                    <button
                        onClick={() => setTask(null)}
                        className="text-gray-500 hover:text-black text-xl cursor-pointer">
                        ×
                    </button>
                </div>

                {task && (
                    <div className="space-y-4 text-sm">
                        <div>
                            <strong>ID:</strong> <span className="break-all">{task.id}</span>
                        </div>
                        <div>
                            <strong>Name:</strong> {task.name}
                        </div>
                        <div>
                            <strong>Status:</strong> <StatusBadge status={task.status} />
                        </div>
                        <div>
                            <strong>Prev ID:</strong> {task.prevId || '—'}
                        </div>
                        <div>
                            <strong>Tries:</strong> {task.tries}
                        </div>
                        <div>
                            <strong>Updated At:</strong> {new Date(task.updatedAt).toLocaleString()}
                        </div>

                        {task.error && (
                            <>
                                <hr />
                                <div>
                                    <strong>Error:</strong> {task.error.message || 'No error'}
                                </div>
                                {task.error.stack && (
                                    <div className="mt-2 bg-gray-100 p-3 rounded max-h-60 overflow-auto text-xs whitespace-pre-wrap font-mono border border-gray-200">
                                        <code className="block">{task.error.stack}</code>
                                    </div>
                                )}
                                {task.error.name && (
                                    <div className="mt-2 bg-gray-100 p-2 rounded">
                                        <strong>Error Name:</strong> {task.error.name}
                                    </div>
                                )}
                            </>
                        )}

                        {getParent(task) && (
                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">
                                    Parent Task
                                </div>
                                <button
                                    className="text-sm font-medium text-blue-600 hover:underline cursor-pointer"
                                    onClick={() => setTask(getParent(task)!)}>
                                    {getParent(task)!.name}
                                </button>
                            </div>
                        )}

                        {getDependents(task.id).length > 0 && (
                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">
                                    Child Tasks
                                </div>
                                <ul className="space-y-1">
                                    {getDependents(task.id).map(dep => (
                                        <li key={dep.id}>
                                            <button
                                                className="text-sm text-blue-600 hover:underline cursor-pointer"
                                                onClick={() => setTask(dep)}>
                                                {dep.name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
