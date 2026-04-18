import { DemoApiError, demoRequest } from "./demoApi.js";
import { readDemoMode } from "./demoMode.js";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest(endpoint, options = {}) {
  if (readDemoMode()) {
    try {
      return await demoRequest(endpoint, options);
    } catch (error) {
      if (error instanceof DemoApiError) {
        throw new ApiError(error.message, error.status);
      }

      throw error;
    }
  }

  const token = localStorage.getItem("token");
  const headers = {
    ...(options.headers || {})
  };

  if (options.body && !(options.body instanceof FormData) && !hasContentType(headers)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await readJson(response);

  if (!response.ok) {
    const message = data?.mensagem || data?.erro || "Nao foi possivel concluir a operacao.";
    throw new ApiError(message, response.status);
  }

  return data;
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function hasContentType(headers) {
  return Object.keys(headers).some((key) => key.toLowerCase() === "content-type");
}
