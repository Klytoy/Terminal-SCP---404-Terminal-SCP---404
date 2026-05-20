import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe, login as apiLogin } from '../utils/api';
import { io } from 'socket.io-client';

const AuthContext = createContext(null);

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commsBlocked, setCommsBlocked] = useState(false);
  const [notifications, setNotifications] = useState({}); // { convId: count }

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getMe()
        .then(res => { setUser(res.data); initSocket(token); })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const initSocket = (token) => {
    const s = io(SOCKET_URL, { auth: { token } });
    
    s.on('comms_status', ({ blocked }) => setCommsBlocked(blocked));
    s.on('new_message', ({ conversationId, message }) => {
      setNotifications(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || 0) + 1
      }));
    });
    
    setSocket(s);
    return s;
  };

  const login = async (username, password) => {
    const res = await apiLogin({ username, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    initSocket(res.data.token);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    socket?.disconnect();
    setSocket(null);
    setUser(null);
  };

  const clearNotification = (convId) => {
    setNotifications(prev => { const n = { ...prev }; delete n[convId]; return n; });
  };

  const totalNotifications = Object.values(notifications).reduce((a, b) => a + b, 0);

  return (
    <AuthContext.Provider value={{
      user, socket, loading, commsBlocked,
      notifications, totalNotifications, clearNotification,
      login, logout, setUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
