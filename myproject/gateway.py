#from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask import Flask, session
import sqlite3
import os
import json
from werkzeug.security import generate_password_hash, check_password_hash
#from flask_sqlalchemy import SQLAlchemy
#from config import Config
from controllers.tasks import TaskController
from db_config import db, app, render_template, request, redirect, url_for, flash, session, jsonify

# Import Google OAuth libraries only when needed
try:
    import requests
    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token
    from google_auth_oauthlib.flow import Flow
    from config import Config
    GOOGLE_OAUTH_AVAILABLE = True
except ImportError as e:
    print(f"Google OAuth libraries not available: {e}")
    GOOGLE_OAUTH_AVAILABLE = False
    # Create a dummy Config class for basic functionality
    class Config:
        GOOGLE_CLIENT_ID = 'dummy'
        GOOGLE_CLIENT_SECRET = 'dummy'
        GOOGLE_DISCOVERY_URL = 'dummy'


@app.route('/QOTD')
def QOTD():
    return render_template('QOTD.html')
# app = Flask(__name__)
# app.config.from_object(Config)
# db = SQLAlchemy()
# db.init_app(app)

app.secret_key = 'your_secret_key'  # Use a strong, random secret key

def get_db_connection():
    db_path = os.path.join(os.path.dirname(__file__), 'users.db')
    conn = sqlite3.connect(db_path)
    return conn

@app.route('/create_db')
def create_db():
    conn = get_db_connection()
    # conn.execute('DROP TABLE tasks')
    # conn.execute('DROP TABLE users')
    # conn.execute('DROP CONSTRAINT uid')
    conn.execute('''\
                 CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    password TEXT,
                    email TEXT,
                    google_id TEXT UNIQUE,
                    profile_pic TEXT,
                    auth_provider TEXT DEFAULT 'local'
                 );\
                 ''')
    conn.execute('''\
                 CREATE TABLE tasks (
                    id INTEGER NOT NULL,
                    uid INTEGER NOT NULL,
                    label VARCHAR(80) NOT NULL,
                    start_time INTEGER NOT NULL,
                    end_time INTEGER,
                    urgency VARCHAR(30) NOT NULL,
                    save_task INTEGER NOT NULL,
                    PRIMARY KEY (id)
                 );\
                 ''')


    # 1) git managment
    # 2) use alter
    conn.close()
    return render_template('loginG.html')

@app.route('/migrate_db')
def migrate_db():
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Check if the new columns exist
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]

        # Add missing columns
        if 'email' not in columns:
            cursor.execute('ALTER TABLE users ADD COLUMN email TEXT')
        if 'google_id' not in columns:
            cursor.execute('ALTER TABLE users ADD COLUMN google_id TEXT')
        if 'profile_pic' not in columns:
            cursor.execute('ALTER TABLE users ADD COLUMN profile_pic TEXT')
        if 'auth_provider' not in columns:
            cursor.execute('ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT "local"')

        # Update existing users to have auth_provider = 'local'
        cursor.execute('UPDATE users SET auth_provider = "local" WHERE auth_provider IS NULL')

        conn.commit()
    return 'Database migrated successfully! Google OAuth columns added.'

@app.route('/fix_db_schema')
def fix_db_schema():
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Create a new table with the correct schema
        cursor.execute('''
            CREATE TABLE users_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT,
                email TEXT,
                google_id TEXT UNIQUE,
                profile_pic TEXT,
                auth_provider TEXT DEFAULT 'local'
            )
        ''')

        # Copy data from old table to new table
        cursor.execute('''
            INSERT INTO users_new (id, username, password, email, google_id, profile_pic, auth_provider)
            SELECT id, username, password, email, google_id, profile_pic, auth_provider FROM users
        ''')

        # Drop old table and rename new table
        cursor.execute('DROP TABLE users')
        cursor.execute('ALTER TABLE users_new RENAME TO users')

        conn.commit()
    return 'Database schema fixed! Password is now nullable for Google users.'

@app.route('/debug_db')
def debug_db():
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Get table structure
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()

        # Get all users
        cursor.execute("SELECT * FROM users")
        users = cursor.fetchall()

        # Get table constraints
        cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'")
        table_sql = cursor.fetchone()

        return jsonify({
            "columns": columns,
            "users": users,
            "table_sql": table_sql[0] if table_sql else None
        })



@app.route('/')
def index():
    # db.drop_all()
    db.create_all()
    if 'username' in session:
        return redirect(url_for('home'))
    return render_template('loginG.html')

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    print(f"Login attempt - Username: {username}, Password: {password}")

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()

    if user:
        id = user[0]
        stored_password = user[2]
        print(f"Fetched user: {user}")
        print(f"Stored password hash: {stored_password}")

        if check_password_hash(stored_password, password):
            session['username'] = username
            session['uid'] = id
            flash('Login successful!', 'success')
            return redirect(url_for('home'))

    # Flash this for any failure (username not found or password mismatch)
    flash('Your username or password was incorrect.', 'danger')
    return redirect(url_for('index'))



@app.route('/logout')
def logout():
    session.pop('username', None)
    flash('You have been logged out.', 'success')
    return redirect(url_for('index'))

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['username']
        password = generate_password_hash(request.form['password'], method='pbkdf2:sha256')
        print(f"Generated password hash: {password}")  # Debug statement
        with get_db_connection() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute('INSERT INTO users (username, password, auth_provider) VALUES (?, ?, ?)', (username, password, 'local'))
                conn.commit()
                flash('User created successfully!', 'success')
            except sqlite3.IntegrityError:
                flash('Username already exists', 'danger')
        return redirect(url_for('index'))
    return render_template('signup.html')

# Google OAuth Configuration
if GOOGLE_OAUTH_AVAILABLE:
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # For development only

    def get_google_provider_cfg():
        # Use hardcoded Google OAuth endpoints (these are stable and don't change)
        return {
            "authorization_endpoint": "https://accounts.google.com/o/oauth2/auth",
            "token_endpoint": "https://oauth2.googleapis.com/token",
            "userinfo_endpoint": "https://openidconnect.googleapis.com/v1/userinfo",
            "issuer": "https://accounts.google.com",
            "jwks_uri": "https://www.googleapis.com/oauth2/v3/certs"
        }

    @app.route('/auth/google')
    def google_login():
        # Check if Google OAuth is properly configured
        if (Config.GOOGLE_CLIENT_ID == 'dummy' or
            Config.GOOGLE_CLIENT_SECRET == 'dummy' or
            Config.GOOGLE_CLIENT_ID == 'your-google-client-id.apps.googleusercontent.com' or
            Config.GOOGLE_CLIENT_SECRET == 'your-google-client-secret'):
            flash('Google OAuth is not configured. Please follow the setup guide in GOOGLE_OAUTH_SETUP.md to configure your Google OAuth credentials.', 'warning')
            return redirect(url_for('index'))

        # Find out what URL to hit for Google login
        google_provider_cfg = get_google_provider_cfg()
        if not google_provider_cfg:
            flash('Unable to connect to Google OAuth service. Please check your internet connection and try again.', 'danger')
            return redirect(url_for('index'))

        authorization_endpoint = google_provider_cfg["authorization_endpoint"]

        # Use library to construct the request for Google login and provide
        # scopes that let you retrieve user's profile from Google
        redirect_uri = request.url_root.rstrip('/') + "/auth/google/callback"
        print(f"Using redirect URI: {redirect_uri}")

        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": Config.GOOGLE_CLIENT_ID,
                    "client_secret": Config.GOOGLE_CLIENT_SECRET,
                    "auth_uri": authorization_endpoint,
                    "token_uri": google_provider_cfg["token_endpoint"],
                    "redirect_uris": [redirect_uri]
                }
            },
            scopes=["openid", "https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"]
        )
        flow.redirect_uri = redirect_uri

        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true'
        )

        session["state"] = state
        return redirect(authorization_url)

    @app.route('/auth/google/callback')
    def google_callback():
        # Get authorization code Google sent back to you
        code = request.args.get("code")

        # Find out what URL to hit to get tokens that allow you to ask for
        # things on behalf of a user
        google_provider_cfg = get_google_provider_cfg()
        if not google_provider_cfg:
            flash('Unable to connect to Google OAuth service. Please try again later.', 'danger')
            return redirect(url_for('index'))

        token_endpoint = google_provider_cfg["token_endpoint"]

        # Prepare and send a request to get tokens
        redirect_uri = request.url_root.rstrip('/') + "/auth/google/callback"

        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": Config.GOOGLE_CLIENT_ID,
                    "client_secret": Config.GOOGLE_CLIENT_SECRET,
                    "auth_uri": google_provider_cfg["authorization_endpoint"],
                    "token_uri": token_endpoint,
                    "redirect_uris": [redirect_uri]
                }
            },
            scopes=["openid", "https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"]
        )
        flow.redirect_uri = redirect_uri

        # Use the authorization server's response to fetch the OAuth 2.0 tokens
        authorization_response = request.url
        flow.fetch_token(authorization_response=authorization_response)

        # Now that you have tokens (yay!) let's find and hit the URL
        # from Google that gives you the user's profile information,
        # including their Google account email
        userinfo_endpoint = google_provider_cfg["userinfo_endpoint"]

        # Parse the response
        userinfo_response = flow.authorized_session().get(userinfo_endpoint)

        if userinfo_response.json().get("email_verified"):
            unique_id = userinfo_response.json()["sub"]
            users_email = userinfo_response.json()["email"]
            picture = userinfo_response.json()["picture"]
            users_name = userinfo_response.json().get("given_name", "")

            # Create a unique username for Google users if given_name is empty or already exists
            if not users_name:
                users_name = users_email.split('@')[0]  # Use email prefix as username

            # Make sure username is unique by appending a number if needed
            with get_db_connection() as conn:
                cursor = conn.cursor()
                original_username = users_name
                counter = 1
                while True:
                    cursor.execute('SELECT * FROM users WHERE username = ?', (users_name,))
                    if not cursor.fetchone():
                        break
                    users_name = f"{original_username}_{counter}"
                    counter += 1
        else:
            flash("User email not available or not verified by Google.", 'danger')
            return redirect(url_for('index'))

        # Check if user already exists
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # First check if user exists with this Google ID
            cursor.execute('SELECT * FROM users WHERE google_id = ?', (unique_id,))
            google_user = cursor.fetchone()

            if google_user:
                # User already linked with Google, log them in
                session['username'] = google_user[1] if google_user[1] else users_name
                session['uid'] = google_user[0]
                session['email'] = users_email
                flash('Welcome back! Login successful.', 'success')
            else:
                # Check if user exists with this email (but no Google ID)
                cursor.execute('SELECT * FROM users WHERE email = ?', (users_email,))
                email_user = cursor.fetchone()

                if email_user:
                    # Link existing account with Google
                    cursor.execute('''UPDATE users SET google_id = ?, profile_pic = ?, auth_provider = ?
                                     WHERE email = ?''',
                                  (unique_id, picture, 'google', users_email))
                    conn.commit()

                    session['username'] = email_user[1]
                    session['uid'] = email_user[0]
                    session['email'] = users_email
                    flash('Your account has been linked with Google! Login successful.', 'success')
                else:
                    # Create new user
                    try:
                        print(f"Attempting to create user: {users_name}, {users_email}, {unique_id}")
                        cursor.execute('''INSERT INTO users (username, email, google_id, profile_pic, auth_provider)
                                         VALUES (?, ?, ?, ?, ?)''',
                                      (users_name, users_email, unique_id, picture, 'google'))
                        conn.commit()

                        # Get the new user's ID
                        cursor.execute('SELECT * FROM users WHERE google_id = ?', (unique_id,))
                        new_user = cursor.fetchone()

                        session['username'] = users_name
                        session['uid'] = new_user[0]
                        session['email'] = users_email
                        flash('Account created and login successful!', 'success')
                    except sqlite3.IntegrityError as e:
                        print(f"IntegrityError: {e}")
                        # Check what's causing the constraint violation
                        cursor.execute('SELECT * FROM users WHERE username = ?', (users_name,))
                        existing_username = cursor.fetchone()
                        cursor.execute('SELECT * FROM users WHERE email = ?', (users_email,))
                        existing_email = cursor.fetchone()
                        cursor.execute('SELECT * FROM users WHERE google_id = ?', (unique_id,))
                        existing_google_id = cursor.fetchone()

                        if existing_username:
                            flash(f'Username "{users_name}" already exists. Please try signing in with your existing account.', 'warning')
                        elif existing_email:
                            flash('An account with this email already exists. Please try signing in with your existing account.', 'warning')
                        elif existing_google_id:
                            flash('This Google account is already linked to another user.', 'warning')
                        else:
                            flash('Unable to create account due to a database constraint. Please try again.', 'danger')
                        return redirect(url_for('index'))

        return redirect(url_for('home'))

    # Test route to check Google OAuth configuration
    @app.route('/test-google-config')
    def test_google_config():
        try:
            config_data = get_google_provider_cfg()
            return jsonify({
                "status": "success",
                "message": "Google OAuth configuration is working",
                "client_id_configured": bool(Config.GOOGLE_CLIENT_ID and Config.GOOGLE_CLIENT_ID != 'your-google-client-id.apps.googleusercontent.com'),
                "client_secret_configured": bool(Config.GOOGLE_CLIENT_SECRET and Config.GOOGLE_CLIENT_SECRET != 'your-google-client-secret'),
                "authorization_endpoint": config_data.get("authorization_endpoint"),
                "token_endpoint": config_data.get("token_endpoint"),
                "userinfo_endpoint": config_data.get("userinfo_endpoint")
            })
        except Exception as e:
            return jsonify({
                "status": "error",
                "message": f"Error with Google OAuth configuration: {str(e)}"
            })

else:
    # Create dummy routes when Google OAuth is not available
    @app.route('/auth/google')
    def google_login():
        flash('Google OAuth libraries are not installed. Please install the required packages.', 'danger')
        return redirect(url_for('index'))

    @app.route('/auth/google/callback')
    def google_callback():
        flash('Google OAuth libraries are not installed.', 'danger')
        return redirect(url_for('index'))

    @app.route('/test-google-config')
    def test_google_config():
        return jsonify({
            "status": "error",
            "message": "Google OAuth libraries are not installed"
        })

@app.route('/view_users', methods=['GET'])
def view_users():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users')
        user = cursor.fetchone()
        #return jsonify(user)
        return session["uid"]

@app.route('/home')
def home():
    if 'username' not in session:
        return redirect(url_for('index'))
    return render_template('homeG.html')

@app.route("/sunday")
def sunday():
    return render_template('sunday.html')

@app.route('/add_task', methods=['POST'])
def add_task():
    task_controller = TaskController()

    # Retrieve form data
    label = request.form.get('label')
    start_time = request.form.get('start_time')
    end_time = request.form.get('end_time')
    uid = session["uid"]
    urgency = request.form.get('urgency')
    save_task = request.form.get('save_task')

    # Add the task and get the task data
    task_data = task_controller.add_task(uid, label, start_time, end_time, urgency, save_task)

    # Prepare the response
    response = task_data

    # Return the response as JSON
    return response


@app.route('/update_task_text', methods=['POST'])
def update_task_text():
    task_controller = TaskController()
    id = request.form.get('id')
    task_text = request.form.get('task_text')
    return task_controller.get_task_by_id(1, id)
    #return task_controller.update_task_text(id, task_text)
    #return jsonify(task_controller)

@app.route('/fetch_task_text')
def fetch_task_text():
    return {'task_text': "Heyyyyy"}

@app.route('/get_task', methods= ['POST'])
def get_task():
    task_controller = TaskController()

    # Retrieve form data
    id = request.form.get('id')
    task_data = task_controller.get_task_by_id(1, id)

    return task_data

@app.route('/get_tasks', methods=['POST'])
def get_tasks():
    task_controller = TaskController()

    # Retrieve tasks by user id
    uid = session["uid"]
    task_data = task_controller.get_tasks_by_uid(uid)

    # Print task data to identify any issues
    print(f"Task Data: {task_data}")

    try:
        return jsonify(task_data)  # This will throw an error if something is not serializable
    except TypeError as e:
        print(f"Serialization Error: {e}")
        return {"error": "Data serialization issue. Please check task data format."}, 500


@app.route('/delete_task', methods = ['POST'])
def delete_task():
    task_controller = TaskController()

    id = request.form.get('id')
    print(task_controller.delete(id))
    return "1"

@app.route('/delete_all', methods = ['POST'])
def delete_all():
        task_controller = TaskController()
        task_controller.delete_all()

@app.route('/day-list')
def day():
    return render_template('day-list.html')
@app.route('/calendar')
def calendar():
    return render_template('calendar.html')

@app.route('/timeout')
def timeout():
    return render_template('timeout.html')
#0. Make a controller
#1. Create a route in this file that accepts data as a POST from new task form
#2. Handle Posted Data using alchemy to put the data into the database
#3. Resolve the comment by using SELECT in alchemy

@app.route('/reward')
def reward():
    return render_template('rewardPage.html')

@app.route('/signout')
def signout():
        session.clear()  # Clear all session data
        return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)


