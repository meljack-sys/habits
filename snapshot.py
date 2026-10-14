#!/usr/bin/env python3
"""Copies the family's habit data from the database into snapshot.json, encrypted.
Runs on GitHub Actions. The public key lives in snap_pub.pem; only the coach holds the private key."""
import json, os, sys, hashlib, base64, urllib.request, datetime
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding
BASE = os.environ.get('SNAP_BASE', 'https://habits-d86b0-default-rtdb.firebaseio.com/families/39axrr8gwh4dmuad2zhj')
DOCS = ['config','log-p1','log-p2','val-p1','val-p2','profile-p1','profile-p2','exp-p1','exp-p2','budgets','fixed-p1','fixed-p2']
def get(d):
    with urllib.request.urlopen(BASE + '/' + d + '.json', timeout=30) as r:
        return json.loads(r.read().decode('utf-8'))
docs = {d: get(d) for d in DOCS}
if not docs.get('config'):
    print('config is empty - nothing written'); sys.exit(0)
canon = json.dumps(docs, sort_keys=True, ensure_ascii=False, separators=(',', ':'))
h = hashlib.sha256(canon.encode('utf-8')).hexdigest()
try:
    old = json.load(open('snapshot.json', encoding='utf-8'))
except Exception:
    old = {}
if old.get('h') == h:
    print('no change'); sys.exit(0)
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
plain = json.dumps({'fetched': now, 'docs': docs}, ensure_ascii=False).encode('utf-8')
key, iv = os.urandom(32), os.urandom(12)
ct = AESGCM(key).encrypt(iv, plain, None)
pub = serialization.load_pem_public_key(open('snap_pub.pem', 'rb').read())
wk = pub.encrypt(key, padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None))
b = lambda x: base64.b64encode(x).decode()
json.dump({'v': 1, 'h': h, 'fetched': now, 'wk': b(wk), 'iv': b(iv), 'ct': b(ct)}, open('snapshot.json', 'w', encoding='utf-8'), indent=1)
print('written', now, len(plain), 'bytes')
