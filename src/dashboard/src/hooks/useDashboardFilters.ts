import { useState, useCallback } from 'react';
import type { TaskStatus } from '../types';

export interface UseDashboardFiltersReturn {
    filterStatus: TaskStatus | null;
    filterTags: string[];
    searchTerm: string;
    setFilterStatus: (status: TaskStatus | null) => void;
    setFilterTags: (tags: string[]) => void;
    setSearchTerm: (term: string) => void;
    updateFilter: (status: TaskStatus) => void;
    clearFilters: () => void;
}

export function useDashboardFilters(): UseDashboardFiltersReturn {
    const [filterStatus, setFilterStatus] = useState<TaskStatus | null>(null);
    const [filterTags, setFilterTags] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const updateFilter = useCallback((status: TaskStatus) => {
        setFilterStatus(prev => prev === status ? null : status);
    }, []);

    const clearFilters = useCallback(() => {
        setFilterStatus(null);
        setFilterTags([]);
        setSearchTerm('');
    }, []);

    return {
        filterStatus,
        filterTags,
        searchTerm,
        setFilterStatus,
        setFilterTags,
        setSearchTerm,
        updateFilter,
        clearFilters,
    };
}
