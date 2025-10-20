from .client import get_supabase_client
from config import Config
from datetime import datetime
import uuid

class DocumentService:
    def __init__(self):
        self.supabase = get_supabase_client()
        self.table = Config.SUPABASE_DOCUMENTS_TABLE
    
    def create_document(self, document_data):
        """Create a new document record in Supabase"""
        try:
            # Prepare document data for Supabase
            supabase_data = {
                'id': str(uuid.uuid4()),
                'name': document_data.get('name'),
                'original_name': document_data.get('original_name'),
                'file_path': document_data.get('file_path'),
                'file_size': document_data.get('file_size'),  # bytes (BIGINT)
                'file_type': document_data.get('file_type'),
                'status': document_data.get('status', 'uploaded'),
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            # Insert into Supabase
            result = self.supabase.table(self.table).insert(supabase_data).execute()
            
            if result.data:
                return result.data[0]
            else:
                raise Exception("Failed to create document record")
                
        except Exception as e:
            print(f"Error creating document: {str(e)}")
            raise e
    
    def get_documents(self):
        """Get all documents from Supabase"""
        try:
            result = self.supabase.table(self.table).select('*').order('created_at', desc=True).execute()
            return result.data
        except Exception as e:
            print(f"Error fetching documents: {str(e)}")
            raise e
    
    def get_document_by_id(self, document_id):
        """Get a specific document by ID"""
        try:
            result = self.supabase.table(self.table).select('*').eq('id', document_id).execute()
            if result.data:
                return result.data[0]
            return None
        except Exception as e:
            print(f"Error fetching document: {str(e)}")
            raise e

    def get_documents_by_ids(self, document_ids):
        """Get multiple documents by a list of IDs"""
        try:
            if not document_ids:
                return []
            result = self.supabase.table(self.table).select('*').in_('id', document_ids).execute()
            return result.data or []
        except Exception as e:
            print(f"Error fetching documents by ids: {str(e)}")
            raise e
    
    def delete_document(self, document_id):
        """Delete a document from Supabase"""
        try:
            result = self.supabase.table(self.table).delete().eq('id', document_id).execute()
            return result.data
        except Exception as e:
            print(f"Error deleting document: {str(e)}")
            raise e
    
    def delete_multiple_documents(self, document_ids):
        """Delete multiple documents from Supabase"""
        try:
            result = self.supabase.table(self.table).delete().in_('id', document_ids).execute()
            return result.data or []
        except Exception as e:
            print(f"Error deleting documents: {str(e)}")
            raise e
    
    def update_document_status(self, document_id, status):
        """Update document status"""
        try:
            result = self.supabase.table(self.table).update({
                'status': status,
                'updated_at': datetime.now().isoformat()
            }).eq('id', document_id).execute()
            
            if result.data:
                return result.data[0]
            return None
        except Exception as e:
            print(f"Error updating document status: {str(e)}")
            raise e
