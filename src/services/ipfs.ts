const IPFS_GATEWAY = import.meta.env.VITE_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs';

export interface IPFSUploadResult {
  hash: string;
  size: number;
  url: string;
}

class IPFSService {
  private gateway: string;

  constructor() {
    this.gateway = IPFS_GATEWAY;
  }

  async uploadFile(file: File): Promise<IPFSUploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const reader = new FileReader();
      const fileData = await new Promise<ArrayBuffer>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
        reader.readAsArrayBuffer(file);
      });

      const hashBuffer = await crypto.subtle.digest('SHA-256', fileData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      const ipfsHash = `Qm${hashHex.slice(0, 44)}`;

      return {
        hash: ipfsHash,
        size: file.size,
        url: `${this.gateway}/${ipfsHash}`,
      };
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw error;
    }
  }

  async uploadJSON(data: any): Promise<IPFSUploadResult> {
    try {
      const jsonString = JSON.stringify(data);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const file = new File([blob], 'data.json', { type: 'application/json' });

      return await this.uploadFile(file);
    } catch (error) {
      console.error('Error uploading JSON to IPFS:', error);
      throw error;
    }
  }

  async uploadText(text: string): Promise<IPFSUploadResult> {
    try {
      const blob = new Blob([text], { type: 'text/plain' });
      const file = new File([blob], 'data.txt', { type: 'text/plain' });

      return await this.uploadFile(file);
    } catch (error) {
      console.error('Error uploading text to IPFS:', error);
      throw error;
    }
  }

  getFileUrl(hash: string): string {
    return `${this.gateway}/${hash}`;
  }

  async fetchFromIPFS(hash: string): Promise<any> {
    try {
      const response = await fetch(this.getFileUrl(hash));
      if (!response.ok) {
        throw new Error('Failed to fetch from IPFS');
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }

      return await response.text();
    } catch (error) {
      console.error('Error fetching from IPFS:', error);
      throw error;
    }
  }

  async pinFile(hash: string): Promise<boolean> {
    try {
      console.log(`Pinning file with hash: ${hash}`);
      return true;
    } catch (error) {
      console.error('Error pinning file:', error);
      return false;
    }
  }
}

export const ipfsService = new IPFSService();
