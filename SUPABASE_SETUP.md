# Supabase Integration Setup Guide

This guide will help you set up Supabase integration for storing file metadata in your RAG application.

## 🚀 Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `rag-documents` (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your location
6. Click "Create new project"
7. Wait for the project to be created (2-3 minutes)

### 2. Get Supabase Credentials

1. Go to your project dashboard
2. Click on "Settings" in the left sidebar
3. Click on "API" in the settings menu
4. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 3. Configure Backend

1. Open `backend/config_supabase.py`
2. Replace the placeholder values:

```python
# Replace these with your actual Supabase project details
SUPABASE_URL = "https://your-project-id.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 4. Set Up Database Schema

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy and paste the contents of `backend/supabase_schema.sql`
5. Click "Run" to execute the SQL

### 5. Test the Integration

1. Start your backend server:
   ```bash
   cd backend
   python main.py
   ```

2. Start your frontend:
   ```bash
   npm run dev
   ```

3. Try uploading a file to test the integration

## 📊 Database Schema

The `documents` table includes:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `name` | VARCHAR(255) | File name |
| `original_name` | VARCHAR(255) | Original file name |
| `file_path` | TEXT | Server file path |
| `file_size` | VARCHAR(50) | Human-readable file size |
| `file_size_bytes` | BIGINT | File size in bytes |
| `file_type` | VARCHAR(20) | File extension (PDF, DOCX, etc.) |
| `mime_type` | VARCHAR(100) | MIME type |
| `upload_date` | TIMESTAMP | When file was uploaded |
| `status` | VARCHAR(20) | File status (uploaded, processing, etc.) |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

## 🔧 Features

### ✅ Implemented
- [x] File upload with Supabase metadata storage
- [x] Document listing from Supabase
- [x] Document deletion (both file and database record)
- [x] Bulk document operations
- [x] File type and size validation
- [x] Automatic timestamp management

### 🎯 Benefits
- **Persistent Storage**: File metadata survives server restarts
- **Scalable**: Supabase handles database scaling
- **Real-time**: Can add real-time features later
- **Secure**: Built-in authentication and security
- **Backup**: Automatic database backups

## 🛠️ Development

### Local Development
1. Update `config_supabase.py` with your credentials
2. Run the SQL schema in Supabase
3. Start backend: `python main.py`
4. Start frontend: `npm run dev`

### Production Deployment
1. Use environment variables for credentials
2. Set up proper RLS policies
3. Configure backup strategies
4. Monitor database performance

## 🔍 Troubleshooting

### Common Issues

1. **Connection Error**
   - Check your Supabase URL and key
   - Verify internet connection
   - Ensure Supabase project is active

2. **Table Not Found**
   - Run the SQL schema in Supabase
   - Check table name in `database_service.py`

3. **Permission Denied**
   - Check RLS policies in Supabase
   - Verify API key permissions

4. **File Upload Fails**
   - Check file size limits
   - Verify file type is allowed
   - Check backend logs for errors

### Debug Mode
- Check Supabase logs in the dashboard
- Use browser dev tools for frontend errors
- Check backend console for API errors

## 📈 Next Steps

1. **Authentication**: Add user authentication
2. **Real-time**: Enable real-time document updates
3. **Search**: Implement full-text search
4. **Processing**: Add document processing pipeline
5. **RAG**: Connect to vector database for AI features

## 🔗 Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [Python Client](https://supabase.com/docs/reference/python)
- [Database API](https://supabase.com/docs/guides/database/api)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
