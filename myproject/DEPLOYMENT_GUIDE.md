# Deployment Guide

## Pre-Deployment Checklist

### 1. Clean Repository
- ✅ Test files removed
- ✅ .gitignore created (excludes .env, __pycache__, etc.)
- ✅ Production configuration ready

### 2. Google Cloud Console Setup for Production
1. Go to: https://console.cloud.google.com/
2. Navigate to: APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Add your production redirect URI:
   ```
   https://yourdomain.com/google_callback
   ```
   Replace `yourdomain.com` with your actual domain

## Deployment Steps

### Step 1: Push to GitHub
```bash
# In your local project directory
git add .
git commit -m "Add Google OAuth authentication"
git push origin main
```

### Step 2: Pull to Production Server
```powershell
# On your production server
git pull origin main
```

### Step 3: Set Up Production Environment
```powershell
# Copy the production environment template
Copy-Item .env.production .env

# Edit .env file with your production values:
# - Generate a secure SECRET_KEY
# - Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
# - Set FLASK_ENV=production
```

### Step 4: Install Dependencies
```powershell
# Install Python dependencies
pip install -r requirements.txt
```

### Step 5: Database Setup
```powershell
# Create/update database schema
python -c "from gateway import app; from db_config import db; with app.app_context(): db.create_all()"
```

### Step 6: Start Production Server
```powershell
# Start the Flask application
python gateway.py
```

## Environment Variables for Production

Create a `.env` file on your production server with these variables:

```env
FLASK_ENV=production
SECRET_KEY=your_very_secure_random_secret_key_here
PREFERRED_URL_SCHEME=https
GOOGLE_CLIENT_ID=370656745578-bt6jooeod4p592eo3fnk891efj2mksgu.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
PORT=5000
```

## Important Security Notes

### 1. Secret Key
Generate a secure secret key for production:
```python
import secrets
print(secrets.token_hex(32))
```

### 2. HTTPS
- Ensure your website uses HTTPS in production
- Google OAuth requires HTTPS for production domains

### 3. Environment Variables
- Never commit .env files to GitHub
- Set environment variables directly on your server if possible

## Testing Production Deployment

1. **Access your website**: https://yourdomain.com
2. **Test traditional login**: Username/password should work
3. **Test Google OAuth**: 
   - Click "Sign in with Google" on login page
   - Click "Sign up with Google" on signup page
   - Complete Google authentication
   - Verify you're logged in and redirected properly

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch"**
   - Add `https://yourdomain.com/google_callback` to Google Cloud Console

2. **"invalid_client"**
   - Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct

3. **Database errors**
   - Ensure database file has proper permissions
   - Run database creation command

4. **Import errors**
   - Verify all dependencies are installed: `pip install -r requirements.txt`

### Debug Mode
To enable debug mode temporarily in production:
```powershell
$env:FLASK_ENV="development"
python gateway.py
```

## File Structure After Deployment
```
myproject/
├── .env                    # Production environment variables (not in git)
├── .env.production        # Template for production (in git)
├── .gitignore             # Git ignore file
├── requirements.txt       # Python dependencies
├── DEPLOYMENT_GUIDE.md    # This file
├── gateway.py             # Main Flask application
├── config.py              # Configuration
├── db_config.py           # Database configuration
├── services/
│   └── google_auth.py     # Google OAuth service
├── templates/             # HTML templates
├── static/                # CSS, JS, images
└── controllers/           # Application controllers
```

Your application is now ready for production deployment with Google OAuth authentication!
