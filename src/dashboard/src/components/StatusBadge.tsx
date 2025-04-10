import { TaskStatus } from '../types';

export default function StatusBadge({ status }: { status: TaskStatus }) {
    const colorMap = {
        pending: 'bg-yellow-200 text-yellow-800',
        running: 'bg-blue-200 text-blue-800',
        completed: 'bg-green-200 text-green-800',
        failed: 'bg-red-200 text-red-800',
        skipped: 'bg-gray-200 text-gray-800',
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorMap[status]}`}>
            {status}
        </span>
    );
}
