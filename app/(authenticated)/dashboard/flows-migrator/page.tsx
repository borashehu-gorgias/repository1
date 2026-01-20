'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TokenModal from '@/components/flows-migrator/TokenModal';
import ResultBanner from '@/components/flows-migrator/ResultBanner';
import CredentialsModal from '@/components/flows-migrator/CredentialsModal';
import AccountMigrationModal from '@/components/flows-migrator/AccountMigrationModal';
import PreviewGuidancesModal from '@/components/flows-migrator/PreviewGuidancesModal';
import ImportFlowsModal from '@/components/flows-migrator/ImportFlowsModal';
import MigrationActions from '@/components/flows-migrator/MigrationActions';
import FlowsList from '@/components/flows-migrator/FlowsList';

interface Flow {
  id: string | number;
  name: string;
  description?: string;
  enabled?: boolean;
  created_datetime?: string;
}

export default function FlowsMigratorPage() {
  const router = useRouter();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFlows, setSelectedFlows] = useState<Set<string | number>>(new Set());
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [subdomain, setSubdomain] = useState('');
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [credentialsForm, setCredentialsForm] = useState({
    username: '',
    apiKey: '',
  });
  const [showMigrateOptions, setShowMigrateOptions] = useState(false);
  const [showAccountMigrationModal, setShowAccountMigrationModal] = useState(false);
  const [accountMigrationForm, setAccountMigrationForm] = useState({
    targetSubdomain: '',
    targetLongJWT: '',
    targetShopName: '',
    targetIntegrationType: 'shopify',
  });
  const [accountMigrationResult, setAccountMigrationResult] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<any>(null);
  const [importForm, setImportForm] = useState({
    targetLongJWT: '',
    targetShopName: '',
    targetIntegrationType: 'shopify',
  });
  const [importResult, setImportResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewGuidances, setPreviewGuidances] = useState<Array<{ flowId: string | number, flowName: string, content: string }>>([]);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [pushingGuidances, setPushingGuidances] = useState(false);
  const [pushResult, setPushResult] = useState<any>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');

    if (tokenFromUrl) {
      window.history.replaceState({}, '', '/dashboard/flows-migrator');
      fetchFlows(tokenFromUrl);
    } else {
      fetchFlows();
    }

    checkCredentials();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showMigrateOptions) {
        const target = event.target as HTMLElement;
        if (!target.closest('.relative')) {
          setShowMigrateOptions(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMigrateOptions]);

  async function checkCredentials() {
    try {
      const response = await fetch('/api/credentials');
      const data = await response.json();
      setHasCredentials(data.hasCredentials);
      if (data.username) {
        setCredentialsForm(prev => ({ ...prev, username: data.username }));
      }
    } catch (error) {
      console.error('Error checking credentials:', error);
    }
  }

  async function saveCredentials() {
    try {
      const response = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentialsForm),
      });

      if (!response.ok) {
        const data = await response.json();
        alert('Error: ' + data.error);
        return;
      }

      setHasCredentials(true);
      setShowCredentialsModal(false);
      alert('✅ Credentials saved! You can now migrate flows.');
    } catch (error) {
      console.error('Error saving credentials:', error);
      alert('Failed to save credentials');
    }
  }

  async function fetchFlows(longJWT?: string) {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/flows', {
        method: longJWT ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: longJWT ? JSON.stringify({ longJWT }) : undefined,
      });

      if (response.status === 401) {
        router.push('/?error=session_expired');
        return;
      }

      const data = await response.json();

      if (data.subdomain || data.error?.subdomain) {
        setSubdomain(data.subdomain || data.error?.subdomain);
      }

      if (data.flows && data.flows.length > 0) {
        setFlows(data.flows);
        setLoading(false);
        setShowTokenModal(false);
      } else {
        setLoading(false);
        setShowTokenModal(true);
      }
    } catch (err: any) {
      console.error('Error in fetchFlows:', err);
      setError(err.message);
      setLoading(false);
    }
  }

  async function submitToken() {
    const tokenInput = (document.getElementById('longJWTInput') as HTMLInputElement)?.value?.trim();

    if (!tokenInput) {
      alert('Please paste the token');
      return;
    }

    await fetchFlows(tokenInput);
  }

  function toggleFlow(flowId: string | number) {
    const newSelected = new Set(selectedFlows);
    if (newSelected.has(flowId)) {
      newSelected.delete(flowId);
    } else {
      newSelected.add(flowId);
    }
    setSelectedFlows(newSelected);
  }

  function selectAll() {
    if (selectedFlows.size === flows.length) {
      setSelectedFlows(new Set());
    } else {
      setSelectedFlows(new Set(flows.map((f) => f.id)));
    }
  }

  async function migrateFlows() {
    if (selectedFlows.size === 0) {
      alert('Please select at least one flow to migrate');
      return;
    }

    if (!hasCredentials) {
      setShowCredentialsModal(true);
      return;
    }

    setMigrating(true);
    setMigrationResult(null);

    try {
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowIds: Array.from(selectedFlows),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Migration failed');
      }

      setMigrationResult({
        success: true,
        count: data.migratedCount,
      });

      setSelectedFlows(new Set());
    } catch (err: any) {
      if (err.message.includes('credentials')) {
        setShowCredentialsModal(true);
      }

      setMigrationResult({
        success: false,
        error: err.message,
      });
    } finally {
      setMigrating(false);
    }
  }

  async function migrateToAccount() {
    if (selectedFlows.size === 0) {
      alert('Please select at least one flow to migrate');
      return;
    }

    if (!accountMigrationForm.targetSubdomain || !accountMigrationForm.targetLongJWT) {
      alert('Please fill in all fields');
      return;
    }

    setMigrating(true);
    setAccountMigrationResult(null);

    try {
      const response = await fetch('/api/migrate-to-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowIds: Array.from(selectedFlows),
          targetSubdomain: accountMigrationForm.targetSubdomain.trim(),
          targetLongJWT: accountMigrationForm.targetLongJWT.trim(),
          targetShopName: accountMigrationForm.targetShopName.trim() || undefined,
          targetIntegrationType: accountMigrationForm.targetIntegrationType || 'shopify',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Migration failed');
      }

      setAccountMigrationResult(data);

      if (data.success) {
        setSelectedFlows(new Set());
      }
    } catch (err: any) {
      setAccountMigrationResult({
        success: false,
        error: err.message,
      });
    } finally {
      setMigrating(false);
    }
  }

  function closeAccountMigrationModal() {
    setShowAccountMigrationModal(false);
    setAccountMigrationForm({ targetSubdomain: '', targetLongJWT: '', targetShopName: '', targetIntegrationType: 'shopify' });
    setAccountMigrationResult(null);
    setShowMigrateOptions(false);
  }

  async function exportFlows() {
    if (selectedFlows.size === 0) {
      alert('Please select at least one flow to export');
      return;
    }

    setExporting(true);
    try {
      const response = await fetch('/api/export-flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flowIds: Array.from(selectedFlows) }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Export failed');
      }

      const data = await response.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gorgias-flows-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSelectedFlows(new Set());
    } catch (err: any) {
      alert('Export failed: ' + err.message);
    } finally {
      setExporting(false);
      setShowMigrateOptions(false);
    }
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.flows || !Array.isArray(data.flows)) {
          alert('Invalid export file: missing flows array');
          return;
        }
        setImportFile(data);
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  }

  async function importFlows() {
    if (!importFile || !importForm.targetLongJWT) {
      alert('Please upload a file and provide the target account JWT');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const response = await fetch('/api/import-flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flows: importFile.flows,
          targetLongJWT: importForm.targetLongJWT.trim(),
          targetShopName: importForm.targetShopName.trim() || undefined,
          targetIntegrationType: importForm.targetIntegrationType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setImportResult(data);
    } catch (err: any) {
      setImportResult({ success: false, error: err.message });
    } finally {
      setImporting(false);
    }
  }

  function closeImportModal() {
    setShowImportModal(false);
    setImportFile(null);
    setImportForm({ targetLongJWT: '', targetShopName: '', targetIntegrationType: 'shopify' });
    setImportResult(null);
  }

  async function previewFlows() {
    if (selectedFlows.size === 0) {
      alert('Please select at least one flow to preview');
      return;
    }

    if (!hasCredentials) {
      setShowCredentialsModal(true);
      return;
    }

    setGeneratingPreview(true);
    setPushResult(null);

    try {
      const response = await fetch('/api/migrate/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowIds: Array.from(selectedFlows),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Preview generation failed');
      }

      setPreviewGuidances(data.previews);
      setShowPreviewModal(true);
      setShowMigrateOptions(false);
    } catch (err: any) {
      alert('Preview failed: ' + err.message);
    } finally {
      setGeneratingPreview(false);
    }
  }

  function updatePreviewContent(flowId: string | number, newContent: string) {
    setPreviewGuidances(prev =>
      prev.map(g => g.flowId === flowId ? { ...g, content: newContent } : g)
    );
  }

  async function pushGuidances() {
    setPushingGuidances(true);
    setPushResult(null);

    try {
      const response = await fetch('/api/migrate/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guidances: previewGuidances,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Push failed');
      }

      setPushResult(data);

      if (data.success) {
        setSelectedFlows(new Set());
      }
    } catch (err: any) {
      setPushResult({
        success: false,
        error: err.message,
      });
    } finally {
      setPushingGuidances(false);
    }
  }

  function closePreviewModal() {
    setShowPreviewModal(false);
    setPreviewGuidances([]);
    setPushResult(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400 text-lg">Loading flows...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-[#1a1f29] border border-gray-800 rounded-2xl p-8 max-w-md">
          <div className="flex items-start gap-3 mb-4">
            <svg className="w-6 h-6 text-rose-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h2 className="text-white font-semibold text-lg mb-1">Error Loading Flows</h2>
              <p className="text-gray-400 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchFlows()}
            className="w-full mt-4 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-500 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (showTokenModal) {
    return <TokenModal subdomain={subdomain} onSubmit={submitToken} />;
  }

  return (
    <>
      <CredentialsModal
        show={showCredentialsModal}
        credentialsForm={credentialsForm}
        onFormChange={setCredentialsForm}
        onSave={saveCredentials}
        onClose={() => setShowCredentialsModal(false)}
      />

      <AccountMigrationModal
        show={showAccountMigrationModal}
        selectedFlowsCount={selectedFlows.size}
        migrating={migrating}
        form={accountMigrationForm}
        result={accountMigrationResult}
        onFormChange={setAccountMigrationForm}
        onMigrate={migrateToAccount}
        onClose={closeAccountMigrationModal}
      />

      <PreviewGuidancesModal
        show={showPreviewModal}
        guidances={previewGuidances}
        pushingGuidances={pushingGuidances}
        pushResult={pushResult}
        onUpdateContent={updatePreviewContent}
        onPush={pushGuidances}
        onClose={closePreviewModal}
      />

      <ImportFlowsModal
        show={showImportModal}
        importing={importing}
        importFile={importFile}
        importForm={importForm}
        importResult={importResult}
        onFileUpload={handleFileUpload}
        onFormChange={setImportForm}
        onImport={importFlows}
        onClose={closeImportModal}
      />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-12">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-4xl font-medium tracking-tight">Flows Migration</h1>
            <div className="flex items-center gap-3">
              {!hasCredentials && (
                <button
                  onClick={() => setShowCredentialsModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600/20 border border-amber-600/50 text-amber-300 rounded-lg text-sm font-medium hover:bg-amber-600/30 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Add API Credentials
                </button>
              )}
              <span className="text-sm text-gray-400">{flows.length} flows</span>
              {selectedFlows.size > 0 && (
                <span className="text-sm text-blue-400 font-medium">
                  {selectedFlows.size} selected
                </span>
              )}
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-600/50 text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-600/30 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import Flows
              </button>
            </div>
          </div>
          <p className="text-gray-400 text-base">
            Select flows to migrate to AI Guidances
          </p>
        </div>

        {migrationResult && <ResultBanner result={migrationResult} />}

        {flows.length === 0 ? (
          <div className="bg-[#1a1f29] border border-gray-800 rounded-2xl p-16 text-center">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-400 text-lg">No flows found in your account</p>
          </div>
        ) : (
          <>
            <div className="bg-[#1a1f29] border border-gray-800 rounded-2xl p-5 mb-4 flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedFlows.size === flows.length}
                  onChange={selectAll}
                  className="w-5 h-5 rounded border-gray-600 bg-transparent text-blue-500 focus:ring-blue-500 focus:ring-offset-0 focus:ring-2 cursor-pointer"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  Select all {flows.length} flows
                </span>
              </label>
              <MigrationActions
                disabled={selectedFlows.size === 0}
                migrating={migrating}
                showOptions={showMigrateOptions}
                generatingPreview={generatingPreview}
                exporting={exporting}
                onToggleOptions={() => setShowMigrateOptions(!showMigrateOptions)}
                onPreview={previewFlows}
                onMigrateToAccount={() => {
                  setShowMigrateOptions(false);
                  setShowAccountMigrationModal(true);
                }}
                onExport={exportFlows}
              />
            </div>

            <FlowsList
              flows={flows}
              selectedFlows={selectedFlows}
              onToggleFlow={toggleFlow}
            />
          </>
        )}
      </div>
    </>
  );
}
