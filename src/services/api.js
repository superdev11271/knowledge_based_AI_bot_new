const API_BASE_URL = 'http://localhost:5000/api/document'

// Upload single file
export const uploadFile = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Upload failed')
  }
  
  return await response.json()
}


// Get all documents
export const getDocuments = async () => {
  const response = await fetch(`${API_BASE_URL}/list`, {
    method: 'GET'
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch documents')
  }
  
  return await response.json()
}

// Delete single document
export const deleteDocument = async (documentId) => {
  const response = await fetch(`${API_BASE_URL}/delete/${documentId}`, {
    method: 'DELETE'
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete document')
  }
  
  return await response.json()
}

// Delete multiple documents
export const deleteMultipleDocuments = async (documentIds) => {
  const response = await fetch(`${API_BASE_URL}/delete-multiple`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ document_ids: documentIds })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete documents')
  }
  
  return await response.json()
}

// Download single document
export const downloadDocument = async (documentId) => {
  const response = await fetch(`${API_BASE_URL}/download/${documentId}`, {
    method: 'GET'
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Failed to download document')
  }
  const blob = await response.blob()
  return blob
}
