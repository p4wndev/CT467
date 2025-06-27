"use client"

import { useAuth } from "@/contexts/auth-context"

// Base API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  const data = await response.json()

  if (!response.ok) {
    const error = data.error || data.message || "Something went wrong"
    throw new Error(error)
  }

  return data
}

// Create a custom hook for API calls
export function useApiClient() {
  const { token, logout } = useAuth()

  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE_URL}${endpoint}`

    // Add authorization header if token exists
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        logout()
        throw new Error("Your session has expired. Please log in again.")
      }

      return handleResponse(response)
    } catch (error) {
      console.error("API request failed:", error)
      throw error
    }
  }

  return {
    get: (endpoint: string) => fetchWithAuth(endpoint, { method: "GET" }),
    post: (endpoint: string, data: any) =>
      fetchWithAuth(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    put: (endpoint: string, data: any) =>
      fetchWithAuth(endpoint, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (endpoint: string) => fetchWithAuth(endpoint, { method: "DELETE" }),
  }
}
