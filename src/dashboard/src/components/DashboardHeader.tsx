interface DashboardHeaderProps {
    title?: string;
    isConnected?: boolean;
}

export default function DashboardHeader({ 
    title = "🧠 TaskRunner Dashboard",
    isConnected = true 
}: DashboardHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">{title}</h1>
            <div className="flex items-center gap-2">
                <div 
                    className={`w-3 h-3 rounded-full ${
                        isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    title={isConnected ? 'Connected' : 'Disconnected'}
                />
                <span className="text-sm text-gray-600">
                    {isConnected ? 'Connected' : 'Disconnected'}
                </span>
            </div>
        </div>
    );
}
