import requests
from google_auth_oauthlib.flow import Flow
from flask import current_app

class GoogleAuthService:
    def __init__(self):
        self.client_id = current_app.config['GOOGLE_CLIENT_ID']
        self.client_secret = current_app.config['GOOGLE_CLIENT_SECRET']
        self.discovery_url = current_app.config['GOOGLE_DISCOVERY_URL']

    def get_google_provider_cfg(self):
        """Get Google's OAuth 2.0 configuration"""
        try:
            response = requests.get(self.discovery_url, timeout=10)
            response.raise_for_status()
            return response.json()
        except (requests.RequestException, ValueError):
            # Fallback to hardcoded Google OAuth endpoints
            return {
                "authorization_endpoint": "https://accounts.google.com/o/oauth2/auth",
                "token_endpoint": "https://oauth2.googleapis.com/token",
                "userinfo_endpoint": "https://openidconnect.googleapis.com/v1/userinfo"
            }

    def create_flow(self):
        """Create OAuth 2.0 flow"""
        google_provider_cfg = self.get_google_provider_cfg()

        # Dynamic redirect URI based on environment
        import os
        from flask import request

        # Check if we're in development or production
        if 'localhost' in request.host or '127.0.0.1' in request.host:
            # Development environment
            redirect_uri = f"http://{request.host}/google_callback"
            os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # Allow HTTP for localhost
        else:
            # Production environment
            redirect_uri = f"https://{request.host}/google_callback"

        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "auth_uri": google_provider_cfg["authorization_endpoint"],
                    "token_uri": google_provider_cfg["token_endpoint"],
                    "redirect_uris": [redirect_uri]
                }
            },
            scopes=["https://www.googleapis.com/auth/userinfo.email",
                   "https://www.googleapis.com/auth/userinfo.profile",
                   "openid"]
        )

        flow.redirect_uri = redirect_uri
        return flow

    def get_authorization_url(self):
        """Get the authorization URL for Google OAuth"""
        flow = self.create_flow()
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true'
        )
        return authorization_url, state

    def get_user_info(self, authorization_response):
        """Exchange authorization code for user info"""
        try:
            flow = self.create_flow()
            flow.fetch_token(authorization_response=authorization_response)

            # Get user info from Google
            google_provider_cfg = self.get_google_provider_cfg()
            userinfo_endpoint = google_provider_cfg["userinfo_endpoint"]

            # Use the authorized session to make the request
            userinfo_response = flow.authorized_session().get(userinfo_endpoint)

            if userinfo_response.status_code == 200:
                user_data = userinfo_response.json()
                if user_data.get("email_verified", True):  # Default to True if not present
                    return {
                        'google_id': user_data["sub"],
                        'email': user_data["email"],
                        'name': user_data["name"],
                        'picture': user_data.get("picture", "")
                    }
            return None

        except Exception as e:
            return None
