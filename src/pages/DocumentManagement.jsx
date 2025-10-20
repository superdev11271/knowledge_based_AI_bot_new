import { useState, useEffect } from 'react'
import { Upload, FileText, Trash2, Search, Plus, FolderOpen, Download } from 'lucide-react'
import * as api from '../services/api'

function DocumentManagement() {
  const [documents, setDocuments] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDocuments, setSelectedDocuments] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [uploadingFiles, setUploadingFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [uploadQueue, setUploadQueue] = useState([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showUploadConfirm, setShowUploadConfirm] = useState(false)
  const [pendingFiles, setPendingFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [deleteComplete, setDeleteComplete] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [pendingDeleteMessage, setPendingDeleteMessage] = useState('')

  // Helpers
  const formatBytes = (bytes) => {
    if (typeof bytes !== 'number' || isNaN(bytes)) return '0 B'
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const value = parseFloat((bytes / Math.pow(k, i)).toFixed(2))
    return `${value} ${sizes[i]}`
  }

  // Load documents from backend
  const loadDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getDocuments()
      setDocuments(response.documents || [])
    } catch (err) {
      setError(err.message)
      console.error('Failed to load documents:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load documents on component mount
  useEffect(() => {
    loadDocuments()
  }, [])

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    // Create preview of files to upload
    const filePreview = files.map((file, index) => ({
      id: `preview-${Date.now()}-${index}`,
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.name.split('.').pop().toUpperCase(),
      file: file,
      index: index
    }))
    
    setPendingFiles(filePreview)
    setShowUploadConfirm(true)
    
    // Reset the file input
    event.target.value = ''
  }


  const processFilesSequentially = (files, currentIndex) => {
    if (currentIndex >= files.length) {
      // All files processed
      setIsUploading(false)
      setUploadingFiles([]) // Clear current upload
      setUploadQueue([]) // Clear queue
      setUploadComplete(true)
      setTimeout(() => setUploadComplete(false), 3000)
      return
    }

    const file = files[currentIndex]
    const uploadId = `uploading-${Date.now()}-${currentIndex}`
    
    // Update queue to show current file as uploading
    setUploadQueue(prev => 
      prev.map((item, index) => ({
        ...item,
        status: index === currentIndex ? 'uploading' : index < currentIndex ? 'completed' : 'pending'
      }))
    )
    
    // Add current file to uploading list
    const uploadingFile = {
      id: uploadId,
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.name.split('.').pop().toUpperCase(),
      progress: 0,
      status: 'uploading'
    }
    
    setUploadingFiles([uploadingFile]) // Only show current file

    // Simulate upload progress for current file
    let progress = 0
    const uploadInterval = setInterval(() => {
      progress += Math.random() * 20 + 10 // Faster progress for single file
      if (progress >= 100) {
        progress = 100
        clearInterval(uploadInterval)
        
        // Update progress to 100%
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === uploadId 
              ? { ...f, progress: 100 }
              : f
          )
        )
        
        // Wait a moment to show completion, then move to next file
        setTimeout(() => {
          // Add completed file to documents
          const fileName = file.webkitRelativePath || file.name
          const newDocument = {
            id: Date.now() + currentIndex,
            name: fileName,
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            uploadDate: new Date().toISOString().split('T')[0],
            type: file.name.split('.').pop().toUpperCase(),
            isFolderUpload: !!file.webkitRelativePath
          }
          
          setDocuments(prev => [...prev, newDocument])
          
          // Process next file
          processFilesSequentially(files, currentIndex + 1)
        }, 800) // Wait 800ms before next file
      } else {
        // Update progress
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === uploadId 
              ? { ...f, progress: Math.min(progress, 100) }
              : f
          )
        )
      }
    }, 150 + Math.random() * 200) // Faster updates for single file
  }

  const handleDeleteDocument = async (id) => {
    try {
      await api.deleteDocument(id)
      setDocuments(prev => prev.filter(doc => doc.id !== id))
      setSelectedDocuments(prev => prev.filter(docId => docId !== id))
    } catch (err) {
      setError(err.message)
      console.error('Failed to delete document:', err)
    }
  }

  const handleDeleteSelected = () => {
    setDeleteTarget('selected')
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    // Close dialog immediately for snappy UX
    const target = deleteTarget
    const isBulk = target === 'selected'
    setShowDeleteConfirm(false)
    setDeleteTarget(null)

    // Determine ids to delete
    const idsToDelete = isBulk ? [...selectedDocuments] : (target ? [target] : [])
    const count = idsToDelete.length

    // Optimistic UI update
    const prevDocs = documents
    setDocuments(prev => prev.filter(doc => !idsToDelete.includes(doc.id)))
    if (isBulk) setSelectedDocuments([])
    setIsDeleting(true)
    setPendingDeleteMessage(`Deleting ${count} document${count !== 1 ? 's' : ''}...`)

    try {
      if (isBulk) {
        await api.deleteMultipleDocuments(idsToDelete)
      } else if (target) {
        await api.deleteDocument(target)
      }

      // Success notification
      setIsDeleting(false)
      setDeleteMessage(`${count} document${count !== 1 ? 's' : ''} deleted successfully`)
      setDeleteComplete(true)
      setTimeout(() => setDeleteComplete(false), 3000)
    } catch (err) {
      // Rollback optimistic update on error
      setIsDeleting(false)
      setDocuments(prevDocs)
      if (isBulk) setSelectedDocuments(idsToDelete)
      setError(err.message)
      console.error('Failed to delete documents:', err)
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setDeleteTarget(null)
  }

  const confirmUpload = async () => {
    setShowUploadConfirm(false)
    setIsUploading(true)
    setUploadingFiles([]) // Clear any existing uploads
    setError(null)
    setCurrentFileIndex(0)
    
    try {
      // Upload files one by one
      const files = pendingFiles.map(f => f.file)
      const uploadedDocuments = []
      const errors = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileInfo = pendingFiles[i]
        
        // Update current file index
        setCurrentFileIndex(i + 1)
        
        // Update current uploading file
        setUploadingFiles([{
          id: fileInfo.id,
          name: fileInfo.name,
          size: fileInfo.size,
          progress: 0,
          isFolderUpload: false
        }])
        
        try {
          // Simulate progress for individual file
          const progressInterval = setInterval(() => {
            setUploadingFiles(prev => prev.map(f => 
              f.id === fileInfo.id 
                ? { ...f, progress: Math.min(f.progress + Math.random() * 20, 90) }
                : f
            ))
          }, 100)
          
          // Upload single file
          const response = await api.uploadFile(file)
          
          // Complete progress
          clearInterval(progressInterval)
          setUploadingFiles(prev => prev.map(f => 
            f.id === fileInfo.id 
              ? { ...f, progress: 100 }
              : f
          ))
          
          // Add to uploaded documents
          if (response.document) {
            uploadedDocuments.push(response.document)
            setDocuments(prev => [...prev, response.document])
          }
          
          // Wait a moment to show completion
          await new Promise(resolve => setTimeout(resolve, 500))
          
        } catch (fileError) {
          errors.push(`Failed to upload ${fileInfo.name}: ${fileError.message}`)
          console.error(`Failed to upload ${fileInfo.name}:`, fileError)
        }
      }
      
      // Clear uploading files
      setUploadingFiles([])
      setCurrentFileIndex(0)
      
      // Show results
      if (uploadedDocuments.length > 0) {
        setUploadComplete(true)
        setTimeout(() => setUploadComplete(false), 3000)
      }
      
      if (errors.length > 0) {
        setError(`Upload completed with ${errors.length} errors: ${errors.join(', ')}`)
      }
      
    } catch (err) {
      setError(err.message)
      console.error('Upload failed:', err)
    } finally {
      setIsUploading(false)
      setPendingFiles([])
      setCurrentFileIndex(0)
    }
  }

  const cancelUpload = () => {
    setShowUploadConfirm(false)
    setPendingFiles([])
  }

  const handleSelectDocument = (id) => {
    setSelectedDocuments(prev => 
      prev.includes(id) 
        ? prev.filter(docId => docId !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedDocuments.length === documents.length) {
      setSelectedDocuments([])
    } else {
      setSelectedDocuments(documents.map(doc => doc.id))
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination calculations
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredDocuments.length / itemsPerPage)
  const startIndex = itemsPerPage === -1 ? 0 : (currentPage - 1) * itemsPerPage
  const endIndex = itemsPerPage === -1 ? filteredDocuments.length : startIndex + itemsPerPage
  const currentDocuments = filteredDocuments.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    setSelectedDocuments([]) // Clear selection when changing pages
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page
    setSelectedDocuments([]) // Clear selection
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Document Management</h1>
          <p className="text-lg text-gray-600">Manage your knowledge base documents for RAG pipeline</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Knowledge Base</h2>
                  <p className="text-sm text-primary-100">{documents.length} documents</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-2">
                <label className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                  isUploading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-primary-500 hover:bg-primary-600'
                } text-white`}>
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 inline mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 inline mr-2" />
                      Upload Files
                    </>
                  )}
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.md,.js,.sql,.yaml,.pptx"
                    disabled={isUploading}
                  />
                </label>
                {selectedDocuments.length > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 inline mr-2" />
                    Delete ({selectedDocuments.length})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Upload Success Notification */}
          {uploadComplete && (
            <div className="px-6 py-3 bg-green-50 border-b border-green-200">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-green-800">Files uploaded successfully!</span>
              </div>
            </div>
          )}

          {/* Pending Delete Notification */}
          {isDeleting && (
            <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium text-blue-800">{pendingDeleteMessage || 'Deleting...'}</span>
              </div>
            </div>
          )}

          {/* Delete Success Notification */}
          {deleteComplete && (
            <div className="px-6 py-3 bg-green-50 border-b border-green-200">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-green-800">{deleteMessage || 'Deleted successfully'}</span>
              </div>
            </div>
          )}

          {/* Error Notification */}
          {error && (
            <div className="px-6 py-3 bg-red-50 border-b border-red-200">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 000 2v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-red-800">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && uploadingFiles.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-blue-900">
                  Uploading files one by one...
                </h3>
                <div className="text-xs text-blue-600">
                  {currentFileIndex} of {pendingFiles.length} files
                </div>
              </div>
              
              {/* Current Upload */}
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {uploadingFiles[0].name}
                    </span>
                    <span className="text-xs text-gray-500">({uploadingFiles[0].size})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">{Math.round(uploadingFiles[0].progress)}%</span>
                    {uploadingFiles[0].progress === 100 && (
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadingFiles[0].progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Documents List */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading documents...</h3>
                <p className="text-gray-500">Please wait while we fetch your documents</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-500 mb-2">No documents found</h3>
                <p className="text-gray-400">
                  {searchTerm ? 'Try adjusting your search terms' : 'Upload your first document to get started'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Pagination Info and Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {itemsPerPage === -1 
                        ? `Showing all ${filteredDocuments.length} documents`
                        : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredDocuments.length)} of ${filteredDocuments.length} documents`
                      }
                    </span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value={5}>5 per page</option>
                      <option value={10}>10 per page</option>
                      <option value={20}>20 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={-1}>Show All</option>
                    </select>
                  </div>
                </div>

                {/* Select All */}
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={selectedDocuments.length === currentDocuments.length && currentDocuments.length > 0}
                    onChange={() => {
                      if (selectedDocuments.length === currentDocuments.length) {
                        setSelectedDocuments([])
                      } else {
                        setSelectedDocuments(currentDocuments.map(doc => doc.id))
                      }
                    }}
                    className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Select All on this page ({currentDocuments.length} documents)
                  </span>
                </div>

                {/* Documents */}
                {currentDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className={`flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                      selectedDocuments.includes(doc.id) ? 'bg-primary-50 border-primary-200' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(doc.id)}
                      onChange={() => handleSelectDocument(doc.id)}
                      className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                    />
                    <div className="ml-4 flex-1 flex items-center">
                    <div className="flex-shrink-0">
                      {(() => {
                        const t = (doc.file_type || doc.type || '').toUpperCase()
                        if (t === 'PDF') return <FileText className="w-8 h-8 text-red-500" />
                        if (t === 'DOC' || t === 'DOCX') return <FileText className="w-8 h-8 text-blue-500" />
                        if (t === 'TXT') return <FileText className="w-8 h-8 text-gray-500" />
                        if (t === 'MD' || t === 'MARKDOWN') return <FileText className="w-8 h-8 text-purple-500" />
                        if (t === 'PPT' || t === 'PPTX') return <FileText className="w-8 h-8 text-orange-500" />
                        if (t === 'JS' || t === 'TS' || t === 'TSX' || t === 'JSX') return <FileText className="w-8 h-8 text-yellow-500" />
                        if (t === 'SQL') return <FileText className="w-8 h-8 text-green-500" />
                        if (t === 'YAML' || t === 'YML') return <FileText className="w-8 h-8 text-pink-500" />
                        if (t === 'CSV' || t === 'XLS' || t === 'XLSX') return <FileText className="w-8 h-8 text-emerald-500" />
                        return <FileText className="w-8 h-8 text-gray-400" />
                      })()}
                    </div>
                       <div className="ml-4 flex-1">
                         <h3 className="text-sm font-medium text-gray-900">
                           {doc.isFolderUpload ? (
                             <span className="flex items-center">
                               <span className="text-blue-600 mr-1">📁</span>
                               {doc.name}
                             </span>
                           ) : (
                             doc.name
                           )}
                         </h3>
                         <p className="text-sm text-gray-500">
                           {formatBytes(doc.file_size ?? 0)} • {(doc.file_type || doc.type || '').toUpperCase()} • Uploaded {doc.uploadDate}
                           {doc.isFolderUpload && <span className="text-blue-600 ml-1">• Folder</span>}
                         </p>
                       </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={async () => {
                          try {
                            const blob = await api.downloadDocument(doc.id)
                            const url = window.URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            const suggestedName = doc.name || `document-${doc.id}`
                            a.download = suggestedName
                            document.body.appendChild(a)
                            a.click()
                            a.remove()
                            window.URL.revokeObjectURL(url)
                          } catch (err) {
                            setError(err.message)
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTarget(doc.id)
                          setShowDeleteConfirm(true)
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Pagination Controls */}
                {totalPages > 1 && itemsPerPage !== -1 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      <div className="flex space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-1 text-sm border rounded ${
                                currentPage === pageNum
                                  ? 'bg-primary-500 text-white border-primary-500'
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Confirmation Dialog */}
      {showUploadConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Confirm Upload</h3>
                  <p className="text-sm text-primary-100">
                    {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''} ready to upload
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="mb-4">
                <h4 className="text-lg font-medium text-gray-900 mb-2">Files to Upload</h4>
                <p className="text-sm text-gray-600">
                  The following files will be uploaded to your knowledge base:
                </p>
              </div>

              {/* Files List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pendingFiles.map((file, index) => (
                  <div key={file.id} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-shrink-0 mr-3">
                      {file.type === 'PDF' && <FileText className="w-5 h-5 text-red-500" />}
                      {file.type === 'DOCX' && <FileText className="w-5 h-5 text-blue-500" />}
                      {file.type === 'TXT' && <FileText className="w-5 h-5 text-gray-500" />}
                      {file.type === 'MD' && <FileText className="w-5 h-5 text-purple-500" />}
                      {file.type === 'PPTX' && <FileText className="w-5 h-5 text-orange-500" />}
                      {file.type === 'JS' && <FileText className="w-5 h-5 text-yellow-500" />}
                      {file.type === 'SQL' && <FileText className="w-5 h-5 text-green-500" />}
                      {file.type === 'YAML' && <FileText className="w-5 h-5 text-pink-500" />}
                      {!['PDF', 'DOCX', 'TXT', 'MD', 'PPTX', 'JS', 'SQL', 'YAML'].includes(file.type) && <FileText className="w-5 h-5 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {file.size} • {file.type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary-900">
                      Total: {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-primary-700">
                      Files will be processed sequentially with progress tracking
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={cancelUpload}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpload}
                className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors font-medium"
              >
                Upload Files
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
                 <p className="text-sm text-gray-500">
                   {deleteTarget === 'selected'
                     ? `Are you sure you want to delete ${selectedDocuments.length} selected documents? This action cannot be undone.`
                     : 'Are you sure you want to delete this document? This action cannot be undone.'
                   }
                 </p>
              </div>
            </div>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentManagement
