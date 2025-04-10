import { Stats, TaskStatus } from '../types';

interface Props {
    stats: Stats;
    filterStatus: TaskStatus | null;
    updateFilter: (status: TaskStatus) => void;
}

export default function StatCards({ stats, filterStatus, updateFilter }: Props) {
    const cards = [
        { label: 'Running', value: stats.runningTasks, color: 'blue' },
        { label: 'Completed', value: stats.completedTasks, color: 'green' },
        { label: 'Pending', value: stats.pendingTasks, color: 'yellow' },
        { label: 'Failed', value: stats.failedTasks, color: 'red' },
        { label: 'Skipped', value: stats.skippedTasks, color: 'gray' },
    ];

    return (
        <div className="grid grid-cols-5 gap-4 mb-8">
            {cards.map(({ label, value, color }) => {
                const active = filterStatus === label.toLowerCase() || filterStatus === null;
                return (
                    <div
                        key={label}
                        onClick={() => updateFilter(label.toLowerCase() as TaskStatus)}
                        className={`cursor-pointer rounded-xl p-4 text-white bg-${color}-${active ? '500' : '300'} shadow`}>
                        <div className="text-sm uppercase">{label}</div>
                        <div className="text-2xl font-bold">{value}</div>
                    </div>
                );
            })}
        </div>
    );
}
