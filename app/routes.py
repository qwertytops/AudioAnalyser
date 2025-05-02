from flask import render_template, flash, redirect, request, jsonify
from flask_login import current_user, login_required
from sqlalchemy import func
from app import app, db
from app.models import AnalysisResult
import datetime

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
@login_required
def save():
    data = request.get_json()

    analysis = AnalysisResult(
        id=db.session.query(func.max(AnalysisResult.id)).scalar(),
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
    return jsonify({'message': 'Analysis saved successfully!'}), 200



@app.route('/share')
@login_required
def share():
    return render_template('shareView.html')

@app.route('/signUp')
def signUp():
    return render_template('signUp.html')

