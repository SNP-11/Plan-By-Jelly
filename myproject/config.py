import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
	SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(BASE_DIR, "users.db")}'
	SQLALCHEMY_TRACK_MODIFICATIONS = False
	SECRET_KEY = os.getenv('SECRET_KEY', 'your_secret_key')

	# OpenAI Configuration
	OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

	# AI Configuration
	AI_MODEL = 'gpt-3.5-turbo'  # Can be changed to gpt-4 if needed
	AI_MAX_TOKENS = 150
	AI_TEMPERATURE = 0.7
