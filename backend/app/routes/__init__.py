from .chat import chat
from .document import document

def register_routes(app):
    app.register_blueprint(chat, url_prefix='/api/chat')
    app.register_blueprint(document, url_prefix='/api/document')
    