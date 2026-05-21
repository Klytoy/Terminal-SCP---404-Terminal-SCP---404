import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// Users
export const getUsers = (params) => api.get('/users', { params });
export const getUser = (id) => api.get(`/users/${id}`);
export const updateCallsign = (callsign) => api.patch('/users/me/callsign', { callsign });
export const muteConversation = (conversationId, muted) => api.patch('/users/me/mute', { conversationId, muted });

// Documents
export const getDocs = (params) => api.get('/documents', { params });
export const getDoc = (id) => api.get(`/documents/${id}`);
export const createDoc = (data) => api.post('/documents', data);
export const updateDoc = (id, data) => api.patch(`/documents/${id}`, data);
export const deleteDoc = (id) => api.delete(`/documents/${id}`);

// Messages
export const getConversations = () => api.get('/messages/conversations');
export const startDM = (targetUserId) => api.post('/messages/conversations/dm', { targetUserId });
export const createGroup = (name, participantIds) => api.post('/messages/conversations/group', { name, participantIds });
export const addToGroup = (convId, userIds) => api.post(`/messages/conversations/${convId}/participants`, { userIds });
export const getMessages = (convId) => api.get(`/messages/conversations/${convId}/messages`);
export const sendMessage = (convId, content, replyTo) => api.post(`/messages/conversations/${convId}/messages`, { content, replyTo });
export const editMessage = (msgId, content) => api.patch(`/messages/${msgId}`, { content });
export const deleteMessage = (msgId) => api.delete(`/messages/${msgId}`);
export const blockConversation = (convId, blocked) => api.post(`/messages/conversations/${convId}/block`, { blocked });
export const deleteConversation = (convId) => api.delete(`/messages/conversations/${convId}`);

// Requests
export const getMyRequests = () => api.get('/requests/my');
export const requestClearance = (data) => api.post('/requests/clearance', data);
export const requestDocAccess = (documentId, reason) => api.post('/requests/document', { documentId, reason });

// Admin
export const getAdminRequests = (params) => api.get('/admin/requests', { params });
export const approveRequest = (id, data) => api.post(`/admin/requests/${id}/approve`, data);
export const rejectRequest = (id, data) => api.post(`/admin/requests/${id}/reject`, data);
export const getAdminUsers = (params) => api.get('/admin/users', { params });
export const updateUser = (id, data) => api.patch(`/admin/users/${id}`, data);
export const blockAllComms = (blocked) => api.post('/admin/comms/block-all', { blocked });
export const getCommsStatus = () => api.get('/admin/comms/status');
export const issueServiceId = (data) => api.post('/admin/issue-service-id', data);

// Twins
export const requestTwin = (data) => api.post('/twins/request', data);
export const getMyTwins = () => api.get('/twins/my');

export default api;

// SCP Objects
export const getSCPs = (params) => api.get('/scp', { params });
export const getSCP = (id) => api.get(`/scp/${id}`);
export const createSCP = (data) => api.post('/scp', data);
export const updateSCP = (id, data) => api.patch(`/scp/${id}`, data);
export const deleteSCP = (id) => api.delete(`/scp/${id}`);

// Factions
export const getFactions = (params) => api.get('/factions', { params });
export const createFaction = (data) => api.post('/factions', data);
export const updateFaction = (id, data) => api.patch(`/factions/${id}`, data);
export const deleteFaction = (id) => api.delete(`/factions/${id}`);

// Wanted
export const getWanted = (params) => api.get('/wanted', { params });
export const createWanted = (data) => api.post('/wanted', data);
export const updateWanted = (id, data) => api.patch(`/wanted/${id}`, data);
export const deleteWanted = (id) => api.delete(`/wanted/${id}`);

// Linked Orgs
export const getLinkedOrgs = () => api.get('/linked-orgs');
export const createLinkedOrg = (data) => api.post('/linked-orgs', data);
export const updateLinkedOrg = (id, data) => api.patch(`/linked-orgs/${id}`, data);
export const deleteLinkedOrg = (id) => api.delete(`/linked-orgs/${id}`);

// Logs
export const getLogs = (params) => api.get('/logs', { params });

// Personnel records (база УД)
export const getPersonnel = (params) => api.get('/personnel', { params });
export const getPersonnelById = (id) => api.get(`/personnel/${id}`);
export const createPersonnel = (data) => api.post('/personnel', data);
export const updatePersonnel = (id, data) => api.patch(`/personnel/${id}`, data);
export const deletePersonnel = (id) => api.delete(`/personnel/${id}`);

// Full user edit by admin
export const updateUserPersonnel = (id, data) => api.patch(`/users/${id}/personnel`, data);
