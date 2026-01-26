import { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  Loader2,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  GeneralWallet as GeneralWalletType,
  WrapperWallet,
  NativeTransaction,
  ChainConfig,
  createGeneralWallet,
  getGeneralWallets,
  getSupportedChains,
  generateWrapperWallet,
  getWrapperWallets,
  getNativeTransactions,
  syncWrapperWallet,
  calculateGeneralWalletBalance,
  getChainExplorerUrl,
  getChainIcon,
  recordNativeTransaction,
} from '../services/multi-chain-wallet';

export function GeneralWallet() {
  const [generalWallets, setGeneralWallets] = useState<GeneralWalletType[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<GeneralWalletType | null>(null);
  const [wrapperWallets, setWrapperWallets] = useState<WrapperWallet[]>([]);
  const [chains, setChains] = useState<ChainConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddChain, setShowAddChain] = useState(false);
  const [expandedWallet, setExpandedWallet] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Record<string, NativeTransaction[]>>({});
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [chainsData, walletsData] = await Promise.all([
        getSupportedChains(),
        loadGeneralWallets(),
      ]);
      setChains(chainsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGeneralWallets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const wallets = await getGeneralWallets(user.id);
      setGeneralWallets(wallets);

      if (wallets.length > 0 && !selectedWallet) {
        setSelectedWallet(wallets[0]);
        await loadWrapperWallets(wallets[0].id);
      }

      return wallets;
    } catch (error) {
      console.error('Failed to load general wallets:', error);
      return [];
    }
  };

  const loadWrapperWallets = async (generalWalletId: string) => {
    try {
      const wrappers = await getWrapperWallets(generalWalletId);
      setWrapperWallets(wrappers);

      for (const wrapper of wrappers) {
        const txs = await getNativeTransactions(wrapper.id);
        setTransactions((prev) => ({ ...prev, [wrapper.id]: txs }));
      }
    } catch (error) {
      console.error('Failed to load wrapper wallets:', error);
    }
  };

  const handleCreateGeneralWallet = async (name: string, description: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userWallets } = await supabase
        .from('user_wallets')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!userWallets) {
        alert('Please create a HashBurst wallet first');
        return;
      }

      const newWallet = await createGeneralWallet(
        user.id,
        userWallets.id,
        name,
        description
      );

      await loadGeneralWallets();
      setSelectedWallet(newWallet);
      setShowCreate(false);
    } catch (error) {
      console.error('Failed to create general wallet:', error);
      alert('Failed to create general wallet');
    }
  };

  const handleAddWrapperWallet = async (chain: string) => {
    try {
      if (!selectedWallet) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userWallets } = await supabase
        .from('user_wallets')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      await generateWrapperWallet(chain, selectedWallet.id, userWallets?.id);
      await loadWrapperWallets(selectedWallet.id);
      await calculateGeneralWalletBalance(selectedWallet.id);
      await loadGeneralWallets();
      setShowAddChain(false);
    } catch (error) {
      console.error('Failed to add wrapper wallet:', error);
      alert('Failed to add wrapper wallet');
    }
  };

  const handleSync = async (wrapperWalletId: string) => {
    setSyncing(wrapperWalletId);
    try {
      await syncWrapperWallet(wrapperWalletId);
      if (selectedWallet) {
        await loadWrapperWallets(selectedWallet.id);
        await calculateGeneralWalletBalance(selectedWallet.id);
        await loadGeneralWallets();
      }
    } catch (error) {
      console.error('Failed to sync wallet:', error);
    } finally {
      setSyncing(null);
    }
  };

  const handleRecordTransaction = async (
    wrapperWalletId: string,
    chain: string,
    address: string
  ) => {
    try {
      const txHash = Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      await recordNativeTransaction(wrapperWalletId, {
        transaction_hash: txHash,
        chain,
        from_address: address,
        to_address: address,
        amount: Math.random() * 5,
        fee: Math.random() * 0.001,
        transaction_type: 'receive',
        metadata: { note: 'Test transaction' },
      });

      const txs = await getNativeTransactions(wrapperWalletId);
      setTransactions((prev) => ({ ...prev, [wrapperWalletId]: txs }));
    } catch (error) {
      console.error('Failed to record transaction:', error);
    }
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
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">General Wallets</h2>
              <p className="text-sm text-gray-500 mt-1">
                Manage multiple blockchain wallets in one place
              </p>
            </div>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create General Wallet
            </button>
          </div>
        </div>

        {showCreate && (
          <CreateGeneralWalletForm
            onSubmit={handleCreateGeneralWallet}
            onCancel={() => setShowCreate(false)}
          />
        )}

        {generalWallets.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No general wallets yet</p>
            <p className="text-sm text-gray-400">
              Create a general wallet to manage multiple blockchains
            </p>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {generalWallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => {
                    setSelectedWallet(wallet);
                    loadWrapperWallets(wallet.id);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedWallet?.id === wallet.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {wallet.name}
                </button>
              ))}
            </div>

            {selectedWallet && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedWallet.name}
                  </h3>
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  ${selectedWallet.total_balance_usd.toFixed(2)}
                </div>
                <p className="text-sm text-gray-600">Total Portfolio Value</p>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedWallet && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Chain Wallets</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {wrapperWallets.length} blockchain{wrapperWallets.length !== 1 ? 's' : ''}{' '}
                  connected
                </p>
              </div>
              <button
                onClick={() => setShowAddChain(!showAddChain)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Chain
              </button>
            </div>
          </div>

          {showAddChain && (
            <AddChainForm
              chains={chains}
              existingChains={wrapperWallets.map((w) => w.chain)}
              onAdd={handleAddWrapperWallet}
              onCancel={() => setShowAddChain(false)}
            />
          )}

          <div className="divide-y divide-gray-200">
            {wrapperWallets.length === 0 ? (
              <div className="p-12 text-center">
                <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No chain wallets yet</p>
                <p className="text-sm text-gray-400">Add a blockchain wallet to get started</p>
              </div>
            ) : (
              wrapperWallets.map((wrapper) => (
                <WrapperWalletCard
                  key={wrapper.id}
                  wrapper={wrapper}
                  transactions={transactions[wrapper.id] || []}
                  isExpanded={expandedWallet === wrapper.id}
                  isSyncing={syncing === wrapper.id}
                  onToggleExpand={() =>
                    setExpandedWallet(expandedWallet === wrapper.id ? null : wrapper.id)
                  }
                  onSync={() => handleSync(wrapper.id)}
                  onRecordTransaction={() =>
                    handleRecordTransaction(wrapper.id, wrapper.chain, wrapper.address)
                  }
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateGeneralWalletForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (name: string, description: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="p-6 bg-gray-50 border-b border-gray-200">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(name, description);
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="My Crypto Portfolio"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Main investment portfolio"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
          >
            Create Wallet
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function AddChainForm({
  chains,
  existingChains,
  onAdd,
  onCancel,
}: {
  chains: ChainConfig[];
  existingChains: string[];
  onAdd: (chain: string) => void;
  onCancel: () => void;
}) {
  const availableChains = chains.filter((c) => !existingChains.includes(c.chain));

  return (
    <div className="p-6 bg-gray-50 border-b border-gray-200">
      <h4 className="text-sm font-medium text-gray-700 mb-4">Select Blockchain</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {availableChains.map((chain) => (
          <button
            key={chain.chain}
            onClick={() => onAdd(chain.chain)}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center"
          >
            <div className="text-2xl mb-2">{getChainIcon(chain.chain)}</div>
            <div className="font-semibold text-gray-900 text-sm">{chain.name}</div>
            <div className="text-xs text-gray-500">{chain.symbol}</div>
          </button>
        ))}
      </div>
      <button
        onClick={onCancel}
        className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

function WrapperWalletCard({
  wrapper,
  transactions,
  isExpanded,
  isSyncing,
  onToggleExpand,
  onSync,
  onRecordTransaction,
}: {
  wrapper: WrapperWallet;
  transactions: NativeTransaction[];
  isExpanded: boolean;
  isSyncing: boolean;
  onToggleExpand: () => void;
  onSync: () => void;
  onRecordTransaction: () => void;
}) {
  return (
    <div className="p-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xl font-bold">
          {getChainIcon(wrapper.chain)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{wrapper.chain}</h4>
              <p className="text-xs text-gray-600 font-mono break-all">{wrapper.address}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                {wrapper.balance.toFixed(4)} {wrapper.chain}
              </div>
              <div className="text-xs text-gray-500">${wrapper.balance_usd.toFixed(2)}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1.5 text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync
            </button>
            <button
              onClick={onRecordTransaction}
              className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1.5 text-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Record TX
            </button>
            <a
              href={getChainExplorerUrl(wrapper.chain, wrapper.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5 text-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Explorer
            </a>
            <button
              onClick={onToggleExpand}
              className="ml-auto px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5 text-sm"
            >
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              {transactions.length} TXs
            </button>
          </div>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Recent Transactions</h5>
              {transactions.length === 0 ? (
                <p className="text-sm text-gray-500">No transactions yet</p>
              ) : (
                <div className="space-y-2">
                  {transactions.slice(0, 5).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.transaction_type === 'receive'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {tx.transaction_type === 'receive' ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            {tx.transaction_type === 'receive' ? 'Received' : 'Sent'}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {tx.amount.toFixed(4)} {wrapper.chain}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 font-mono truncate">
                          {tx.transaction_hash}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
