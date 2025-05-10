from flask_login import UserMixin
from app import db, login_manager

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True, nullable=False, index=True, autoincrement=True)
    username = db.Column(db.String(32), unique=True, nullable=False)
    email = db.Column(db.String(256), unique=True, nullable=False)
    passwordHash = db.Column(db.String(64), nullable=False) # SHA256 hashes are 64 bits (256 bytes)
    createdAt = db.Column(db.DateTime, nullable=False)
    updatedAt = db.Column(db.DateTime, onupdate=db.func.current_timestamp(), nullable=False)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class AnalysisResult(db.Model):
    id = db.Column(db.Integer, primary_key=True, nullable=False, index=True, autoincrement=True)
    createdAt = db.Column(db.DateTime, default=db.func.current_timestamp(), nullable=False)

    userId = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    fileName = db.Column(db.String(256), nullable=False)
    frequencyArray = db.Column(db.JSON, nullable=False)
    clipLength = db.Column(db.Float, nullable=False)
    maxLevel = db.Column(db.Float, nullable=False)
    highestFrequency = db.Column(db.Float, nullable=False)
    lowestFrequency = db.Column(db.Float, nullable=False)
    fundamentalFrequency = db.Column(db.Float, nullable=False)

class SharedResults(db.Model):
    id = db.Column(db.Integer, primary_key=True, nullable=False, index=True, autoincrement=True)
    analysisId = db.Column(db.Integer, db.ForeignKey('analysis_result.id'), nullable=False)
    fromUser = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    toUser = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.String(256), nullable=False, server_default='')
    date = db.Column(db.DateTime, nullable=False)