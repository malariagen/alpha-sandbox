#!/usr/bin/env python

import sqlite3
import time

conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

queries = [
    """SELECT * FROM snp WHERE daf_afr < 0.1 AND daf_sea > 0.9 ORDER BY daf_sea DESC LIMIT 100""",
    """SELECT * FROM snp WHERE chromosome = 'MAL1' AND position > 100000 AND position < 200000 ORDER BY position LIMIT 100""",
    """SELECT * FROM snp WHERE genetext LIKE '%pfmdr%' ORDER BY chromosome, position LIMIT 100"""
]

for query in queries:
    print query
    for _ in range(5): # repeat each query 5 times
        time.sleep(1) # sleep for 1 second between queries
        before = time.clock()
        cursor.execute(query)
        count = sum(1 for _ in cursor)
        after = time.clock()
        print '%s rows in %ss' % (count, after - before)
