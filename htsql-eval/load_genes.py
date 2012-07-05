#!/usr/bin/env python

#
# This script prepares the GFF data and loads it into
# an sqlite database.
# 

# dependencies from standard python libraries
import sqlite3
import urllib2
from zipfile import ZipFile
import os.path
import time
from datetime import datetime

# 3rd party dependencies
from petl import * # pip install petl
from petlx.gff3 import fromgff3 # pip install petlx bx-python


# class to ensure log gets flushed on each write
class Unbuffered:
   def __init__(self, stream):
       self.stream = stream
   def write(self, data):
       self.stream.write(data)
       self.stream.flush()
   def __getattr__(self, attr):
       return getattr(self.stream, attr)

# main routine
if __name__ == '__main__':

    with open('log_load_genes.html', 'w') as logfile:
        
        # set up logging
        logfile = Unbuffered(logfile)
        content = """
<!doctype html>
<title>log</title>
<meta http-equiv="refresh" content="5"/>
<pre>
"""
        print >>logfile, content
        print >>logfile, str(datetime.now())
        logfile.flush()

        def log(message):
            print >>logfile, message
            logfile.flush()

        try:
    
            log('download source data?')
            URL = 'http://plasmodb.org/common/downloads/release-7.2/Pfalciparum/gff/data/Pfalciparum_PlasmoDB-7.2.gff'
            FILE = 'Pfalciparum_PlasmoDB-7.2.gff'
            if os.path.isfile(FILE): # only download if not already done so
                log('already downloaded')
            else:
                log('downloading from %s' % URL)
                u = urllib2.urlopen(URL)
                with open(FILE, 'w') as f:
                    f.write(u.read())
        
            log('set up the database')
            log('set up the database')
            schema = """
CREATE TABLE gene (
    name TEXT NOT NULL,
    chromosome TEXT NOT NULL,
    start INTEGER NOT NULL,
    end INTEGER NOT NULL,
    strand TEXT NOT NULL,
    alias TEXT,
    description TEXT,
    fulltext TEXT,
    CONSTRAINT name_pk PRIMARY KEY (name)
)
"""
            conn = sqlite3.connect('db.sqlite3')
            conn.execute('PRAGMA legacy_file_format=false') # needed otherwise index sort order is ignored
            log('drop gene table')
            conn.execute('DROP TABLE IF EXISTS gene')
            log('create gene table')
            conn.execute(schema)
            
            log('prepare the data for loading')
            gff = fromgff3('Pfalciparum_PlasmoDB-7.2.gff')
            # select only genes
            t0 = selecteq(gff, 'type', 'gene')
            # columns from attributes
            t1 = unpackdict(t0, 'attributes', keys=('ID', 'Name', 'Alias', 'description'))
            # add a 'chromosome' column with MAL.. style naming
            def mk_chromosome(row):
                seqid = row['seqid']
                if seqid.startswith('apidb|Pf3D7_0'):
                    return 'MAL' + seqid[13:]
                elif seqid.startswith('apidb|Pf3D7_'):
                    return 'MAL' + seqid[12:]
                else:
                    return seqid
            t2 = addfield(t1, 'chromosome', mk_chromosome)
            # add a 'fulltext' column
            def mk_fulltext(row):
                s = ''
                for f in ['ID', 'Name', 'Alias', 'description']:
                    if row[f] is not None:
                        s += row[f] + ' '
                return s
            t3 = addfield(t2, 'fulltext', mk_fulltext)
            # choose only the fields we're really interested in
            t4 = cut(t3, 'Name', 'chromosome', 'start', 'end', 'strand', 'Alias', 'description', 'fulltext')
            # type conversions (N.B., start and end already converted by fromgff3()
            typedefs = {
                'Name': unicode,
                'chromosome': unicode,
                'strand': unicode,
                'Alias': unicode,
                'description': unicode,
                'fulltext': unicode
            }
            t5 = convert(t4, typedefs)

            log('load the database')
            p = progress(t5, 1000, out=logfile)
            tosqlite3(p, conn, 'gene', create=False)
        
            # index all fields up and down
            bf = time.time()
            for f in [f.lower() for f in header(t5)]:
                log('index field %s' % f)
                stmtasc = "CREATE INDEX IF NOT EXISTS idx_gene_%s_asc ON gene (%s ASC)" % (f, f)
                stmtdesc = "CREATE INDEX IF NOT EXISTS idx_gene_%s_desc ON gene (%s DESC)" % (f, f)
                conn.execute(stmtasc)
                conn.execute(stmtdesc)
            af = time.time()
            log('total time for index creation: %s' % (af - bf))
        
            log('clean up')
            conn.close()
            
            log('all done')

        except Exception as e:    
            log('Error: %s' % str(e))
            raise

