import { useState, useEffect } from 'react';
import { Wallet, Plus, Download, Star, Copy, Check, Loader2, Globe, CheckCircle, XCircle, Link as LinkIcon, RefreshCw, Shield } from 'lucide-react';
import { walletService, Wallet as WalletType } from '../services/wallet';
import {
  registerName,
  checkNameAvailability,
  getNamesByWallet,
  validateName,
  NameRecord,
} from '../services/name-service';
import {
  connectMetaMask,
  connectTrustWallet,
  connectTronLink,
  detectMetaMask,
  detectTrustWallet,
  detectTronLink,
  getExternalWallets,
  saveExternalWallet,
  disconnectExternalWallet,
  getMetaMaskBalance,
  getTronBalance,
  getNetworkName,
  getWalletIcon,
  ExternalWalletConnection,
  ExternalWalletType,
} from '../services/external-wallets';
import { ledgerService, saveLedgerWallet } from '../services/ledger-wallet';
import { supabase } from '../lib/supabase';

export function WalletManager() {
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [externalWallets, setExternalWallets] = useState<ExternalWalletConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showConnectExternal, setShowConnectExternal] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [creating, setCreating] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [nameRecords, setNameRecords] = useState<Record<string, NameRecord[]>>({});
  const [ensName, setEnsName] = useState('');
  const [hbcName, setHbcName] = useState('');
  const [ensAvailable, setEnsAvailable] = useState<boolean | null>(null);
  const [hbcAvailable, setHbcAvailable] = useState<boolean | null>(null);
  const [checkingEns, setCheckingEns] = useState(false);
  const [checkingHbc, setCheckingHbc] = useState(false);
  const [activeTab, setActiveTab] = useState<'hashburst' | 'external'>('hashburst');

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const [userWallets, extWallets] = await Promise.all([
          walletService.getUserWallets(user.id),
          getExternalWallets(user.id),
        ]);

        setWallets(userWallets);
        setExternalWallets(extWallets);

        const records: Record<string, NameRecord[]> = {};
        for (const wallet of userWallets) {
          try {
            const names = await getNamesByWallet(wallet.id);
            records[wallet.id] = names;
          } catch (error) {
            console.error(`Failed to load names for wallet ${wallet.id}:`, error);
            records[wallet.id] = [];
          }
        }
        setNameRecords(records);
      }
    } catch (error) {
      console.error('Failed to load wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectMetaMask = async () => {
    setConnecting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please sign in first');
        return;
      }

      const { address, chainId } = await connectMetaMask();
      await saveExternalWallet(user.id, 'metamask', address, chainId);

      await loadWallets();
      setShowConnectExternal(false);
      alert('MetaMask connected successfully!');
    } catch (error: any) {
      console.error('Failed to connect MetaMask:', error);
      alert(error.message || 'Failed to connect MetaMask');
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectTrustWallet = async () => {
    setConnecting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please sign in first');
        return;
      }

      const { address, chainId } = await connectTrustWallet();
      await saveExternalWallet(user.id, 'trust', address, chainId);

      await loadWallets();
      setShowConnectExternal(false);
      alert('Trust Wallet connected successfully!');
    } catch (error: any) {
      console.error('Failed to connect Trust Wallet:', error);
      alert(error.message || 'Failed to connect Trust Wallet');
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectTronLink = async () => {
    setConnecting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please sign in first');
        return;
      }

      const { address, network } = await connectTronLink();
      await saveExternalWallet(user.id, 'tronlink', address, undefined, network);

      await loadWallets();
      setShowConnectExternal(false);
      alert('TronLink connected successfully!');
    } catch (error: any) {
      console.error('Failed to connect TronLink:', error);
      alert(error.message || 'Failed to connect TronLink');
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectLedger = async () => {
    setConnecting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please sign in first');
        return;
      }

      const hasPermission = await ledgerService.requestPermission();
      if (!hasPermission) {
        throw new Error('Ledger permission denied');
      }

      await ledgerService.connect();
      const address = await ledgerService.getEthereumAddress();

      await saveLedgerWallet(user.id, address, "m/44'/60'/0'/0/0", 'ethereum');

      await loadWallets();
      setShowConnectExternal(false);
      alert('Ledger connected successfully!');
    } catch (error: any) {
      console.error('Failed to connect Ledger:', error);
      alert(error.message || 'Failed to connect Ledger');
    } finally {
      setConnecting(false);
      await ledgerService.disconnect();
    }
  };

  const handleDisconnectExternal = async (walletId: string) => {
    try {
      await disconnectExternalWallet(walletId);
      await loadWallets();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      alert('Failed to disconnect wallet');
    }
  };

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletName.trim()) return;

    setCreating(true);
    try {
      const newWallet = await walletService.generateWallet(walletName);

      if (ensName && ensAvailable) {
        try {
          await registerName({
            walletId: newWallet.id,
            name: ensName,
            domain: 'eth',
            address: newWallet.wallet_address,
            isPrimary: !hbcName,
          });
        } catch (error) {
          console.error('Failed to register ENS name:', error);
        }
      }

      if (hbcName && hbcAvailable) {
        try {
          await registerName({
            walletId: newWallet.id,
            name: hbcName,
            domain: 'hbc',
            address: newWallet.wallet_address,
            isPrimary: true,
          });
        } catch (error) {
          console.error('Failed to register .hbc name:', error);
        }
      }

      setWalletName('');
      setEnsName('');
      setHbcName('');
      setEnsAvailable(null);
      setHbcAvailable(null);
      setShowCreate(false);
      await loadWallets();
    } catch (error) {
      console.error('Failed to create wallet:', error);
      alert('Failed to create wallet. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const checkEnsName = async (name: string) => {
    if (!name) {
      setEnsAvailable(null);
      return;
    }

    const validation = validateName(name);
    if (!validation.valid) {
      setEnsAvailable(false);
      return;
    }

    setCheckingEns(true);
    try {
      const available = await checkNameAvailability(name, 'eth');
      setEnsAvailable(available);
    } catch (error) {
      console.error('Failed to check ENS availability:', error);
      setEnsAvailable(null);
    } finally {
      setCheckingEns(false);
    }
  };

  const checkHbcName = async (name: string) => {
    if (!name) {
      setHbcAvailable(null);
      return;
    }

    const validation = validateName(name);
    if (!validation.valid) {
      setHbcAvailable(false);
      return;
    }

    setCheckingHbc(true);
    try {
      const available = await checkNameAvailability(name, 'hbc');
      setHbcAvailable(available);
    } catch (error) {
      console.error('Failed to check .hbc availability:', error);
      setHbcAvailable(null);
    } finally {
      setCheckingHbc(false);
    }
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleDownloadBackup = (wallet: WalletType) => {
    walletService.downloadWalletBackup(wallet);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">My Wallets</h2>
            <p className="text-sm text-gray-500 mt-1">Manage your HashBurst and external wallets</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('hashburst')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'hashburst'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Wallet className="w-4 h-4" />
              HashBurst Wallets
            </div>
          </button>
          <button
            onClick={() => setActiveTab('external')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              activeTab === 'external'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <LinkIcon className="w-4 h-4" />
              External Wallets
            </div>
          </button>
        </div>
      </div>

      {activeTab === 'hashburst' && (
        <>
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create HashBurst Wallet
            </button>
          </div>

      {showCreate && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <form onSubmit={handleCreateWallet} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Name</label>
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="My HashBurst Wallet"
                required
              />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5 text-gray-600" />
                <h3 className="text-sm font-medium text-gray-700">Name Service (Optional)</h3>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Register a human-readable name for your wallet address
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ENS Name (Ethereum Name Service)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={ensName}
                      onChange={(e) => {
                        setEnsName(e.target.value);
                        checkEnsName(e.target.value);
                      }}
                      className="w-full px-4 py-2 pr-24 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="myname"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <span className="text-sm text-gray-500">.eth</span>
                      {checkingEns && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                      {ensAvailable === true && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {ensAvailable === false && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                  {ensAvailable === false && (
                    <p className="text-xs text-red-500 mt-1">This name is not available</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HashBurst Name (Native Format)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={hbcName}
                      onChange={(e) => {
                        setHbcName(e.target.value);
                        checkHbcName(e.target.value);
                      }}
                      className="w-full px-4 py-2 pr-24 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="myname"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <span className="text-sm text-gray-500">.hbc</span>
                      {checkingHbc && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                      {hbcAvailable === true && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {hbcAvailable === false && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                  {hbcAvailable === false && (
                    <p className="text-xs text-red-500 mt-1">This name is not available</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={creating || !walletName.trim()}
                className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    Generate Wallet
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setEnsName('');
                  setHbcName('');
                  setEnsAvailable(null);
                  setHbcAvailable(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {wallets.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No wallets yet</p>
            <p className="text-sm text-gray-400">Create your first wallet to get started</p>
          </div>
        ) : (
          wallets.map((wallet) => (
            <div key={wallet.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{wallet.wallet_name}</h3>
                        {wallet.is_primary && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                            <Star className="w-3 h-3" />
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-600 font-mono">{wallet.wallet_address}</p>
                        <button
                          onClick={() => handleCopyAddress(wallet.wallet_address)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Copy address"
                        >
                          {copiedAddress === wallet.wallet_address ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{wallet.balance.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">HBT</div>
                    </div>
                  </div>

                  <div className="space-y-2 mt-3">
                    {nameRecords[wallet.id] && nameRecords[wallet.id].length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {nameRecords[wallet.id].map((record) => (
                          <div
                            key={record.id}
                            className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${
                              record.domain === 'eth'
                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                : 'bg-green-100 text-green-700 border border-green-200'
                            }`}
                          >
                            <Globe className="w-3 h-3" />
                            {record.name}
                            {record.isPrimary && <Star className="w-3 h-3 fill-current" />}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadBackup(wallet)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5 text-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Backup
                      </button>
                      <div className="text-xs text-gray-500">
                        Created {new Date(wallet.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
        </>
      )}

      {activeTab === 'external' && (
        <>
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={() => setShowConnectExternal(!showConnectExternal)}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <LinkIcon className="w-4 h-4" />
              Connect External Wallet
            </button>
          </div>

          {showConnectExternal && (
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Wallet Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleConnectMetaMask}
                  disabled={connecting}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-3xl mb-3">🦊</div>
                  <div className="font-semibold text-gray-900 mb-1">MetaMask</div>
                  <div className="text-sm text-gray-600">Connect your MetaMask wallet for Ethereum and EVM chains</div>
                </button>

                <button
                  onClick={handleConnectTrustWallet}
                  disabled={connecting}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-3xl mb-3">🛡️</div>
                  <div className="font-semibold text-gray-900 mb-1">Trust Wallet</div>
                  <div className="text-sm text-gray-600">Connect your Trust Wallet for multi-chain support</div>
                </button>

                <button
                  onClick={handleConnectTronLink}
                  disabled={connecting}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-3xl mb-3">⚡</div>
                  <div className="font-semibold text-gray-900 mb-1">TronLink</div>
                  <div className="text-sm text-gray-600">Connect your TronLink wallet for Tron blockchain</div>
                </button>

                <button
                  onClick={handleConnectLedger}
                  disabled={connecting}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-3xl mb-3">🔐</div>
                  <div className="font-semibold text-gray-900 mb-1">Ledger Hardware</div>
                  <div className="text-sm text-gray-600">Connect your Ledger hardware wallet via USB</div>
                </button>
              </div>

              {connecting && (
                <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connecting wallet...</span>
                </div>
              )}

              <button
                onClick={() => setShowConnectExternal(false)}
                className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="divide-y divide-gray-200">
            {externalWallets.length === 0 ? (
              <div className="p-12 text-center">
                <LinkIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No external wallets connected</p>
                <p className="text-sm text-gray-400">Connect MetaMask, Trust Wallet, TronLink, or Ledger</p>
              </div>
            ) : (
              externalWallets.map((wallet) => (
                <div key={wallet.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl">
                      {getWalletIcon(wallet.wallet_type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{wallet.wallet_name}</h3>
                            {wallet.is_connected && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                                <CheckCircle className="w-3 h-3" />
                                Connected
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-gray-600 font-mono">{wallet.wallet_address.slice(0, 12)}...{wallet.wallet_address.slice(-8)}</p>
                            <button
                              onClick={() => handleCopyAddress(wallet.wallet_address)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title="Copy address"
                            >
                              {copiedAddress === wallet.wallet_address ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                          {wallet.chain_id && (
                            <p className="text-xs text-gray-500 mt-1">
                              {getNetworkName(wallet.chain_id)}
                            </p>
                          )}
                          {wallet.network && !wallet.chain_id && (
                            <p className="text-xs text-gray-500 mt-1">
                              {wallet.network}
                            </p>
                          )}
                        </div>
                        {wallet.balance !== undefined && wallet.balance !== null && (
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">{wallet.balance.toFixed(4)}</div>
                            <div className="text-xs text-gray-500">Balance</div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => handleDisconnectExternal(wallet.id)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1.5 text-sm"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Disconnect
                        </button>
                        <div className="text-xs text-gray-500">
                          Last connected {new Date(wallet.last_connected).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
