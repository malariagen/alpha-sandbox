# Change working directory so relative paths (and template lookup) work again
import os
os.chdir(os.path.dirname(__file__))

import bottle
bottle.debug(True)

from bottle import Bottle, route, get, post, response, redirect
from subprocess import Popen

app = Bottle()

@app.post('/load_snps')
def load_snps():
    pid = Popen(["./load_snps.py"]).pid
    redirect("../log_load_snps?pid=%s" % pid)

application = app
