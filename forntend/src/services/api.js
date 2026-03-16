import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api', // Make sure this matches backend port
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const donationAPI = {
    getAvailable: (params) => api.get('/donations/available', { params }),
    getMy: () => api.get('/donations/my/history'),
    create: (data) => api.post('/donations', data),
};

export const pickupAPI = {
    getMy: () => api.get('/pickups/my'),
    accept: (id, data) => api.post(`/pickups/${id}/accept`, data),
    updateStatus: (id, data) => api.put(`/pickups/${id}/status`, data),
    cancel: (id, reason) => api.post(`/pickups/${id}/cancel`, { reason }),
};

export const adminAPI = {
    getStats: () => api.get('/admin/stats'),
    getAllUsers: (params) => api.get('/admin/users', { params }),
    toggleUser: (id) => api.put(`/admin/users/${id}/toggle`),
    updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
    getAllDonations: (params) => api.get('/donations', { params }),
    getReports: () => api.get('/admin/reports')
};

export const campaignAPI = {
    getAll: () => api.get('/campaigns'),
    create: (data) => api.post('/campaigns', data)
};

export const authAPI = {
    upgradeRole: () => api.put('/auth/volunteer-upgrade'),
    updateProfile: (data) => api.put('/auth/profile', data),
    forgotPasswordSendOtp: (data) => api.post('/auth/forgot-password/send-otp', data),
    verifyOtp: (data) => api.post('/auth/forgot-password/verify-otp', data),
    resetPasswordWithOtp: (data) => api.post('/auth/forgot-password/reset', data),
    verifyEmailOTP: (data) => api.post('/auth/verify-email-otp', data),
    resendEmailOTP: (data) => api.post('/auth/resend-email-otp', data),
};

export default api;
