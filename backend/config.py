import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'

    UPLOAD_FOLDER = 'uploads'
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    ALLOWED_EXTENSIONS = {
        'txt', 'pdf', 'doc', 'docx', 'md', 'js', 'sql', 
        'yaml', 'yml', 'pptx', 'ppt', 'xlsx', 'xls', 'csv'
    }
    
    # Supabase Configuration
    SUPABASE_URL = os.getenv('SUPABASE_URL', 'your_supabase_project_url_here')
    SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY', 'your_supabase_anon_key_here')
    SUPABASE_DOCUMENTS_TABLE = 'documents'
    
    CORS_ORIGINS = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173'
    ]
