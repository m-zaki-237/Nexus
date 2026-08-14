import axios from "axios";
import { io } from "socket.io-client";

// Get API Base URL with fallback support for deployment
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== "") {
    const cleanUrl = envUrl.trim().replace(/\/$/, "");
    return cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
  }
  // Default for local development
  return "http://localhost:8000/api";
};

const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/api\/?$/, "").replace(/\/$/, "");
  }
  return "http://localhost:8000";
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

export const socket = io(getSocketUrl(), {
  withCredentials: true,
});

export default api;