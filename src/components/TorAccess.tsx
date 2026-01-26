import { Shield, Download, Globe, Lock, Eye, Server } from 'lucide-react';
import { useState } from 'react';

export function TorAccess() {
  const [showAddresses, setShowAddresses] = useState(false);

  const onionServices = [
    {
      name: 'Node 1 RPC',
      type: 'Blockchain',
      address: '[deployed].onion',
      status: 'Available after deployment',
    },
    {
      name: 'IPFS Gateway',
      type: 'Storage',
      address: '[deployed].onion',
      status: 'Available after deployment',
    },
    {
      name: 'Web Dashboard',
      type: 'Interface',
      address: '[deployed].onion',
      status: 'Available after deployment',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 rounded-xl p-8 text-white">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Darkweb Access via Tor</h2>
            <p className="text-purple-100 text-lg">
              Access HashBurst anonymously through Tor hidden services (.onion domains)
            </p>
          </div>
        </div>
      </div>

      {/* Why Tor Section */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <Eye className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Complete Anonymity</h3>
          <p className="text-sm text-gray-600">
            Your IP address and location are completely hidden. No one can track your activity.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Censorship Resistant</h3>
          <p className="text-sm text-gray-600">
            Access HashBurst even if it's blocked in your country. No ISP can prevent access.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Server className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">End-to-End Encrypted</h3>
          <p className="text-sm text-gray-600">
            All traffic encrypted through Tor network. No DNS leaks, no tracking.
          </p>
        </div>
      </div>

      {/* How to Access */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">How to Access via Tor</h3>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">Download Tor Browser</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Visit the official Tor Project website and download Tor Browser for your operating system.
                </p>
                <a
                  href="https://www.torproject.org/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Tor Browser
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">Connect to Tor Network</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Open Tor Browser and click "Connect". Wait 10-20 seconds for connection to establish.
                  If in a restricted country, configure bridges first.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                  💡 <strong>Tip:</strong> Visit{' '}
                  <code className="bg-white px-2 py-1 rounded">check.torproject.org</code> to verify
                  your connection
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">Access HashBurst .onion Address</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Enter your HashBurst .onion URL in Tor Browser. Contact your administrator for the
                  address if you don't have it.
                </p>
                <button
                  onClick={() => setShowAddresses(!showAddresses)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  {showAddresses ? 'Hide' : 'Show'} Example Addresses
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Services (if shown) */}
      {showAddresses && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Hidden Services (.onion)</h3>
            <p className="text-sm text-gray-500 mt-1">
              These addresses are generated during deployment and only accessible via Tor
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {onionServices.map((service, index) => (
              <div key={index} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{service.name}</h4>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                        {service.type}
                      </span>
                    </div>
                    <code className="text-sm text-gray-600 font-mono">
                      http://{service.address}
                    </code>
                  </div>
                  <span className="text-xs text-gray-500">{service.status}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> Actual .onion addresses are generated during deployment.
              Contact your administrator or check the deployment logs for the real addresses.
            </p>
          </div>
        </div>
      )}

      {/* Security Tips */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
        <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security Best Practices
        </h3>
        <ul className="space-y-2 text-sm text-orange-800">
          <li className="flex items-start gap-2">
            <span className="text-orange-600 font-bold mt-0.5">•</span>
            <span>
              <strong>Only use Tor Browser:</strong> Don't access .onion addresses in regular browsers
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-600 font-bold mt-0.5">•</span>
            <span>
              <strong>Verify addresses:</strong> Always verify the .onion URL is correct before
              entering sensitive data
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-600 font-bold mt-0.5">•</span>
            <span>
              <strong>No personal info:</strong> Don't enter identifying information that could
              compromise your anonymity
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-600 font-bold mt-0.5">•</span>
            <span>
              <strong>Keep Tor updated:</strong> Always use the latest version of Tor Browser for
              security patches
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-600 font-bold mt-0.5">•</span>
            <span>
              <strong>Use bridges if blocked:</strong> If Tor is blocked in your country, configure
              bridges in Tor Browser settings
            </span>
          </li>
        </ul>
      </div>

      {/* For Administrators */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">For Administrators</h3>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Deploy Tor Hidden Services</h4>
              <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <div># Navigate to Tor deployment directory</div>
                <div className="text-white">cd deployment/tor</div>
                <div className="mt-2"># Run deployment script</div>
                <div className="text-white">chmod +x deploy-tor.sh</div>
                <div className="text-white">./deploy-tor.sh</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Retrieve .onion Addresses</h4>
              <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <div># Get all .onion addresses</div>
                <div className="text-white">./get-onion-addresses.sh</div>
                <div className="mt-2"># Or view saved addresses</div>
                <div className="text-white">cat .onion_addresses</div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>📚 Full Documentation:</strong> See{' '}
                <code className="bg-white px-2 py-1 rounded">deployment/tor/TOR_ACCESS_GUIDE.md</code>{' '}
                for complete setup and configuration instructions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-sm text-yellow-800">
          <strong>⚡ Performance Note:</strong> Tor connections are slower than regular internet
          (50-200 KB/s) and have higher latency (300-1000ms). This is expected and the tradeoff for
          complete anonymity. Be patient when loading pages and uploading files.
        </p>
      </div>
    </div>
  );
}
