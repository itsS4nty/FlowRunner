import { useMemo } from 'react';
import StatCards from '../components/StatCards';
import DashboardHeader from '../components/DashboardHeader';
import DashboardControls from '../components/DashboardControls';
import DashboardContent from '../components/DashboardContent';
import { 
    useTaskSocket, 
    useDashboardFilters, 
    useTaskSelection 
} from '../hooks';

export default function Dashboard() {
    // Custom hooks for state management
    const { stats, tasks, isConnected } = useTaskSocket();
    const {
        filterStatus,
        filterTags,
        searchTerm,
        setFilterStatus,
        setFilterTags,
        setSearchTerm,
        updateFilter,
        clearFilters,
    } = useDashboardFilters();
    const {
        selectedTask,
        hoveredTaskId,
        setSelectedTask,
        setHoveredTaskId,
    } = useTaskSelection();

    // Memoized computed values
    const hasActiveFilters = useMemo(() => {
        return filterStatus !== null || filterTags.length > 0 || searchTerm.trim() !== '';
    }, [filterStatus, filterTags, searchTerm]);

    return (
        <main className="p-8 max-w-7xl mx-auto">
            <DashboardHeader isConnected={isConnected} />
            
            <StatCards 
                stats={stats} 
                filterStatus={filterStatus} 
                updateFilter={updateFilter} 
            />

            <DashboardControls
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                setFilterStatus={setFilterStatus}
                setFilterTags={setFilterTags}
                clearFilters={clearFilters}
                hasActiveFilters={hasActiveFilters}
            />

            <DashboardContent
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
        </main>
    );
}

// Export socket if needed elsewhere
