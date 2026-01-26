import { supabase } from '../lib/supabase';

export interface FederatedResource {
  id: string;
  node_id: string;
  user_id: string | null;
  resource_type: 'compute' | 'storage' | 'bandwidth';
  capacity: number;
  used: number;
  available: number;
  price_per_unit: number;
  status: 'active' | 'inactive' | 'maintenance';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface IPFSNode {
  id: string;
  node_id: string;
  peer_id: string;
  multiaddress: string;
  owner_id: string | null;
  storage_capacity: number;
  storage_used: number;
  pinned_files: number;
  bandwidth_up: number;
  bandwidth_down: number;
  is_online: boolean;
  last_seen: string | null;
  rewards_earned: number;
  created_at: string;
}

class FederationService {
  async registerResource(
    nodeId: string,
    resourceType: 'compute' | 'storage' | 'bandwidth',
    capacity: number,
    pricePerUnit: number
  ): Promise<FederatedResource> {
    const { data, error } = await supabase
      .from('federated_resources')
      .insert({
        node_id: nodeId,
        resource_type: resourceType,
        capacity,
        used: 0,
        available: capacity,
        price_per_unit: pricePerUnit,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAvailableResources(resourceType?: 'compute' | 'storage' | 'bandwidth'): Promise<FederatedResource[]> {
    let query = supabase
      .from('federated_resources')
      .select('*')
      .eq('status', 'active')
      .gt('available', 0);

    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    const { data, error } = await query.order('price_per_unit', { ascending: true });

    if (error) return [];
    return data || [];
  }

  async registerIPFSNode(peerId: string, multiaddress: string, storageCapacity: number): Promise<IPFSNode> {
    const nodeId = `ipfs-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const { data, error } = await supabase
      .from('ipfs_nodes')
      .insert({
        node_id: nodeId,
        peer_id: peerId,
        multiaddress,
        storage_capacity: storageCapacity,
        storage_used: 0,
        pinned_files: 0,
        bandwidth_up: 0,
        bandwidth_down: 0,
        is_online: true,
        last_seen: new Date().toISOString(),
        rewards_earned: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getOnlineIPFSNodes(): Promise<IPFSNode[]> {
    const { data, error } = await supabase
      .from('ipfs_nodes')
      .select('*')
      .eq('is_online', true)
      .order('rewards_earned', { ascending: false });

    if (error) return [];
    return data || [];
  }

  async updateIPFSNodeStatus(nodeId: string, isOnline: boolean): Promise<void> {
    await supabase
      .from('ipfs_nodes')
      .update({
        is_online: isOnline,
        last_seen: new Date().toISOString(),
      })
      .eq('node_id', nodeId);
  }

  async calculateRewards(nodeId: string): Promise<number> {
    const { data: resources } = await supabase
      .from('federated_resources')
      .select('resource_type, used, price_per_unit')
      .eq('node_id', nodeId)
      .eq('status', 'active');

    if (!resources) return 0;

    let totalRewards = 0;
    for (const resource of resources) {
      totalRewards += resource.used * resource.price_per_unit;
    }

    return totalRewards;
  }

  async getFederationStats(): Promise<{
    totalResources: number;
    activeProviders: number;
    totalCapacity: { compute: number; storage: number; bandwidth: number };
    totalUsed: { compute: number; storage: number; bandwidth: number };
    ipfsNodes: number;
    totalRewardsDistributed: number;
  }> {
    const { data: resources } = await supabase
      .from('federated_resources')
      .select('resource_type, capacity, used, status');

    const { data: ipfsNodes } = await supabase
      .from('ipfs_nodes')
      .select('id, rewards_earned, is_online');

    const activeResources = resources?.filter(r => r.status === 'active') || [];

    const stats = {
      totalResources: resources?.length || 0,
      activeProviders: new Set(activeResources.map(r => r.node_id)).size,
      totalCapacity: {
        compute: 0,
        storage: 0,
        bandwidth: 0,
      },
      totalUsed: {
        compute: 0,
        storage: 0,
        bandwidth: 0,
      },
      ipfsNodes: ipfsNodes?.filter(n => n.is_online).length || 0,
      totalRewardsDistributed: 0,
    };

    for (const resource of activeResources) {
      const type = resource.resource_type as keyof typeof stats.totalCapacity;
      stats.totalCapacity[type] += resource.capacity;
      stats.totalUsed[type] += resource.used;
    }

    stats.totalRewardsDistributed = ipfsNodes?.reduce((sum, n) => sum + n.rewards_earned, 0) || 0;

    return stats;
  }

  async allocateResource(
    resourceId: string,
    amount: number
  ): Promise<{ success: boolean; message: string }> {
    const { data: resource } = await supabase
      .from('federated_resources')
      .select('*')
      .eq('id', resourceId)
      .single();

    if (!resource) {
      return { success: false, message: 'Resource not found' };
    }

    if (resource.available < amount) {
      return { success: false, message: 'Insufficient capacity available' };
    }

    const newUsed = resource.used + amount;
    const newAvailable = resource.available - amount;

    const { error } = await supabase
      .from('federated_resources')
      .update({
        used: newUsed,
        available: newAvailable,
      })
      .eq('id', resourceId);

    if (error) {
      return { success: false, message: 'Failed to allocate resource' };
    }

    return { success: true, message: 'Resource allocated successfully' };
  }

  generateIPFSConfig(storageCapacity: number): string {
    const config = {
      API: {
        HTTPHeaders: {
          'Access-Control-Allow-Origin': ['*'],
          'Access-Control-Allow-Methods': ['GET', 'POST', 'PUT'],
        },
      },
      Addresses: {
        API: '/ip4/0.0.0.0/tcp/5001',
        Gateway: '/ip4/0.0.0.0/tcp/8080',
        Swarm: [
          '/ip4/0.0.0.0/tcp/4001',
          '/ip6/::/tcp/4001',
        ],
      },
      Bootstrap: [
        '/dnsaddr/bootstrap.hashburst.io',
      ],
      Datastore: {
        StorageMax: `${storageCapacity}GB`,
        GCPeriod: '1h',
      },
      Federation: {
        Enabled: true,
        Network: 'hashburst-mainnet',
      },
      Experimental: {
        AcceleratedDHTClient: true,
        FilestoreEnabled: true,
      },
    };

    return JSON.stringify(config, null, 2);
  }
}

export const federationService = new FederationService();
