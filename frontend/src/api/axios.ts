export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});


export const socket = io(import.meta.env.VITE_SOCKET_URL, {
  withCredentials: true,
});