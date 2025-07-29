import { createContext, useContext, ReactNode } from 'react';
import { 
    useTaskSocket, 
    useDashboardFilters as useFilters, 
    useTaskSelection,
    UseTaskSocketReturn,
    UseDashboardFiltersReturn,
    UseTaskSelectionReturn
} from '../hooks';

interface DashboardContextValue {
    socket: UseTaskSocketReturn;
    filters: UseDashboardFiltersReturn;
    selection: UseTaskSelectionReturn;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

interface DashboardProviderProps {
    children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
    const socket = useTaskSocket();
    const filters = useFilters();
    const selection = useTaskSelection();

    const value: DashboardContextValue = {
        socket,
        filters,
        selection,
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}
