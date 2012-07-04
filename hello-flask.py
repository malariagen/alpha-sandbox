from flask import Flask, render_template
app = Flask(__name__)


@app.route("/<name>")
def index(name=None):
    return "Hello %s from Flask!" % name

@app.route('/hello/<name>')
def hello(name=None):
    return render_template('hello.html', name=name)


if __name__ == "__main__":
    app.run()
else:
    application = app # for wsgi
    # Change working directory so relative paths (and template lookup) work again
    import os
    os.chdir(os.path.dirname(__file__))
