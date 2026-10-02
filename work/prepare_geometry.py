"""Preserve native dataset files and package an offline comparison viewer."""
from pathlib import Path
import json,zipfile,re,hashlib,gzip,base64,urllib.request,csv
import numpy as np
BASE=Path(__file__).resolve().parents[1];ROOT=BASE/'Precedent_Images';ASSETS=ROOT/'viewer_assets';ASSETS.mkdir(exist_ok=True)
catalog=json.loads((ROOT/'Collection_Index.json').read_text(encoding='utf8'))
mapping=json.loads((BASE/'research/building_files.json').read_text(encoding='utf8'))
archive=zipfile.ZipFile(BASE/'research/BINVOX.zip')
def decoded(s):
 try:return s.encode('cp437').decode('utf8')
 except (UnicodeError,UnicodeEncodeError):return s
entries={decoded(a.filename):a for a in archive.infolist() if a.filename.endswith('.binvox') and not a.filename.startswith('__MACOSX/')}
SOURCE='https://drive.google.com/file/d/1tg78R_WkyCPVBpsG9uJnYkV5JAie3a2D/view'
inventory=[];packed=[]
for b in catalog:
 folder=ROOT/b['folder'];geo=folder/'geometry';geo.mkdir(exist_ok=True);files=[];payload={}
 for path in sorted(mapping[b['dataset_identifier']]):
  raw=archive.read(entries[path]);head,data=raw.split(b'data\n',1);lines=head.decode('ascii').splitlines();meta={s.split()[0]:s.split()[1:] for s in lines[1:]};dims=list(map(int,meta['dim']));rle=np.frombuffer(data,dtype=np.uint8)
  assert len(rle)%2==0 and int(rle[1::2].astype(np.uint64).sum())==int(np.prod(dims)),path
  assert set(np.unique(rle[::2])).issubset({0,1}),path
  aug='TARGETAUGMENTED' in path;angle=int(re.search(r'_(\d+)\.binvox$',path).group(1)) if aug else None
  category='Augmented' if aug else 'Original';res=dims[0];key=f'aug_{angle:03d}_{res}' if aug else f'original_{res}'
  filename=f'{b["folder"]}_{category}'+(f'_{angle:03d}' if aug else '')+f'_{res:03d}.binvox';dest=geo/category/filename;dest.parent.mkdir(exist_ok=True);dest.write_bytes(raw)
  record=dict(key=key,file=str(dest.relative_to(folder)).replace('\\','/'),resolution=res,kind=category,augmentation_angle=angle,archive_path=path,sha256=hashlib.sha256(raw).hexdigest(),bytes=len(raw),translate=list(map(float,meta['translate'])),scale=float(meta['scale'][0]),occupied_voxels=int(np.dot(rle[::2].astype(np.uint64),rle[1::2].astype(np.uint64))))
  files.append(record);payload[key]=base64.b64encode(gzip.compress(raw,mtime=0)).decode();inventory.append(dict(building=b['building'],dataset_identifier=b['dataset_identifier'],**record))
 originals=[f for f in files if f['kind']=='Original'];default=next((f['key'] for f in originals if f['resolution']==128),files[0]['key'])
 bundle=dict(folder=b['folder'],files=payload)
 (geo/'viewer_data.js').write_text('window.ARCH_GEOMETRY=window.ARCH_GEOMETRY||{};window.ARCH_GEOMETRY['+json.dumps(b['folder'])+']='+json.dumps(bundle,separators=(',',':'))+';',encoding='utf8')
 (geo/'geometry.json').write_text(json.dumps(dict(source=SOURCE,dataset_identifier=b['dataset_identifier'],default=default,files=files),ensure_ascii=False,indent=2),encoding='utf8')
 (geo/'README.txt').write_text('ArchComplete / ArchHouse native voxel geometry\n\n'+b['building']+'\n'+b['dataset_identifier']+'\n\n'+('Original models are available at 64, 128, 256 and 512 cubed.\n' if originals else 'ONLY AUGMENTED GEOMETRY is available for this identifier in the public release. These are deformed variants, not a faithful unmodified building model.\n')+'\nThe .binvox files are byte-for-byte copies of the public BINVOX.zip release. geometry.json records their archive paths, SHA-256 checksums and header transforms. Original/ and Augmented/ retain the two dataset categories. Augmentation numbers identify the rotation applied in the authors\u2019 deformation procedure; variants are not just alternate viewing angles.\n\nOpen ../../viewer.html#'+b['folder']+' to compare geometry and images. The viewer displays an exact exposed-voxel surface at native 64, 128 or 256 resolution. Native 512 files are preserved for download; 512 preview is intentionally omitted to keep the browser responsive. Export OBJ in the viewer creates a voxel-derived surface, not an original CAD mesh. Coordinates use the BINVOX scale/translation; physical units are not declared by this release. No artificial smoothing or generated geometry is applied.\n\nPublic source: '+SOURCE+'\nRepository: https://gitlab.cg.tuwien.ac.at/srasoulzadeh/archcomplete\nBINVOX ordering: https://www.patrickmin.com/binvox/binvox.html\n',encoding='utf8')
 images=json.loads((folder/'sources.json').read_text(encoding='utf8'));html=(folder/'index.html').read_text(encoding='utf8');thumbs=re.findall(r'<img loading="lazy" src="(data:image/jpeg;base64,[^"]+)"',html)
 for i,a in enumerate(images):a['thumbnail']=thumbs[i] if i<len(thumbs) else ''
 packed.append(dict(**b,geometry=files,defaultGeometry=default,originalAvailable=bool(originals),imageFiles=images))
 marker='<!-- geometry-viewer-link -->'
 if marker not in html:
  html=html.replace('<h1>',marker+'<p><a href="../viewer.html#'+b['folder']+'">Open 3D + image comparison →</a></p><h1>',1);(folder/'index.html').write_text(html,encoding='utf8')
 (folder/'geometry.html').write_text('<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=../viewer.html#'+b['folder']+'"><a href="../viewer.html#'+b['folder']+'">Open 3D + image viewer</a>',encoding='utf8')
 print(b['number'],b['building'],len(files),'original' if originals else 'AUGMENTED ONLY',flush=True)
(ASSETS/'catalog.js').write_text('window.ARCH_CATALOG='+json.dumps(packed,ensure_ascii=False,separators=(',',':'))+';',encoding='utf8')
with (ROOT/'Geometry_Inventory.csv').open('w',newline='',encoding='utf-8-sig') as f:
 w=csv.DictWriter(f,fieldnames=list(inventory[0]));w.writeheader();w.writerows(inventory)
(ASSETS/'geometry_inventory.json').write_text(json.dumps(inventory,indent=2),encoding='utf8')
vendors={'three.min.js':'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js','OrbitControls.js':'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js','THREE-LICENSE.txt':'https://cdn.jsdelivr.net/npm/three@0.128.0/LICENSE'}
for name,url in vendors.items():
 target=ASSETS/name
 if not target.exists():target.write_bytes(urllib.request.urlopen(url,timeout=30).read())
index=ROOT/'index.html';text=index.read_text(encoding='utf8')
if '<!-- geometry-viewer-link -->' not in text:text=text.replace('<h1>','<!-- geometry-viewer-link --><p><a href="viewer.html">Open 3D + image comparison →</a></p><h1>',1);index.write_text(text,encoding='utf8')
print('Prepared',len(packed),'buildings,',len(inventory),'native models;',sum(b['originalAvailable'] for b in packed),'with originals.',flush=True)
