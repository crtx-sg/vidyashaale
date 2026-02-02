import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateClass from './pages/CreateClass';
import EditClass from './pages/EditClass';
import ClassDetail from './pages/ClassDetail';
import UploadResource from './pages/UploadResource';
import UploadAssignmentResource from './pages/UploadAssignmentResource';
import CreateAssignment from './pages/CreateAssignment';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
      />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes/new"
        element={
          <ProtectedRoute roles={['educator', 'admin']}>
            <CreateClass />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes/:id"
        element={
          <ProtectedRoute>
            <ClassDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes/:id/edit"
        element={
          <ProtectedRoute roles={['educator', 'admin']}>
            <EditClass />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes/:id/resources/upload"
        element={
          <ProtectedRoute roles={['educator', 'admin']}>
            <UploadResource />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes/:id/assignments/new"
        element={
          <ProtectedRoute roles={['educator', 'admin']}>
            <CreateAssignment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes/:id/assignments/:assignmentId/upload"
        element={
          <ProtectedRoute roles={['educator', 'admin']}>
            <UploadAssignmentResource />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
