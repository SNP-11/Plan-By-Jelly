import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
	SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(BASE_DIR, "users.db")}'
	SQLALCHEMY_TRACK_MODIFICATIONS = False
	SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'

	# Flask URL configuration for OAuth
	SERVER_NAME = None  # Let Flask auto-detect
	PREFERRED_URL_SCHEME = os.environ.get('PREFERRED_URL_SCHEME', 'https')  # Use HTTPS in production

	# Google OAuth Configuration
	GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID') or 'your_google_client_id_here'
	GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET') or 'your_google_client_secret_here'
	GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid_configuration"
