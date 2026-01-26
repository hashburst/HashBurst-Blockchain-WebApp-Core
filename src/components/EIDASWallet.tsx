import { useState, useEffect } from 'react';
import { Shield, Key, FileText, CheckCircle, AlertCircle, Plus, Eye, Lock, Award, History } from 'lucide-react';
import { EIDASWalletService } from '../services/eidas-wallet';
import { VerifiableCredentialsService } from '../services/verifiable-credentials';

interface Wallet {
  id: string;
  walletDid: string;
  publicKey: string;
  trustLevel: 'low' | 'substantial' | 'high';
  status: 'active' | 'suspended' | 'revoked';
  createdAt: string;
}

export default function EIDASWallet() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [attestations, setAttestations] = useState<any[]>([]);
  const [pidData, setPidData] = useState<any>(null);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'credentials' | 'attestations' | 'audit'>('overview');
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [showAddPID, setShowAddPID] = useState(false);
  const [showAddCredential, setShowAddCredential] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const [walletForm, setWalletForm] = useState({
    passphrase: '',
    confirmPassphrase: '',
    trustLevel: 'substantial' as 'low' | 'substantial' | 'high',
  });

  const [pidForm, setPidForm] = useState({
    givenName: '',
    familyName: '',
    birthDate: '',
    birthPlace: '',
    nationality: '',
    gender: '',
    nationalId: '',
    issuingAuthority: '',
    issuingCountry: '',
    expiryDate: '',
  });

  const [credentialForm, setCredentialForm] = useState({
    credentialType: '',
    issuerDid: '',
    issuerName: '',
    attributes: '{}',
    expirationDate: '',
  });

  useEffect(() => {
    loadWallets();
  }, []);

  useEffect(() => {
    if (selectedWallet) {
      loadWalletData(selectedWallet.id);
    }
  }, [selectedWallet]);

  const loadWallets = async () => {
    try {
      const userWallets = await EIDASWalletService.getUserWallets('demo-user-id');
      setWallets(userWallets);
      if (userWallets.length > 0 && !selectedWallet) {
        setSelectedWallet(userWallets[0]);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadWalletData = async (walletId: string) => {
    try {
      const [creds, atts, pid, audit] = await Promise.all([
        VerifiableCredentialsService.getCredentials(walletId),
        VerifiableCredentialsService.getAttestations(walletId),
        EIDASWalletService.getPersonIdentificationData(walletId),
        EIDASWalletService.getAuditLog(walletId),
      ]);
      setCredentials(creds);
      setAttestations(atts);
      setPidData(pid);
      setAuditLog(audit);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (walletForm.passphrase !== walletForm.confirmPassphrase) {
      setError('Passphrases do not match');
      return;
    }
    if (walletForm.passphrase.length < 12) {
      setError('Passphrase must be at least 12 characters');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const wallet = await EIDASWalletService.createWallet(
        'demo-user-id',
        walletForm.passphrase,
        walletForm.trustLevel
      );
      await loadWallets();
      setSelectedWallet(wallet);
      setShowCreateWallet(false);
      setWalletForm({ passphrase: '', confirmPassphrase: '', trustLevel: 'substantial' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPID = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet) return;

    setLoading(true);
    setError('');
    try {
      await EIDASWalletService.addPersonIdentificationData(selectedWallet.id, pidForm);
      await loadWalletData(selectedWallet.id);
      setShowAddPID(false);
      setPidForm({
        givenName: '',
        familyName: '',
        birthDate: '',
        birthPlace: '',
        nationality: '',
        gender: '',
        nationalId: '',
        issuingAuthority: '',
        issuingCountry: '',
        expiryDate: '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet) return;

    setLoading(true);
    setError('');
    try {
      const attributes = JSON.parse(credentialForm.attributes);
      await VerifiableCredentialsService.issueCredential(
        selectedWallet.id,
        credentialForm.credentialType,
        credentialForm.issuerDid,
        credentialForm.issuerName,
        attributes,
        credentialForm.expirationDate || undefined
      );
      await loadWalletData(selectedWallet.id);
      setShowAddCredential(false);
      setCredentialForm({
        credentialType: '',
        issuerDid: '',
        issuerName: '',
        attributes: '{}',
        expirationDate: '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTrustLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'substantial': return 'text-blue-600 bg-blue-50';
      case 'low': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'suspended': return 'text-yellow-600 bg-yellow-50';
      case 'revoked': return 'text-red-600 bg-red-50';
      case 'expired': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-10 h-10 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">eIDAS 2.0 EUDI Wallet</h1>
                <p className="text-sm text-gray-600">European Digital Identity Wallet - Compliant with EU Regulations</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateWallet(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Wallet</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Key className="w-5 h-5 text-blue-600" />
                <span>My Wallets</span>
              </h2>
              {wallets.length === 0 ? (
                <p className="text-sm text-gray-500">No wallets yet. Create one to get started.</p>
              ) : (
                <div className="space-y-2">
                  {wallets.map(wallet => (
                    <button
                      key={wallet.id}
                      onClick={() => setSelectedWallet(wallet)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                        selectedWallet?.id === wallet.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono text-gray-600">
                          {wallet.walletDid.slice(0, 20)}...
                        </span>
                        {wallet.status === 'active' && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded ${getTrustLevelColor(wallet.trustLevel)}`}>
                          {wallet.trustLevel.toUpperCase()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            {selectedWallet ? (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Wallet Details</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedWallet.status)}`}>
                      {selectedWallet.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">DID</label>
                      <p className="font-mono text-sm bg-gray-50 p-2 rounded break-all">{selectedWallet.walletDid}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Trust Level</label>
                      <p className={`inline-block px-3 py-1 rounded mt-1 ${getTrustLevelColor(selectedWallet.trustLevel)}`}>
                        {selectedWallet.trustLevel.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Created</label>
                      <p className="text-sm">{new Date(selectedWallet.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg">
                  <div className="border-b border-gray-200">
                    <div className="flex space-x-4 px-6">
                      {['overview', 'credentials', 'attestations', 'audit'].map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab as any)}
                          className={`py-4 px-2 border-b-2 transition-colors ${
                            activeTab === tab
                              ? 'border-blue-600 text-blue-600'
                              : 'border-transparent text-gray-600 hover:text-blue-600'
                          }`}
                        >
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-6">
                    {activeTab === 'overview' && (
                      <div className="space-y-6">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold flex items-center space-x-2">
                              <FileText className="w-5 h-5 text-blue-600" />
                              <span>Person Identification Data (PID)</span>
                            </h3>
                            {!pidData && (
                              <button
                                onClick={() => setShowAddPID(true)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                              >
                                Add PID
                              </button>
                            )}
                          </div>
                          {pidData ? (
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                              <div>
                                <label className="text-xs text-gray-600">Given Name</label>
                                <p className="font-medium">{pidData.given_name}</p>
                              </div>
                              <div>
                                <label className="text-xs text-gray-600">Family Name</label>
                                <p className="font-medium">{pidData.family_name}</p>
                              </div>
                              <div>
                                <label className="text-xs text-gray-600">Birth Date</label>
                                <p className="font-medium">{new Date(pidData.birth_date).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <label className="text-xs text-gray-600">Nationality</label>
                                <p className="font-medium">{pidData.nationality}</p>
                              </div>
                              <div>
                                <label className="text-xs text-gray-600">Issuing Authority</label>
                                <p className="font-medium">{pidData.issuing_authority}</p>
                              </div>
                              <div>
                                <label className="text-xs text-gray-600">Status</label>
                                <span className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(pidData.status)}`}>
                                  {pidData.status.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No PID data added yet.</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <Award className="w-5 h-5 text-blue-600" />
                              <span className="text-sm font-medium text-blue-900">Credentials</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-900">{credentials.length}</p>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="text-sm font-medium text-green-900">Attestations</span>
                            </div>
                            <p className="text-2xl font-bold text-green-900">{attestations.length}</p>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <History className="w-5 h-5 text-purple-600" />
                              <span className="text-sm font-medium text-purple-900">Audit Events</span>
                            </div>
                            <p className="text-2xl font-bold text-purple-900">{auditLog.length}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'credentials' && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">Verifiable Credentials</h3>
                          <button
                            onClick={() => setShowAddCredential(true)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            Add Credential
                          </button>
                        </div>
                        {credentials.length === 0 ? (
                          <p className="text-gray-500 text-sm">No credentials yet.</p>
                        ) : (
                          <div className="space-y-3">
                            {credentials.map(cred => (
                              <div key={cred.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">{cred.credential_type}</span>
                                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(cred.status)}`}>
                                    {cred.status}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <p>Issuer: {cred.issuer_name}</p>
                                  <p>Issued: {new Date(cred.issued_at).toLocaleString()}</p>
                                  {cred.expires_at && <p>Expires: {new Date(cred.expires_at).toLocaleString()}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'attestations' && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Electronic Attestations</h3>
                        {attestations.length === 0 ? (
                          <p className="text-gray-500 text-sm">No attestations yet.</p>
                        ) : (
                          <div className="space-y-3">
                            {attestations.map(att => (
                              <div key={att.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">{att.attestation_name}</span>
                                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(att.status)}`}>
                                    {att.status}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <p>Type: {att.attestation_type}</p>
                                  <p>Issuer: {att.issuer_name}</p>
                                  <p>Issued: {new Date(att.issued_at).toLocaleString()}</p>
                                  {att.selective_disclosure_enabled && (
                                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                      Selective Disclosure
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'audit' && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Audit Log</h3>
                        {auditLog.length === 0 ? (
                          <p className="text-gray-500 text-sm">No audit events yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {auditLog.map(log => (
                              <div key={log.id} className="border-l-4 border-blue-500 bg-gray-50 p-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm">{log.operation_type}</span>
                                  <span className="text-xs text-gray-600">
                                    {new Date(log.created_at).toLocaleString()}
                                  </span>
                                </div>
                                {log.operation_details && Object.keys(log.operation_details).length > 0 && (
                                  <pre className="text-xs text-gray-600 mt-1 overflow-auto">
                                    {JSON.stringify(log.operation_details, null, 2)}
                                  </pre>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Wallet Selected</h3>
                <p className="text-gray-500">Select a wallet or create a new one to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <Lock className="w-6 h-6 text-blue-600" />
              <span>Create New eIDAS Wallet</span>
            </h3>
            <form onSubmit={handleCreateWallet} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Trust Level</label>
                <select
                  value={walletForm.trustLevel}
                  onChange={(e) => setWalletForm({ ...walletForm, trustLevel: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="substantial">Substantial</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Passphrase (min 12 characters)</label>
                <input
                  type="password"
                  value={walletForm.passphrase}
                  onChange={(e) => setWalletForm({ ...walletForm, passphrase: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={12}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm Passphrase</label>
                <input
                  type="password"
                  value={walletForm.confirmPassphrase}
                  onChange={(e) => setWalletForm({ ...walletForm, confirmPassphrase: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={12}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Wallet'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateWallet(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddPID && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-8">
            <h3 className="text-xl font-semibold mb-4">Add Person Identification Data</h3>
            <form onSubmit={handleAddPID} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Given Name</label>
                  <input
                    type="text"
                    value={pidForm.givenName}
                    onChange={(e) => setPidForm({ ...pidForm, givenName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Family Name</label>
                  <input
                    type="text"
                    value={pidForm.familyName}
                    onChange={(e) => setPidForm({ ...pidForm, familyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Birth Date</label>
                  <input
                    type="date"
                    value={pidForm.birthDate}
                    onChange={(e) => setPidForm({ ...pidForm, birthDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Birth Place</label>
                  <input
                    type="text"
                    value={pidForm.birthPlace}
                    onChange={(e) => setPidForm({ ...pidForm, birthPlace: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nationality</label>
                  <input
                    type="text"
                    value={pidForm.nationality}
                    onChange={(e) => setPidForm({ ...pidForm, nationality: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <input
                    type="text"
                    value={pidForm.gender}
                    onChange={(e) => setPidForm({ ...pidForm, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">National ID</label>
                  <input
                    type="text"
                    value={pidForm.nationalId}
                    onChange={(e) => setPidForm({ ...pidForm, nationalId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Issuing Authority</label>
                  <input
                    type="text"
                    value={pidForm.issuingAuthority}
                    onChange={(e) => setPidForm({ ...pidForm, issuingAuthority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Issuing Country (ISO Code)</label>
                  <input
                    type="text"
                    value={pidForm.issuingCountry}
                    onChange={(e) => setPidForm({ ...pidForm, issuingCountry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={pidForm.expiryDate}
                    onChange={(e) => setPidForm({ ...pidForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add PID'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPID(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddCredential && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Add Verifiable Credential</h3>
            <form onSubmit={handleAddCredential} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Credential Type</label>
                <input
                  type="text"
                  value={credentialForm.credentialType}
                  onChange={(e) => setCredentialForm({ ...credentialForm, credentialType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., UniversityDegree"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Issuer DID</label>
                <input
                  type="text"
                  value={credentialForm.issuerDid}
                  onChange={(e) => setCredentialForm({ ...credentialForm, issuerDid: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="did:key:z..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Issuer Name</label>
                <input
                  type="text"
                  value={credentialForm.issuerName}
                  onChange={(e) => setCredentialForm({ ...credentialForm, issuerName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., University of Example"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Attributes (JSON)</label>
                <textarea
                  value={credentialForm.attributes}
                  onChange={(e) => setCredentialForm({ ...credentialForm, attributes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                  rows={4}
                  placeholder='{"degree": "Bachelor", "field": "Computer Science"}'
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expiration Date (Optional)</label>
                <input
                  type="date"
                  value={credentialForm.expirationDate}
                  onChange={(e) => setCredentialForm({ ...credentialForm, expirationDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Credential'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCredential(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
