from flask import render_template, flash, redirect
from app import app

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

@app.route('/signUp')
def signUp():
    return render_template('signUp.html')

@app.route('/account')
def account():
    return render_template('accountView.html')
