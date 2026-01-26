import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://hfckxxnltfbppncjgvyb.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmY2t4eG5sdGZicHBuY2pndnliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NDM5MjMsImV4cCI6MjA4MTMxOTkyM30.GnlCvuF7FSMy_QI_thhPQ-QX_W1SBp12ATDbiuF_M9s';

const supabase = createClient(supabaseUrl, supabaseKey);

async function registerMainnetNodes() {
  console.log('Registering HashBurst Mainnet Nodes...\n');

  const nodes = [
    {
      node_id: 'node-001-mainnet-primary',
      node_name: 'hashburst-mainnet-1',
      node_type: 'virtual',
      endpoint: '31.25.11.195:8002',
      ip_address: '31.25.11.195',
      port: 8002,
      public_key: generatePublicKey('node-001'),
      is_federated: true,
      compute_contribution: 4.0,
      storage_contribution: 107374182400, // 100GB
      uptime_percentage: 99.9,
      reputation_score: 100,
      rewards_earned: 0,
      status: 'online',
      last_block: 0,
      last_ping: new Date().toISOString(),
      metadata: {
        location: 'Ubuntu 24.04 VPS',
        provider: 'Primary Server',
        capabilities: ['validator', 'rpc', 'ipfs'],
      },
    },
    {
      node_id: 'node-002-mainnet-validator',
      node_name: 'hashburst-mainnet-2',
      node_type: 'virtual',
      endpoint: '85.187.128.14:8003',
      ip_address: '85.187.128.14',
      port: 8003,
      public_key: generatePublicKey('node-002'),
      is_federated: true,
      compute_contribution: 2.0,
      storage_contribution: 53687091200, // 50GB
      uptime_percentage: 99.5,
      reputation_score: 100,
      rewards_earned: 0,
      status: 'online',
      last_block: 0,
      last_ping: new Date().toISOString(),
      metadata: {
        location: 'CloudLinux 7.9',
        provider: 'CloudLinux',
        capabilities: ['validator', 'rpc'],
      },
    },
    {
      node_id: 'node-003-mainnet-validator',
      node_name: 'hashburst-mainnet-3',
      node_type: 'virtual',
      endpoint: '85.187.128.14:8005',
      ip_address: '85.187.128.14',
      port: 8005,
      public_key: generatePublicKey('node-003'),
      is_federated: true,
      compute_contribution: 2.0,
      storage_contribution: 53687091200, // 50GB
      uptime_percentage: 99.5,
      reputation_score: 100,
      rewards_earned: 0,
      status: 'online',
      last_block: 0,
      last_ping: new Date().toISOString(),
      metadata: {
        location: 'CloudLinux 7.9',
        provider: 'CloudLinux',
        capabilities: ['validator', 'rpc'],
      },
    },
  ];

  for (const node of nodes) {
    console.log(`Registering ${node.node_name}...`);

    const { data, error } = await supabase
      .from('network_nodes')
      .upsert(node, { onConflict: 'node_id' });

    if (error) {
      console.error(`   Error: ${error.message}`);
    } else {
      console.log(`   Registered successfully`);
    }
  }

  console.log('\n Registering IPFS Nodes...\n');

  const ipfsNodes = [
    {
      node_id: 'ipfs-node-001-mainnet',
      peer_id: '12D3KooWHashBurstIPFS1' + Date.now().toString().slice(-8),
      multiaddress: '/ip4/31.25.11.195/tcp/4001',
      storage_capacity: 107374182400, // 100GB
      storage_used: 0,
      pinned_files: 0,
      bandwidth_up: 0,
      bandwidth_down: 0,
      is_online: true,
      last_seen: new Date().toISOString(),
      rewards_earned: 0,
      metadata: {
        gateway: 'http://31.25.11.195:8080',
        api: 'http://31.25.11.195:5001',
      },
    },
    {
      node_id: 'ipfs-node-002-mainnet',
      peer_id: '12D3KooWHashBurstIPFS2' + Date.now().toString().slice(-8),
      multiaddress: '/ip4/85.187.128.14/tcp/4002',
      storage_capacity: 53687091200, // 50GB
      storage_used: 0,
      pinned_files: 0,
      bandwidth_up: 0,
      bandwidth_down: 0,
      is_online: true,
      last_seen: new Date().toISOString(),
      rewards_earned: 0,
      metadata: {
        gateway: 'http://85.187.128.14:8081',
        api: 'http://85.187.128.14:5002',
      },
    },
  ];

  for (const ipfsNode of ipfsNodes) {
    console.log(`Registering ${ipfsNode.node_id}...`);

    const { data, error } = await supabase
      .from('ipfs_nodes')
      .upsert(ipfsNode, { onConflict: 'node_id' });

    if (error) {
      console.error(`   Error: ${error.message}`);
    } else {
      console.log(`   Registered successfully`);
    }
  }

  console.log('\n Creating P2P Connections...\n');

  const { data: registeredNodes, error: nodesError } = await supabase
    .from('network_nodes')
    .select('id, node_id')
    .in('node_id', ['node-001-mainnet-primary', 'node-002-mainnet-validator', 'node-003-mainnet-validator']);

  if (!nodesError && registeredNodes && registeredNodes.length >= 2) {
    const connections = [];

    for (let i = 0; i < registeredNodes.length; i++) {
      for (let j = i + 1; j < registeredNodes.length; j++) {
        connections.push({
          source_node_id: registeredNodes[i].id,
          target_node_id: registeredNodes[j].id,
          connection_type: 'hybrid',
          latency: Math.floor(Math.random() * 50) + 10,
          bandwidth: 1073741824,
          is_active: true,
          last_ping: new Date().toISOString(),
        });
      }
    }

    for (const conn of connections) {
      const { error: connError } = await supabase
        .from('p2p_connections')
        .upsert(conn);

      if (!connError) {
        console.log(`   Connection created`);
      }
    }
  }

  console.log('\n✨ Registration Complete!\n');
  console.log('You can now view the nodes in your dashboard at:');
  console.log('  Network tab: http://localhost:5173/?tab=network');
  console.log('  Federation tab: http://localhost:5173/?tab=federation');
}

function generatePublicKey(nodeId: string): string {
  const hash = Buffer.from(nodeId + Date.now()).toString('base64');
  return `0x${hash.replace(/[^a-f0-9]/gi, '').slice(0, 64)}`;
}

registerMainnetNodes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
