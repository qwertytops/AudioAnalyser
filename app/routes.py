from flask import render_template, flash, redirect, request, url_for
import os
from app import app

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
        # TODO: letting analysis handle files onclick
        return render_template('analysisView.html', files=files)
    else:
        flash('No files uploaded')

    return render_template('analysisView.html')

@app.route('/share')
def share():
    return render_template('shareView.html')

@app.route('/signUp')
def signUp():
    return render_template('signUp.html')
