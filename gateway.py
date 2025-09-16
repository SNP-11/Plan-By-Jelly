#from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask import Flask, session
import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash
#from flask_sqlalchemy import SQLAlchemy
from config import Config
from controllers.tasks import TaskController
from db_config import db, app, render_template, request, redirect, url_for, flash, session, jsonify
from services.ai_service import EnhancedTaskAI
import json
import re
import logging
from datetime import datetime, timedelta


# Initialize the enhanced AI helper
task_ai = EnhancedTaskAI()

# Add these routes BEFORE the `if __name__ == '__main__':` line

@app.route('/ai/suggest-duration', methods=['POST'])
def suggest_task_duration():
    """Endpoint for AI-powered task duration suggestions"""
    try:
        data = request.get_json()
        print(f"AI suggestion request received: {data}")

        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        task_description = data.get('task', '')
        age = data.get('age', 13)

        print(f"Processing AI suggestion for: '{task_description}', age: {age}")

        if not task_description:
            return jsonify({'error': 'Task description required'}), 400

        # Get enhanced AI suggestion
        suggestion_result = task_ai.get_duration_suggestion(task_description, age)
        print(f"AI suggestion result: {suggestion_result}")

        if not suggestion_result:
            # Fallback to basic rule-based suggestion
            print("AI suggestion failed, using basic fallback")
            fallback_minutes = 30  # Default
            if 'practice' in task_description.lower():
                fallback_minutes = 90
            elif 'game' in task_description.lower():
                fallback_minutes = 120
            elif 'homework' in task_description.lower():
                fallback_minutes = 45

            suggestion_result = {
                'suggested_minutes': fallback_minutes,
                'difficulty': 3,
                'subject': 'general',
                'reasoning': 'Basic fallback suggestion',
                'source': 'fallback',
                'confidence': 0.5
            }

        return jsonify(suggestion_result)

    except Exception as e:
        print(f"Duration suggestion error: {e}")
        logging.error(f"Duration suggestion error: {e}")

        # Return a basic fallback even on error
        return jsonify({
            'suggested_minutes': 30,
            'difficulty': 3,
            'subject': 'general',
            'reasoning': 'Error fallback - basic suggestion',
            'source': 'error_fallback',
            'confidence': 0.3
        }), 200  # Return 200 instead of 500 so frontend doesn't show error

@app.route('/ai/calculate-points', methods=['POST'])
def calculate_task_points():
    """Endpoint for AI-powered dynamic point calculation"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        task_description = data.get('task_description', '')
        estimated_duration = data.get('estimated_duration')  # in seconds
        actual_duration = data.get('actual_duration')  # in seconds
        urgency = data.get('urgency', 'medium')

        if not estimated_duration or not actual_duration:
            return jsonify({'error': 'Duration data required'}), 400

        # Use enhanced AI validation and point calculation
        completion_result = task_ai.validate_task_completion(
            task_description, estimated_duration, actual_duration, urgency
        )

        return jsonify(completion_result)

    except Exception as e:
        logging.error(f"Points calculation error: {e}")
        return jsonify({'error': 'Failed to calculate points'}), 500

@app.route('/ai/validate-completion', methods=['POST'])
def validate_task_completion():
    """Endpoint for AI-powered task completion validation"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        task_id = data.get('task_id')
        task_description = data.get('task_description', '')
        start_time = data.get('start_time')  # Unix timestamp
        current_time = data.get('current_time')  # Unix timestamp
        estimated_duration = data.get('estimated_duration')  # in seconds
        urgency = data.get('urgency', 'medium')

        if not all([task_id, start_time, current_time]):
            return jsonify({'error': 'Missing required data'}), 400

        # Calculate actual time spent
        actual_duration = current_time - start_time

        # Use AI to validate if enough time has passed
        validation_result = task_ai.validate_task_completion(
            task_description, estimated_duration or actual_duration, actual_duration, urgency
        )

        # Add task-specific information
        validation_result.update({
            'task_id': task_id,
            'actual_duration_minutes': round(actual_duration / 60, 1),
            'estimated_duration_minutes': round((estimated_duration or actual_duration) / 60, 1) if estimated_duration else None
        })

        return jsonify(validation_result)

    except Exception as e:
        logging.error(f"Task completion validation error: {e}")
        return jsonify({'error': 'Failed to validate completion'}), 500

@app.route('/ai/insights', methods=['GET'])
def get_ai_insights():
    """Get AI-powered insights about user's task patterns and recommendations"""
    try:
        if 'uid' not in session:
            return jsonify({'error': 'User not logged in'}), 401

        uid = session['uid']

        # Get user's completed tasks only
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM tasks
                WHERE uid = ? AND completed = 1
                ORDER BY completion_time DESC
                LIMIT 50
            ''', (uid,))
            recent_tasks = cursor.fetchall()

        # Convert to list of dictionaries
        tasks_data = []
        for task in recent_tasks:
            tasks_data.append({
                'id': task[0],
                'uid': task[1],
                'label': task[2],
                'start_time': task[3],
                'end_time': task[4],
                'urgency': task[5] if len(task) > 5 else 'medium',
                'save_task': task[6] if len(task) > 6 else 0
            })

        # Generate AI insights
        insights = generate_ai_insights(tasks_data)

        return jsonify(insights)

    except Exception as e:
        logging.error(f"AI insights error: {e}")
        return jsonify({'error': 'Failed to generate insights'}), 500

def generate_ai_insights(tasks_data):
    """Generate AI-powered insights from task data"""
    if not tasks_data:
        return {
            'total_tasks': 0,
            'recommendations': ['Start by adding some tasks to get personalized insights!'],
            'patterns': {},
            'performance_score': 0
        }

    total_tasks = len(tasks_data)
    urgent_tasks = sum(1 for task in tasks_data if task.get('urgency', '').lower() in ['very important', 'important'])

    # Analyze subjects
    subject_counts = {}
    for task in tasks_data:
        subject = task_ai.categorize_task(task['label'])
        subject_counts[subject] = subject_counts.get(subject, 0) + 1

    most_common_subject = max(subject_counts.keys(), default='general') if subject_counts else 'general'

    # Generate recommendations
    recommendations = []

    if total_tasks < 5:
        recommendations.append("Try to add more tasks to build a consistent routine!")
    elif urgent_tasks > total_tasks * 0.7:
        recommendations.append("Consider planning ahead to reduce urgent tasks and stress.")
    else:
        recommendations.append("Great job maintaining a balanced task schedule!")

    if most_common_subject != 'general':
        recommendations.append(f"You're doing great with {most_common_subject} tasks! Consider mixing in other subjects for variety.")

    # Calculate performance score (1-100)
    performance_score = min(100, max(10, total_tasks * 5 + (100 - urgent_tasks * 2)))

    return {
        'total_tasks': total_tasks,
        'urgent_tasks': urgent_tasks,
        'most_common_subject': most_common_subject,
        'subject_breakdown': subject_counts,
        'recommendations': recommendations,
        'performance_score': performance_score,
        'patterns': {
            'urgency_ratio': round(urgent_tasks / total_tasks * 100, 1) if total_tasks > 0 else 0,
            'variety_score': len(subject_counts)
        }
    }

@app.route('/ai/task-insights', methods=['GET'])
def get_task_insights():
    """Get insights about user's task completion patterns"""
    try:
        if 'uid' not in session:
            return jsonify({'error': 'User not logged in'}), 401
            
        uid = session['uid']
        
        # Query your database for user's completed tasks
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM tasks 
                WHERE uid = ? 
                ORDER BY end_time DESC 
                LIMIT 50
            ''', (uid,))
            completed_tasks = cursor.fetchall()
        
        # Convert to list of dictionaries for easier processing
        tasks_data = []
        for task in completed_tasks:
            tasks_data.append({
                'id': task[0],
                'uid': task[1],
                'label': task[2],
                'start_time': task[3],
                'end_time': task[4],
                'urgency': task[5],
                'save_task': task[6]
            })
        
        insights = analyze_task_patterns(tasks_data)
        return jsonify(insights)
        
    except Exception as e:
        logging.error(f"Task insights error: {e}")
        return jsonify({'error': 'Failed to generate insights'}), 500

def analyze_task_patterns(completed_tasks):
    """Analyze user's task completion patterns for insights"""
    if not completed_tasks:
        return {
            'message': 'Complete more tasks to see insights!',
            'total_tasks_completed': 0,
            'average_time_accuracy': 0,
            'recommendations': ['Start completing tasks to get personalized insights!']
        }
    
    total_tasks = len(completed_tasks)
    
    # Basic analysis
    urgent_tasks = sum(1 for task in completed_tasks if task.get('urgency') == 'high')
    
    # Subject categorization
    subject_counts = {}
    for task in completed_tasks:
        subject = categorize_task(task.get('label', ''))
        subject_counts[subject] = subject_counts.get(subject, 0) + 1
    
    most_common_subject = max(subject_counts.keys(), default='general') if subject_counts else 'general'
    
    recommendations = generate_recommendations(total_tasks, urgent_tasks, most_common_subject)
    
    insights = {
        'total_tasks_completed': total_tasks,
        'most_common_subject': most_common_subject,
        'urgent_tasks_completed': urgent_tasks,
        'subject_breakdown': subject_counts,
        'recommendations': recommendations
    }
    
    return insights

def categorize_task(task_label):
    """Categorize tasks by subject/type for analysis"""
    if not task_label:
        return 'other'
        
    task_lower = task_label.lower()
    
    categories = {
        'math': ['math', 'algebra', 'geometry', 'calculus', 'arithmetic'],
        'science': ['science', 'biology', 'chemistry', 'physics'],
        'english': ['english', 'writing', 'essay', 'reading', 'literature'],
        'history': ['history', 'social studies', 'geography'],
        'art': ['art', 'drawing', 'painting', 'creative'],
        'music': ['music', 'instrument', 'practice'],
        'project': ['project', 'presentation', 'research'],
        'chores': ['chores', 'clean', 'organize'],
        'study': ['study', 'review', 'practice', 'homework']
    }
    
    for category, keywords in categories.items():
        if any(keyword in task_lower for keyword in keywords):
            return category
    
    return 'other'

def generate_recommendations(total_tasks, urgent_tasks, most_common_subject):
    """Generate personalized recommendations based on task patterns"""
    recommendations = []
    
    if total_tasks < 5:
        recommendations.append("Keep it up! Complete more tasks to unlock detailed insights.")
        recommendations.append("Try setting specific start and end times for better planning.")
    elif total_tasks < 20:
        recommendations.append("You're building good task completion habits!")
        recommendations.append("Consider breaking larger tasks into smaller chunks.")
    else:
        recommendations.append("Excellent task completion record!")
        recommendations.append("You've developed strong planning skills.")
    
    if urgent_tasks > total_tasks * 0.7:
        recommendations.append("Try to plan ahead to reduce urgent tasks.")
    
    recommendations.append(f"You seem to focus a lot on {most_common_subject} tasks. Great job staying consistent!")
    
    return recommendations


@app.route('/landingPage')
def landingPage():
    return render_template('landingPage.html')

app.secret_key = 'your_secret_key'  # Use a strong, random secret key

def get_db_connection():
    db_path = os.path.join(os.path.dirname(__file__), 'users.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # This makes rows behave like dictionaries
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
                    password TEXT NOT NULL
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

@app.route('/test-migration')
def test_migration():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(tasks)")
        columns = cursor.fetchall()
        return jsonify([dict(col) for col in columns])
    
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
    try:
        task_controller = TaskController()

        # Retrieve form data
        label = request.form.get('label')
        start_time = request.form.get('start_time')
        end_time = request.form.get('end_time')
        uid = session.get("uid")
        urgency = request.form.get('urgency')
        save_task = request.form.get('save_task')

        # Debug logging
        print(f"Add task request - Label: {label}, Start: {start_time}, End: {end_time}, UID: {uid}, Urgency: {urgency}, Save: {save_task}")

        # Validate required fields
        if not uid:
            return jsonify({'error': 'User not logged in'}), 401
        if not label or not start_time or not end_time:
            return jsonify({'error': 'Missing required fields'}), 400

        # Add the task and get the task data
        task_data = task_controller.add_task(uid, label, start_time, end_time, urgency, save_task)

        print(f"Task created successfully: {task_data}")

        # Return the response as JSON
        return jsonify(task_data)

    except Exception as e:
        print(f"Error adding task: {e}")
        return jsonify({'error': str(e)}), 500


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


@app.route('/complete_task', methods=['POST'])
def complete_task():
    """Mark a task as completed with time tracking data"""
    task_controller = TaskController()

    id = request.form.get('id')
    actual_duration = request.form.get('actual_duration')
    estimated_duration = request.form.get('estimated_duration')
    earned_xp = request.form.get('earned_xp')

    if not id:
        return jsonify({'error': 'Task ID required'}), 400

    # Store time tracking data for AI learning
    if actual_duration and estimated_duration:
        try:
            actual_duration = int(actual_duration)
            estimated_duration = int(estimated_duration)
            earned_xp = int(earned_xp) if earned_xp else 10

            # Store in database for AI learning (you can create a time_tracking table later)
            logging.info(f"Task {id} completed: estimated={estimated_duration}s, actual={actual_duration}s, xp={earned_xp}")

        except ValueError:
            logging.warning(f"Invalid duration data for task {id}")

    completed_task = task_controller.complete_task(id)
    if completed_task:
        return jsonify({
            'success': True,
            'task': completed_task,
            'time_data': {
                'actual_duration': actual_duration,
                'estimated_duration': estimated_duration,
                'earned_xp': earned_xp
            }
        })
    else:
        return jsonify({'error': 'Task not found'}), 404

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
@app.route('/donut')
def donut():
    return render_template('donut.html')

if __name__ == '__main__':
    app.run(debug=True)


