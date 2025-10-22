from flask import Blueprint, request, jsonify
import sys
sys.path.append('..')
from sb.database_service import DocumentService
from config import Config
from openai import OpenAI
import json
import os

chat = Blueprint("chat", __name__)

# Initialize OpenAI client
def get_openai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is required")
    return OpenAI(api_key=api_key)

@chat.route("/chat", methods=["POST"])
def chat_endpoint():
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        chat_history = data.get('chat_history', [])
        
        if not user_message.strip():
            return jsonify({"error": "Message cannot be empty"}), 400
        
        # Get relevant document chunks using vector similarity search
        db_service = DocumentService()
        relevant_chunks = db_service.search_similar_chunks(user_message, top_k=5)
        
        # Prepare context from retrieved chunks
        context = ""
        if relevant_chunks:
            context = "\n\n".join([chunk['content'] for chunk in relevant_chunks])
        
        # Prepare messages for OpenAI
        messages = []
        
        # Add system message with context
        system_message = f"""You are a helpful AI assistant with access to a knowledge base. 
Use the following context to answer the user's question. If the context doesn't contain relevant information, 
say so and provide a general helpful response.

Context:
{context}

Please provide a helpful and accurate response based on the available information."""
        
        messages.append({"role": "system", "content": system_message})
        
        # Add chat history
        for msg in chat_history:
            messages.append({
                "role": msg.get("role", "user"),
                "content": msg.get("content", "")
            })
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})
        
        # Get response from OpenAI
        client = get_openai_client()
        response = client.chat.completions.create(
            model="gpt-5",
            messages=messages
        )
        
        bot_response = response.choices[0].message.content
        
        return jsonify({
            "response": bot_response,
            "sources": [
                {
                    "document_id": chunk.get('document_id'),
                    "document_name": chunk.get('document_name', 'Unknown'),
                    "document_type": chunk.get('document_type', ''),
                    "similarity": chunk.get('similarity', 0),
                    "source_link": chunk.get('source_link', '')
                }
                for chunk in relevant_chunks
            ] if relevant_chunks else []
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Chat failed: {str(e)}"}), 500