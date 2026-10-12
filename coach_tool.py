#!/usr/bin/env python3
"""Read or write the private coach notes of 'Habits, Together'.
coach.json in this public repo holds ONLY ciphertext (AES-256-GCM, key = PBKDF2-SHA256(family code)). The app decrypts it in the browser with the family code from the link.
Usage:  python3 coach_tool.py read  <family-code> [coach.json]   -> prints the plain JSON (empty object if the file is missing)
        python3 coach_tool.py write <family-code> <plain.json> [coach.json]   -> encrypts plain.json into coach.json
Needs: pip install cryptography --break-system-packages   (if the import fails)"""
import sys,json,os,base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
ITER=100000
def key(code,salt):
    return PBKDF2HMAC(algorithm=hashes.SHA256(),length=32,salt=salt,iterations=ITER).derive(code.encode())
def read(code,path='coach.json'):
    if not os.path.exists(path):return {}
    c=json.load(open(path,encoding='utf-8'))
    if 'enc' not in c:return c
    e=c['enc'];b=base64.b64decode
    return json.loads(AESGCM(key(code,b(e['salt']))).decrypt(b(e['iv']),b(e['ct']),None).decode('utf-8'))
def write(code,obj,path='coach.json'):
    salt,iv=os.urandom(16),os.urandom(12)
    ct=AESGCM(key(code,salt)).encrypt(iv,json.dumps(obj,ensure_ascii=False).encode('utf-8'),None)
    b=lambda x:base64.b64encode(x).decode()
    out={'v':3,'updated':obj.get('updated',''),'enc':{'alg':'AES-GCM','kdf':'PBKDF2-SHA256','iter':ITER,'salt':b(salt),'iv':b(iv),'ct':b(ct)}}
    json.dump(out,open(path,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
if __name__=='__main__':
    a=sys.argv
    if len(a)>=3 and a[1]=='read':print(json.dumps(read(a[2],a[3] if len(a)>3 else 'coach.json'),ensure_ascii=False,indent=1))
    elif len(a)>=4 and a[1]=='write':write(a[2],json.load(open(a[3],encoding='utf-8')),a[4] if len(a)>4 else 'coach.json')
    else:print(__doc__);sys.exit(1)
