// src/api/axios.ts
import axios from "axios";

// Создание экземпляра axios с настройками по умолчанию
const api = axios.create({
  // baseURL: 'http://127.0.0.1:8000',
  baseURL: "http://localhost:8000",
  timeout: 10000, // 10 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ERR_NETWORK") {
      console.error("Network error - please check if the backend is running");
    } else if (error.response) {
      console.error("Response error:", error.response.data);
    } else if (error.request) {
      console.error("Request error:", error.request);
    } else {
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
