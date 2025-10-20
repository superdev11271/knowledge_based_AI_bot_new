from supabase import create_client, Client
import sys
sys.path.append(r'E:\CurrentProject\Project\tmp\vite-project\backend')
from config import Config

def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    if not Config.SUPABASE_URL or not Config.SUPABASE_ANON_KEY:
        raise ValueError("Supabase URL and Key must be set in environment variables or config")
    
    return create_client(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY)
