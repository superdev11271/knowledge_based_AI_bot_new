"""
Supabase setup utilities
"""
import os
import sys
sys.path.append('..')
from client import get_supabase_client
from config import Config

def create_documents_table():
    """Create the documents table if it doesn't exist"""
    try:
        # Read the schema file
        schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
        
        # Execute the schema
        supabase = get_supabase_client()
        result = supabase.rpc('exec_sql', {'sql': schema_sql}).execute()
        
        print("Documents table created successfully")
        return True
        
    except Exception as e:
        print(f"Error creating documents table: {str(e)}")
        return False

def check_connection():
    """Check if Supabase connection is working"""
    try:
        supabase = get_supabase_client()
        # Try to get the documents table
        result = supabase.table(Config.SUPABASE_DOCUMENTS_TABLE).select('*').limit(1).execute()
        print("Supabase connection successful")
        return True
    except Exception as e:
        print(f"Supabase connection failed: {str(e)}")
        return False

def setup_supabase():
    """Complete Supabase setup"""
    print("Setting up Supabase...")
    
    # Check connection
    if not check_connection():
        print("Failed to connect to Supabase. Please check your configuration.")
        return False
    
    # Create table
    if not create_documents_table():
        print("Failed to create documents table.")
        return False
    
    print("Supabase setup completed successfully!")
    return True

if __name__ == "__main__":
    setup_supabase()
