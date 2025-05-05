
from flask import render_template, flash, redirect, request, jsonify, url_for
from flask_login import current_user, login_required
from sqlalchemy import func
from app import app, db
from app.models import AnalysisResult
import datetime


uploadFolder = 'app/static/uploads/'
app.config['UPLOAD_FOLDER'] = uploadFolder
@app.route('/')
@app.route('/index')
def index():
    return render_template('introductoryView.html')

@app.route('/upload' , methods=['GET', 'POST'])
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
                filePath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
                file.save(filePath)
                savedFiles.append(file.filename)
        return redirect(url_for('analysis', files=",".join(savedFiles)))
                
    return render_template('uploadView.html')

@app.route('/analysis', methods=['GET'])
def analysis():
    sentFiles = request.args.get('files')
    if sentFiles:
        files = sentFiles.split(',')
        return render_template('analysisView.html', files=files)
    else:
        flash('No files uploaded')

    return render_template('analysisView.html')


@app.route('/cleanupFiles', methods=['POST'])
def cleanupFiles():
    try:
        for filename in os.listdir(app.config['UPLOAD_FOLDER']):
            filePath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            if os.path.isfile(filePath):
                os.unlink(filePath)
        return jsonify({"status": "success"}), 200
    except Exception as e:
        print(e)
        return jsonify({"status": "error"}), 500
        

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

@app.route('/signUp')
def signUp():
    return render_template('signUp.html')

@app.route('/account')
def account():
    return render_template('accountView.html')
