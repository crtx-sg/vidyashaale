import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  format,
} from 'date-fns';
import { useAuth } from '../context/AuthContext';
import ClassCard from '../components/ClassCard';
import Layout from '../components/Layout';
import api from '../api/client';
import './Dashboard.css';

type ViewType = 'day' | 'week' | 'month';

interface ClassData {
  id: string;
  name: string;
  topic?: string;
  startTime: string;
  durationMinutes: number;
  educatorId: string;
  meetingLink?: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState<ViewType>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  const getDateRange = () => {
    switch (view) {
      case 'day':
        return { start: startOfDay(currentDate), end: endOfDay(currentDate) };
      case 'week':
        return { start: startOfWeek(currentDate), end: endOfWeek(currentDate) };
      case 'month':
        return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
    }
  };

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const response = await api.get('/classes', {
        params: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      });
      setClasses(response.data.data.classes);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [view, currentDate]);

  const navigate = (direction: 'prev' | 'next') => {
    const modifier = direction === 'next' ? 1 : -1;
    switch (view) {
      case 'day':
        setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(
          direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1)
        );
        break;
      case 'month':
        setCurrentDate(
          direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1)
        );
        break;
    }
  };

  const getDateLabel = () => {
    const { start, end } = getDateRange();
    switch (view) {
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'week':
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
      case 'month':
        return format(currentDate, 'MMMM yyyy');
    }
  };

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>My Classes</h1>
          {user?.role === 'educator' && (
            <Link to="/classes/new" className="btn btn-primary">
              Create Class
            </Link>
          )}
        </div>

        <div className="dashboard-controls">
          <div className="view-toggle">
            <button
              className={`view-btn ${view === 'day' ? 'active' : ''}`}
              onClick={() => setView('day')}
            >
              Day
            </button>
            <button
              className={`view-btn ${view === 'week' ? 'active' : ''}`}
              onClick={() => setView('week')}
            >
              Week
            </button>
            <button
              className={`view-btn ${view === 'month' ? 'active' : ''}`}
              onClick={() => setView('month')}
            >
              Month
            </button>
          </div>

          <div className="date-navigation">
            <button className="nav-btn" onClick={() => navigate('prev')}>
              &larr;
            </button>
            <span className="date-label">{getDateLabel()}</span>
            <button className="nav-btn" onClick={() => navigate('next')}>
              &rarr;
            </button>
          </div>

          <button className="btn btn-outline" onClick={() => setCurrentDate(new Date())}>
            Today
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading classes...</div>
        ) : classes.length === 0 ? (
          <div className="empty-state">
            <h2>No classes scheduled</h2>
            <p>
              {user?.role === 'educator'
                ? 'Create your first class to get started.'
                : 'You have no classes scheduled for this period.'}
            </p>
            {user?.role === 'educator' && (
              <Link to="/classes/new" className="btn btn-primary">
                Create Class
              </Link>
            )}
          </div>
        ) : (
          <div className="classes-grid">
            {classes.map(cls => (
              <ClassCard
                key={cls.id}
                id={cls.id}
                name={cls.name}
                topic={cls.topic}
                startTime={cls.startTime}
                durationMinutes={cls.durationMinutes}
                meetingLink={cls.meetingLink}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
