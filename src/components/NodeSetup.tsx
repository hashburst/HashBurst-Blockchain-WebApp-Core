import { useState, useEffect } from 'react';
import { Server, Download, Terminal, CheckCircle2, ExternalLink } from 'lucide-react';
import { nodeService, NodeDownloadInfo } from '../services/node';

export function NodeSetup() {
  const [downloads, setDownloads] = useState<NodeDownloadInfo[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<'linux' | 'macos' | 'windows' | 'docker'>('linux');
  const [nodeName, setNodeName] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [step, setStep] = useState<'download' | 'config' | 'setup'>('download');

  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    const data = await nodeService.getNodeDownloads();
    setDownloads(data);
  };

  const selectedDownload = downloads.find(d => d.platform === selectedPlatform);

  const handleDownloadConfig = () => {
    if (!nodeName || !walletAddress) return;
    nodeService.downloadNodeConfig(nodeName, walletAddress);
  };

  const handleDownloadScript = () => {
    if (selectedPlatform === 'docker') return;

    const script = nodeService.generateSetupScript(selectedPlatform);
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `setup-hashburst-${selectedPlatform}.${selectedPlatform === 'windows' ? 'bat' : 'sh'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Download Full Node</h2>
              <p className="text-sm text-gray-600 mt-1">
                Join the HashBurst mainnet and become part of the decentralized network
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            {(['download', 'config', 'setup'] as const).map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step === s
                      ? 'bg-blue-500 text-white'
                      : i < ['download', 'config', 'setup'].indexOf(step)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {i < ['download', 'config', 'setup'].indexOf(step) ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <div className="ml-2 text-sm font-medium text-gray-700 capitalize">{s}</div>
                {i < 2 && <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>}
              </div>
            ))}
          </div>

          {step === 'download' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Platform</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {downloads.map((download) => (
                    <button
                      key={download.platform}
                      onClick={() => setSelectedPlatform(download.platform)}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        selectedPlatform === download.platform
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900 capitalize">{download.platform}</div>
                      <div className="text-xs text-gray-500 mt-1">{download.size}</div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedDownload && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-medium text-gray-900">{selectedDownload.version}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium text-gray-900">{selectedDownload.size}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Checksum:</span>
                    <span className="font-mono text-xs text-gray-900">
                      {selectedDownload.checksum.slice(0, 20)}...
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep('config')}
                className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Continue to Configuration
              </button>
            </div>
          )}

          {step === 'config' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Node Name</label>
                <input
                  type="text"
                  value={nodeName}
                  onChange={(e) => setNodeName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="my-hashburst-node"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Address</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0x..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Rewards will be sent to this wallet address
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Configuration Includes:</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• RPC endpoint on port 8002</li>
                  <li>• P2P networking on port 30303</li>
                  <li>• IPFS integration with gateway on port 8080</li>
                  <li>• Resource federation enabled</li>
                  <li>• Automatic mainnet genesis configuration</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep('download')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleDownloadConfig}
                  disabled={!nodeName || !walletAddress}
                  className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Configuration
                </button>
                <button
                  onClick={() => setStep('setup')}
                  disabled={!nodeName || !walletAddress}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 'setup' && (
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-4 text-green-400 font-mono text-sm overflow-x-auto">
                {selectedPlatform === 'docker' ? (
                  <div className="space-y-2">
                    <div># Pull the HashBurst node image</div>
                    <div className="text-white">docker pull hashburst/node:latest</div>
                    <div className="mt-4"># Run the node</div>
                    <div className="text-white">
                      docker run -d --name hashburst-node \<br />
                      {'  '}-p 8002:8002 -p 30303:30303 -p 8080:8080 \<br />
                      {'  '}-v $(pwd)/hashburst-node-config.json:/config.json \<br />
                      {'  '}-v hashburst-data:/data \<br />
                      {'  '}hashburst/node:latest
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div># Download and run the setup script</div>
                    <div className="text-white">
                      {selectedPlatform === 'windows'
                        ? '.\\setup-hashburst-windows.bat'
                        : 'chmod +x setup-hashburst-' + selectedPlatform + '.sh'}
                    </div>
                    {selectedPlatform !== 'windows' && (
                      <div className="text-white">./setup-hashburst-{selectedPlatform}.sh</div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleDownloadScript}
                disabled={selectedPlatform === 'docker'}
                className="w-full py-2 px-4 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Terminal className="w-4 h-4" />
                {selectedPlatform === 'docker' ? 'Use Docker Commands Above' : 'Download Setup Script'}
              </button>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Ready to Join the Network!
                </h4>
                <p className="text-sm text-green-800">
                  Once your node is running, it will automatically connect to the HashBurst mainnet and start
                  participating in consensus. You can monitor your node status in the dashboard.
                </p>
              </div>

              <a
                href="https://github.com/hashburst/blockchain-hvm-framework"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Documentation
              </a>

              <button
                onClick={() => setStep('download')}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Start Over
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
