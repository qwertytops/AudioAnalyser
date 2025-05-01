from flask import render_template, flash, redirect, request, jsonify
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
def save():
    userLoggedIn = False # change to actually check if user is logged in

    data = request.get_json()

    analysis = AnalysisResult(
        id=None,
        title=None,
        description=None,
        createdAt=datetime.datetime.now(),
        userId=None,
        fileName=data.get('filename'),
        clipLength=data.get('clipLength'),
        maxLevel=data.get('maxLevel'),
        highestFrequency=data.get('highestFrequency'),
        lowestFrequency=data.get('lowestFrequency'),
        fundamentalFrequency=data.get('fundamentalFrequency')
    )

    if userLoggedIn:
        # complete analysis fields
        db.session.add(analysis)
        db.session.commit()
        return jsonify({'message': 'Analysis saved successfully!'}), 200
    else:
        return jsonify({'error': 'User not logged in'}), 401


@app.route('/share')
def share():
    return render_template('shareView.html')

@app.route('/signUp')
def signUp():
    return render_template('signUp.html')

