from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('sidebar.html')

@app.route('/day-list')
def day():
    return render_template('day-list.html')

# @app.route('/sunday')
# def sunday():
#     return render_template('sunday.html')

if __name__ == '__main__':
    app.run(debug=True)
