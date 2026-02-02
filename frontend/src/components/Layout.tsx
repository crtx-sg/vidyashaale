import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content container">
          <Link to="/" className="logo">
            Vidyashaale
          </Link>
          <nav className="nav">
            {user && (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <span className="user-info">
                  {user.name} ({user.role})
                </span>
                <button onClick={handleLogout} className="btn btn-outline">
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="main">
        <div className="container">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
