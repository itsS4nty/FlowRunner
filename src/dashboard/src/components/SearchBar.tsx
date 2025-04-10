interface Props {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    setFilterStatus: (status: null) => void;
    setFilterTags: (tags: string[]) => void;
}

export default function SearchBar({
    searchTerm,
    setSearchTerm,
    setFilterStatus,
    setFilterTags,
}: Props) {
    return (
        <div className="flex items-center justify-between mb-6 gap-4">
            <input
                type="text"
                placeholder="🔍 Search by task name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 min-h-[42px] border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
            <button
                onClick={() => {
                    setFilterStatus(null);
                    setFilterTags([]);
                    setSearchTerm('');
                }}
                className="cursor-pointer px-4 py-2 min-h-[42px] text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition">
                Clear Filters
            </button>
        </div>
    );
}
