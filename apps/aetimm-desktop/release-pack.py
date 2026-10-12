import pathlib,tarfile,json,hashlib,os
root=pathlib.Path(__file__).parent
bundle=root/'bundle'
build=json.loads((bundle/'game-build.json').read_text())['build']
out=root/'dist';out.mkdir(exist_ok=True)
archive=out/'aetimm-game-content.tar.gz'
with tarfile.open(archive,'w:gz',format=tarfile.USTAR_FORMAT) as tar:
 for file in sorted(bundle.rglob('*')):
  if file.is_symlink():raise ValueError('Symlink in content bundle')
  if file.is_file():tar.add(file,arcname=file.relative_to(bundle).as_posix(),recursive=False)
manifest={'format':1,'build':build,'minimumLauncher':json.loads((root/'package.json').read_text())['version'],'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'url':f'https://github.com/injammed/ABYS/releases/download/game-content-{build}/aetimm-game-content.tar.gz'}
assert manifest['bytes']<128*1024*1024
(out/'game-content.json').write_text(json.dumps(manifest,indent=2))
print(f'Content pack {build[:12]}: {manifest["bytes"]//1024//1024} MB')
