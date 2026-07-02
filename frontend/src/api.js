import axios from 'axios';

const API = axios.create({ baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api' });

API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Auth
export const login = (d) => API.post('/auth/login', d);
export const register = (d) => API.post('/requests', d);
export const getMe = () => API.get('/auth/me');

// Users (admin)
export const getUsers = () => API.get('/users');
export const getPersonnel = () => API.get('/users/personnel');
export const getUser = (id) => API.get(`/users/${id}`);
export const updateUser = (id, d) => API.put(`/users/${id}`, d);
export const updateUserClearance = (id, d) => API.patch(`/users/${id}/clearance`, d);
export const updateUserStatus = (id, d) => API.patch(`/users/${id}/status`, d);
export const banUser = (id, d) => API.patch(`/users/${id}/ban`, d);
export const deleteUser = (id) => API.delete(`/users/${id}`);

// Requests
export const getRequests = () => API.get('/requests');
export const approveRequest = (id) => API.patch(`/requests/${id}/approve`);
export const rejectRequest = (id, d) => API.patch(`/requests/${id}/reject`, d);

// Documents
export const getDocuments = () => API.get('/documents');
export const getDocument = (id) => API.get(`/documents/${id}`);
export const createDocument = (d) => API.post('/documents', d);
export const updateDocument = (id, d) => API.put(`/documents/${id}`, d);
export const deleteDocument = (id) => API.delete(`/documents/${id}`);

// SCP
export const getSCPs = () => API.get('/scp');
export const getSCP = (id) => API.get(`/scp/${id}`);
export const createSCP = (d) => API.post('/scp', d);
export const updateSCP = (id, d) => API.put(`/scp/${id}`, d);
export const deleteSCP = (id) => API.delete(`/scp/${id}`);

// Messages
export const getConversations = () => API.get('/messages/conversations');
export const createConversation = (d) => API.post('/messages/conversations', d);
export const getMessages = (room) => API.get(`/messages/${room}`);
export const sendMessage = (room, d) => API.post(`/messages/${room}`, d);

// Clearance
export const getClearances = () => API.get('/clearance');
export const createClearance = (d) => API.post('/clearance', d);
export const updateClearance = (id, d) => API.put(`/clearance/${id}`, d);
export const deleteClearance = (id) => API.delete(`/clearance/${id}`);

export default API;
