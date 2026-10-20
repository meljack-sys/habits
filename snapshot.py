#!/usr/bin/env python3
"""Copies the family's habit data from the database into snapshot.json, encrypted with the family code
(same format as coach.json). Runs on GitHub Actions; FAMILY_CODE comes from a repository secret."""
import json, os, sys, hashlib, datetime, urllib.request
import coach_tool
BASE = os.environ.get('SNAP_BASE', 'https://habits-d86b0-default-rtdb.firebaseio.com/families/39axrr8gwh4dmuad2zhj')
CODE = os.environ.get('FAMILY_CODE', '').strip()
DOCS = ['config','log-p1','log-p2','val-p1','val-p2','profile-p1','profile-p2','exp-p1','exp-p2','budgets','fixed-p1','fixed-p2']
if not CODE:
    print('FAMILY_CODE secret is not set - nothing written'); sys.exit(1)
def get(d):
    with urllib.request.urlopen(BASE + '/' + d + '.json', timeout=30) as r:
        return json.loads(r.read().decode('utf-8'))
docs = {d: get(d) for d in DOCS}
if not docs.get('config'):
    print('config is empty - nothing written'); sys.exit(0)
canon = json.dumps(docs, sort_keys=True, ensure_ascii=False, separators=(',', ':'))
h = hashlib.sha256(canon.encode('utf-8')).hexdigest()
try:
    old = coach_tool.read(CODE, 'snapshot.json')
except Exception:
    old = {}
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
fresh = False
try:
    age = datetime.datetime.now(datetime.timezone.utc) - datetime.datetime.strptime(old.get('fetched', ''), '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=datetime.timezone.utc)
    fresh = age < datetime.timedelta(hours=5)
except Exception:
    pass
if old.get('docs') is not None and old.get('h') == h and fresh and not os.environ.get('FORCE'):
    print('no change'); sys.exit(0)
# cash withdrawals, transfers and loans (ty 'w', 'l', 'p') are money moved, never spending: keep them out of what the coach reads
for d in ('exp-p1', 'exp-p2'):
    items = (docs.get(d) or {}).get('items')
    if isinstance(items, dict):
        for day in list(items):
            if isinstance(items[day], dict):
                items[day] = {k: v for k, v in items[day].items() if not (isinstance(v, dict) and v.get('ty') in ('w', 'l', 'p'))}
                if not items[day]:
                    del items[day]
coach_tool.write(CODE, {'h': h, 'fetched': now, 'updated': now, 'docs': docs}, 'snapshot.json')
print('written', now)
