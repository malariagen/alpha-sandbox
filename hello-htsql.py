# change working directory so relative paths work again
import os
os.chdir(os.path.dirname(__file__))

from htsql import HTSQL

# The address of the database in the form:
#   engine://user:pass@host:port/database
DB = 'sqlite:htsql_demo.sqlite'

application = HTSQL(DB, {
	    'tweak.autolimit': {'limit': 1000},
	    'tweak.cors': {'origin': '*'},
	    'tweak.meta': {}	     
	    })
