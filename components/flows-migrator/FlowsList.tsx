'use client';

interface Flow {
  id: string | number;
  name: string;
  description?: string;
  enabled?: boolean;
  created_datetime?: string;
}

interface FlowsListProps {
  flows: Flow[];
  selectedFlows: Set<string | number>;
  onToggleFlow: (flowId: string | number) => void;
}

export default function FlowsList({ flows, selectedFlows, onToggleFlow }: FlowsListProps) {
  return (
    <div className="bg-[#1a1f29] border border-gray-800 rounded-2xl overflow-hidden">
      {flows.map((flow, index) => (
        <div
          key={flow.id}
          className={`p-5 hover:bg-[#20252f] cursor-pointer transition-colors ${
            index !== flows.length - 1 ? 'border-b border-gray-800' : ''
          }`}
          onClick={() => onToggleFlow(flow.id)}
        >
          <div className="flex items-start gap-4">
            <input
              type="checkbox"
              checked={selectedFlows.has(flow.id)}
              onChange={() => onToggleFlow(flow.id)}
              className="mt-1 w-5 h-5 rounded border-gray-600 bg-transparent text-blue-500 focus:ring-blue-500 focus:ring-offset-0 focus:ring-2 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white text-base">
                  {flow.name || `Flow ${flow.id}`}
                </h3>
                {flow.enabled !== undefined && (
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      flow.enabled
                        ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/50'
                        : 'bg-gray-800 text-gray-400 border border-gray-700'
                    }`}
                  >
                    {flow.enabled ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
              {flow.description && (
                <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                  {flow.description}
                </p>
              )}
              <p className="text-xs text-gray-500 font-mono">
                {flow.id}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
