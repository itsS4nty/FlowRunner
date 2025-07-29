import { useState, useCallback } from 'react';
import type { Task } from '../types';

export interface UseTaskSelectionReturn {
    selectedTask: Task | null;
    hoveredTaskId: string;
    setSelectedTask: (task: Task | null) => void;
    setHoveredTaskId: (id: string) => void;
    selectTask: (task: Task) => void;
    clearSelection: () => void;
}

export function useTaskSelection(): UseTaskSelectionReturn {
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [hoveredTaskId, setHoveredTaskId] = useState<string>('none');

    const selectTask = useCallback((task: Task) => {
        setSelectedTask(task);
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedTask(null);
        setHoveredTaskId('none');
    }, []);

    return {
        selectedTask,
        hoveredTaskId,
        setSelectedTask,
        setHoveredTaskId,
        selectTask,
        clearSelection,
    };
}
