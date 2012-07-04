#!/usr/bin/env python

#
# This script prepares the SNP data and loads it into
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

    with open('log_load_snps.html', 'w') as logfile:
        
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
            URL = 'http://explorercat.sanger.ac.uk/ExplorerCat-pgv/resources/2/snp_complete_pgv.csv.zip'
            ZIPFILE = 'snp_complete_pgv.csv.zip'
            FILE = 'snp_complete_pgv.csv'
            if os.path.isfile(FILE): # only download if not already done so
                log('already downloaded')
            else:
                u = urllib2.urlopen(URL)
                with open(ZIPFILE, 'w') as f:
                    log('downloading from %s' % URL)
                    f.write(u.read())
                z = ZipFile(ZIPFILE)
                log('extracting zip file')
                z.extract(FILE)
    
            log('set up the database')
            schema = """
CREATE TABLE snp (
    id INTEGER NOT NULL,
    chromosome TEXT NOT NULL,
    position INTEGER NOT NULL,
    snpname TEXT NOT NULL,
    gene TEXT,
    aminoacid TEXT,
    nraf_afr REAL,
    nraf_sea REAL,
    nraf_png REAL,
    lcaf_afr REAL,
    lcaf_sea REAL,
    lcaf_png REAL,
    maf_afr REAL,
    maf_sea REAL,
    maf_png REAL,
    daf_afr REAL,
    daf_sea REAL,
    daf_png REAL,
    mutation TEXT,
    refallele TEXT,
    nonrefallele TEXT,
    outgroupallele TEXT,
    ancestralallele TEXT,
    derivedallele TEXT,
    privateallele TEXT,
    privatepopulation TEXT,
    geneid TEXT,
    genealiases TEXT,
    genedescription TEXT,
    xreference TEXT,
    genetext TEXT,
    CONSTRAINT id_pk PRIMARY KEY (id)
)
    """
            conn = sqlite3.connect('db.sqlite3')
            conn.execute('PRAGMA legacy_file_format=false') # needed otherwise index sort order is ignored
            log('drop snp table')
            conn.execute('DROP TABLE IF EXISTS snp')
            log('create snp table')
            conn.execute(schema)

            log('prepare the data for loading')
            t0 = fromcsv(FILE)
            t1 = convertall(t0, lambda v: None if v == '-' else v) # normalise nulls
            type_conversions = {
                'ID': int, 
                'Chromosome': unicode, 
                'Position': int, 
                "snpName": unicode,
                "Gene": unicode,
                "AminoAcid": unicode,
                "NRAF_AFR": float,
                "NRAF_SEA": float,
                "NRAF_PNG": float,
                "LCAF_AFR": float,
                "LCAF_SEA": float,
                "LCAF_PNG": float,
                "MAF_AFR": float,
                "MAF_SEA": float,
                "MAF_PNG": float,
                "DAF_AFR": float,
                "DAF_SEA": float,
                "DAF_PNG": float,
                "Mutation": unicode,
                "RefAllele": unicode,
                "NonrefAllele": unicode,
                "OutgroupAllele": unicode,
                "AncestralAllele": unicode,
                "DerivedAllele": unicode,
                "PrivateAllele": unicode,
                "PrivatePopulation": unicode,
                "GeneID": unicode,
                "GeneAliases": unicode,
                "GeneDescription": unicode,
                "xReference": unicode 
            }
            t2 = fieldconvert(t1, type_conversions) # prepare datatypes
        
            # add a column with all gene text for gene search
            def make_genetext(row):
                text = u''
                for f in ['GeneID', 'GeneAliases', 'GeneDescription']:
                    if row[f] is not None:
                        text += u' ' + unicode(row[f]).lower()
                return text
            t3 = addfield(t2, 'GeneText', make_genetext)
        
            log('load the database')
            p = progress(t3, 20000, out=logfile)
            tosqlite3(p, conn, 'snp', create=False)
        
            # index all fields up and down
            bf = time.time()
            for f in [f.lower() for f in header(t3)]:
                log('index field %s' % f)
                stmtasc = "CREATE INDEX IF NOT EXISTS idx_snp_%s_asc ON snp (%s ASC)" % (f, f)
                stmtdesc = "CREATE INDEX IF NOT EXISTS idx_snp_%s_desc ON snp (%s DESC)" % (f, f)
                conn.execute(stmtasc)
                conn.execute(stmtdesc)
            log('index chromosome, position')
            conn.execute("CREATE INDEX IF NOT EXISTS idx_snp_chromosome_position_asc ON snp (chromosome ASC, position ASC)")
            af = time.time()
            log('total time for index creation: %s' % (af - bf))
        
            log('clean up')
            conn.close()
            
            log('all done')

        except Exception as e:    
            log('Error: %s' % str(e))
            raise




