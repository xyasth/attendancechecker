const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Auth & User
  login: (email) => ipcRenderer.invoke('auth-login', email),
  
  // Registration
  registerUser: (data) => ipcRenderer.invoke('register-user', data),
  
  // Attendance
  checkIn: (embeddings) => ipcRenderer.invoke('check-in', embeddings),
  
  // Admin
  getAdminData: () => ipcRenderer.invoke('get-admin-data'),
  
  // Dashboard
  getDashboardData: (userId) => ipcRenderer.invoke('get-dashboard-data', userId),
});