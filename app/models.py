from flask_login import UserMixin
from app import db, login_manager

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True, nullable=False, index=True)
    username = db.Column(db.String(32), unique=True, nullable=False)
    email = db.Column(db.String(256), unique=True, nullable=False)
    passwordHash = db.Column(db.String(128), nullable=False)
    createdAt = db.Column(db.DateTime, nullable=False)
    updatedAt = db.Column(db.DateTime, onupdate=db.func.current_timestamp(), nullable=False)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class AnalysisResult(db.Model):
    id = db.Column(db.Integer, primary_key=True, nullable=False, index=True)
    title = db.Column(db.String(64), nullable=True)
    description = db.Column(db.String(512), nullable=True)
    createdAt = db.Column(db.DateTime, default=db.func.current_timestamp(), nullable=False)

    userId = db.Column(db.Integer, db.ForeignKey('User.id'), nullable=False)

    fileName = db.Column(db.String(256), nullable=False)
    clipLength = db.Column(db.Float, nullable=False)
    maxLevel = db.Column(db.Float, nullable=False)
    highestFrequency = db.Column(db.Float, nullable=False)
    lowestFrequency = db.Column(db.Float, nullable=False)
    fundamentalFrequency = db.Column(db.Float, nullable=False)

class SharedResults(db.Model):
    id = db.Column(db.Integer, primary_key=True, nullable=False, index=True)
    analysisId = db.Column(db.Integer, db.ForeignKey('AnalysisResult.id'), nullable=False)
    fromUser = db.Column(db.Integer, db.ForeignKey('User.id'), nullable=False)
    toUser = db.Column(db.Integer, db.ForeignKey('User.id'), nullable=False)
    date = db.Column(db.DateTime, nullable=False)