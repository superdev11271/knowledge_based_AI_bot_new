# Backend Configuration Guide

This guide explains the new organized configuration structure for the RAG application backend.

## 📁 Directory Structure

```
backend/
├── config.py                 # Main configuration file
├── main.py                   # Application entry point
├── app/                      # Flask application
│   ├── __init__.py
│   └── routes/              # API routes
├── supabase/                # Supabase integration
│   ├── __init__.py
│   ├── client.py           # Supabase client
│   ├── database_service.py # Database operations
│   ├── schema.sql          # Database schema
│   └── setup.py           # Setup utilities
├── uploads/                 # File storage directory
└── env.template            # Environment variables template
```

## ⚙️ Configuration

### 1. Environment Variables

Copy `env.template` to `.env` and configure:

```bash
# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
FLASK_DEBUG=True

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2. Configuration

The application uses a single `Config` class with environment variable support:

- **Environment Variables**: All settings can be overridden via environment variables
- **Default Values**: Sensible defaults for all configuration options
- **Flexible**: Easy to customize for different environments

### 3. Supabase Setup

1. **Configure Credentials**: Update `SUPABASE_URL` and `SUPABASE_ANON_KEY` in your `.env` file

2. **Create Database Schema**: Run the SQL schema in Supabase:
   ```sql
   -- Copy and paste contents of supabase/schema.sql
   ```

3. **Test Connection**: 
   ```python
   from sb.setup import setup_supabase
   setup_supabase()
   ```

## 🚀 Running the Application

### Basic Usage
```bash
# Run application
python main.py
```

### With Environment Variables
```bash
# Set debug mode
export FLASK_DEBUG=False

# Run application
python main.py
```

### Using Gunicorn (Production)
```bash
gunicorn -w 4 -b 0.0.0.0:5000 main:app
```

## 🔧 Configuration Options

### File Upload Settings
- **UPLOAD_FOLDER**: Directory for file storage
- **MAX_FILE_SIZE**: Maximum file size (50MB default)
- **ALLOWED_EXTENSIONS**: Permitted file types

### Supabase Settings
- **SUPABASE_URL**: Your Supabase project URL
- **SUPABASE_ANON_KEY**: Your Supabase anonymous key
- **SUPABASE_DOCUMENTS_TABLE**: Database table name

### Security Settings
- **SECRET_KEY**: Flask secret key
- **JWT_SECRET_KEY**: JWT token secret
- **CORS_ORIGINS**: Allowed CORS origins

## 📊 Database Schema

The `documents` table includes:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(255) | File name |
| `file_path` | TEXT | Server file path |
| `file_size` | VARCHAR(50) | Human-readable size |
| `file_type` | VARCHAR(20) | File extension |
| `upload_date` | TIMESTAMP | Upload timestamp |
| `status` | VARCHAR(20) | File status |
| `created_at` | TIMESTAMP | Record creation |
| `updated_at` | TIMESTAMP | Last update |

## 🛠️ Development

### Adding New Configuration
1. Add new settings to `config.py`
2. Update environment template
3. Document new settings

### Adding New Supabase Features
1. Add methods to `supabase/database_service.py`
2. Update routes to use new methods
3. Test with `supabase/setup.py`

### Database Migrations
1. Update `supabase/schema.sql`
2. Run SQL in Supabase dashboard
3. Update `supabase/setup.py` if needed

## 🔍 Troubleshooting

### Common Issues

1. **Configuration Not Loading**
   - Check `.env` file exists
   - Verify environment variables
   - Check `config.py` imports

2. **Supabase Connection Failed**
   - Verify URL and key
   - Check network connection
   - Test with `setup_supabase()`

3. **File Upload Issues**
   - Check upload directory permissions
   - Verify file size limits
   - Check allowed extensions

### Debug Mode
```python
# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📈 Production Deployment

### Environment Setup
1. Set `FLASK_DEBUG=False`
2. Use strong secret keys
3. Configure proper CORS origins
4. Set up database backups

### Security Considerations
1. Use environment variables for secrets
2. Enable HTTPS
3. Configure proper CORS
4. Set up authentication
5. Monitor logs

### Performance Optimization
1. Use connection pooling
2. Configure caching
3. Optimize database queries
4. Set up monitoring

## 🔗 API Endpoints

- `POST /api/document/upload` - Upload single file
- `GET /api/document/list` - Get all documents
- `DELETE /api/document/delete/{id}` - Delete document
- `DELETE /api/document/delete-multiple` - Delete multiple documents

## 📝 Next Steps

1. **Authentication**: Add user authentication
2. **Real-time**: Enable Supabase real-time features
3. **Search**: Implement full-text search
4. **Processing**: Add document processing pipeline
5. **Monitoring**: Set up application monitoring
