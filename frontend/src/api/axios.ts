// src/api/axios.ts
import axios from "axios";

// Создание экземпляра axios с настройками по умолчанию
const api = axios.create({
  // baseURL: 'http://127.0.0.1:8000',
  baseURL: "http://localhost:8000",

  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
