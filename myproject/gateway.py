#from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask import Flask, session
import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash
#from flask_sqlalchemy import SQLAlchemy
#from config import Config
from controllers.tasks import TaskController
from db_config import db, app, render_template, request, redirect, url_for, flash, session, jsonify
from services.google_auth import GoogleAuthService

# Allow HTTP for OAuth in development (required for localhost)
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'


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
                    username TEXT UNIQUE,
                    password TEXT,
                    email TEXT UNIQUE,
                    google_id TEXT UNIQUE,
                    name TEXT,
                    picture TEXT,
                    auth_type TEXT DEFAULT 'local'
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
    session.pop('uid', None)
    session.pop('auth_type', None)
    session.pop('oauth_state', None)
    flash('You have been logged out.', 'success')
    return redirect(url_for('index'))

@app.route('/google_login')
def google_login():
    """Initiate Google OAuth login"""
    try:
        google_auth = GoogleAuthService()
        authorization_url, state = google_auth.get_authorization_url()
        session['oauth_state'] = state
        return redirect(authorization_url)
    except Exception as e:
        flash('Failed to initiate Google login. Please try again.', 'danger')
        return redirect(url_for('index'))

@app.route('/google_callback')
def google_callback():
    """Handle Google OAuth callback"""
    google_auth = GoogleAuthService()

    # Get user info from Google
    user_info = google_auth.get_user_info(request.url)

    if not user_info:
        flash('Google authentication failed. Please try again.', 'danger')
        return redirect(url_for('index'))

    # Check if user exists in database
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE google_id = ? OR email = ?',
                      (user_info['google_id'], user_info['email']))
        user = cursor.fetchone()

        if user:
            # User exists, log them in
            user_id = user[0]
            username = user[1] or user_info['name']  # Use name if no username
        else:
            # Create new user
            try:
                cursor.execute('''INSERT INTO users (email, google_id, name, picture, auth_type)
                                 VALUES (?, ?, ?, ?, ?)''',
                              (user_info['email'], user_info['google_id'],
                               user_info['name'], user_info['picture'], 'google'))
                conn.commit()
                user_id = cursor.lastrowid
                username = user_info['name']
            except sqlite3.IntegrityError:
                flash('Account creation failed. Email may already be in use.', 'danger')
                return redirect(url_for('index'))

    # Set session variables
    session['username'] = username
    session['uid'] = user_id
    session['auth_type'] = 'google'
    session.pop('oauth_state', None)  # Clean up

    flash('Successfully logged in with Google!', 'success')
    return redirect(url_for('home'))

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['username']
        password = generate_password_hash(request.form['password'], method='pbkdf2:sha256')
        print(f"Generated password hash: {password}")  # Debug statement
        with get_db_connection() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, password))
                conn.commit()
                flash('User created successfully!', 'success')
            except sqlite3.IntegrityError:
                flash('Username already exists', 'danger')
        return redirect(url_for('index'))
    return render_template('signup.html')

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
    import os
    debug_mode = os.environ.get('FLASK_ENV') != 'production'

    if debug_mode:
        print("Starting Flask app in development mode...")
        app.run(debug=True, host='localhost', port=5000)
    else:
        print("Starting Flask app in production mode...")
        app.run(debug=False, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))


