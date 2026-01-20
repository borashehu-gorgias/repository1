'use client';

import { useState, useEffect } from 'react';
import AITicketsList from '@/components/ai-evaluation/AITicketsList';

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
  messages?: any[];
  tags?: Array<{ name: string }>;
}

export default function AIEvaluationPage() {
  const [faqTickets, setFaqTickets] = useState<Ticket[]>([]);
  const [testTickets, setTestTickets] = useState<Ticket[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'source' | 'test'>('source');

  // Fetch FAQ tickets on load
  useEffect(() => {
    fetchFAQTickets();
    fetchTestTickets();
  }, []);

  const fetchFAQTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/faq-tickets?limit=10');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tickets');
      }

      setFaqTickets(data.tickets || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTestTickets = async () => {
    try {
      const response = await fetch('/api/ai-test-tickets');
      const data = await response.json();

      if (response.ok) {
        setTestTickets(data.tickets || []);
      }
    } catch (err: any) {
      console.error('Error fetching test tickets:', err);
    }
  };

  const handleToggleTicket = (ticket: Ticket) => {
    const newSelected = new Set(selectedTickets);
    if (newSelected.has(ticket.id)) {
      newSelected.delete(ticket.id);
    } else {
      newSelected.add(ticket.id);
    }
    setSelectedTickets(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTickets.size === faqTickets.length) {
      setSelectedTickets(new Set());
    } else {
      setSelectedTickets(new Set(faqTickets.map(t => t.id)));
    }
  };

  const handleCreateTestTickets = async () => {
    if (selectedTickets.size === 0) {
      setError('Please select at least one ticket');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      setSuccessMessage(null);

      const sourceTickets = faqTickets.filter(t => selectedTickets.has(t.id));

      const response = await fetch('/api/ai-test-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceTickets
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create test tickets');
      }

      setSuccessMessage(`Successfully created ${data.created} test ticket(s)`);
      setSelectedTickets(new Set());

      // Refresh test tickets
      await fetchTestTickets();

      // Switch to test tickets tab
      setActiveTab('test');

    } catch (err: any) {
      setError(err.message);
      console.error('Error creating test tickets:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Agent Evaluation</h1>
          <p className="text-gray-400">
            Test your AI agent's responses against past closed tickets
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-900/20 border border-emerald-800 rounded-lg text-emerald-300">
            {successMessage}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('source')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'source'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Source Tickets ({faqTickets.length})
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'test'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            AI Test Tickets ({testTickets.length})
          </button>
        </div>

        {/* Source FAQ Tickets Tab */}
        {activeTab === 'source' && (
          <div className="space-y-6">
            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {selectedTickets.size === faqTickets.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-sm text-gray-400">
                  {selectedTickets.size} ticket(s) selected
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchFAQTickets}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
                <button
                  onClick={handleCreateTestTickets}
                  disabled={creating || selectedTickets.size === 0}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : `Create ${selectedTickets.size || ''} Test Ticket${selectedTickets.size !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>

            {/* Tickets List */}
            {loading && faqTickets.length === 0 ? (
              <div className="bg-[#1a1f29] border border-gray-800 rounded-2xl p-8 text-center">
                <p className="text-gray-400">Loading tickets...</p>
              </div>
            ) : (
              <AITicketsList
                tickets={faqTickets}
                onSelect={handleToggleTicket}
                selectedTickets={selectedTickets}
                showMessages={true}
              />
            )}
          </div>
        )}

        {/* AI Test Tickets Tab */}
        {activeTab === 'test' && (
          <div className="space-y-6">
            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                View and analyze AI agent responses to test tickets
              </div>
              <button
                onClick={fetchTestTickets}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Refresh
              </button>
            </div>

            {/* Test Tickets List */}
            <AITicketsList
              tickets={testTickets}
              showMessages={true}
            />

            {/* Info Box */}
            {testTickets.length > 0 && (
              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                <h3 className="font-medium text-blue-300 mb-2">Next Steps</h3>
                <ul className="text-sm text-blue-200 space-y-1 list-disc list-inside">
                  <li>Test tickets are tagged with 'ai-agent-test' and 'ai-evaluation'</li>
                  <li>Monitor AI agent responses in the messages section above</li>
                  <li>Compare AI responses with original human responses from source tickets</li>
                  <li>View all test tickets in Gorgias by filtering for 'ai-agent-test' tag</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
