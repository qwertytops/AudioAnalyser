from flask import render_template, flash, redirect, url_for, session, request, jsonify
from app import app, db
from app.models import User
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

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

@app.route('/share')
def share():
    return render_template('shareView.html')

@app.route('/signUp', methods=['GET', 'POST'])
def signUp():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        #passwordHash = generate_password_hash(password, method='sha256')
        createdAt = datetime.now()
        updatedAt = datetime.now()

        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            flash(f'Username "{username}" is already taken. Please choose another.', 'danger')
            return render_template('signUp.html')
                
        existing_email = User.query.filter_by(email=email).first()
        if existing_email:
            flash(f'Email "{email}" is already registered. Please use another email or try to log in.', 'danger')
            return render_template('signUp.html')

        new_user = User(username=username, email=email, passwordHash=password, createdAt=createdAt, updatedAt=updatedAt)
        db.session.add(new_user)
        db.session.commit()

        # Get redirect URL from form or default to index
        redirect_url = request.form.get('referrer', '/')

        flash('Account created successfully!', 'success')
        return redirect(redirect_url)
    
    return render_template('signUp.html')

@app.route('/account')
def account():
    return render_template('accountView.html')
