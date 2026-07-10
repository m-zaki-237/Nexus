import React, { useEffect, useState, useRef } from 'react';
import { FileText, Upload, Download, Trash2, Share2 } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import api from '../../api/axios';
import { Document } from '../../types';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mine' | 'shared'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data.documents || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocuments(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Document uploaded');
      await fetchDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Delete this document?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      toast.success('Document deleted');
      setDocuments(prev => prev.filter(d => (d as any)._id !== docId && d.id !== docId));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getMimeLabel = (mime: string) => {
    if (mime.includes('pdf')) return 'PDF';
    if (mime.includes('word')) return 'Document';
    if (mime.includes('sheet') || mime.includes('excel')) return 'Spreadsheet';
    if (mime.includes('image')) return 'Image';
    return 'File';
  };

  const filteredDocs = documents.filter(doc => {
    const ownerId = typeof doc.ownerId === 'object' ? (doc.ownerId as any)._id : doc.ownerId;
    if (filter === 'mine') return ownerId === user?.id || ownerId === (user as any)?._id;
    if (filter === 'shared') return Array.isArray(doc.sharedWith) && doc.sharedWith.length > 0;
    return true;
  });

  const totalSize = documents.reduce((sum, d) => sum + (d.fileSize || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage your startup's important files</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={handleUpload}
          />
          <Button
            leftIcon={<Upload size={18} />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Storage</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used</span>
                <span className="font-medium text-gray-900">{formatSize(totalSize)}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-primary-600 rounded-full" style={{ width: `${Math.min((totalSize / (50 * 1024 * 1024)) * 100, 100)}%` }} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Files</span>
                <span className="font-medium text-gray-900">{documents.length}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Quick Access</h3>
              <div className="space-y-1">
                {(['all', 'mine', 'shared'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                      filter === f ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {f === 'all' ? 'All Files' : f === 'mine' ? 'My Files' : 'Shared with Me'}
                  </button>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Document list */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                {filter === 'all' ? 'All Documents' : filter === 'mine' ? 'My Documents' : 'Shared with Me'}
              </h2>
              <span className="text-sm text-gray-500">{filteredDocs.length} files</span>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading documents...</div>
              ) : filteredDocs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No documents yet.</p>
                  <p className="text-sm text-gray-400 mt-1">Upload your first document to get started.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDocs.map(doc => {
                    const docId = (doc as any)._id || doc.id;
                    const ownerId = typeof doc.ownerId === 'object' ? (doc.ownerId as any)._id : doc.ownerId;
                    const isOwner = ownerId === user?.id || ownerId === (user as any)?._id;

                    return (
                      <div
                        key={docId}
                        className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                      >
                        <div className="p-2 bg-primary-50 rounded-lg mr-4">
                          <FileText size={24} className="text-primary-600" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-gray-900 truncate">{doc.title}</h3>
                            {doc.isSigned && <Badge variant="success" size="sm">Signed</Badge>}
                            {doc.sharedWith && doc.sharedWith.length > 0 && (
                              <Badge variant="secondary" size="sm">Shared</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span>{getMimeLabel(doc.mimeType)}</span>
                            <span>{formatSize(doc.fileSize)}</span>
                            <span>v{doc.version}</span>
                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <a
                            href={import.meta.env.VITE_API_URL + doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm" className="p-2" aria-label="Download">
                              <Download size={18} />
                            </Button>
                          </a>

                          {isOwner && (
                            <>
                              <Button variant="ghost" size="sm" className="p-2" aria-label="Share">
                                <Share2 size={18} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-2 text-red-500 hover:text-red-700"
                                aria-label="Delete"
                                onClick={() => handleDelete(docId)}
                              >
                                <Trash2 size={18} />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
