# Backend Integration Guide

This document explains how to integrate the file upload functionality with the backend API.

## 🚀 Quick Start

### 1. Start the Backend Server
```bash
# Option 1: Use the batch file (Windows)
start-backend.bat

# Option 2: Manual start
cd backend
python main.py
```

The backend will run on `http://localhost:5000`

### 2. Start the Frontend
```bash
# Option 1: Use the batch file (Windows)
start-frontend.bat

# Option 2: Manual start
npm run dev
```

The frontend will run on `http://localhost:5173`

## 📁 Backend API Endpoints

### File Upload
- **POST** `/api/document/upload` - Upload single file
- **POST** `/api/document/upload-multiple` - Upload multiple files
- **GET** `/api/document/list` - Get all documents
- **DELETE** `/api/document/delete/{id}` - Delete single document
- **DELETE** `/api/document/delete-multiple` - Delete multiple documents

### Request/Response Examples

#### Upload Single File
```javascript
const formData = new FormData()
formData.append('file', file)

const response = await fetch('http://localhost:5000/api/document/upload', {
  method: 'POST',
  body: formData
})
```

#### Upload Multiple Files
```javascript
const formData = new FormData()
files.forEach(file => formData.append('files', file))

const response = await fetch('http://localhost:5000/api/document/upload-multiple', {
  method: 'POST',
  body: formData
})
```

#### Get Documents
```javascript
const response = await fetch('http://localhost:5000/api/document/list')
const data = await response.json()
// Returns: { documents: [...], total: number }
```

#### Delete Document
```javascript
const response = await fetch(`http://localhost:5000/api/document/delete/${documentId}`, {
  method: 'DELETE'
})
```

## 🔧 Configuration

### Backend Settings
- **Upload Folder**: `backend/uploads/`
- **Max File Size**: 50MB
- **Allowed Extensions**: txt, pdf, doc, docx, md, js, sql, yaml, yml, pptx, ppt, xlsx, xls, csv

### Frontend Settings
- **API Base URL**: `http://localhost:5000/api/document`
- **CORS**: Enabled for localhost:5173

## 📋 Features

### ✅ Implemented
- [x] File upload with progress tracking
- [x] Multiple file upload
- [x] File type validation
- [x] File size validation
- [x] Document listing
- [x] Document deletion (single and bulk)
- [x] Error handling
- [x] Loading states
- [x] Success notifications

### 🎯 File Upload Flow
1. User selects files
2. Confirmation dialog shows file preview
3. User confirms upload
4. Files are sent to backend
5. Backend validates and saves files
6. Frontend updates document list
7. Success notification appears

### 🗑️ Delete Flow
1. User selects documents to delete
2. Confirmation dialog appears
3. User confirms deletion
4. Backend deletes files from server
5. Frontend updates document list

## 🛠️ Development

### Backend Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── routes/
│   │   ├── __init__.py
│   │   └── document.py
│   └── static/
├── uploads/          # File storage directory
├── main.py
├── requirements.txt
└── config.py
```

### Frontend Structure
```
src/
├── services/
│   └── api.js        # API service functions
├── pages/
│   └── DocumentManagement.jsx
└── components/
    └── Navigation.jsx
```

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure Flask-CORS is installed: `pip install flask-cors`
   - Check CORS configuration in `app/__init__.py`

2. **File Upload Fails**
   - Check file size (max 50MB)
   - Verify file extension is allowed
   - Ensure uploads directory exists

3. **Backend Not Starting**
   - Install dependencies: `pip install -r requirements.txt`
   - Check Python version (3.7+)
   - Verify port 5000 is available

4. **Frontend API Errors**
   - Verify backend is running on port 5000
   - Check browser console for errors
   - Ensure API base URL is correct

### Debug Mode
- Backend runs in debug mode by default
- Check console for error messages
- Use browser dev tools for frontend debugging

## 📊 API Response Format

### Success Response
```json
{
  "message": "Files uploaded successfully",
  "documents": [
    {
      "id": "uuid",
      "name": "filename.pdf",
      "file_size": "2.4 MB",
      "file_type": "PDF",
      "upload_date": "2024-01-15T10:30:00",
      "status": "uploaded"
    }
  ]
}
```

### Error Response
```json
{
  "error": "File type not allowed"
}
```

## 🚀 Production Deployment

### Backend
- Use production WSGI server (Gunicorn)
- Configure proper file storage
- Set up database for document metadata
- Implement authentication

### Frontend
- Build for production: `npm run build`
- Serve static files from backend
- Configure environment variables
- Set up proper error handling

## 📝 Next Steps

1. **Database Integration**: Store document metadata in database
2. **Authentication**: Add user authentication
3. **File Processing**: Add document parsing and indexing
4. **Search**: Implement full-text search
5. **RAG Pipeline**: Connect to vector database for AI features
