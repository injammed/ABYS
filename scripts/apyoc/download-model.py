# SPDX-License-Identifier: MIT
"""Download only revision- and digest-pinned data files; never remote model code."""
import hashlib,json,sys,urllib.request
from pathlib import Path
lock=json.loads((Path(__file__).parent/'model-lock.json').read_text())
directory=Path(sys.argv[1]);directory.mkdir(parents=True,exist_ok=True)
for name,digest in lock['files'].items():
    target=directory/name
    if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest()==digest:continue
    with urllib.request.urlopen(f"https://huggingface.co/{lock['model']}/resolve/{lock['revision']}/{name}",timeout=120) as response:
        payload=response.read()
    if hashlib.sha256(payload).hexdigest()!=digest:raise RuntimeError('Model file digest mismatch')
    target.write_bytes(payload)
print('Model data matches pinned SHA256 digests.')
