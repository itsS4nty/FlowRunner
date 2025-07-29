import { useDashboard } from './DashboardContext';

// Individual hook selectors for performance optimization
export function useDashboardSocket() {
    return useDashboard().socket;
}

export function useDashboardFilters() {
    return useDashboard().filters;
}

export function useDashboardSelection() {
    return useDashboard().selection;
}
