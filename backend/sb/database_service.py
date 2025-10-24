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

    def get_documents_paginated(self, page=1, per_page=5):
        """Get documents with pagination"""
        try:
            # Calculate offset
            offset = (page - 1) * per_page
            
            # Get total count
            count_result = self.supabase.table(self.table).select('id', count='exact').execute()
            total = count_result.count or 0
            
            # Get paginated documents
            result = self.supabase.table(self.table).select('*').order('created_at', desc=True).range(offset, offset + per_page - 1).execute()
            documents = result.data or []
            
            # Calculate total pages
            total_pages = (total + per_page - 1) // per_page
            
            return {
                'documents': documents,
                'total': total,
                'total_pages': total_pages,
                'page': page,
                'per_page': per_page
            }
        except Exception as e:
            print(f"Error getting paginated documents: {str(e)}")
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

    def delete_all_documents(self):
        """Delete all documents using TRUNCATE for efficiency"""
        try:
            # Use SQL function to truncate all tables efficiently
            result = self.supabase.rpc('truncate_all_documents').execute()
            
            if result.data and len(result.data) > 0:
                data = result.data[0]
                documents_deleted = data.get('deleted_documents_count', 0)
                chunks_deleted = data.get('deleted_chunks_count', 0)
                print(f"Truncated {documents_deleted} documents and {chunks_deleted} chunks")
                return documents_deleted
            else:
                print("No documents found to delete")
                return 0
                
        except Exception as e:
            print(f"Error truncating all documents: {str(e)}")
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

    def insert_document_chunks(self, document_id, chunks_with_embeddings):
        """Bulk insert document chunks with embeddings.
        chunks_with_embeddings: List[dict] with keys: chunk_index, content, embedding
        """
        try:
            if not chunks_with_embeddings:
                return []
            rows = []
            for item in chunks_with_embeddings:
                # Clean content to remove problematic Unicode characters
                cleaned_content = self._clean_text_content(item['content'])
                rows.append({
                    'document_id': document_id,
                    'chunk_index': int(item['chunk_index']),
                    'content': cleaned_content,
                    'embedding': f"[{','.join(map(str, item['embedding']))}]"  # Convert to PostgreSQL vector format
                })
            result = self.supabase.table('document_chunks').insert(rows).execute()
            return result.data or []
        except Exception as e:
            print(f"Error inserting document chunks: {str(e)}")
            raise e

    def search_similar_chunks(self, query_text, top_k=5):
        """Search for similar chunks using Supabase SQL function."""
        try:
            from openai import OpenAI
            import os
            # Generate embedding for query
            OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

            client = OpenAI(api_key=OPENAI_API_KEY)
            query_embedding = client.embeddings.create(
                model="text-embedding-3-small",
                input=query_text
            ).data[0].embedding
            # Call Supabase SQL function directly
            result = self.supabase.rpc(
                'match_documents',
                {
                    'query_embedding': query_embedding,
                    'match_count': top_k
                }
            ).execute()
            # Format results with source links
            if result.data:
                formatted_results = []
                for chunk in result.data:
                    if chunk.get('similarity') > 0.3:
                        formatted_results.append({
                            'id': chunk.get('id'),
                            'document_id': chunk.get('document_id'),
                            'chunk_index': chunk.get('chunk_index'),
                            'content': chunk.get('content'),
                            'similarity': chunk.get('similarity'),
                            'document_name': chunk.get('document_name', 'Unknown'),
                            'document_path': chunk.get('document_path', ''),
                            'document_type': chunk.get('document_type', ''),
                            'source_link': f"/documents/{chunk.get('document_id')}"
                        })
                return formatted_results
            
            return []
            
        except Exception as e:
            print(f"Error searching similar chunks: {str(e)}")
            return []
    
    def _clean_text_content(self, text):
        """Clean text content to remove problematic Unicode characters."""
        if not text:
            return ""
        
        # Remove null characters and other problematic Unicode sequences
        cleaned = text.replace('\x00', '')  # Remove null characters
        cleaned = cleaned.replace('\u0000', '')  # Remove Unicode null characters
        
        # Remove other control characters except newlines and tabs
        import re
        cleaned = re.sub(r'[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]', '', cleaned)
        
        # Normalize whitespace
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        return cleaned
    
