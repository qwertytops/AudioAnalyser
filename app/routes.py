from flask import render_template, flash, redirect, url_for, session, request, jsonify
from flask_login import current_user, login_required
from sqlalchemy import func
from app import app, db
from app.models import User, AnalysisResult
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import re


@app.route('/')
@app.route('/index')
def index():
    return render_template('introductoryView.html')

@app.route('/upload')
def upload():
    return render_template('uploadView.html')

@app.route('/analysis')
def analysis():
    return render_template('analysisView.html')

@app.route('/save', methods=['GET', 'POST'])
def save():

    if not current_user.is_authenticated:
        return jsonify({'error': 'User not logged in'}), 401

    data = request.get_json()

    analysis = AnalysisResult(
        id=db.session.query(func.max(AnalysisResult.id)).scalar(), # update database so this autoincrements
        title="default_title",
        description="default_description",
        createdAt=datetime.datetime.now(),
        userId=current_user.id,
        fileName=data.get('filename'),
        clipLength=data.get('clipLength'),
        maxLevel=data.get('maxLevel'),
        highestFrequency=data.get('highestFrequency'),
        lowestFrequency=data.get('lowestFrequency'),
        fundamentalFrequency=data.get('fundamentalFrequency')
    )

    db.session.add(analysis)
    db.session.commit()
    print("saved!")
    return jsonify({'message': 'Analysis saved successfully!'}), 200



@app.route('/share')
@login_required
def share():
    return render_template('shareView.html')

@app.route('/account')
def account():
    return render_template('accountView.html')


# Function to validate email format
def is_valid_email(email):
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(email_regex, email) is not None

# Function to validate password requirements
def is_valid_password(password):
    # Minimum 8 characters, contains at least one letter and one number
    return (len(password) >= 8 and 
            re.search(r'[A-Za-z]', password) and 
            re.search(r'\d', password))



@app.route('/signUp', methods=['GET', 'POST'])
def signUp():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        # Server-side validation
        errors = []
        
        # Validate username
        if not username or len(username) < 3:
            errors.append('Username must be at least 3 characters long.')
        
        # Validate email
        if not email or not is_valid_email(email):
            errors.append('Please enter a valid email address.')
        
        # Validate password
        if not password or not is_valid_password(password):
            errors.append('Password must be at least 8 characters long and contain both letters and numbers.')
        
        # Check for existing username/email
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            errors.append(f'Username "{username}" is already taken. Please choose another.')
            
        existing_email = User.query.filter_by(email=email).first()
        if existing_email:
            errors.append(f'Email "{email}" is already registered. Please use another email or try to log in.')
        
        # If there are any validation errors, flash them and return to the form
        if errors:
            for error in errors:
                flash(error, 'danger')
            return render_template('signUp.html')
        
        # If validation passes, create the new user
        passwordHash = generate_password_hash(password)
        createdAt = datetime.now()
        updatedAt = datetime.now()

        new_user = User(username=username, email=email, passwordHash=passwordHash, createdAt=createdAt, updatedAt=updatedAt)
        db.session.add(new_user)
        db.session.commit()

        # Get redirect URL from form or default to index
        redirect_url = request.form.get('referrer', '/')

        flash('Account created successfully!', 'success')
        return redirect(redirect_url)
    
    return render_template('signUp.html')