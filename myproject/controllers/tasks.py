from datetime import datetime
from models.tasks import Tasks
from db_config import db
from flask import jsonify
# from .table_schema import TableSchema  # Adjust if necessary

class TaskController:
    def __init__(self):
        pass

    def add_task(self, uid, label, start_time, end_time, urgency, save_task):
        # # Convert to Unix timestamp if they are strings
        # if isinstance(start_time, str):
        #     start_time = int(datetime.fromisoformat(start_time).timestamp())
        # if isinstance(end_time, str):
        #     end_time = int(datetime.fromisoformat(end_time).timestamp())
        
        new_task = Tasks(uid=uid, label=label, start_time=start_time, end_time=end_time, urgency = urgency, save_task = save_task)
        db.session.add(new_task)
        db.session.commit()
        # return jsonify(new_task)
        return (new_task.to_dict())

    # def get_task_by_id(self, uid, id):
    #     fetched_task = db.session.query(Tasks).filter_by(id=id, uid=uid).all()
    #     return jsonify(TableSchema(many=True).dump(fetched_task))
    
    def get_tasks_by_uid(self, uid):
        # Fetch the tasks by user ID
        fetched_tasks = Tasks.query.filter_by(uid=uid).all()
        # Log the fetched tasks for debugging

        tasks_json = [task.to_json() for task in fetched_tasks]
        for task in fetched_tasks:
            print(f"Task ID: {task.id}, Start Time: {task.start_time}, End Time: {task.end_time}, Urgency: {task.urgency}")
            
        print(tasks_json)
        # Return the JSON response with the fetched task data
        return (tasks_json)

    def delete(self, id):
        fetched_task = Tasks.query.get(id)
        if fetched_task:  # Check if the task exists
            db.session.delete(fetched_task)
            db.session.commit()

    def delete_all(self):
        Tasks.query.delete()
        db.session.commit()

    def update_task_text(self, id, task_text):
        fetched_task = Tasks.query.get(id)
        if fetched_task:  # Check if the task exists
            fetched_task.label = task_text
            db.session.commit()
