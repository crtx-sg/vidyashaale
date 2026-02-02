import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api/client';
import './ClassDetail.css';

interface ClassData {
  id: string;
  name: string;
  topic?: string;
  description?: string;
  startTime: string;
  durationMinutes: number;
  educatorId: string;
  meetingLink?: string;
  meetingPassword?: string;
  meetingLinkManual: boolean;
}

interface Resource {
  id: string;
  name: string;
  originalFilename: string;
  type: string;
  fileSize: number;
  createdAt: string;
  assignmentId?: string;
  uploaderName?: string;
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  resources?: Resource[];
}

const ClassDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'resources' | 'assignments'>('info');
  const [loading, setLoading] = useState(true);

  const isEducator = user?.role === 'educator' && classData?.educatorId === user?.id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classRes, resourcesRes, assignmentsRes] = await Promise.all([
          api.get(`/classes/${id}`),
          api.get(`/resources/class/${id}`),
          api.get(`/assignments/class/${id}`),
        ]);

        setClassData(classRes.data.data.class);
        setResources(resourcesRes.data.data.resources);

        // Fetch resources for each assignment
        const assignmentsList: Assignment[] = assignmentsRes.data.data.assignments;
        const assignmentsWithResources = await Promise.all(
          assignmentsList.map(async assignment => {
            try {
              const resRes = await api.get(`/resources/assignment/${assignment.id}`);
              return { ...assignment, resources: resRes.data.data.resources };
            } catch {
              return { ...assignment, resources: [] };
            }
          })
        );

        setAssignments(assignmentsWithResources);
      } catch (error) {
        console.error('Failed to fetch class data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;

    try {
      await api.delete(`/classes/${id}`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to delete class:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading...</div>
      </Layout>
    );
  }

  if (!classData) {
    return (
      <Layout>
        <div className="error">Class not found</div>
      </Layout>
    );
  }

  const startDate = new Date(classData.startTime);
  const endDate = new Date(startDate.getTime() + classData.durationMinutes * 60000);

  return (
    <Layout>
      <div className="class-detail">
        <div className="class-header">
          <div className="class-header-info">
            <h1>{classData.name}</h1>
            {classData.topic && <p className="class-topic">{classData.topic}</p>}
          </div>

          {isEducator && (
            <div className="class-actions">
              <button className="btn btn-outline" onClick={() => navigate(`/classes/${id}/edit`)}>
                Edit
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          )}
        </div>

        <div className="class-meta">
          <div className="meta-item">
            <span className="meta-label">Date</span>
            <span>{format(startDate, 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Time</span>
            <span>
              {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
            </span>
          </div>
          {classData.meetingLink && (
            <div className="meeting-info">
              <a
                href={classData.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary join-btn"
              >
                Join Meeting
              </a>
              {classData.meetingPassword && (
                <span className="meeting-password">
                  Password: <strong>{classData.meetingPassword}</strong>
                </span>
              )}
            </div>
          )}
        </div>

        {classData.description && (
          <div className="class-description">
            <h3>Description</h3>
            <p>{classData.description}</p>
          </div>
        )}

        <div className="class-tabs">
          <button
            className={`tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Information
          </button>
          <button
            className={`tab ${activeTab === 'resources' ? 'active' : ''}`}
            onClick={() => setActiveTab('resources')}
          >
            Resources ({resources.length})
          </button>
          <button
            className={`tab ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveTab('assignments')}
          >
            Assignments ({assignments.length})
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'info' && (
            <div className="info-tab">
              <p>To leave the meeting, use the red "Leave call" button in Google Meet.</p>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="resources-tab">
              {isEducator && (
                <div className="tab-header">
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate(`/classes/${id}/resources/upload`)}
                  >
                    Upload Resource
                  </button>
                </div>
              )}

              {resources.length === 0 ? (
                <p className="empty-message">No resources uploaded yet.</p>
              ) : (
                <div className="resources-list">
                  {resources.map(resource => (
                    <div key={resource.id} className="resource-item">
                      <div className="resource-info">
                        <span className="resource-name">{resource.name}</span>
                        <span className="resource-meta">
                          {resource.type} • {formatFileSize(resource.fileSize)}
                        </span>
                      </div>
                      <button
                        className="btn btn-outline"
                        onClick={() => window.open(`/api/resources/${resource.id}/download`)}
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="assignments-tab">
              {isEducator && (
                <div className="tab-header">
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate(`/classes/${id}/assignments/new`)}
                  >
                    Create Assignment
                  </button>
                </div>
              )}

              {assignments.length === 0 ? (
                <p className="empty-message">No assignments yet.</p>
              ) : (
                <div className="assignments-list">
                  {assignments.map(assignment => (
                    <div key={assignment.id} className="assignment-card">
                      <div className="assignment-header">
                        <div className="assignment-info">
                          <span className="assignment-title">{assignment.title}</span>
                          {assignment.dueDate && (
                            <span className="assignment-due">
                              Due: {format(new Date(assignment.dueDate), 'MMM d, yyyy h:mm a')}
                            </span>
                          )}
                        </div>
                        {isEducator && (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => navigate(`/classes/${id}/assignments/${assignment.id}/upload`)}
                          >
                            Upload File
                          </button>
                        )}
                      </div>
                      {assignment.description && (
                        <p className="assignment-description">{assignment.description}</p>
                      )}
                      {assignment.resources && assignment.resources.length > 0 && (
                        <div className="assignment-resources">
                          <span className="resources-label">Attached Files:</span>
                          <div className="resources-list">
                            {assignment.resources.map(resource => (
                              <div key={resource.id} className="resource-item compact">
                                <div className="resource-details">
                                  <span className="resource-name">{resource.name}</span>
                                  <span className="resource-meta">
                                    {formatFileSize(resource.fileSize)}
                                    {resource.uploaderName && ` • Uploaded by ${resource.uploaderName}`}
                                    {resource.createdAt && ` • ${format(new Date(resource.createdAt), 'MMM d, yyyy h:mm a')}`}
                                  </span>
                                </div>
                                <button
                                  className="btn btn-link"
                                  onClick={e => {
                                    e.stopPropagation();
                                    window.open(`/api/resources/${resource.id}/download`);
                                  }}
                                >
                                  Download
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ClassDetail;
