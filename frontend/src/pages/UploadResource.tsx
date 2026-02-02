import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';
import './UploadResource.css';

const UploadResource: React.FC = () => {
  const { id: classId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'notes' as 'reading' | 'notes' | 'other',
    file: null as File | null,
  });

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
      const file = e.dataTransfer.files[0];
      setFormData(prev => ({
        ...prev,
        file,
        name: prev.name || file.name.replace(/\.[^/.]+$/, ''),
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        file,
        name: prev.name || file.name.replace(/\.[^/.]+$/, ''),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) {
      setError('Please select a file to upload');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = new FormData();
      data.append('file', formData.file);
      data.append('name', formData.name);
      data.append('type', formData.type);
      data.append('classId', classId!);

      await api.post('/resources/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate(`/classes/${classId}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to upload resource');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Layout>
      <div className="upload-resource">
        <h1>Upload Resource</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="upload-form">
          <div
            className={`drop-zone ${dragActive ? 'active' : ''} ${formData.file ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {formData.file ? (
              <div className="file-preview">
                <span className="file-icon">📄</span>
                <div className="file-info">
                  <span className="file-name">{formData.file.name}</span>
                  <span className="file-size">{formatFileSize(formData.file.size)}</span>
                </div>
                <button
                  type="button"
                  className="remove-file"
                  onClick={() => setFormData(prev => ({ ...prev, file: null }))}
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <span className="drop-icon">📁</span>
                <p>Drag and drop a file here, or click to select</p>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="file-input"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.jpg,.jpeg,.png,.gif"
                />
              </>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="name">Resource Name *</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Chapter 1 Notes"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Resource Type *</label>
            <select
              id="type"
              value={formData.type}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  type: e.target.value as 'reading' | 'notes' | 'other',
                }))
              }
            >
              <option value="notes">Notes</option>
              <option value="reading">Reading Material</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !formData.file}>
              {loading ? 'Uploading...' : 'Upload Resource'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default UploadResource;
