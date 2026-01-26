import { useState } from 'react';
import { Layers, Upload, FileText, Code, Menu, X, Wallet, Server, Network, Share2, Shield, KeyRound, ChevronDown, Globe } from 'lucide-react';
import { NetworkStatus } from './components/NetworkStatus';
import { FileUpload } from './components/FileUpload';
import { RecordsViewer } from './components/RecordsViewer';
import { SmartContracts } from './components/SmartContracts';
import { WalletManager } from './components/WalletManager';
import { NodeSetup } from './components/NodeSetup';
import { FederationDashboard } from './components/FederationDashboard';
import { P2PNetwork } from './components/P2PNetwork';
import { TorAccess } from './components/TorAccess';
import EIDASWallet from './components/EIDASWallet';
import { GeneralWallet } from './components/GeneralWallet';

type Tab = 'dashboard' | 'wallet' | 'general-wallet' | 'eidas' | 'node' | 'upload' | 'records' | 'contracts' | 'federation' | 'network' | 'tor';

interface MenuItem {
  id: Tab;
  label: string;
  icon: any;
  submenu?: MenuItem[];
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    {
      id: 'wallet',
      label: 'Wallet',
      icon: Wallet,
      submenu: [
        { id: 'wallet', label: 'HashBurst Wallet', icon: Wallet },
        { id: 'general-wallet', label: 'Multi-Chain Wallet', icon: Globe },
        { id: 'eidas', label: 'eIDAS Wallet', icon: KeyRound },
      ]
    },
    { id: 'node', label: 'Node', icon: Server },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'records', label: 'Records', icon: FileText },
    { id: 'contracts', label: 'Contracts', icon: Code },
    { id: 'federation', label: 'Federation', icon: Share2 },
    {
      id: 'network',
      label: 'Network',
      icon: Network,
      submenu: [
        { id: 'network', label: 'P2P Network', icon: Network },
        { id: 'tor', label: 'Tor Access', icon: Shield },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">HashBurst</h1>
                <p className="text-xs text-gray-500">Blockchain & IPFS Platform</p>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <nav className="hidden lg:flex items-center gap-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const hasSubmenu = item.submenu && item.submenu.length > 0;
                const isActive = activeTab === item.id || (item.submenu?.some(sub => sub.id === activeTab));

                return (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => {
                        if (hasSubmenu) {
                          setOpenDropdown(openDropdown === item.id ? null : item.id);
                        } else {
                          setActiveTab(item.id);
                          setOpenDropdown(null);
                        }
                      }}
                      onMouseEnter={() => hasSubmenu && setOpenDropdown(item.id)}
                      onMouseLeave={() => hasSubmenu && setTimeout(() => setOpenDropdown(null), 200)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        isActive
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                      {hasSubmenu && <ChevronDown className="w-4 h-4" />}
                    </button>

                    {hasSubmenu && openDropdown === item.id && (
                      <div
                        className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[200px] z-50"
                        onMouseEnter={() => setOpenDropdown(item.id)}
                        onMouseLeave={() => setOpenDropdown(null)}
                      >
                        {item.submenu!.map((subItem) => {
                          const SubIcon = subItem.icon;
                          return (
                            <button
                              key={subItem.id}
                              onClick={() => {
                                setActiveTab(subItem.id);
                                setOpenDropdown(null);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                                activeTab === subItem.id
                                  ? 'bg-blue-50 text-blue-600'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <SubIcon className="w-4 h-4" />
                              {subItem.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>

        {sidebarOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-3 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const hasSubmenu = item.submenu && item.submenu.length > 0;
                const isActive = activeTab === item.id || (item.submenu?.some(sub => sub.id === activeTab));

                return (
                  <div key={item.id}>
                    <button
                      onClick={() => {
                        if (hasSubmenu) {
                          setOpenDropdown(openDropdown === item.id ? null : item.id);
                        } else {
                          setActiveTab(item.id);
                          setSidebarOpen(false);
                        }
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </div>
                      {hasSubmenu && <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === item.id ? 'rotate-180' : ''}`} />}
                    </button>

                    {hasSubmenu && openDropdown === item.id && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.submenu!.map((subItem) => {
                          const SubIcon = subItem.icon;
                          return (
                            <button
                              key={subItem.id}
                              onClick={() => {
                                setActiveTab(subItem.id);
                                setSidebarOpen(false);
                                setOpenDropdown(null);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                                activeTab === subItem.id
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <SubIcon className="w-4 h-4" />
                              {subItem.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Network Overview</h2>
              <p className="text-gray-600">
                Real-time status of the HashBurst blockchain network and IPFS nodes
              </p>
            </div>

            <NetworkStatus />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Network Type</span>
                    <span className="font-semibold text-gray-900">HashBurst HVM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Consensus</span>
                    <span className="font-semibold text-gray-900">Virtual Nodes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Storage</span>
                    <span className="font-semibold text-gray-900">IPFS Distributed</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Smart Contracts</span>
                    <span className="font-semibold text-gray-900">HBT-20 / HBT-721</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Decentralized Storage</div>
                      <div className="text-sm text-gray-600">IPFS integration for file storage</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Public Ledger</div>
                      <div className="text-sm text-gray-600">Immutable record keeping</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Smart Contracts</div>
                      <div className="text-sm text-gray-600">Deploy custom logic on-chain</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Records</h3>
              <RecordsViewer />
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Files</h2>
              <p className="text-gray-600">
                Upload files to IPFS and create permanent records on the HashBurst blockchain
              </p>
            </div>

            <FileUpload />

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-2">How It Works</h3>
              <ol className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="font-semibold">1.</span>
                  <span>Your file is uploaded to IPFS, generating a unique content hash (CID)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold">2.</span>
                  <span>A transaction is created on the HashBurst blockchain with the file metadata</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold">3.</span>
                  <span>The record is permanently stored and publicly accessible</span>
                </li>
              </ol>
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Public Records</h2>
              <p className="text-gray-600">
                Browse all confirmed records on the HashBurst blockchain
              </p>
            </div>

            <RecordsViewer />
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Smart Contracts</h2>
              <p className="text-gray-600">
                Deploy and manage smart contracts on the HashBurst blockchain
              </p>
            </div>

            <SmartContracts />

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
              <h3 className="font-semibold text-purple-900 mb-2">Contract Types</h3>
              <div className="space-y-3 text-sm text-purple-800">
                <div>
                  <div className="font-semibold">HBT-20 (Fungible Tokens)</div>
                  <div>Standard token contract for creating fungible tokens like currencies</div>
                </div>
                <div>
                  <div className="font-semibold">HBT-721 (Non-Fungible Tokens)</div>
                  <div>NFT contract for creating unique digital assets</div>
                </div>
                <div>
                  <div className="font-semibold">Custom Contracts</div>
                  <div>Deploy custom smart contract logic for specialized use cases</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Wallet Management</h2>
              <p className="text-gray-600">
                Create and manage your HashBurst wallets for secure transactions
              </p>
            </div>

            <WalletManager />

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <h3 className="font-semibold text-yellow-900 mb-2">Security Reminder</h3>
              <ul className="space-y-1 text-sm text-yellow-800">
                <li>• Always backup your wallet and keep it secure</li>
                <li>• Never share your private keys with anyone</li>
                <li>• Use strong encryption for wallet backups</li>
                <li>• Verify transaction details before confirming</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'eidas' && <EIDASWallet />}

        {activeTab === 'general-wallet' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Multi-Chain Wallet</h2>
              <p className="text-gray-600">
                Manage multiple blockchain wallets (BTC, BCH, ETC, LTC, ZEC, XMR, DOGE, DASH) in one place
              </p>
            </div>

            <GeneralWallet />

            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6">
              <h3 className="font-semibold text-orange-900 mb-2">Supported Blockchains</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="font-semibold text-orange-900">Bitcoin (BTC)</div>
                  <div className="text-xs text-orange-700">Original cryptocurrency</div>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="font-semibold text-orange-900">Bitcoin Cash (BCH)</div>
                  <div className="text-xs text-orange-700">Peer-to-peer payments</div>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="font-semibold text-orange-900">Ethereum Classic (ETC)</div>
                  <div className="text-xs text-orange-700">Immutable smart contracts</div>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="font-semibold text-orange-900">Litecoin (LTC)</div>
                  <div className="text-xs text-orange-700">Fast transactions</div>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="font-semibold text-orange-900">Zcash (ZEC)</div>
                  <div className="text-xs text-orange-700">Privacy-focused</div>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="font-semibold text-orange-900">Monero (XMR)</div>
                  <div className="text-xs text-orange-700">Private transactions</div>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="font-semibold text-orange-900">Dogecoin (DOGE)</div>
                  <div className="text-xs text-orange-700">Community-driven</div>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <div className="font-semibold text-orange-900">Dash (DASH)</div>
                  <div className="text-xs text-orange-700">Instant payments</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'node' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Run a Full Node</h2>
              <p className="text-gray-600">
                Download and setup your own HashBurst node to join the mainnet
              </p>
            </div>

            <NodeSetup />

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
              <h3 className="font-semibold text-green-900 mb-3">Benefits of Running a Node</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-green-800">
                <div>
                  <div className="font-medium mb-1">Network Participation</div>
                  <div>Contribute to the decentralization and security of the HashBurst network</div>
                </div>
                <div>
                  <div className="font-medium mb-1">Earn Rewards</div>
                  <div>Receive HBT tokens for validating transactions and maintaining the network</div>
                </div>
                <div>
                  <div className="font-medium mb-1">Resource Federation</div>
                  <div>Share your compute and storage resources to earn additional rewards</div>
                </div>
                <div>
                  <div className="font-medium mb-1">Full Control</div>
                  <div>Direct access to the blockchain without relying on third-party services</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'federation' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Resource Federation</h2>
              <p className="text-gray-600">
                Federate your compute and storage resources to the network and earn rewards
              </p>
            </div>

            <FederationDashboard />

            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-6">
              <h3 className="font-semibold text-cyan-900 mb-3">How Federation Works</h3>
              <div className="space-y-3 text-sm text-cyan-800">
                <p>
                  Resource federation allows you to contribute your unused compute power, storage space,
                  and bandwidth to the HashBurst network.
                </p>
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-white/50 rounded-lg p-3">
                    <div className="font-medium text-cyan-900 mb-1">1. Register Resources</div>
                    <div className="text-xs">Allocate compute, storage, or bandwidth to the network</div>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3">
                    <div className="font-medium text-cyan-900 mb-1">2. Earn Rewards</div>
                    <div className="text-xs">Get paid in HBT tokens when others use your resources</div>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3">
                    <div className="font-medium text-cyan-900 mb-1">3. Build Reputation</div>
                    <div className="text-xs">Maintain high uptime to increase your reputation score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'network' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">P2P Network Status</h2>
              <p className="text-gray-600">
                Real-time monitoring of the trustless peer-to-peer HashBurst network
              </p>
            </div>

            <P2PNetwork />
          </div>
        )}

        {activeTab === 'tor' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Darkweb Access via Tor</h2>
              <p className="text-gray-600">
                Access HashBurst anonymously through Tor hidden services for maximum privacy
              </p>
            </div>

            <TorAccess />
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-600">
                Powered by <span className="font-semibold text-gray-900">HashBurst HVM Framework</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Blockchain, IPFS & Smart Contracts Platform
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <a href="https://github.com/hashburst/blockchain-hvm-framework" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                Documentation
              </a>
              <span className="text-gray-300">|</span>
              <a href="https://github.com/hashburst" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
