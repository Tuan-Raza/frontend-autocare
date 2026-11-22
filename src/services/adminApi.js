import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config";

const TOKEN_KEY = "autocare_admin_token";
const ADMIN_USER_KEY = "autocare_admin_user";

/**
 * Helper to get authorization headers
 */
async function getAuthHeaders() {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

/**
 * Handle API responses safely
 */
async function handleResponse(response) {
    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error(text || "Respons server tidak valid");
    }

    if (!response.ok) {
        throw new Error(data.message || `Request gagal dengan status ${response.status}`);
    }

    return data;
}

export const adminApi = {
    // ----------------------------------------------------
    // AUTHENTICATION
    // ----------------------------------------------------
    async login(email, password) {
        const response = await fetch(`${API_URL}/api/admin/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({ email, password }),
        });
        const res = await handleResponse(response);
        if (res.token) {
            await AsyncStorage.setItem(TOKEN_KEY, res.token);
            await AsyncStorage.setItem(ADMIN_USER_KEY, JSON.stringify(res.admin));
        }
        return res;
    },

    async getMe() {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/admin/me`, {
            method: "GET",
            headers,
        });
        return handleResponse(response);
    },

    async getStoredAdmin() {
        const raw = await AsyncStorage.getItem(ADMIN_USER_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    },

    async logout() {
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(ADMIN_USER_KEY);
    },

    // ----------------------------------------------------
    // DASHBOARD
    // ----------------------------------------------------
    async getDashboard() {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/admin/dashboard`, {
            method: "GET",
            headers,
        });
        return handleResponse(response);
    },

    // ----------------------------------------------------
    // USERS (PELANGGAN)
    // ----------------------------------------------------
    async getUsers(params = {}) {
        const headers = await getAuthHeaders();
        const query = new URLSearchParams(params).toString();
        const url = `${API_URL}/api/admin/users${query ? `?${query}` : ""}`;
        const response = await fetch(url, { method: "GET", headers });
        return handleResponse(response);
    },

    async getUserDetail(id) {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/admin/users/${id}`, {
            method: "GET",
            headers,
        });
        return handleResponse(response);
    },

    async updateUser(id, data) {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/admin/users/${id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    async deleteUser(id) {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/admin/users/${id}`, {
            method: "DELETE",
            headers,
        });
        return handleResponse(response);
    },

    // ----------------------------------------------------
    // VEHICLES (KENDARAAN)
    // ----------------------------------------------------
    async getVehicles(params = {}) {
        const headers = await getAuthHeaders();
        const query = new URLSearchParams(params).toString();
        const url = `${API_URL}/api/admin/vehicles${query ? `?${query}` : ""}`;
        const response = await fetch(url, { method: "GET", headers });
        return handleResponse(response);
    },

    // ----------------------------------------------------
    // BOOKINGS
    // ----------------------------------------------------
    async getBookings(params = {}) {
        const headers = await getAuthHeaders();
        const query = new URLSearchParams(params).toString();
        const url = `${API_URL}/api/admin/bookings${query ? `?${query}` : ""}`;
        const response = await fetch(url, { method: "GET", headers });
        return handleResponse(response);
    },

    async updateBookingStatus(id, status, catatan_admin = "") {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/admin/bookings/${id}/status`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ status, catatan_admin }),
        });
        return handleResponse(response);
    },

    // ----------------------------------------------------
    // SERVICE HISTORY
    // ----------------------------------------------------
    async getServiceHistory(params = {}) {
        const headers = await getAuthHeaders();
        const query = new URLSearchParams(params).toString();
        const url = `${API_URL}/api/admin/service-history${query ? `?${query}` : ""}`;
        const response = await fetch(url, { method: "GET", headers });
        return handleResponse(response);
    },

    // ----------------------------------------------------
    // PAYMENTS
    // ----------------------------------------------------
    async getPayments(params = {}) {
        const headers = await getAuthHeaders();
        const query = new URLSearchParams(params).toString();
        const url = `${API_URL}/api/admin/payments${query ? `?${query}` : ""}`;
        const response = await fetch(url, { method: "GET", headers });
        return handleResponse(response);
    },

    async verifyPayment(id, status_verifikasi, catatan = "") {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/admin/payments/${id}/verify`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ status_verifikasi, catatan }),
        });
        return handleResponse(response);
    },

    // ----------------------------------------------------
    // SERVICES (LAYANAN)
    // ----------------------------------------------------
    async getServices() {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/admin/services`, {
            method: "GET",
            headers,
        });
        return handleResponse(response);
    },

    async createService(data) {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/admin/services`, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    async updateService(id, data) {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/admin/services/${id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    async deleteService(id) {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/admin/services/${id}`, {
            method: "DELETE",
            headers,
        });
        return handleResponse(response);
    },

    // ----------------------------------------------------
    // REPORTS & ANALYTICS
    // ----------------------------------------------------
    async getReports(year) {
        const headers = await getAuthHeaders();
        const url = `${API_URL}/api/admin/reports${year ? `?year=${year}` : ""}`;
        const response = await fetch(url, { method: "GET", headers });
        return handleResponse(response);
    },

    // ----------------------------------------------------
    // SETTINGS
    // ----------------------------------------------------
    async getSettings() {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/admin/settings`, {
            method: "GET",
            headers,
        });
        return handleResponse(response);
    },

    async updateSettings(data) {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/api/admin/settings`, {
            method: "PUT",
            headers,
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },
};
