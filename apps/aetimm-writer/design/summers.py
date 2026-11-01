"""Build Summers from original centerline drawings informed by the owner's alphabet.
No existing typeface is used. Missing numerals/punctuation are designed companions.
Requires fonttools, shapely, brotli. Run from any working directory.
"""
from pathlib import Path
import json,base64,math,unicodedata
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.basePen import BasePen
from fontTools.svgLib.path import parse_path
from fontTools.ttLib import TTFont
from shapely.geometry import LineString
from shapely.ops import unary_union
from shapely.geometry.polygon import orient
ROOT=Path(__file__).resolve().parents[2]/'item-web/public/writer'
# SVG coordinates: cap top 0, baseline 70, x-height approximately 36.
D={
'A':(59,'M3 70L27 3 55 69M13 45L43 43'),
'B':(48,'M9 70L13 2C48 -2 48 28 13 33C55 27 54 67 9 70'),
'C':(51,'M47 10C21 -9 3 7 5 37C5 67 23 79 47 61'),
'D':(53,'M8 69L12 2C61 -5 61 67 8 69'),
'E':(45,'M42 3L11 2 6 70 42 66M10 33L35 29'),
'F':(45,'M8 70L12 3 44 4M10 33L35 31'),
'G':(55,'M47 12C33 -6 4 4 5 35C3 63 23 79 47 62L48 37 30 39'),
'H':(54,'M12 2L5 70M49 1L42 70M9 35L45 32'),
'I':(30,'M8 2L28 0M19 1L12 70M2 71L25 68'),
'J':(43,'M22 2L41 0M33 1L28 53C25 81 4 74 3 53'),
'K':(52,'M12 2L5 70M48 1L10 38 49 68'),
'L':(45,'M12 1L6 70 44 67'),
'M':(69,'M4 70L14 3 29 57 54 1 62 69'),
'N':(58,'M5 70L13 3 45 65 53 0'),
'O':(54,'M29 2C4 -4 -1 44 10 62C23 85 51 68 50 32C49 11 42 1 29 2Z'),
'P':(49,'M8 70L14 2C51 -4 56 30 11 34'),
'Q':(55,'M29 2C4 -4 -1 44 10 62C23 85 51 68 50 32C49 11 42 1 29 2ZM29 46L55 76'),
'R':(51,'M8 70L14 2C51 -4 55 30 12 34L48 70'),
'S':(49,'M44 9C25 -11 3 6 7 24C13 40 46 29 45 52C44 76 14 80 4 63'),
'T':(55,'M3 5L53 0M31 3L23 70'),
'U':(56,'M12 2L7 48C4 81 43 78 46 48L52 0'),
'V':(55,'M5 2L19 71 53 4'),
'W':(77,'M4 2L15 70 37 19 46 70 74 4'),
'X':(56,'M5 2L49 70M53 1L5 68'),
'Y':(55,'M4 2L24 35 51 1M24 35L18 71'),
'Z':(56,'M5 3L52 0 5 70 53 68'),
'a':(36,'M29 42C16 32 6 44 5 58C1 77 22 74 29 43L26 69 34 70'),
'b':(36,'M12 1L5 68C22 79 37 61 30 46C23 34 10 44 8 56'),
'c':(32,'M29 42C13 29 3 47 4 61C4 76 21 74 29 66'),
'd':(37,'M30 43C17 32 5 44 4 59C1 77 22 73 28 50M34 1L27 69 35 70'),
'e':(34,'M5 54L29 48C29 34 10 33 5 50C-1 70 15 79 31 66'),
'f':(29,'M8 86L15 16C17 2 26 -1 29 7M2 40L27 37'),
'g':(37,'M29 43C15 32 4 43 4 58C2 75 23 73 29 42L25 79C22 96 3 96 3 83'),
'h':(37,'M12 1L5 70M8 53C16 28 33 34 30 55L29 70'),
'i':(18,'M10 39L6 69 13 68M12 21L12 23'),
'j':(21,'M15 39L10 80Q8 98 -2 88M17 21L17 23'),
'k':(36,'M12 1L5 70M32 37L9 54 32 71'),
'l':(20,'M13 1L6 68 16 70'),
'm':(54,'M8 39L4 70M6 53C11 34 25 31 23 51L21 69M23 51C32 29 49 34 46 53L45 71'),
'n':(36,'M9 39L5 70M7 52C17 30 32 34 30 54L28 70'),
'o':(35,'M19 38C3 34 0 59 7 67C20 80 33 66 31 50C31 40 25 37 19 38Z'),
'p':(37,'M11 38L4 92M9 49C26 25 39 47 28 62Q20 75 8 66'),
'q':(37,'M30 43C17 32 5 44 4 59C1 77 22 73 29 43L25 90 35 86'),
'r':(29,'M9 39L5 70M8 51Q16 33 28 40'),
's':(30,'M27 42C15 30 2 42 7 50C12 57 28 53 25 63C21 75 9 75 3 68'),
';':(15,'M8 44L8 46M9 66L4 78'),
't':(27,'M17 16L11 61Q10 73 25 68M2 40L26 37'),
'u':(37,'M9 39L6 59C2 80 26 75 30 42M32 39L28 69 36 70'),
'v':(34,'M5 39L13 71 33 40'),
'w':(52,'M4 39L11 70 24 45 31 70 51 40'),
'x':(34,'M5 39L29 70M32 38L3 69'),
'y':(36,'M5 39L14 66M34 38L9 90'),
'z':(33,'M5 40L30 38 4 70 30 68'),
'0':(46,'M25 3C4 1 2 32 6 56C10 78 37 78 41 43C43 19 40 3 25 3ZM12 57L35 18'),
'1':(30,'M5 17L20 3 13 70M4 71L26 69'),
'2':(46,'M5 17C11 -4 42 -5 41 19C40 35 21 42 5 69L43 67'),
'3':(43,'M6 8C36 -7 50 20 22 33C50 27 48 64 26 70Q10 77 3 64'),
'4':(46,'M34 2L4 47 43 45M34 2L29 70'),
'5':(44,'M42 2L11 4 6 35C39 22 49 56 27 68Q11 78 3 64'),
'6':(44,'M38 5C15 -1 0 38 7 60C15 82 45 70 40 48C37 31 16 30 7 49'),
'7':(46,'M4 4L43 2 17 71M13 36L36 33'),
'8':(44,'M24 2C3 0 0 23 22 34C48 45 44 74 19 71C-4 69 0 44 22 34C46 24 44 1 24 2Z'),
'9':(44,'M36 30C28 51 1 38 7 16C13 -6 43 -1 39 29L24 71'),
'.':(15,'M7 68L8 70'),
',':(15,'M9 66L4 78'),
':':(15,'M8 44L8 46M7 67L7 69'),
'!':(16,'M13 1L8 51M7 68L8 70'),
'?':(40,'M3 16C7 -2 36 -4 35 16C34 30 17 31 16 50M14 68L15 70'),
"'":(13,'M9 2L6 18'),
'"':(26,'M9 2L6 18M23 3L19 18'),
'-':(32,'M3 43L29 41'),
'_':(48,'M2 76L45 75'),
'(': (25,'M23 -3C4 15 0 56 15 83'),
')':(25,'M10 -3C26 20 23 62 3 83'),
'[':(25,'M24 -2L10 -1 3 81 19 80'),
']':(25,'M7 -2L23 -1 16 81 1 80'),
'{':(29,'M28 -2Q12 -4 14 20Q15 35 4 40Q14 43 10 60Q7 81 22 83'),
'}':(29,'M8 -2Q24 -4 22 20Q21 35 32 40Q22 43 26 60Q29 81 14 83'),
'/':(39,'M37 -2L2 80'),
'\\':(39,'M5 -2L36 80'),
'+':(45,'M4 41L42 39M25 20L21 61'),
'=':(44,'M5 33L42 31M4 48L40 46'),
'<':(40,'M37 20L4 42 34 62'),
'>':(40,'M5 20L37 40 3 62'),
'*':(36,'M20 14L16 49M3 23L32 41M33 19L3 44'),
'#':(48,'M19 9L10 70M38 7L29 69M5 30L45 27M3 51L43 48'),
'%':(62,'M9 70L56 2M18 3C1 0 0 29 15 28C29 28 31 1 18 3ZM48 44C31 41 30 70 45 69C59 69 61 42 48 44Z'),
'&':(54,'M49 68L13 27C-1 8 29 -9 32 11C34 28 -2 36 6 58C14 84 41 64 49 40'),
'@':(66,'M45 30C29 17 20 35 24 47C29 58 44 48 46 31L42 49C63 56 71 15 45 5C12 -7 -2 27 7 55Q19 84 54 68'),
'$':(47,'M42 14C21 -3 1 17 9 29C15 40 46 31 41 55Q36 76 5 62M30 -6L18 80'),
'^':(40,'M4 28L23 4 37 26'),
'`':(20,'M6 0L17 14'),
'~':(47,'M4 43Q13 28 26 40Q38 49 44 33'),
'|':(15,'M10 -5L4 82')
}
# Additional punctuation uses the same pen vocabulary.
D.update({'–':(50,'M3 43L47 40'),'—':(78,'M3 43L75 39'),'‘':(15,'M10 0L5 14'),'’':(15,'M10 0L5 14'),'“':(29,'M11 0L6 14M25 1L20 15'),'”':(29,'M11 0L6 14M25 1L20 15'),'…':(49,'M7 68L8 70M23 68L24 70M39 68L40 70'),'•':(22,'M10 39L12 41'),'–':(50,'M3 43L47 40')})
class Flatten(BasePen):
 def __init__(self): super().__init__(None);self.lines=[];self.points=[]
 def _moveTo(self,p):
  if self.points:self.lines.append(self.points)
  self.points=[p]
 def _lineTo(self,p):self.points.append(p)
 def _curveToOne(self,p1,p2,p3):
  p0=self._getCurrentPoint()
  for i in range(1,21):
   t=i/20;self.points.append(tuple((1-t)**3*p0[k]+3*(1-t)**2*t*p1[k]+3*(1-t)*t*t*p2[k]+t**3*p3[k] for k in (0,1)))
 def _qCurveToOne(self,p1,p2):
  p0=self._getCurrentPoint()
  for i in range(1,17):
   t=i/16;self.points.append(tuple((1-t)**2*p0[k]+2*(1-t)*t*p1[k]+t*t*p2[k] for k in (0,1)))
 def _closePath(self):self.points.append(self.points[0]);self._endPath()
 def _endPath(self):
  if self.points:self.lines.append(self.points);self.points=[]
def outline(path):
 p=Flatten();parse_path(path,p);p._endPath()
 shapes=[LineString(line).buffer(1.18+(i%3)*.07,quad_segs=5,cap_style=1,join_style=1) for i,line in enumerate(p.lines) if len(line)>1]
 return unary_union(shapes)
def glyph(shape):
 pen=TTGlyphPen(None)
 if shape is not None:
  for poly in ([shape] if shape.geom_type=='Polygon' else shape.geoms):
   poly=orient(poly,sign=1)
   for ring in [poly.exterior,*poly.interiors]:
    coords=[(round((x+5)*10),round(700-y*10)) for x,y in ring.coords[:-1]]
    if not coords:continue
    pen.moveTo(coords[0])
    for pt in coords[1:]:pen.lineTo(pt)
    pen.closePath()
 return pen.glyph()
shapes={c:outline(p) for c,(w,p) in D.items()};widths={c:w for c,(w,p) in D.items()}
# Common accented Latin letters remain handwriting, not fallback typography.
accents={'\u0301':'M17 -9L30 -22','\u0300':'M16 -22L27 -9','\u0302':'M10 -10L22 -22 33 -11','\u0303':'M9 -13Q16 -24 24 -16Q32 -8 38 -20','\u0308':'M14 -17L15 -15M32 -17L33 -15','\u030a':'M22 -25C9 -25 10 -9 22 -9C34 -9 35 -25 22 -25Z','\u0327':'M22 71L16 80Q33 77 26 89L16 91'}
from shapely.affinity import translate
for cp in range(0xc0,0x180):
 c=chr(cp);n=unicodedata.normalize('NFD',c)
 if len(n)==2 and n[0] in shapes and n[1] in accents:
  mark=outline(accents[n[1]])
  if n[0].islower() and n[1]!='\u0327':mark=translate(mark,yoff=32)
  shapes[c]=unary_union([shapes[n[0]],mark]);widths[c]=widths[n[0]]
for c,base in [('Ø','O'),('ø','o')]:
 shapes[c]=unary_union([shapes[base],outline('M4 70L48 2' if c.isupper() else 'M3 72L32 36')]);widths[c]=widths[base]
Dextra={'ß':(42,'M7 72L12 21C14 -4 43 1 34 21L22 34C53 35 45 75 24 69'),'æ':(55,'M27 44C14 33 3 44 4 59C2 77 22 73 27 44L24 67M25 54L51 48C51 33 30 34 26 50C21 71 39 78 53 65'),'Æ':(72,'M3 70L29 2 38 70M14 43L34 42M29 2L69 1M34 33L60 30M38 70L68 67')}
for c,(w,p) in Dextra.items():shapes[c]=outline(p);widths[c]=w
order=['.notdef','space']+[f'uni{ord(c):04X}' for c in shapes];g={'.notdef':glyph(outline('M3 0L43 0 43 70 3 70Z')),'space':glyph(None)};metrics={'.notdef':(520,38),'space':(280,0)};cmap={32:'space',160:'space'}
for c,shape in shapes.items():
 name=f'uni{ord(c):04X}';g[name]=glyph(shape);metrics[name]=(round((widths[c]+10)*10),g[name].xMin if hasattr(g[name],'xMin') else round((shape.bounds[0]+5)*10));cmap[ord(c)]=name
fb=FontBuilder(1000,isTTF=True);fb.setupGlyphOrder(order);fb.setupCharacterMap(cmap);fb.setupGlyf(g);fb.setupHorizontalMetrics(metrics);fb.setupHorizontalHeader(ascent=1000,descent=-260);fb.setupNameTable({'familyName':'Summers','styleName':'Regular','uniqueFontIdentifier':'AETIMM:Summers-Regular:1.000','fullName':'Summers Regular','psName':'Summers-Regular','version':'Version 1.000','copyright':'Original Summers letterforms created for the handwriting owner, 2026.','description':'Handwriting-based typeface for vnnova. Alphabet informed by supplied sample; numerals, punctuation and accents are designed additions.'});fb.setupOS2(sTypoAscender=1000,sTypoDescender=-260,sTypoLineGap=0,usWinAscent=1000,usWinDescent=260,sxHeight=340,sCapHeight=700,fsType=0);fb.setupPost();fb.setupMaxp();fb.font['head'].created=fb.font['head'].modified=3876336000
(ROOT/'fonts').mkdir(exist_ok=True);ttf=ROOT/'fonts/Summers-Regular.ttf';fb.save(ttf);f=TTFont(ttf);f.flavor='woff2';f.save(ROOT/'fonts/Summers-Regular.woff2')
ttf64=base64.b64encode(ttf.read_bytes()).decode();woff64=base64.b64encode((ROOT/'fonts/Summers-Regular.woff2').read_bytes()).decode();css='@font-face{font-family:Summers;src:url(data:font/woff2;base64,'+woff64+') format("woff2");font-weight:400;font-style:normal;font-display:swap;}'
(ROOT/'fonts.js').write_text('(function(root){const api='+json.dumps({'css':css,'ttf':ttf64})+';if(typeof module!=="undefined")module.exports=api;else root.WriterFonts=api;})(typeof window!=="undefined"?window:globalThis);\n')
(ROOT/'fonts/summers.css').write_text(css+'\n')
print('Summers built:',len(cmap),'characters;',ttf.stat().st_size,'TTF bytes')
