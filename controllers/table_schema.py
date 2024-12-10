from marshmallow import Schema, fields

class TableSchema(Schema):
    id = fields.Int()
    start_time = fields.Str()  # Or fields.DateTime(format='%Y-%m-%dT%H:%M')
    end_time = fields.Str()    # Or fields.DateTime(format='%Y-%m-%dT%H:%M')
    urgency = fields.Str()
