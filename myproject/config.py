import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
	SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(BASE_DIR, "users.db")}'
	SQLALCHEMY_TRACK_MODIFICATIONS = False
	SECRET_KEY = 'your_secret_key'

	# Google OAuth Config
	GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID') or 'your-google-client-id.apps.googleusercontent.com'
	GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET') or 'your-google-client-secret'
	GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid_configuration"
