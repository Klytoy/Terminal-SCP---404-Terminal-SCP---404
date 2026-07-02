import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Personnel from './pages/Personnel';
import PersonnelDetail from './pages/PersonnelDetail';
import Factions from './pages/Factions';
import Terminal from './pages/Terminal';
import Clearance from './pages/Clearance';
import Wanted from './pages/Wanted';
import BlackMarket from './pages/BlackMarket';
import Logs from './pages/Logs';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest text-primary font-code-sm">
        &gt; ПРОВЕРКА ДОСТУПА...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Protected><Dashboard /></Protected>} />
          <Route path="/personnel" element={<Protected><Personnel /></Protected>} />
          <Route path="/personnel/:id" element={<Protected><PersonnelDetail /></Protected>} />
          <Route path="/factions" element={<Protected><Factions /></Protected>} />
          <Route path="/terminal" element={<Protected><Terminal /></Protected>} />
          <Route path="/clearance" element={<Protected><Clearance /></Protected>} />
          <Route path="/wanted" element={<Protected><Wanted /></Protected>} />
          <Route path="/blackmarket" element={<Protected><BlackMarket /></Protected>} />
          <Route path="/logs" element={<Protected><Logs /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
