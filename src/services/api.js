import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds timeout
})

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`)
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.error || `Request failed with status ${error.response.status}`
      throw new Error(errorMessage)
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error - no response from server')
    } else {
      // Something else happened
      throw new Error(error.message || 'Request failed')
    }
  }
)

// Upload single file
export const uploadFile = async (file, onUploadProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await apiClient.post('/api/document/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: onUploadProgress
  })
  
  return response.data
}

// Get all documents
export const getDocuments = async () => {
  const response = await apiClient.get('/api/document/list')
  return response.data
}

// Delete single document
export const deleteDocument = async (documentId) => {
  const response = await apiClient.delete(`/api/document/delete/${documentId}`)
  return response.data
}

// Delete multiple documents
export const deleteMultipleDocuments = async (documentIds) => {
  const response = await apiClient.delete('/api/document/delete-multiple', {
    data: { document_ids: documentIds }
  })
  return response.data
}

// Download single document
export const downloadDocument = async (documentId) => {
  const response = await apiClient.get(`/api/document/download/${documentId}`, {
    responseType: 'blob'
  })
  return response.data
}

// Chat with RAG
export const sendChatMessage = async (message, chatHistory = []) => {
  const response = await apiClient.post('/api/chat/chat', {
    message,
    chat_history: chatHistory
  })
  return response.data
}
