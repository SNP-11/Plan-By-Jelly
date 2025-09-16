# Time Management App for Middle Schoolers

A gamified time management application designed to help middle school students develop executive functioning skills.

## Features

- ⏰ Task scheduling with AI-powered time suggestions
- 🎮 Gamification with XP points and streaks
- 🤖 AI analysis for realistic task duration estimates
- 📊 Performance tracking and insights
- 🏃 Sports and activity-specific time recommendations

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your API keys:
# OPENAI_API_KEY=sk-your_actual_openai_api_key_here
# SECRET_KEY=your_random_secret_key_here
```

### 4. Get OpenAI API Key
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it to your `.env` file

### 5. Run the Application
```bash
python gateway.py
```

## Important Security Notes

- **Never commit your `.env` file to git**
- **Never hardcode API keys in your source code**
- **Always use environment variables for sensitive data**

## Technologies Used

- **Backend**: Python, Flask, SQLite
- **Frontend**: JavaScript, HTML, CSS
- **AI Integration**: OpenAI GPT API
- **Time Picker**: Flatpickr
- **Process Management**: PM2

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
