from flask import Flask
from flask_cors import CORS
from .routes import register_routes
from config import Config


def create_app():
    app = Flask(__name__, instance_relative_config=True)
    
    # Load configuration
    app.config.from_object(Config)

    # Enable CORS
    CORS(app, origins=Config.CORS_ORIGINS)
    
    # Register routes
    register_routes(app)

    return app
