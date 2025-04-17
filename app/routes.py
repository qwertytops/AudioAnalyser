from flask import render_template, flash, redirect
from app import app

@app.route('/')
@app.route('/index')
def index():
    return render_template('introductoryView.html')

@app.route('/analysis')
def analysis():
    return render_template('analysisView.html')