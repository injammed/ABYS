"""Fetch public USGS NAIP aerial imagery and DC Open Data footprints; no credentials."""
import concurrent.futures, hashlib, io, json, math, pathlib, urllib.parse, urllib.request
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2] / 'public/maps/washington'
ROOT.mkdir(parents=True, exist_ok=True)
BBOX = [-77.08, 38.835, -76.945, 38.925]
ORIGIN = [-77.04, 38.904]
IMAGERY = 'https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer'
BUILDINGS = 'https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Facility_and_Structure/MapServer/1'
def request(endpoint, params):
    with urllib.request.urlopen(endpoint + '?' + urllib.parse.urlencode(params), timeout=90) as r:
        return r.read()
def xy(lon, lat):
    return [round((lon-ORIGIN[0])*111320*math.cos(math.radians(ORIGIN[1])),1),round((ORIGIN[1]-lat)*111320,1)]
def aerial():
    canvas=Image.new('RGB',(4096,3500))
    for row in range(2):
        for col in range(2):
            west=BBOX[0]+(BBOX[2]-BBOX[0])*col/2
            east=west+(BBOX[2]-BBOX[0])/2
            north=BBOX[3]-(BBOX[3]-BBOX[1])*row/2
            south=north-(BBOX[3]-BBOX[1])/2
            data=request(IMAGERY+'/exportImage',dict(bbox=f'{west},{south},{east},{north}',bboxSR=4326,imageSR=4326,size='2048,1750',format='jpg',bandIds='0,1,2',adjustAspectRatio='false',f='image'))
            assert data[:2] == b'\xff\xd8', data[:200]
            canvas.paste(Image.open(io.BytesIO(data)),(col*2048,row*1750))
    canvas.save(ROOT/'aerial.jpg',quality=88)
    data=(ROOT/'aerial.jpg').read_bytes()
    return hashlib.sha256(data).hexdigest()
params=dict(geometry=','.join(map(str,BBOX)),geometryType='esriGeometryEnvelope',inSR=4326,spatialRel='esriSpatialRelIntersects',where='FEATURECODE=2000',f='json')
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    image = pool.submit(aerial)
    ids=json.loads(request(BUILDINGS+'/query',{**params,'returnIdsOnly':'true'}))['objectIds']
    def batch(start):
        d=json.loads(request(BUILDINGS+'/query',dict(objectIds=','.join(map(str,ids[start:start+1000])),outFields='OBJECTID',outSR=4326,returnGeometry='true',maxAllowableOffset=.00002,f='json')))
        assert 'features' in d, d
        return d['features']
    features=[]
    for chunk in pool.map(batch,range(0,len(ids),1000)):
        features.extend(chunk)
    rows=[]
    for f in features:
        rings=f.get('geometry',{}).get('rings',[])
        if not rings: continue
        ring=max(rings,key=len)
        points=[xy(*p[:2]) for p in ring]
        if points[0]==points[-1]: points.pop()
        if len(points)<3: continue
        xs=[p[0] for p in points];zs=[p[1] for p in points]
        w=max(xs)-min(xs);d=max(zs)-min(zs)
        if w<10 or d<10: continue
        if min(xs)<80 and max(xs)>-80 and min(zs)<160 and max(zs)>-140: continue
        if any(min(xs)-12<mx<max(xs)+12 and min(zs)-12<mz<max(zs)+12 for mx,mz in [(-105,240),(150,430),(-180,690),(80,870),(0,1090)]): continue
        height=9 if w*d<450 else 18 if w*d<1800 else 30
        rows.append([height,points])
    rows.sort(key=lambda r:(min(p[1] for p in r[1]),min(p[0] for p in r[1])))
    (ROOT/'buildings.json').write_text(json.dumps(rows,separators=(',',':')))
    metadata=dict(bbox=BBOX,origin=ORIGIN,coordinates='Local metres: east x, south z; north up. Equirectangular approximation.',imagery=IMAGERY,imageryLicense='USGS/USDA NAIP public-domain aerial photography',imagerySHA256=image.result(),footprints=BUILDINGS,footprintLicense='DC Open Data public domain',buildings=len(rows),height='Estimated game heights; not surveyed building heights',fetched='2026-10-04',limitations='Flat ground and simplified footprint extrusions; not photogrammetric facades or interiors.')
    (ROOT/'sources.json').write_text(json.dumps(metadata,indent=2)+'\n')
    print(f'Fetched aerial imagery and {len(rows)} building footprints.')
