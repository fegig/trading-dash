import axios, { AxiosError, AxiosResponse } from "axios"

const BASE_URL = import.meta.env.VITE_API_URL
const API_KEY = import.meta.env.VITE_API_KEY



export const get = async (endpoint: string) => {
    try {
        const response = await axios.get(`${BASE_URL}${endpoint}`, {
            headers: {
                'x-api-key': API_KEY,
        },
    })
    return response?.data
    } catch (error: unknown) {
        if (error instanceof AxiosError) {
            console.error('Error fetching data:', error.response?.data);
            throw new Error('Failed to fetch data');
        }
       
    }
}

export const post = async (endpoint: string, payload: Record<string, unknown>, contentType = 'application/json') => {
    try {
        const response:AxiosResponse = await axios.post(`${BASE_URL}${endpoint}`, payload, {
            headers: {
                'x-api-key': API_KEY,
                'Content-Type': contentType,
            },
        })
       
            return response
        
    } catch (error: unknown) {
        if (error instanceof AxiosError) {
            console.error('Error saving data:', error.response?.data);
            return error.response
        }
       
    }
}

export const update = async (endpoint: string, payload: Record<string, unknown>, contentType = 'application/json') => {
    const response = await axios.put(`${BASE_URL}${endpoint}`, payload, {
        headers: {
            'x-api-key': API_KEY,
            'Content-Type': contentType,
        },
    })
    if (response.status === 200) {
        return response.data
    }
    return response
}

export const remove = (endpoint: string) => {
    return axios.delete(`${BASE_URL}${endpoint}`, {
        headers: {
            'x-api-key': API_KEY,
        },
    })
}
