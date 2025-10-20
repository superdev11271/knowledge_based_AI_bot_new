from flask import Blueprint, request, jsonify, current_app
import os
import uuid
from werkzeug.utils import secure_filename
import mimetypes
import sys
sys.path.append('..')
from sb.database_service import DocumentService
from config import Config
from flask import send_file

document = Blueprint("document", __name__)

# Configure upload settings from config
UPLOAD_FOLDER = Config.UPLOAD_FOLDER
ALLOWED_EXTENSIONS = Config.ALLOWED_EXTENSIONS
MAX_FILE_SIZE = Config.MAX_FILE_SIZE

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_size(file):
    file.seek(0, 2)  # Seek to end
    size = file.tell()
    file.seek(0)  # Reset to beginning
    return size

@document.route("/upload", methods=["POST"])
def upload_document():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"error": "File type not allowed"}), 400
        
        # Check file size
        file_size = get_file_size(file)
        if file_size > MAX_FILE_SIZE:
            return jsonify({"error": "File too large. Maximum size is 50MB"}), 400
        
        # Generate unique filename
        filename = secure_filename(file.filename)
        file_extension = filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        # Save file
        file.save("app/" + file_path)
        
        # Create document record (store numeric bytes and one file_type)
        document_data = {
            "name": filename,
            "original_name": filename,
            "file_path": file_path,
            "file_size": file_size,  # bytes (BIGINT)
            "file_type": file_extension.upper(),
            "status": "uploaded"
        }
        
        # Save to Supabase
        db_service = DocumentService()
        saved_document = db_service.create_document(document_data)
        
        return jsonify({
            "message": "File uploaded successfully",
            "document": saved_document
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500


@document.route("/list", methods=["GET"])
def list_documents():
    try:
        # Get documents from Supabase
        db_service = DocumentService()
        documents = db_service.get_documents()
        # Format documents for frontend
        formatted_documents = []
        for doc in documents:
            formatted_doc = {
                "id": doc.get('id'),
                "name": doc.get('name'),
                "file_size": doc.get('file_size'),  # bytes
                "file_type": doc.get('file_type'),
                # Derive date from created_at if frontend expects a date string
                "upload_date": (doc.get('created_at', '') or '').split('T')[0],
                "file_path": doc.get('file_path'),
                "status": doc.get('status', 'uploaded')
            }
            formatted_documents.append(formatted_doc)
        
        return jsonify({
            "documents": formatted_documents,
            "total": len(formatted_documents)
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to list documents: {str(e)}"}), 500

@document.route("/delete/<document_id>", methods=["DELETE"])
def delete_document(document_id):
    try:
        # Get document from Supabase first
        db_service = DocumentService()
        document = db_service.get_document_by_id(document_id)
        
        if not document:
            return jsonify({"error": "Document not found"}), 404
        
        # Delete file from filesystem
        file_path = document.get('file_path')
        current_dir = os.path.dirname(os.path.abspath(__file__))   # routes/
        app_dir = os.path.dirname(current_dir)
        file_path = os.path.join(app_dir, file_path)
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
        
        # Delete from Supabase
        db_service.delete_document(document_id)
        
        return jsonify({"message": "Document deleted successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to delete document: {str(e)}"}), 500

@document.route("/delete-multiple", methods=["DELETE"])
def delete_multiple_documents():
    try:
        data = request.get_json()
        document_ids = data.get('document_ids', [])
        
        if not document_ids:
            return jsonify({"error": "No document IDs provided"}), 400
        
        db_service = DocumentService()
        # Fetch documents once to resolve file paths
        documents = db_service.get_documents_by_ids(document_ids)
        
        # Delete files from filesystem first (best-effort)
        for doc in documents:
            try:
                file_path = doc.get('file_path')
                current_dir = os.path.dirname(os.path.abspath(__file__))   # routes/
                app_dir = os.path.dirname(current_dir)
                file_path = os.path.join(app_dir, file_path)
                if file_path and os.path.exists(file_path):
                    os.remove(file_path)
            except Exception:
                pass
        
        # Single DB command to delete all by ids
        deleted_rows = db_service.delete_multiple_documents(document_ids)
        deleted_count = len(deleted_rows)
        
        return jsonify({
            "message": f"Deleted {deleted_count} documents successfully",
            "deleted_count": deleted_count,
            "errors": None
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to delete documents: {str(e)}"}), 500

@document.route("/download/<document_id>", methods=["GET"])
def download_document(document_id):
    try:
        db_service = DocumentService()
        document = db_service.get_document_by_id(document_id)
        if not document:
            return jsonify({"error": "Document not found"}), 404

        file_path = document.get('file_path')
        current_dir = os.path.dirname(os.path.abspath(__file__))   # routes/
        app_dir = os.path.dirname(current_dir)
        file_path = os.path.join(app_dir, file_path)
        if not file_path or not os.path.exists(file_path):
            return jsonify({"error": "File not found on server"}), 404

        filename = document.get('original_name') or document.get('name') or os.path.basename(file_path)
        mime_type, _ = mimetypes.guess_type(file_path)

        return send_file(
            file_path,
            mimetype=mime_type or 'application/octet-stream',
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return jsonify({"error": f"Failed to download document: {str(e)}"}), 500
