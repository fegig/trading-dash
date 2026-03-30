import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

const baseURL =
  import.meta.env.VITE_AUTH_API_BASE_URL || import.meta.env.VITE_API_URL || ''

/** Session/credential API (Bearer + cookies). Dashboard `util/request` stays on x-api-key. */
const authClient: AxiosInstance = axios.create({
  baseURL: baseURL || undefined,
  withCredentials: true,
})

authClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers = config.headers ?? {}
        config.headers.Authorization = `Bearer ${token}`
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
