import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("notezy_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      // token invalid - clear
      // localStorage.removeItem("notezy_token");
    }
    return Promise.reject(err);
  }
);

export const auth = {
  getToken: () => localStorage.getItem("notezy_token"),
  getUser: () => {
    try { return JSON.parse(localStorage.getItem("notezy_user") || "null"); }
    catch { return null; }
  },
  set: (token, user) => {
    localStorage.setItem("notezy_token", token);
    localStorage.setItem("notezy_user", JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem("notezy_token");
    localStorage.removeItem("notezy_user");
  },
};
