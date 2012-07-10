#!/usr/bin/env python

from htsql import HTSQL
import time

db = HTSQL('sqlite:db.sqlite3')

queries = [
    """/snp.filter(daf_afr < 0.1 & daf_sea > 0.9).sort(daf_sea-).limit(100)""",
    """/snp.filter(chromosome = 'MAL1' & position > 100000 & position < 200000).sort(position).limit(100)""",
    """/snp.filter(genetext ~ 'pfmdr').sort(chromosome, position).limit(100)"""
]

for query in queries:
    print query
    for _ in range(5): # repeat each query 5 times
        time.sleep(1) # sleep for 1 second between queries
        before = time.clock()
        result = db.produce(query)
        count = sum(1 for _ in result)
        after = time.clock()
        print '%s rows in %ss' % (count, after - before)
