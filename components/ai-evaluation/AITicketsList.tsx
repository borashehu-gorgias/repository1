'use client';

import { useState } from 'react';

interface Message {
  id: number;
  from_agent: boolean;
  body_text?: string;
  body_html?: string;
  created_datetime?: string;
  sender?: {
    email?: string;
    name?: string;
  };
}

interface Ticket {
  id: number;
  subject?: string;
  satisfaction_score?: number;
  created_datetime?: string;
  updated_datetime?: string;
  status?: string;
  customer?: {
    email?: string;
    name?: string;
  };
  messages?: Message[];
  tags?: Array<{ name: string }>;
}

interface AITicketsListProps {
  tickets: Ticket[];
  onSelect?: (ticket: Ticket) => void;
  selectedTickets?: Set<number>;
  showMessages?: boolean;
}

export default function AITicketsList({
  tickets,
  onSelect,
  selectedTickets = new Set(),
  showMessages = false
}: AITicketsListProps) {
  const [expandedTickets, setExpandedTickets] = useState<Set<number>>(new Set());

  const toggleExpand = (ticketId: number) => {
    const newExpanded = new Set(expandedTickets);
    if (newExpanded.has(ticketId)) {
      newExpanded.delete(ticketId);
    } else {
      newExpanded.add(ticketId);
    }
    setExpandedTickets(newExpanded);
  };

  const getCSATBadge = (score?: number) => {
    if (!score) return null;

    const colors: Record<number, string> = {
      5: 'bg-emerald-900/40 text-emerald-300 border-emerald-800/50',
      4: 'bg-blue-900/40 text-blue-300 border-blue-800/50',
      3: 'bg-yellow-900/40 text-yellow-300 border-yellow-800/50',
      2: 'bg-orange-900/40 text-orange-300 border-orange-800/50',
      1: 'bg-red-900/40 text-red-300 border-red-800/50',
    };

    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${colors[score] || 'bg-gray-800 text-gray-400'}`}>
        CSAT: {score}/5
      </span>
    );
  };

  const getAIResponseMessage = (ticket: Ticket) => {
    if (!ticket.messages) return null;

    // Find the first agent response (AI agent response)
    return ticket.messages.find((msg) => msg.from_agent);
  };

  if (tickets.length === 0) {
    return (
      <div className="bg-[#1a1f29] border border-gray-800 rounded-2xl p-8 text-center">
        <p className="text-gray-400">No tickets found</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1f29] border border-gray-800 rounded-2xl overflow-hidden">
      {tickets.map((ticket, index) => {
        const isExpanded = expandedTickets.has(ticket.id);
        const isSelected = selectedTickets.has(ticket.id);
        const aiResponse = getAIResponseMessage(ticket);
        const customerMessage = ticket.messages?.find((msg) => !msg.from_agent);

        return (
          <div
            key={ticket.id}
            className={`p-5 hover:bg-[#20252f] transition-colors ${
              index !== tickets.length - 1 ? 'border-b border-gray-800' : ''
            } ${isSelected ? 'bg-[#20252f]' : ''}`}
          >
            <div className="flex items-start gap-4">
              {onSelect && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onSelect(ticket)}
                  className="mt-1 w-5 h-5 rounded border-gray-600 bg-transparent text-blue-500 focus:ring-blue-500 focus:ring-offset-0 focus:ring-2 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-white text-base mb-1">
                      #{ticket.id} - {ticket.subject || 'No Subject'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>{ticket.customer?.name || ticket.customer?.email || 'Unknown'}</span>
                      <span>•</span>
                      <span>{ticket.status || 'unknown'}</span>
                      {ticket.created_datetime && (
                        <>
                          <span>•</span>
                          <span>{new Date(ticket.created_datetime).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getCSATBadge(ticket.satisfaction_score)}
                    {showMessages && (
                      <button
                        onClick={() => toggleExpand(ticket.id)}
                        className="px-3 py-1 text-xs font-medium rounded-full bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 transition-colors"
                      >
                        {isExpanded ? 'Hide' : 'View'} Messages
                      </button>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {ticket.tags && ticket.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ticket.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs rounded bg-gray-800 text-gray-300 border border-gray-700"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Expanded Messages View */}
                {isExpanded && ticket.messages && (
                  <div className="mt-4 space-y-4">
                    {/* Customer Message */}
                    {customerMessage && (
                      <div className="bg-[#141821] border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-blue-400">CUSTOMER</span>
                          <span className="text-xs text-gray-500">
                            {customerMessage.sender?.name || customerMessage.sender?.email}
                          </span>
                        </div>
                        <div className="text-sm text-gray-300 whitespace-pre-wrap">
                          {customerMessage.body_text || customerMessage.body_html || 'No message content'}
                        </div>
                      </div>
                    )}

                    {/* AI Response */}
                    {aiResponse ? (
                      <div className="bg-[#0d1117] border border-emerald-800/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-emerald-400">AI AGENT RESPONSE</span>
                          <span className="text-xs text-gray-500">
                            {aiResponse.created_datetime && new Date(aiResponse.created_datetime).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-300 whitespace-pre-wrap">
                          {aiResponse.body_text || aiResponse.body_html || 'No response content'}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#1a1410] border border-yellow-800/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-yellow-400">AI AGENT RESPONSE</span>
                        </div>
                        <div className="text-sm text-yellow-300">
                          Waiting for AI agent response...
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
