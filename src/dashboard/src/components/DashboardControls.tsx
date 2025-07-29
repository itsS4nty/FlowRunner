import SearchBar from './SearchBar';
import type { TaskStatus } from '../types';

interface DashboardControlsProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    setFilterStatus: (status: TaskStatus | null) => void;
    setFilterTags: (tags: string[]) => void;
    clearFilters: () => void;
    hasActiveFilters: boolean;
}

export default function DashboardControls({
    searchTerm,
    setSearchTerm,
    setFilterStatus,
    setFilterTags,
    clearFilters,
    hasActiveFilters,
}: DashboardControlsProps) {
    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-700">Filters & Search</h2>
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                        Clear All Filters
                    </button>
                )}
            </div>
            
            <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                setFilterStatus={setFilterStatus}
                setFilterTags={setFilterTags}
            />
        </div>
    );
}
