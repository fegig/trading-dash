import axios, { type AxiosInstance, type AxiosResponse, AxiosError, type InternalAxiosRequestConfig } from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || ''
const API_KEY = import.meta.env.VITE_API_KEY

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL || undefined,
  withCredentials: true,
})

client.interceptors.request.use(
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

export const get = async <T = unknown>(
  endpoint: string,
  params?: Record<string, string | number | undefined>
): Promise<T | undefined> => {
  try {
    const response = await client.get(endpoint, { params })
    return response?.data
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      console.error('Error fetching data:', error.response?.data)
      throw Object.assign(new Error('Failed to fetch data'), { cause: error })
    }
  }
}

export const post = async (
  endpoint: string,
  payload: Record<string, unknown>,
  contentType = 'application/json'
) => {
  try {
    const response: AxiosResponse = await client.post(endpoint, payload, {
      headers: {
        'Content-Type': contentType,
      },
    })
    return response
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      console.error('Error saving data:', error.response?.data)
      return error.response
    }
  }
}

export const update = async (
  endpoint: string,
  payload: Record<string, unknown>,
  contentType = 'application/json'
) => {
  const response = await client.put(endpoint, payload, {
    headers: {
      'Content-Type': contentType,
    },
  })
  if (response.status === 200) {
    return response.data
  }
  return response
}

export const patch = async (
  endpoint: string,
  payload: Record<string, unknown>,
  contentType = 'application/json'
) => {
  try {
    const response = await client.patch(endpoint, payload, {
      headers: {
        'Content-Type': contentType,
      },
    })
    return response
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      console.error('Error patching data:', error.response?.data)
      return error.response
    }
  }
}

export const remove = (endpoint: string) => {
  return client.delete(endpoint)
}

/** Multipart upload — axios sets `Content-Type` boundary automatically. */
export const postForm = async (endpoint: string, formData: FormData) => {
  try {
    return await client.post(endpoint, formData)
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      console.error('Error posting form:', error.response?.data)
      return error.response
    }
  }
}
