from flask import Flask
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_wtf import CSRFProtect
from app.config import Config

app = Flask(__name__)
app.config.from_object(Config)

csrf = CSRFProtect(app)

db = SQLAlchemy(app)
migrate = Migrate(app, db)

login_manager = LoginManager(app)
login_manager.login_view = "signUp"
login_manager.login_message = "Please log in to access this page."

from app import routes, models