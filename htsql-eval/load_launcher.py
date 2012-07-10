import os
import bottle
#bottle.debug(True)

from bottle import Bottle, route, get, post, response, redirect
from subprocess import Popen

app = Bottle()

@app.post('/load_snps')
def load_snps():
    cmd = os.path.dirname(__file__) + "/load_snps.py"
    pid = Popen([cmd]).pid
    redirect("../log_load_snps?pid=%s" % pid)

@app.post('/load_genes')
def load_genes():
    cmd = os.path.dirname(__file__) + "/load_genes.py"
    pid = Popen([cmd]).pid
    redirect("../log_load_genes?pid=%s" % pid)

application = app
