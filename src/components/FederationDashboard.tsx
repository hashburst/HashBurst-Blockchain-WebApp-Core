import { useEffect, useState } from 'react';
import { Cpu, HardDrive, Activity, TrendingUp, Award, Loader2 } from 'lucide-react';
import { federationService, FederatedResource, IPFSNode } from '../services/federation';

export function FederationDashboard() {
  const [resources, setResources] = useState<FederatedResource[]>([]);
  const [ipfsNodes, setIPFSNodes] = useState<IPFSNode[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resources' | 'ipfs'>('resources');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [resourcesData, ipfsData, statsData] = await Promise.all([
        federationService.getAvailableResources(),
        federationService.getOnlineIPFSNodes(),
        federationService.getFederationStats(),
      ]);

      setResources(resourcesData);
      setIPFSNodes(ipfsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load federation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'compute':
        return <Cpu className="w-5 h-5" />;
      case 'storage':
        return <HardDrive className="w-5 h-5" />;
      case 'bandwidth':
        return <Activity className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getResourceColor = (type: string) => {
    switch (type) {
      case 'compute':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'storage':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'bandwidth':
        return 'bg-orange-100 text-orange-700 border-orange-200';
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
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Cpu className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.activeProviders}</div>
            <div className="text-xs text-gray-600 mt-1">Active Providers</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatBytes(stats.totalCapacity.storage)}</div>
            <div className="text-xs text-gray-600 mt-1">Total Storage</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.ipfsNodes}</div>
            <div className="text-xs text-gray-600 mt-1">IPFS Nodes</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalRewardsDistributed.toFixed(2)}</div>
            <div className="text-xs text-gray-600 mt-1">Rewards Distributed</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Federated Network</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'resources'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Resources ({resources.length})
            </button>
            <button
              onClick={() => setActiveTab('ipfs')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'ipfs'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              IPFS Nodes ({ipfsNodes.length})
            </button>
          </div>
        </div>

        {activeTab === 'resources' && (
          <div className="divide-y divide-gray-200">
            {resources.length === 0 ? (
              <div className="p-12 text-center">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No resources available</p>
              </div>
            ) : (
              resources.map((resource) => (
                <div key={resource.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${getResourceColor(resource.resource_type)}`}>
                      {getResourceIcon(resource.resource_type)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 capitalize">{resource.resource_type}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getResourceColor(resource.resource_type)}`}>
                            {resource.status}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {resource.price_per_unit} HBT/unit
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Available: {resource.available.toFixed(2)} / {resource.capacity.toFixed(2)}</span>
                          <span>{((resource.available / resource.capacity) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${(resource.available / resource.capacity) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'ipfs' && (
          <div className="divide-y divide-gray-200">
            {ipfsNodes.length === 0 ? (
              <div className="p-12 text-center">
                <HardDrive className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No IPFS nodes online</p>
              </div>
            ) : (
              ipfsNodes.map((node) => (
                <div key={node.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <HardDrive className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 font-mono text-sm">{node.peer_id.slice(0, 20)}...</h3>
                          <p className="text-xs text-gray-500">{node.multiaddress}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-green-600 font-medium">Online</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">Storage</div>
                          <div className="font-medium text-gray-900">
                            {formatBytes(node.storage_used)} / {formatBytes(node.storage_capacity)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Pinned Files</div>
                          <div className="font-medium text-gray-900">{node.pinned_files}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Rewards</div>
                          <div className="font-medium text-gray-900">{node.rewards_earned.toFixed(2)} HBT</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
