import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 90000,
});

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  error?: string;
}

export async function post<T>(
  endpoint: string,
  body: Record<string, string | undefined>
) {
  const payload = Object.fromEntries(
    Object.entries(body).filter(([, v]) => v !== undefined && v !== "")
  );

  try {
    const res = await api.post<ApiResponse<T>>(endpoint, payload);
    if (!res.data.success) throw new Error(res.data.error || "Request failed");
    return res.data.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 404) {
        throw new Error(
          "API endpoint not found. Check VITE_API_URL or restart the backend."
        );
      }
      if (err.code === "ERR_NETWORK" || !err.response) {
        throw new Error(
          "Cannot reach backend. Set VITE_API_URL to your backend URL (e.g. https://your-api.vercel.app/api)."
        );
      }
    }
    throw err;
  }
}

export default api;
