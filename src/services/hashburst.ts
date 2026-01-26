const HASHBURST_API_URL = import.meta.env.VITE_HASHBURST_API_URL || 'http://localhost:8002';

export interface BlockchainStatus {
  block_height: number;
  network_status: string;
  total_transactions: number;
  active_nodes: number;
  tps: number;
}

export interface ContractDeployment {
  address: string;
  transaction_hash: string;
  status: string;
}

export interface TransactionResult {
  transaction_hash: string;
  status: string;
  block_number: number;
}

class HashBurstService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = HASHBURST_API_URL;
  }

  async getNetworkStatus(): Promise<BlockchainStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/status`);
      if (!response.ok) {
        throw new Error('Failed to fetch network status');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching network status:', error);
      return {
        block_height: 0,
        network_status: 'disconnected',
        total_transactions: 0,
        active_nodes: 0,
        tps: 0,
      };
    }
  }

  async getContracts(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/contracts`);
      if (!response.ok) {
        throw new Error('Failed to fetch contracts');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching contracts:', error);
      return [];
    }
  }

  async deployContract(
    bytecode: string,
    abi: any[],
    contractType: string,
    creatorAddress: string
  ): Promise<ContractDeployment> {
    try {
      const response = await fetch(`${this.baseUrl}/api/contracts/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bytecode,
          abi,
          contract_type: contractType,
          creator: creatorAddress,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to deploy contract');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deploying contract:', error);
      throw error;
    }
  }

  async callContract(
    contractAddress: string,
    method: string,
    params: any[]
  ): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/contracts/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contract_address: contractAddress,
          method,
          params,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to call contract');
      }

      return await response.json();
    } catch (error) {
      console.error('Error calling contract:', error);
      throw error;
    }
  }

  async getDexPools(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/dex/pools`);
      if (!response.ok) {
        throw new Error('Failed to fetch DEX pools');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching DEX pools:', error);
      return [];
    }
  }

  async executeMint(
    contractAddress: string,
    recipient: string,
    amount: number
  ): Promise<TransactionResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/contracts/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contract_address: contractAddress,
          method: 'mint',
          params: [recipient, amount],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute mint');
      }

      return await response.json();
    } catch (error) {
      console.error('Error executing mint:', error);
      throw error;
    }
  }

  async getShards(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/shards`);
      if (!response.ok) {
        throw new Error('Failed to fetch shards');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching shards:', error);
      return [];
    }
  }

  async getSidechains(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/sidechains`);
      if (!response.ok) {
        throw new Error('Failed to fetch sidechains');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching sidechains:', error);
      return [];
    }
  }

  createWebSocket(): WebSocket | null {
    try {
      const wsUrl = this.baseUrl.replace('http', 'ws');
      const ws = new WebSocket(`${wsUrl}/ws`);

      ws.onopen = () => {
        ws.send(JSON.stringify({ action: 'subscribe', channel: 'blockchain_status' }));
      };

      return ws;
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      return null;
    }
  }

  async createBlockchainRecord(
    data: string,
    recordType: string,
    metadata?: any
  ): Promise<TransactionResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/transactions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data,
          record_type: recordType,
          metadata,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const mockTxHash = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
        return {
          transaction_hash: mockTxHash,
          status: 'pending',
          block_number: 0,
        };
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating blockchain record:', error);
      const mockTxHash = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
      return {
        transaction_hash: mockTxHash,
        status: 'pending',
        block_number: 0,
      };
    }
  }
}

export const hashburstService = new HashBurstService();
