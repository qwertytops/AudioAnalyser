# Flask-Login Initialization (in app/__init__.py)
from flask_login import LoginManager

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'  # Specify the login route
login_manager.login_message_category = 'info'  # Set flash message category

# User loader function (in app/__init__.py)
@login_manager.user_loader
def load_user(user_id):
    return models.User.query.get(int(user_id))

# User Model Flask-Login Integration (in app/models.py)
from flask_login import UserMixin

class User(UserMixin, db.Model):
    # UserMixin provides:
    # is_authenticated, is_active, is_anonymous, get_id()
    
    # The rest of your User model...
    
# Flask-Login decorators and functions in routes (in app/routes.py)
from flask_login import current_user, login_user, logout_user, login_required

# Login route
@app.route('/login', methods=['GET', 'POST'])
def login():
    # If user is already logged in, redirect to index
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    form = LoginForm()
    if form.validate_on_submit():
        # Find user by username
        user = User.query.filter_by(username=form.username.data).first()
        
        # Check if user exists and password is correct
        if user is None or not user.check_password(form.password.data):
            flash('Invalid username or password', 'danger')
            return redirect(url_for('login'))
        
        # Log user in
        login_user(user, remember=form.remember_me.data)
        
        # Redirect to the page the user was trying to access or to the default page
        next_page = request.args.get('next')
        if not next_page or not next_page.startswith('/'):
            next_page = url_for('index')
        return redirect(next_page)
    
    return render_template('login.html', title='Sign In', form=form)

# Logout route
@app.route('/logout')
def logout():
    logout_user()
    flash('You have been logged out successfully.', 'success')
    return redirect(url_for('index'))

# Protected routes using @login_required decorator
@app.route('/upload')
@login_required
def upload():
    return render_template('uploadView.html', title='Upload Audio')

@app.route('/analysis')
@login_required
def analysis():
    # Get user's analysis results
    results = AnalysisResult.query.filter_by(userId=current_user.id).all()
    return render_template('analysisView.html', title='Analysis', results=results)

@app.route('/share')
@login_required
def share():
    # Protected route implementation...
    pass

@app.route('/account')
@login_required
def account():
    # Protected route implementation...
    pass

# LoginForm in forms.py
class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember_me = BooleanField('Remember Me')
    submit = SubmitField('Sign In')
