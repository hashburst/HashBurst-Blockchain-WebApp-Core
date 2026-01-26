import { useEffect, useState } from 'react';
import { Code, ExternalLink, Plus, Loader2, Rocket, FileCode, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  CONTRACT_TEMPLATES,
  ContractTemplate,
  deployContract,
  getDeployedContracts,
} from '../services/contract-deployment';

interface DeployedContract {
  id: string;
  wallet_id: string;
  contract_name: string;
  contract_type: string;
  contract_address: string;
  source_code: string;
  deployment_tx: string;
  network: string;
  status: string;
  gas_used: number;
  deployed_at: string;
  created_at: string;
}

export function SmartContracts() {
  const [contracts, setContracts] = useState<DeployedContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeploy, setShowDeploy] = useState(false);
  const [wallets, setWallets] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadContracts(), loadWallets()]);
  };

  const loadWallets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWallets(data || []);
    } catch (error) {
      console.error('Failed to load wallets:', error);
    }
  };

  const loadContracts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setContracts([]);
        setLoading(false);
        return;
      }

      const { data: userWallets } = await supabase
        .from('user_wallets')
        .select('id')
        .eq('user_id', user.id);

      if (!userWallets || userWallets.length === 0) {
        setContracts([]);
        setLoading(false);
        return;
      }

      const walletIds = userWallets.map(w => w.id);

      const { data, error } = await supabase
        .from('deployed_contracts')
        .select('*')
        .in('wallet_id', walletIds)
        .order('deployed_at', { ascending: false });

      if (error) throw error;
      setContracts((data || []) as DeployedContract[]);
    } catch (error) {
      console.error('Failed to load contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContractColor = (type: string) => {
    switch (type) {
      case 'token':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'nft':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'generic':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Smart Contracts</h2>
            <p className="text-sm text-gray-500 mt-1">Deploy and manage contracts on HashBurst</p>
          </div>
          <button
            onClick={() => setShowDeploy(!showDeploy)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Deploy Contract
          </button>
        </div>
      </div>

      {showDeploy && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <DeployContractForm
            wallets={wallets}
            onSuccess={() => {
              setShowDeploy(false);
              loadContracts();
            }}
          />
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {contracts.length === 0 ? (
          <div className="p-12 text-center">
            <Code className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No smart contracts deployed yet</p>
            <p className="text-sm text-gray-400">Deploy your first contract to get started</p>
          </div>
        ) : (
          contracts.map((contract) => (
            <div key={contract.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Code className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{contract.contract_name}</h3>
                      <p className="text-sm text-gray-600 font-mono">
                        {contract.contract_address}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getContractColor(contract.contract_type)}`}>
                      {contract.contract_type}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                    <div>
                      Deployed: {new Date(contract.deployed_at).toLocaleDateString()}
                    </div>
                    <a
                      href={`${import.meta.env.VITE_HASHBURST_API_URL}/explorer/contract/${contract.contract_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View in Explorer
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DeployContractForm({ wallets, onSuccess }: { wallets: any[]; onSuccess: () => void }) {
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [contractName, setContractName] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [network, setNetwork] = useState('hashburst');
  const [constructorArgs, setConstructorArgs] = useState<any[]>([]);
  const [customCode, setCustomCode] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const handleTemplateSelect = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setContractName(template.name);
    setCustomCode(template.sourceCode);
    setConstructorArgs(new Array(template.constructorParams.length).fill(''));
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedWallet || !contractName) return;

    setDeploying(true);

    try {
      const sourceCode = customCode || selectedTemplate?.sourceCode || '';

      await deployContract({
        walletId: selectedWallet,
        contractName,
        contractType: selectedTemplate?.type || 'custom',
        sourceCode,
        constructorArgs,
        network,
      });

      onSuccess();
    } catch (error) {
      console.error('Failed to deploy contract:', error);
      alert('Failed to deploy contract. Please try again.');
    } finally {
      setDeploying(false);
    }
  };

  if (!selectedTemplate) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Contract Template</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CONTRACT_TEMPLATES.map((template) => (
            <button
              key={template.name}
              onClick={() => handleTemplateSelect(template)}
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                {template.type === 'generic' && <Zap className="w-6 h-6 text-white" />}
                {template.type === 'token' && <Code className="w-6 h-6 text-white" />}
                {template.type === 'nft' && <FileCode className="w-6 h-6 text-white" />}
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">{template.name}</h4>
              <p className="text-sm text-gray-600">{template.description}</p>
              <div className="mt-4">
                <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                  template.type === 'token' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                  template.type === 'nft' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                  'bg-green-100 text-green-700 border-green-200'
                }`}>
                  {template.type.toUpperCase()}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleDeploy} className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Deploy {selectedTemplate.name}</h3>
        <button
          type="button"
          onClick={() => {
            setSelectedTemplate(null);
            setContractName('');
            setConstructorArgs([]);
            setCustomCode('');
          }}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Change Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Wallet</label>
          <select
            value={selectedWallet}
            onChange={(e) => setSelectedWallet(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select wallet</option>
            {wallets.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.wallet_name} ({wallet.wallet_address.slice(0, 8)}...)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Network</label>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="hashburst">HashBurst Mainnet</option>
            <option value="testnet">HashBurst Testnet</option>
            <option value="ethereum">Ethereum</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Contract Name</label>
        <input
          type="text"
          value={contractName}
          onChange={(e) => setContractName(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="My Contract"
          required
        />
      </div>

      {selectedTemplate.constructorParams.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Constructor Parameters</h4>
          {selectedTemplate.constructorParams.map((param, index) => (
            <div key={index}>
              <label className="block text-sm text-gray-600 mb-1">
                {param.name} ({param.type})
              </label>
              <input
                type="text"
                value={constructorArgs[index] || ''}
                onChange={(e) => {
                  const newArgs = [...constructorArgs];
                  newArgs[index] = e.target.value;
                  setConstructorArgs(newArgs);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={param.description}
                required
              />
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Source Code</label>
          <button
            type="button"
            onClick={() => setShowCode(!showCode)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showCode ? 'Hide' : 'Show'} Code
          </button>
        </div>
        {showCode && (
          <textarea
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs"
            rows={12}
            placeholder="Solidity source code..."
          />
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={deploying || !selectedWallet || !contractName}
          className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {deploying ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Deploying Contract...
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5" />
              Deploy Contract
            </>
          )}
        </button>
      </div>
    </form>
  );
}
