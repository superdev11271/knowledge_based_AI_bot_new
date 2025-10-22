-- Create documents table in Supabase
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'uploaded',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow public access to documents" ON documents
    FOR ALL USING (true);

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;


-- Table to store document chunks and embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(3072) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_chunk_index ON document_chunks(chunk_index);


-- Create vector similarity search function
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(3072),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index int,
  content text,
  similarity float,
  document_name text,
  document_path text,
  document_type text
)
LANGUAGE sql
AS $$
  SELECT 
    dc.id,
    dc.document_id,
    dc.chunk_index,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity,
    d.name as document_name,
    d.file_path as document_path,
    d.file_type as document_type
  FROM document_chunks dc
  JOIN documents d ON dc.document_id = d.id
  WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Create function to delete all documents
CREATE OR REPLACE FUNCTION delete_all_documents()
RETURNS TABLE (
  deleted_count int,
  message text
)
LANGUAGE plpgsql
AS $$
DECLARE
  doc_count int;
BEGIN
  -- Get count of documents before deletion
  SELECT COUNT(*) INTO doc_count FROM documents;
  
  -- Delete all documents with WHERE clause (cascade will handle document_chunks)
  DELETE FROM documents WHERE id IS NOT NULL;
  
  -- Return result
  RETURN QUERY SELECT 
    doc_count as deleted_count,
    'All documents deleted successfully' as message;
END;
$$;

-- Insert some sample data (optional)
-- INSERT INTO documents (name, original_name, file_path, file_size, file_size_bytes, file_type, upload_date) 
-- VALUES 
--     ('sample.pdf', 'sample.pdf', '/uploads/sample.pdf', '2.4 MB', 2516582, 'PDF', NOW()),
--     ('document.docx', 'document.docx', '/uploads/document.docx', '1.2 MB', 1258291, 'DOCX', NOW());
