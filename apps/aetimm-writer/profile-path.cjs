const path=require('node:path'),fs=require('node:fs');
// Electron used the old productName for packaged profiles and the package name in development.
// Preserve explicit profiles (including the isolated native smoke test profile).
function profilePath(appData,current,exists=fs.existsSync){
 const legacy=path.join(appData,'AETIMM Writer'),development=path.join(appData,'aetimm-writer');
 if(![legacy,development,path.join(appData,'vnnova')].includes(current))return current;
 const hasDraft=folder=>['recovery.aetimm','previous.aetimm'].some(file=>exists(path.join(folder,file)));
 return !hasDraft(legacy)&&hasDraft(development)?development:legacy;
}
module.exports={profilePath};
