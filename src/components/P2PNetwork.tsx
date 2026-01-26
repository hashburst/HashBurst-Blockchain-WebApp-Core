import { useEffect, useState } from 'react';
import { Network, Globe, Zap, Shield, Loader2 } from 'lucide-react';
import { nodeService } from '../services/node';

export function P2PNetwork() {
  const [stats, setStats] = useState<any>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statsData, nodesData] = await Promise.all([
        nodeService.getNodeStats(),
        nodeService.getFederatedNodes(),
      ]);

      setStats(statsData);
      setNodes(nodesData);
    } catch (error) {
      console.error('Failed to load P2P network data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                <Network className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalNodes}</div>
            <div className="text-xs text-gray-600 mt-1">Total Nodes</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.federatedNodes}</div>
            <div className="text-xs text-gray-600 mt-1">Federated Nodes</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalCompute.toFixed(1)}</div>
            <div className="text-xs text-gray-600 mt-1">Total Compute</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.averageUptime.toFixed(1)}%</div>
            <div className="text-xs text-gray-600 mt-1">Average Uptime</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Network Nodes</h2>
              <p className="text-sm text-gray-500 mt-1">
                Decentralized peer-to-peer network of HashBurst nodes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Live</span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
          {nodes.length === 0 ? (
            <div className="p-12 text-center">
              <Network className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No nodes online</p>
            </div>
          ) : (
            nodes.map((node) => (
              <div key={node.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Network className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{node.node_name}</h3>
                        <p className="text-sm text-gray-600">{node.endpoint}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          node.status === 'online'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {node.status}
                        </span>
                        {node.is_federated && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            Federated
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-3">
                      <div>
                        <div className="text-gray-500 text-xs">Last Block</div>
                        <div className="font-medium text-gray-900">{node.last_block?.toLocaleString() || 0}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Storage</div>
                        <div className="font-medium text-gray-900">{formatBytes(node.storage_contribution || 0)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Uptime</div>
                        <div className="font-medium text-gray-900">{node.uptime_percentage?.toFixed(1) || 0}%</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-xs">Reputation</div>
                        <div className="font-medium text-gray-900">{node.reputation_score || 100}</div>
                      </div>
                    </div>

                    {node.rewards_earned > 0 && (
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span className="text-gray-600">
                          Rewards Earned: <span className="font-medium text-gray-900">{node.rewards_earned.toFixed(2)} HBT</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Trustless P2P Network
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            The HashBurst network operates on a trustless peer-to-peer architecture where all nodes
            participate in consensus without requiring central authority.
          </p>
          <ul className="space-y-1 mt-3">
            <li>• All transactions are cryptographically verified</li>
            <li>• IPFS integration provides decentralized storage</li>
            <li>• Smart contracts ensure transparent execution</li>
            <li>• Resource federation enables shared computing power</li>
            <li>• Reputation system maintains network quality</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
