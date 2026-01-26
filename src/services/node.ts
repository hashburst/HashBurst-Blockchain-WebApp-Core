import { supabase } from '../lib/supabase';

export interface NodeConfig {
  nodeId: string;
  nodeName: string;
  ipAddress: string;
  port: number;
  publicKey: string;
  isFederated: boolean;
  computeContribution: number;
  storageContribution: number;
}

export interface NodeDownloadInfo {
  platform: 'linux' | 'macos' | 'windows' | 'docker';
  downloadUrl: string;
  version: string;
  size: string;
  checksum: string;
}

class NodeService {
  async registerNode(config: NodeConfig): Promise<any> {
    const { data, error } = await supabase
      .from('network_nodes')
      .insert({
        node_id: config.nodeId,
        node_name: config.nodeName,
        node_type: 'virtual',
        endpoint: `${config.ipAddress}:${config.port}`,
        ip_address: config.ipAddress,
        port: config.port,
        public_key: config.publicKey,
        is_federated: config.isFederated,
        compute_contribution: config.computeContribution,
        storage_contribution: config.storageContribution,
        status: 'online',
        uptime_percentage: 0,
        reputation_score: 100,
        rewards_earned: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getNodeDownloads(): Promise<NodeDownloadInfo[]> {
    return [
      {
        platform: 'linux',
        downloadUrl: 'https://github.com/hashburst/blockchain-hvm-framework/releases/latest/download/hashburst-node-linux-x64.tar.gz',
        version: 'v1.0.0',
        size: '45 MB',
        checksum: 'sha256:abc123...',
      },
      {
        platform: 'macos',
        downloadUrl: 'https://github.com/hashburst/blockchain-hvm-framework/releases/latest/download/hashburst-node-macos.dmg',
        version: 'v1.0.0',
        size: '48 MB',
        checksum: 'sha256:def456...',
      },
      {
        platform: 'windows',
        downloadUrl: 'https://github.com/hashburst/blockchain-hvm-framework/releases/latest/download/hashburst-node-windows-x64.exe',
        version: 'v1.0.0',
        size: '50 MB',
        checksum: 'sha256:ghi789...',
      },
      {
        platform: 'docker',
        downloadUrl: 'docker pull hashburst/node:latest',
        version: 'v1.0.0',
        size: '120 MB',
        checksum: 'sha256:jkl012...',
      },
    ];
  }

  generateNodeConfig(nodeName: string, walletAddress: string): string {
    const config = {
      node: {
        name: nodeName,
        wallet: walletAddress,
        network: 'mainnet',
        rpc: {
          host: '0.0.0.0',
          port: 8002,
        },
        p2p: {
          host: '0.0.0.0',
          port: 30303,
        },
      },
      blockchain: {
        datadir: './hashburst-data',
        genesis: 'mainnet-genesis.json',
      },
      federation: {
        enabled: true,
        resources: {
          compute: true,
          storage: true,
          bandwidth: true,
        },
      },
      ipfs: {
        enabled: true,
        repo: './ipfs-data',
        gateway: {
          port: 8080,
        },
        api: {
          port: 5001,
        },
      },
    };

    return JSON.stringify(config, null, 2);
  }

  downloadNodeConfig(nodeName: string, walletAddress: string): void {
    const config = this.generateNodeConfig(nodeName, walletAddress);
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hashburst-node-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  generateSetupScript(platform: 'linux' | 'macos' | 'windows'): string {
    const scripts = {
      linux: `#!/bin/bash
# HashBurst Node Setup Script for Linux

echo "Installing HashBurst Node..."

# Download and extract
wget https://github.com/hashburst/blockchain-hvm-framework/releases/latest/download/hashburst-node-linux-x64.tar.gz
tar -xzf hashburst-node-linux-x64.tar.gz
cd hashburst-node

# Make executable
chmod +x hashburst-node

# Initialize node
./hashburst-node init --config hashburst-node-config.json

# Start node
./hashburst-node start

echo "HashBurst Node installed and started!"
echo "Run './hashburst-node status' to check node status"
`,
      macos: `#!/bin/bash
# HashBurst Node Setup Script for macOS

echo "Installing HashBurst Node..."

# Download DMG
curl -LO https://github.com/hashburst/blockchain-hvm-framework/releases/latest/download/hashburst-node-macos.dmg

# Mount and install
hdiutil attach hashburst-node-macos.dmg
cp -R /Volumes/HashBurst/HashBurst.app /Applications/
hdiutil detach /Volumes/HashBurst

# Initialize node
/Applications/HashBurst.app/Contents/MacOS/hashburst-node init --config hashburst-node-config.json

echo "HashBurst Node installed!"
echo "Open HashBurst.app to start your node"
`,
      windows: `@echo off
REM HashBurst Node Setup Script for Windows

echo Installing HashBurst Node...

REM Download installer
curl -LO https://github.com/hashburst/blockchain-hvm-framework/releases/latest/download/hashburst-node-windows-x64.exe

REM Run installer
hashburst-node-windows-x64.exe /S

REM Initialize node
cd "%PROGRAMFILES%\\HashBurst\\Node"
hashburst-node.exe init --config hashburst-node-config.json

echo HashBurst Node installed!
echo Run 'hashburst-node.exe start' to start your node
`,
    };

    return scripts[platform];
  }

  async getFederatedNodes(): Promise<any[]> {
    const { data, error } = await supabase
      .from('network_nodes')
      .select('*')
      .eq('is_federated', true)
      .eq('status', 'online')
      .order('reputation_score', { ascending: false });

    if (error) return [];
    return data || [];
  }

  async getNodeStats(): Promise<{
    totalNodes: number;
    federatedNodes: number;
    totalCompute: number;
    totalStorage: number;
    averageUptime: number;
  }> {
    const { data: nodes } = await supabase
      .from('network_nodes')
      .select('is_federated, compute_contribution, storage_contribution, uptime_percentage');

    if (!nodes) {
      return {
        totalNodes: 0,
        federatedNodes: 0,
        totalCompute: 0,
        totalStorage: 0,
        averageUptime: 0,
      };
    }

    const federatedNodes = nodes.filter(n => n.is_federated).length;
    const totalCompute = nodes.reduce((sum, n) => sum + (n.compute_contribution || 0), 0);
    const totalStorage = nodes.reduce((sum, n) => sum + (n.storage_contribution || 0), 0);
    const averageUptime = nodes.reduce((sum, n) => sum + (n.uptime_percentage || 0), 0) / nodes.length;

    return {
      totalNodes: nodes.length,
      federatedNodes,
      totalCompute,
      totalStorage,
      averageUptime: Math.round(averageUptime * 100) / 100,
    };
  }
}

export const nodeService = new NodeService();
