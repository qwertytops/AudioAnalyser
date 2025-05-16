from flask import Flask
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_wtf import CSRFProtect
from app.config import Config
from flask import Flask


db = SQLAlchemy()
migrate = Migrate()
csrf = CSRFProtect()

login_manager = LoginManager()
login_manager.login_view = "main.signUp"
login_manager.login_message = "Please log in to access this page."

def createApp(config):
    app = Flask(__name__)
    app.config.from_object(config)

    app.config['UPLOAD_FOLDER'] = 'app/static/uploads/' 

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    csrf.init_app(app)

    from app.routes import main as main_bp
    app.register_blueprint(main_bp)
    return app


from app import routes, models