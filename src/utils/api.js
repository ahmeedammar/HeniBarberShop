import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth endpoints
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
};

// Appointment endpoints
export const appointmentAPI = {
    getClientAppointments: () => api.get('/client/appointments'),
    getAdminAppointments: (params) => api.get('/admin/appointments', { params }),
    createAppointment: (data) => api.post('/appointments', data),
    updateStatus: (id, data) => api.patch(`/appointments/${id}/status`, data),
    getAvailableSlots: (params) => api.get('/available-slots', { params }),
};

// Service endpoints
export const serviceAPI = {
    getServices: () => api.get('/services'),
    createService: (data) => api.post('/services', data),
    updateService: (id, data) => api.patch(`/services/${id}`, data),
};

// Barber endpoints
export const barberAPI = {
    getBarbers: () => api.get('/barbers'),
    createBarber: (data) => api.post('/barbers', data),
    updateBarber: (id, data) => api.patch(`/barbers/${id}`, data),
};

// Working hours endpoints
export const workingHoursAPI = {
    getWorkingHours: () => api.get('/working-hours'),
    updateWorkingHours: (id, data) => api.patch(`/working-hours/${id}`, data),
};

// Notification endpoints
export const notificationAPI = {
    getNotifications: () => api.get('/notifications'),
    markAsRead: (id) => api.patch(`/notifications/${id}/read`),
    markAllAsRead: () => api.patch('/notifications/read-all'),
    getUnreadCount: () => api.get('/notifications/unread-count'),
};

export default api;
