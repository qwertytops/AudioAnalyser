from flask import render_template, flash, redirect, url_for, session, request, jsonify, Blueprint, current_app
from flask_login import current_user, login_required, login_user, logout_user
from sqlalchemy import func
from app import db
from app.models import User, AnalysisResult, SharedResults
from werkzeug.security import generate_password_hash, check_password_hash
from app.forms import LoginForm, SignUpForm
from app.passwordHashing import verify_password
import datetime
import re
import os

main = Blueprint('main', __name__)



@main.route('/')
@main.route('/index')
def index():
    form = LoginForm()
    return render_template('introductoryView.html', form=form)

@main.route('/upload' , methods=['GET', 'POST'])
def upload():
    if request.method == 'POST':
        if 'files' not in request.files:
            flash('No file part')
        
        uploadedFiles = request.files.getlist('files')
        savedFiles = []
        for file in uploadedFiles:
            if file.filename == '':
                continue
            if file:
                filePath = os.path.join(current_app.config['UPLOAD_FOLDER'], file.filename)
                file.save(filePath)
                savedFiles.append(file.filename)
        return redirect(url_for('main.analysis', files=",".join(savedFiles)))
                
    return render_template('uploadView.html')

@main.route('/analysis', methods=['GET'])
def analysis():
    sentFiles = request.args.get('files')
    if sentFiles:
        files = sentFiles.split(',')
        return render_template('analysisView.html', files=files)
    else:
        flash('No files uploaded')

    return render_template('analysisView.html')


@main.route('/cleanupFiles', methods=['POST'])
def cleanupFiles():
    try:
        upload_dir = current_app.config['UPLOAD_FOLDER']
        for filename in os.listdir(upload_dir):
            filePath = os.path.join(upload_dir, filename)
            if os.path.isfile(filePath):
                os.unlink(filePath)
        return jsonify({"status": "success"}), 200
    except Exception as e:
        print(e)
        return jsonify({"status": "error"}), 500
        
@main.route('/save', methods=['GET', 'POST'])
def save():

    if not current_user.is_authenticated:
        return jsonify({'error': 'User not logged in'}), 401

    data = request.get_json()

    analysis = AnalysisResult(
        createdAt=datetime.datetime.now(),
        userId=current_user.id,
        fileName=data.get('filename'),
        frequencyArray=data.get('frequencyArray'),
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


@main.route('/share', methods = ['GET','POST'])
@login_required
def share(analysisId=0):
    if request.method == "POST":
        data = request.get_json()
        try:
            analysisId = int(data.get('analysisId'))
            toUsername = data.get('to')
        except (ValueError, TypeError) as e:
            return jsonify({'error': 'Invalid analysis ID format'}), 400

        if not analysisId or not toUsername:
            return jsonify({'error': 'Missing analysisId or recipient username'}), 400
        
        # Check if the analysis exists and belongs to the current user
        analysis = AnalysisResult.query.filter_by(id=analysisId, userId=current_user.id).first()
        if not analysis:
            return jsonify({'error': 'Analysis not found or not authorized'}), 404
        
        # Check if the recipient user exists
        recipient = User.query.filter_by(username=toUsername).first()
        if not recipient:
            return jsonify({'error': 'Recipient user not found'}), 404
        
        sharedResults = SharedResults(
            analysisId=analysisId,
            fromUser=current_user.id,
            toUser=recipient.id,
            message = data.get('message') or "No message",
            date=datetime.datetime.now()
        )
        db.session.add(sharedResults)
        db.session.commit()
        flash("Analysis shared successfully!")

        return jsonify({'message': 'Analysis saved successfully!'}), 200
    else:
        myAnalyses = AnalysisResult.query.filter_by(userId=current_user.id).all()
        if not myAnalyses:
            flash("You have no analyses to share.", "warning")
            return redirect(url_for('main.index'))
        
        # Get the most recent analysis if analysisId is not provided
        most_recent_analysis = AnalysisResult.query.filter_by(userId=current_user.id).order_by(AnalysisResult.createdAt.desc()).first()
        analysisId = analysisId if analysisId != 0 else (most_recent_analysis.id if most_recent_analysis else None)

        return render_template('shareView.html', 
                               myAnalyses=[(x.id, x.fileName) for x in myAnalyses],
                               analysisId=analysisId)

@main.route('/account')
@login_required
def account():
    myAnalyses = AnalysisResult.query.filter_by(userId=current_user.id).all()
    
    # Get shared analyses with related data
    shared_analyses_data = (
        db.session.query(
            SharedResults,
            AnalysisResult,
            User
        )
        .join(
            AnalysisResult,
            SharedResults.analysisId == AnalysisResult.id
        )
        .join(
            User,
            SharedResults.fromUser == User.id
        )
        .filter(SharedResults.toUser == current_user.id)
        .all()
    )

    # Format the data for the template
    formattedShared = [{
        'id': shared.id,
        'fileName': analysis.fileName,
        'fromUser': from_user.username,
        'date': shared.date.strftime('%Y-%m-%d %H:%M'),
        'message': shared.message,
        'clipLength': analysis.clipLength,
        'maxLevel': analysis.maxLevel,
        'fundamentalFrequency': analysis.fundamentalFrequency
    } for shared, analysis, from_user in shared_analyses_data]

    return render_template('accountView.html', 
                         username=current_user.username,
                         email=current_user.email,
                         joinDate=current_user.createdAt,
                         myAnalyses=myAnalyses,
                         sharedAnalyses=formattedShared)

# New route to delete user's analysis history
@main.route('/deleteHistory', methods=['POST'])
@login_required
def deleteHistory():
    try:
        # Delete all analysis results for the current user
        AnalysisResult.query.filter_by(userId=current_user.id).delete()
        
        # Delete any shared results where this user is the sender
        SharedResults.query.filter_by(fromUser=current_user.id).delete()
        
        # Commit the changes to the database
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Analysis history deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error deleting history: {str(e)}'}), 500


@main.route('/updateProfile', methods=['POST'])
@login_required
def updateProfile():
    try:
        data = request.get_json()
        
        # Get the data from the request
        new_username = data.get('username')
        new_email = data.get('email')
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')
        
        # Verify the current password
        if not verify_password(current_password, current_user.passwordHash):
            return jsonify({'success': False, 'message': 'Incorrect current password', 'field': 'currentPassword'}), 400
        
        # Check if the username is being changed and if it's already taken
        if new_username != current_user.username:
            existing_user = User.query.filter_by(username=new_username).first()
            if existing_user:
                return jsonify({'success': False, 'message': f'Username "{new_username}" is already taken. Please choose another.', 'field': 'username'}), 400
        
        # Check if the email is being changed and if it's already taken
        if new_email != current_user.email:
            existing_email = User.query.filter_by(email=new_email).first()
            if existing_email:
                return jsonify({'success': False, 'message': f'Email "{new_email}" is already registered. Please use another email.', 'field': 'email'}), 400
        
        # Validate email format
        if not is_valid_email(new_email):
            return jsonify({'success': False, 'message': 'Please enter a valid email address.', 'field': 'email'}), 400
        
        # Update the user information
        current_user.username = new_username
        current_user.email = new_email
        
        # Update password if provided
        if new_password:
            # Validate new password
            if not is_valid_password(new_password):
                return jsonify({'success': False, 'message': 'Password must be at least 8 characters and contain both letters and numbers.', 'field': 'newPassword'}), 400
            current_user.passwordHash = generate_password_hash(new_password)
        
        # Update the timestamp
        current_user.updatedAt = datetime.datetime.now()
        
        # Save changes to database
        db.session.commit()
        
        # Update session
        session['username'] = current_user.username
        
        return jsonify({'success': True, 'message': 'Profile updated successfully!'}), 200
    
    except Exception as e:
        db.session.rollback()
        print(f"Error updating profile: {str(e)}")
        return jsonify({'success': False, 'message': f'Error updating profile: {str(e)}'}), 500

@main.route('/deleteAnalysis/<int:analysis_id>', methods=['POST'])
@login_required
def deleteAnalysis(analysis_id):
    try:
        # Find the analysis by ID and ensure it belongs to the current user
        analysis = AnalysisResult.query.filter_by(id=analysis_id, userId=current_user.id).first_or_404()
        
        # Delete any shared results related to this analysis
        SharedResults.query.filter_by(analysisId=analysis_id).delete()
        
        # Delete the analysis
        db.session.delete(analysis)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Analysis deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting analysis: {str(e)}")
        return jsonify({'success': False, 'message': f'Error deleting analysis: {str(e)}'}), 500

@main.route('/getAnalysis/<int:analysis_id>', methods=['GET'])
@login_required
def getAnalysis(analysis_id):
    try:
        # Find the analysis by ID and ensure it belongs to the current user
        analysis = AnalysisResult.query.filter_by(id=analysis_id, userId=current_user.id).first_or_404()
        
        # Format the data to be returned
        analysis_data = {
            'fileName': analysis.fileName,
            'clipLength': round(analysis.clipLength, 2),
            'maxLevel': round(analysis.maxLevel, 2),
            'highestFrequency': round(analysis.highestFrequency, 2),
            'lowestFrequency': round(analysis.lowestFrequency, 2),
            'fundamentalFrequency': round(analysis.fundamentalFrequency, 2),
            'frequencyArray': analysis.frequencyArray
        }
        
        return jsonify({'success': True, 'data': analysis_data}), 200
    except Exception as e:
        print(f"Error retrieving analysis: {str(e)}")
        return jsonify({'success': False, 'message': f'Error retrieving analysis: {str(e)}'}), 500

@main.route('/shareAnalysis/<int:analysis_id>', methods=['POST'])
@login_required
def shareAnalysis(analysis_id):
    try:
        data = request.get_json()
        username = data.get('username')
        message = data.get('message', '')
        
        # Check if the analysis exists and belongs to the current user
        analysis = AnalysisResult.query.filter_by(id=analysis_id, userId=current_user.id).first_or_404()
        
        # Find the user to share with
        to_user = User.query.filter_by(username=username).first()
        if not to_user:
            return jsonify({'success': False, 'message': f'User "{username}" not found.'}), 404
        
        # Prevent sharing with yourself
        if to_user.id == current_user.id:
            return jsonify({'success': False, 'message': 'You cannot share an analysis with yourself.'}), 400
        
        # Check if already shared with this user
        existing_share = SharedResults.query.filter_by(
            analysisId=analysis_id,
            fromUser=current_user.id,
            toUser=to_user.id
        ).first()
        
        if existing_share:
            return jsonify({'success': False, 'message': f'Analysis already shared with {username}.'}), 400
        
        # Create a new shared result
        shared_result = SharedResults(
            analysisId=analysis_id,
            fromUser=current_user.id,
            toUser=to_user.id,
            message=message,
            date=datetime.datetime.now()
        )
        
        db.session.add(shared_result)
        db.session.commit()
        
        return jsonify({'success': True, 'message': f'Analysis successfully shared with {username}!'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error sharing analysis: {str(e)}")
        return jsonify({'success': False, 'message': f'Error sharing analysis: {str(e)}'}), 500
    
# New route to delete user's account
@main.route('/deleteAccount', methods=['POST'])
@login_required
def deleteAccount():
    try:
        data = request.get_json()
        password = data.get('password')
        
        # Verify password
        if not verify_password(password, current_user.passwordHash):
            return jsonify({'success': False, 'message': 'Incorrect password'}), 400
        
        # Delete user's analysis results
        AnalysisResult.query.filter_by(userId=current_user.id).delete()
        
        # Delete shared results where user is sender or receiver
        SharedResults.query.filter((SharedResults.fromUser == current_user.id) | 
                                  (SharedResults.toUser == current_user.id)).delete()
        
        # Store user ID before deletion
        user_id = current_user.id
        
        # Log the user out
        logout_user()
        
        # Delete the user
        User.query.filter_by(id=user_id).delete()
        
        # Commit the changes to the database
        db.session.commit()
        
        # Clear session data
        session.clear()
        
        return jsonify({'success': True, 'message': 'Account deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error deleting account: {str(e)}'}), 500


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



@main.route('/signUp', methods=['GET', 'POST'])
def signUp():
    form = SignUpForm()
    if form.validate_on_submit():
        passwordHash = generate_password_hash(form.password.data)
        createdAt = datetime.datetime.now()
        updatedAt = datetime.datetime.now()

        new_user = User(
            username=form.username.data, 
            email=form.email.data, 
            passwordHash=passwordHash, 
            createdAt=createdAt, 
            updatedAt=updatedAt
        )
        db.session.add(new_user)
        db.session.commit()

        # Get redirect URL from form or default to index
        redirect_url = request.args.get('redirect', '/?showLogin=true')

        flash('Account created successfully!', 'success')
        return redirect(redirect_url)
    
    return render_template('signUp.html', form=form)

@main.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        login_id = form.login_id.data
        password = form.password.data
        
        # Check if login_id is an email or username
        if '@' in login_id:
            # Look up user by email
            user = User.query.filter_by(email=login_id).first()
        else:
            # Look up user by username
            user = User.query.filter_by(username=login_id).first()
        
        # Check if user exists and password is correct
        from app.passwordHashing import verify_password
        if user and verify_password(password, user.passwordHash):
            # Log in the user with Flask-Login
            login_user(user)
            
            # Set session variables
            session['user_id'] = user.id
            session['username'] = user.username
            
            flash('Login successful!', 'success')
            
            # Redirect to the requested page or default to index
            next_page = request.args.get('next')
            if not next_page or not next_page.startswith('/'):
                next_page = url_for('main.index')
                
            return redirect(next_page)
        else:
            flash('Invalid username/email or password. Please try again.', 'danger')
            return redirect(url_for('main.index', showLogin='true'))
            
    # If GET request or login failed, show the login form
    return render_template('introductoryView.html', form=form)

@main.route('/logout')
def logout():
    # Clear user session
    session.pop('user_id', None)
    session.pop('username', None)
    
    # For flask-login
    logout_user()
    
    # Redirect to home page
    return redirect(url_for('main.index'))

@main.route('/api/analysis/<int:analysis_id>', methods=['GET'])
@login_required
def get_analysis(analysis_id):
    analysis = AnalysisResult.query.filter_by(id=analysis_id, userId=current_user.id).first()
    if not analysis:
        return jsonify({'error': 'Analysis not found'}), 404

    return jsonify({
        'id': analysis.id,
        'fileName': analysis.fileName,
        'clipLength': analysis.clipLength,
        'maxLevel': analysis.maxLevel,
        'highestFrequency': analysis.highestFrequency,
        'lowestFrequency': analysis.lowestFrequency,
        'fundamentalFrequency': analysis.fundamentalFrequency,
        'frequencyArray': analysis.frequencyArray,
        'createdAt': analysis.createdAt.strftime('%Y-%m-%d %H:%M:%S')
    })

@main.route('/api/users', methods=['GET'])
@login_required
def get_users():
    query = request.args.get('q', '').strip()
    if not query:
        users = User.query.all()
        return jsonify([user.username for user in users])

    users = User.query.filter(User.username.ilike(f'%{query}%')).all()
    return jsonify([user.username for user in users])