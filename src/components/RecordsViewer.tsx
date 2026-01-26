import { useEffect, useState } from 'react';
import { File, Calendar, Hash, ExternalLink, Filter } from 'lucide-react';
import { supabase, BlockchainRecord } from '../lib/supabase';
import { ipfsService } from '../services/ipfs';

export function RecordsViewer() {
  const [records, setRecords] = useState<BlockchainRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'file' | 'event' | 'data' | 'contract'>('all');

  useEffect(() => {
    loadRecords();
    const subscription = supabase
      .channel('blockchain_records_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blockchain_records' },
        () => {
          loadRecords();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [filter]);

  const loadRecords = async () => {
    try {
      let query = supabase
        .from('blockchain_records')
        .select('*')
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter !== 'all') {
        query = query.eq('record_type', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <File className="w-5 h-5" />;
      case 'event':
        return <Calendar className="w-5 h-5" />;
      case 'data':
        return <Hash className="w-5 h-5" />;
      default:
        return <Hash className="w-5 h-5" />;
    }
  };

  const getRecordColor = (type: string) => {
    switch (type) {
      case 'file':
        return 'bg-blue-100 text-blue-700';
      case 'event':
        return 'bg-emerald-100 text-emerald-700';
      case 'data':
        return 'bg-orange-100 text-orange-700';
      case 'contract':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Public Records</h2>
          <span className="text-sm text-gray-500">{records.length} records</span>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex gap-2">
            {['all', 'file', 'event', 'data', 'contract'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type as any)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === type
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
        {records.length === 0 ? (
          <div className="p-12 text-center">
            <Hash className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No records found</p>
          </div>
        ) : (
          records.map((record) => (
            <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getRecordColor(record.record_type)}`}>
                  {getRecordIcon(record.record_type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{record.title}</h3>
                      {record.description && (
                        <p className="text-sm text-gray-600 mb-2">{record.description}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${getRecordColor(record.record_type)}`}>
                      {record.record_type}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(record.created_at)}</span>
                    </div>

                    {record.file_size && (
                      <div className="flex items-center gap-1">
                        <File className="w-3.5 h-3.5" />
                        <span>{formatFileSize(record.file_size)}</span>
                      </div>
                    )}

                    {record.blockchain_hash && (
                      <div className="flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5" />
                        <span className="font-mono truncate">
                          Tx: {record.blockchain_hash.slice(0, 10)}...{record.blockchain_hash.slice(-8)}
                        </span>
                      </div>
                    )}

                    {record.ipfs_hash && (
                      <div className="flex items-center gap-1">
                        <ExternalLink className="w-3.5 h-3.5" />
                        <a
                          href={ipfsService.getFileUrl(record.ipfs_hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 truncate"
                        >
                          View on IPFS
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
