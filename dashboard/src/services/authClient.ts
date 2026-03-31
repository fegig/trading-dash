import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

const baseURL =
  import.meta.env.VITE_AUTH_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  ''

/** Auth API: always sends `Authorization: Bearer` from `localStorage.token` when set; `withCredentials` sends cookies too (session cookie after login / ensureWebSession). */
const API_KEY = import.meta.env.VITE_API_KEY

const authClient: AxiosInstance = axios.create({
  baseURL: baseURL || undefined,
  withCredentials: true,
})

authClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      config.headers = config.headers ?? {}
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      if (API_KEY) {
        config.headers['x-api-key'] = API_KEY
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

const jsonHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
} as const

export async function authPost<T = unknown>(path: string, data?: unknown) {
  return authClient.post<T>(path, data, { headers: { ...jsonHeaders } })
}

export async function authGet<T = unknown>(path: string) {
  return authClient.get<T>(path, { headers: { ...jsonHeaders } })
}

export { authClient }
