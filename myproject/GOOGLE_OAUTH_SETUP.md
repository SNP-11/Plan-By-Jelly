# Google OAuth Setup Guide

## Prerequisites
Your Flask application now has Google OAuth authentication integrated! Follow these steps to complete the setup.

## Step 1: Google Cloud Console Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or Select Project**: Create a new project or select an existing one
3. **Enable Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
   - Also enable "Google Identity" API if available

4. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Set **Authorized redirect URIs** to:
     - `http://localhost:5000/google_callback` (for development)
     - `https://yourdomain.com/google_callback` (for production)

5. **Copy Credentials**: Save the Client ID and Client Secret

## Step 2: Environment Configuration

1. **Create .env file** (copy from .env.example):
   ```bash
   cp .env.example .env
   ```

2. **Update .env file** with your credentials:
   ```
   GOOGLE_CLIENT_ID=your_actual_client_id_here
   GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
   ```

3. **Install python-dotenv** (if not already installed):
   ```bash
   pip install python-dotenv
   ```

4. **Update config.py** to load environment variables:
   ```python
   from dotenv import load_dotenv
   load_dotenv()
   ```

## Step 3: Database Migration

**Important**: You need to update your existing database schema.

### Option A: Recreate Database (Development)
1. Backup any important data
2. Delete the existing `users.db` file
3. Visit `/create_db` route to create new schema

### Option B: Migrate Existing Database (Production)
Run these SQL commands on your existing database:
```sql
ALTER TABLE users ADD COLUMN email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN name TEXT;
ALTER TABLE users ADD COLUMN picture TEXT;
ALTER TABLE users ADD COLUMN auth_type TEXT DEFAULT 'local';

-- Make username and password nullable for Google users
-- Note: This requires recreating the table in SQLite
```

## Step 4: Test the Implementation

1. **Run the test script**:
   ```bash
   python test_google_auth.py
   ```

2. **Start your Flask application**:
   ```bash
   python gateway.py
   ```

3. **Test Google Login**:
   - Go to http://localhost:5000
   - Click "Sign in with Google"
   - Complete OAuth flow
   - Verify you're logged in

## Features

### For Users:
- ✅ Sign in with Google button on login page
- ✅ Automatic account creation for new Google users
- ✅ Seamless login for existing Google users
- ✅ Profile information (name, email, picture) stored
- ✅ Works alongside existing username/password authentication

### For Developers:
- ✅ Secure OAuth 2.0 implementation
- ✅ Proper session management
- ✅ Error handling and user feedback
- ✅ Database schema supports both auth types
- ✅ Clean separation of concerns with service layer

## Security Notes

1. **HTTPS in Production**: Always use HTTPS in production
2. **Environment Variables**: Never commit .env file to version control
3. **Secret Key**: Use a strong, random secret key in production
4. **Redirect URIs**: Only add trusted domains to authorized redirect URIs

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error**:
   - Check that redirect URI in Google Console matches exactly
   - Include the protocol (http/https)

2. **"invalid_client" error**:
   - Verify Client ID and Secret are correct
   - Check environment variables are loaded

3. **Database errors**:
   - Ensure database schema is updated
   - Check file permissions on users.db

4. **Import errors**:
   - Verify all dependencies are installed
   - Check Python path and virtual environment

### Debug Mode:
Enable Flask debug mode to see detailed error messages:
```python
app.run(debug=True)
```

## Next Steps

1. Set up your Google Cloud Console project
2. Configure environment variables
3. Update your database schema
4. Test the implementation
5. Deploy to production with HTTPS

Your Google OAuth integration is now ready to use!
