import { useState } from 'react';
import { Upload, File, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { ipfsService } from '../services/ipfs';
import { hashburstService } from '../services/hashburst';
import { supabase } from '../lib/supabase';

export function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !title) {
      setStatus('error');
      setMessage('Please provide a file and title');
      return;
    }

    setUploading(true);
    setStatus('idle');
    setMessage('');

    try {
      setMessage('Uploading to IPFS...');
      const ipfsResult = await ipfsService.uploadFile(file);

      setMessage('Creating blockchain record...');
      const blockchainResult = await hashburstService.createBlockchainRecord(
        ipfsResult.hash,
        'file',
        {
          title,
          description,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }
      );

      setMessage('Saving to database...');
      const { error } = await supabase.from('blockchain_records').insert({
        record_type: 'file',
        title,
        description,
        ipfs_hash: ipfsResult.hash,
        blockchain_hash: blockchainResult.transaction_hash,
        file_size: file.size,
        file_type: file.type,
        status: 'confirmed',
        metadata: {
          file_name: file.name,
          ipfs_url: ipfsResult.url,
        },
      });

      if (error) throw error;

      setStatus('success');
      setMessage('File successfully uploaded and recorded on blockchain!');
      setFile(null);
      setTitle('');
      setDescription('');

      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    } catch (error) {
      console.error('Upload error:', error);
      setStatus('error');
      setMessage('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload to IPFS & Blockchain</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <File className="w-8 h-8 text-blue-500" />
              <div className="text-left">
                <div className="font-medium text-gray-900">{file.name}</div>
                <div className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</div>
              </div>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Drag and drop your file here, or</p>
              <label className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
                Browse Files
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter file title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter file description"
            rows={3}
          />
        </div>

        {message && (
          <div
            className={`flex items-center gap-2 p-4 rounded-lg ${
              status === 'success'
                ? 'bg-green-50 text-green-800'
                : status === 'error'
                ? 'bg-red-50 text-red-800'
                : 'bg-blue-50 text-blue-800'
            }`}
          >
            {status === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {status === 'error' && <AlertCircle className="w-5 h-5" />}
            {status === 'idle' && uploading && <Loader2 className="w-5 h-5 animate-spin" />}
            <span className="text-sm">{message}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !file || !title}
          className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Upload to IPFS & Blockchain
            </>
          )}
        </button>
      </form>
    </div>
  );
}
