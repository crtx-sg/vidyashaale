import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/client';
import './CreateClass.css';

const CreateClass: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    topic: '',
    description: '',
    date: '',
    time: '',
    durationMinutes: 60,
    recurrence: '' as '' | 'daily' | 'weekly',
    recurrenceEndDate: '',
    meetingLink: '',
    meetingPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const startTime = new Date(`${formData.date}T${formData.time}`);

      if (startTime < new Date()) {
        setError('Class cannot be scheduled in the past');
        setLoading(false);
        return;
      }

      await api.post('/classes', {
        name: formData.name,
        topic: formData.topic || undefined,
        description: formData.description || undefined,
        startTime: startTime.toISOString(),
        durationMinutes: formData.durationMinutes,
        recurrence: formData.recurrence || null,
        recurrenceEndDate: formData.recurrenceEndDate
          ? new Date(formData.recurrenceEndDate).toISOString()
          : undefined,
        meetingLink: formData.meetingLink || undefined,
        meetingPassword: formData.meetingPassword || undefined,
      });

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Layout>
      <div className="create-class">
        <h1>Create New Class</h1>

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
              placeholder="e.g., Introduction to Mathematics"
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
              placeholder="e.g., Algebra Basics"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what this class will cover..."
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
              <label htmlFor="durationMinutes">Duration (minutes) *</label>
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
            <h3>Recurring Class (Optional)</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="recurrence">Repeat</label>
                <select
                  id="recurrence"
                  name="recurrence"
                  value={formData.recurrence}
                  onChange={handleChange}
                >
                  <option value="">No repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              {formData.recurrence && (
                <div className="form-group">
                  <label htmlFor="recurrenceEndDate">Until</label>
                  <input
                    type="date"
                    id="recurrenceEndDate"
                    name="recurrenceEndDate"
                    value={formData.recurrenceEndDate}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3>Meeting Details (Optional)</h3>
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
              <small className="form-hint">Leave empty to auto-generate (if Google Meet is configured)</small>
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
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateClass;
