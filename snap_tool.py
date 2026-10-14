import sys, json, base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding
# usage: python3 snap_tool.py <private_key.pem> [snapshot.json]   -> prints {"fetched":..., "docs":{...}}
priv = serialization.load_pem_private_key(open(sys.argv[1], 'rb').read(), None)
s = json.load(open(sys.argv[2] if len(sys.argv) > 2 else 'snapshot.json', encoding='utf-8'))
d = base64.b64decode
key = priv.decrypt(d(s['wk']), padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None))
print(AESGCM(key).decrypt(d(s['iv']), d(s['ct']), None).decode('utf-8'))
