import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';
import './CreateClass.css';

interface ClassData {
  id: string;
  name: string;
  topic?: string;
  description?: string;
  startTime: string;
  durationMinutes: number;
  meetingLink?: string;
  meetingPassword?: string;
}

const EditClass: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    topic: '',
    description: '',
    date: '',
    time: '',
    durationMinutes: 60,
    meetingLink: '',
    meetingPassword: '',
  });

  useEffect(() => {
    const fetchClass = async () => {
      try {
        const response = await api.get(`/classes/${id}`);
        const classData: ClassData = response.data.data.class;
        const startDate = new Date(classData.startTime);

        setFormData({
          name: classData.name,
          topic: classData.topic || '',
          description: classData.description || '',
          date: startDate.toISOString().split('T')[0],
          time: startDate.toTimeString().slice(0, 5),
          durationMinutes: classData.durationMinutes,
          meetingLink: classData.meetingLink || '',
          meetingPassword: classData.meetingPassword || '',
        });
      } catch (err) {
        console.error('Failed to fetch class:', err);
        setError('Failed to load class data');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchClass();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const startTime = new Date(`${formData.date}T${formData.time}`);

      await api.put(`/classes/${id}`, {
        name: formData.name,
        topic: formData.topic || undefined,
        description: formData.description || undefined,
        startTime: startTime.toISOString(),
        durationMinutes: formData.durationMinutes,
        meetingLink: formData.meetingLink || undefined,
        meetingPassword: formData.meetingPassword || undefined,
      });

      navigate(`/classes/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update class');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="create-class">
        <h1>Edit Class</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="create-class-form">
          <div className="form-group">
            <label htmlFor="name">Class Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="topic">Topic</label>
            <input
              type="text"
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date *</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="time">Time *</label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="durationMinutes">Duration *</label>
              <select
                id="durationMinutes"
                name="durationMinutes"
                value={formData.durationMinutes}
                onChange={handleChange}
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3>Meeting Details</h3>
            <div className="form-group">
              <label htmlFor="meetingLink">Meeting URL</label>
              <input
                type="url"
                id="meetingLink"
                name="meetingLink"
                value={formData.meetingLink}
                onChange={handleChange}
                placeholder="e.g., https://meet.google.com/abc-defg-hij"
              />
            </div>

            <div className="form-group">
              <label htmlFor="meetingPassword">Meeting Password</label>
              <input
                type="text"
                id="meetingPassword"
                name="meetingPassword"
                value={formData.meetingPassword}
                onChange={handleChange}
                placeholder="Optional password for the meeting"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditClass;
