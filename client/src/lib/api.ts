import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Also send the token via Authorization header as a fallback for environments
// where third-party cookies are restricted (kept in sync with the cookie).
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("caps_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getApiErrorMessage(error: unknown, fallback = "Ocurrió un error inesperado"): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message;
    if (typeof message === "string") return message;
    if (error.code === "ERR_NETWORK") return "No se pudo conectar con el servidor.";
  }
  return fallback;
}
