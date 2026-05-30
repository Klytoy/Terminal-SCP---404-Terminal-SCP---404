import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
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
import SCPArchivePage from './pages/SCPArchivePage';
import WantedPage from './pages/WantedPage';
import LinkedOrgsPage from './pages/LinkedOrgsPage';
import PersonnelPage from './pages/PersonnelPage';
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

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route index element={<DashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/:id" element={<ProfilePage />} />
        <Route path="fractions" element={<FractionsPage />} />
        <Route path="personnel" element={<PersonnelPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="scp" element={<SCPArchivePage />} />
        <Route path="wanted" element={<WantedPage />} />
        <Route path="linked-orgs" element={<LinkedOrgsPage />} />
        <Route path="comms" element={<CommsPage />} />
        <Route path="requests" element={<RequestsPage />} />
        <Route path="admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="*" element={<AnimatedRoutes />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
