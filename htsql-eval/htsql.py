import os
from htsql import HTSQL

# The address of the database in the form:
#   engine://user:pass@host:port/database
# N.B., cannot use relative paths under WSGI, need to workaround
DB = 'sqlite:' + os.path.dirname(__file__) + '/db.sqlite3'

application = HTSQL(DB, {
	    'tweak.autolimit': {'limit': 1000},
	    'tweak.cors': {'origin': '*'},
	    'tweak.meta': {},
            'tweak.shell': {}
	    })
