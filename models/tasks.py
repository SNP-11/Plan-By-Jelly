from sqlalchemy import Column, Integer, String, BigInteger
from db_config import db
import json

class Tasks(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    uid = db.Column(db.Integer, nullable=False)
    label = db.Column(db.String(80), nullable=False)
    start_time = db.Column(db.BigInteger, nullable=False)  # Store as Unix timestamp (int)
    end_time = db.Column(db.BigInteger)  # Store as Unix timestamp (int)
    urgency = db.Column(db.String(80), nullable = False)
    save_task = db.Column(db.Integer, nullable = True)
    completed = db.Column(db.Integer, default=0)  # 0 = not completed, 1 = completed
    completion_time = db.Column(db.BigInteger, nullable=True)  # When task was completed

    def to_dict(self):
        return {
            "id": self.id,
            "uid": self.uid,
            "label": self.label,
            "start_time": self.start_time if self.start_time is not None else 0,  # Return 0 if None
            "end_time": self.end_time if self.end_time is not None else 0,  # Return 0 if None
            "urgency" : self.urgency,
            "save_task" : self.save_task,
            "completed": self.completed if self.completed is not None else 0,
            "completion_time": self.completion_time if self.completion_time is not None else 0
        }

    def to_json(self):
        return (self.to_dict())

    def __repr__(self):
        return json.dumps(self.to_dict())
