#from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask import Flask, session
import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash
#from flask_sqlalchemy import SQLAlchemy
#from config import Config
from controllers.tasks import TaskController
from db_config import db, app, render_template, request, redirect, url_for, flash, session, jsonify
from flask import jsonify
import json


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
    conn.execute('''\
                 CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL
                 );\
                 ''')
    conn.execute('''\
                 CREATE TABLE tasks (
                    id INTEGER NOT NULL, 
                    uid INTEGER NOT NULL, 
                    label VARCHAR(80) NOT NULL, 
                    start_time INTEGER NOT NULL, 
                    end_time INTEGER, urgency VARCHAR(80), 
                    PRIMARY KEY (id)
                 );\
                 ''')
    

    # 1) git managment
    # 2) use alter
    conn.close()
    return render_template('loginG.html')

@app.route('/view_tasks_db')
def view_tasks_db():
    conn = get_db_connection()
    result = conn.execute(("SELECT * FROM tasks"))
    rows = [(row) for row in result.fetchall()]
    return json.dumps(rows, indent=4)

@app.route('/view_users_html')
def view_users_html():
    conn = get_db_connection()
    result = conn.execute("SELECT * FROM users")
    rows = result.fetchall()

    # Define the table structure
    table_html = """
    <table border="1">
        <thead>
            <tr>
                <th>id</th>
                <th>username</th>
                <th>password</th>
            </tr>
        </thead>
        <tbody>
    """

    # Add rows to the table
    for row in rows:
        table_html += f"""
        <tr>
            <td>{row[0]}</td>
            <td>{row[1]}</td>
            <td>{row[2]}</td>
        </tr>
        """

    table_html += """
        </tbody>
    </table>
    """

    return table_html

@app.route('/view_tasks_html')
def view_tasks_html():
    conn = get_db_connection()
    result = conn.execute("SELECT * FROM tasks")
    rows = result.fetchall()

    # Define the table structure
    table_html = """
    <table border="1">
        <thead>
            <tr>
                <th>id</th>
                <th>uid</th>
                <th>label</th>
                <th>start_time</th>
                <th>end_time</th>
                <th>urgency</th>
            </tr>
        </thead>
        <tbody>
    """

    # Add rows to the table
    for row in rows:
        table_html += f"""
        <tr>
            <td>{row[0]}</td>
            <td>{row[1]}</td>
            <td>{row[2]}</td>
            <td>{row[3]}</td>
            <td>{row[4]}</td>
            <td>{row[5]}</td>
        </tr>
        """

    table_html += """
        </tbody>
    </table>
    """

    return table_html


@app.route('/')
def index():
    #db.drop_all()
    #db.create_all()
    if 'username' in session:
        return redirect(url_for('home'))
    return render_template('loginG.html')

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    print(f"Login attempt - Username: {username}, Password: {password}")  # Debug statement
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()
        id = user[0]
        print(f"Fetched user: {user}")  # Debug statement

    if user:
        stored_password = user[2]
        print(f"Stored password hash: {stored_password}")  # Debug statement
        if check_password_hash(stored_password, password):
            session['username'] = username
            session['uid'] = id 
            flash('Login successful!', 'success')
            return redirect(url_for('home'))  # Redirect to a secure page on successful login
        else:
            flash('Invalid username or password', 'danger')
            print('Password mismatch - Entered Password:', password)  # Debug statement
            print('Password mismatch - Stored Password Hash:', stored_password)  # Debug statement
    else:
        flash('User not found', 'danger')
        print('User not found')  # Debug statement
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
    return render_template('HomeG.html')

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
    saveTask = request.form.get('saveTask')

    # Add the task and get the task data
    task_data = task_controller.add_task(uid, label, start_time, end_time, urgency, saveTask)
    
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
#0. Make a controller 
#1. Create a route in this file that accepts data as a POST from new task form 
#2. Handle Posted Data using alchemy to put the data into the database 
#3. Resolve the comment by using SELECT in alchemy

if __name__ == '__main__':
    app.run(debug=True)
