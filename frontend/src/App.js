import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import FractionsPage from './pages/FractionsPage';
import DocumentsPage from './pages/DocumentsPage';
import CommsPage from './pages/CommsPage';
import AdminPage from './pages/AdminPage';
import RequestsPage from './pages/RequestsPage';
import './index.css';

const ProtectedRoute = ({ children, adminOnly }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">ЗАГРУЗКА...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role === 'user') return <Navigate to="/" />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">ЗАГРУЗКА...</div>;
  if (user) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="profile/:id" element={<ProfilePage />} />
            <Route path="fractions" element={<FractionsPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="comms" element={<CommsPage />} />
            <Route path="requests" element={<RequestsPage />} />
            <Route path="admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
