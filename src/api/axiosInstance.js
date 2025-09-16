// src/services/api.js
import axios from "axios";
import store from "../store/store";
import { logout } from "../Features/auth/authSlice";
import BaseURL from "../BaseURL";

// ✅ Central axios instance
const api = axios.create({
  baseURL: BaseURL, // use your single BaseURL
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  // timeout: 10000,
});

// ✅ Request interceptor → attach latest token
api.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth?.user?.authToken;

  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// ✅ Response interceptor → logout on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) return Promise.reject(error);

    if (error.response.status === 401) {
      store.dispatch(logout());
    }

    return Promise.reject(error);
  }
);

export default api;
