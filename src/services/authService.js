// src/services/authService.js
import axios from "axios";
import store from "../store/store";
import { logout } from "../Features/auth/authSlice";
import BaseURL from "../BaseURL";

// ✅ Central axios instance for authenticated requests
const API = axios.create({
  baseURL: BaseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// ✅ Attach token for all requests except login
API.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth?.user?.authToken;

  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// ✅ Logout on 401
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) return Promise.reject(error);
    if (error.response.status === 401) {
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

// ✅ Login API (plain axios, no interceptors)
export const loginUser = async (email, password) => {
  try {
    const res = await axios.post(
      `${BaseURL}/candocspro/user/login`,
      { email, password },
      { headers: { "Content-Type": "application/json" } }
    );
    return res.data; 
  } catch (error) {
    if (error.response?.data) {
      throw new Error(error.response.data.message || "Login failed");
    }
    throw new Error(error.message || "Network error");
  }
};

// ✅ New LDAP Login API
export const ldapLoginUser = async (ldapId, email, password) => {
    try {
        const res = await axios.post(
            `${BaseURL}/candocspro/user/login?ldapId=${ldapId}`,
            { email, password },
            { headers: { "Content-Type": "application/json" } }
        );
        return res.data;
    } catch (error) {
        if (error.response?.data) {
            throw new Error(error.response.data.message || "LDAP login failed");
        }
        throw new Error(error.message || "Network error");
    }
};

// ✅ Logout (frontend only)
export const logoutUser = () => {
  store.dispatch(logout());
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userData");
  return true;
};

export default API; // still export API for protected routes