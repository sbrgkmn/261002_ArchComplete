from pathlib import Path
import json,hashlib,numpy as np,csv
BASE=Path(__file__).resolve().parents[1];ROOT=BASE/'Precedent_Images';ASSETS=ROOT/'viewer_assets'
checks=json.loads((BASE/'work/geometry_viewer_checks.json').read_text());data=json.loads((ASSETS/'catalog.js').read_text(encoding='utf8')[len('window.ARCH_CATALOG='):-1]);byfolder={b['folder']:b for b in data};verified=[];native_count=0
for result in checks['results']:
 b=byfolder[result['folder']];f=ROOT/b['folder'];manifest=json.loads((f/'geometry/geometry.json').read_text());source=next(x for x in b['geometry'] if x['key']==result['source'])
 assert source['resolution']==(128 if b['originalAvailable'] else 64)
 for a in b['geometry']:
  raw=(f/a['file']).read_bytes();assert hashlib.sha256(raw).hexdigest()==a['sha256'];native_count+=1
 raw=(f/source['file']).read_bytes().split(b'data\n',1)[1];rle=np.frombuffer(raw,dtype=np.uint8);d=source['resolution'];grid=np.repeat(rle[::2],rle[1::2]).reshape((d,d,d));occupied=int(grid.sum());faces=0
 for axis in range(3):
  lo=[slice(None)]*3;hi=lo.copy();lo[axis]=slice(None,-1);hi[axis]=slice(1,None)
  faces+=int(np.count_nonzero(grid[tuple(lo)]!=grid[tuple(hi)]))+int(np.take(grid,0,axis=axis).sum())+int(np.take(grid,-1,axis=axis).sum())
 assert occupied==result['occupied'] and faces==result['surfaceVoxelFaces'],b['folder']
 objfile=f'geometry/{b["folder"]}_{source["key"]}_Voxel_Surface.obj';text=(f/objfile).read_text();verts=[];triangles=[]
 for line in text.splitlines():
  if line.startswith('v '):verts.append([float(x) for x in line.split()[1:]])
  elif line.startswith('f '):triangles.append([int(x)-1 for x in line.split()[1:]])
 v=np.asarray(verts);idx=np.asarray(triangles);volume=float(np.einsum('ij,ij->i',v[idx[:,0]],np.cross(v[idx[:,1]],v[idx[:,2]])).sum()/6);expected=occupied/(d**3)*source['scale']**3
 assert abs(volume-expected)<1e-7*max(1,abs(expected)),(b['folder'],volume,expected)
 derived=dict(file=objfile,source_key=source['key'],source_archive_path=source['archive_path'],resolution=d,triangles=len(triangles),method='Exact exposed voxel surface; coplanar voxel faces merged into rectangles and triangulated; BINVOX header transform preserved. Not an original CAD mesh.',sha256=hashlib.sha256((f/objfile).read_bytes()).hexdigest())
 manifest['derived_obj']=derived;(f/'geometry/geometry.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8');b['derivedObj']=derived
 readme=f/'geometry/README.txt';s=readme.read_text(encoding='utf8');s+='\nReady-to-import derived OBJ: '+Path(objfile).name+'\nResolution: '+str(d)+' cubed. This is an exact voxel surface export with the BINVOX header transform, not a CAD source model.\n';readme.write_text(s,encoding='utf8')
 verified.append(dict(folder=b['folder'],source=source['key'],occupied=occupied,surface_voxel_faces=faces,triangles=len(triangles),signed_mesh_volume=volume,expected_voxel_volume=expected))
(ASSETS/'catalog.js').write_text('window.ARCH_CATALOG='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';',encoding='utf8')
(BASE/'work/geometry_validation.json').write_text(json.dumps(dict(native_files_verified=native_count,models_verified=verified),indent=2))
with (ROOT/'Geometry_Summary.csv').open('w',newline='',encoding='utf-8-sig') as f:
 rows=[dict(building=b['building'],folder=b['folder'],dataset_identifier=b['dataset_identifier'],original_available=b['originalAvailable'],native_files=len(b['geometry']),preview_resolution=b['derivedObj']['resolution'],derived_obj=b['folder']+'/'+b['derivedObj']['file'],geometry_manifest=b['folder']+'/geometry/geometry.json') for b in data];w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
readme='''ARCHCOMPLETE — GEOMETRY + IMAGE VIEWER

Open viewer.html in Chrome or Edge. No installation, internet connection, or local server is required. Keep viewer.html, viewer_assets/, and the named building folders together.

98 precedent folders contain 1,520 original dataset BINVOX files (380 original-resolution files and 1,140 augmented variants). Each folder also contains a ready-to-import voxel-derived OBJ: original 128³ for 95 precedents, augmented 64³ for the remaining 3.

Ennis House, La Rotonda and Muuratsalo Experimental House have ONLY AUGMENTED geometry in this public release. These variants are deformed geometry, not simply rotated copies of the building. The viewer labels them prominently.

Use the building list or search field to choose a precedent. Drag the model to orbit, scroll to zoom, and right-drag to pan. View presets, up-axis control, wireframe, and an adjustable cutaway support comparison. Cutaways clip the surface and do not create new section caps. Compare any exterior, interior or floor-plan image in the right panel. Full image opens the retained original; large images use a 1,600-pixel display copy in the comparison panel.

Model options include the original and every available augmented variant. Original preview resolutions are 64³, 128³ and 256³. Native 512³ files can be downloaded under Dataset files & precedent notes. The preview uses an exact block surface at the chosen resolution, not a smoothed or AI-generated reconstruction.

Every building's geometry/Original and geometry/Augmented subfolders contain byte-for-byte copies of the native dataset files. geometry/geometry.json provides source archive paths, SHA-256 checksums, header transforms, and derived OBJ provenance. Export OBJ exports the full displayed model at its selected resolution; cutaway and wireframe are viewing controls and do not modify the exported geometry. Dataset units are unspecified.

Comparison notes and review status are saved locally in the current browser. Export review notes downloads a JSON file for safekeeping. Notes are not sent anywhere and do not modify the images or dataset files.

Source dataset: https://gitlab.cg.tuwien.ac.at/srasoulzadeh/archcomplete
Native archive: https://drive.google.com/file/d/1tg78R_WkyCPVBpsG9uJnYkV5JAie3a2D/view
The repository's active download provides BINVOX. Its OBJ download code is commented out; the included OBJ files here are explicitly derived from the public voxels.
BINVOX specification: https://www.patrickmin.com/binvox/binvox.html
Viewer renderer: Three.js r128 and OrbitControls, included locally under MIT license (viewer_assets/THREE-LICENSE.txt).

Verified: all 1,520 native file checksums; all 98 default model loads; voxel occupancy and exposed-face counts against independent calculations; exported mesh volumes against occupied-voxel volumes; 256³ preview, augmented variants, cutaway, image filters, notes, exports, and narrow-screen layout. Tested offline using Chrome with all HTTP requests blocked.
'''
(ROOT/'VIEWER_README.txt').write_text(readme,encoding='utf8')
p=ROOT/'README.txt';s=p.read_text(encoding='utf8');marker='\n\n3D GEOMETRY AND COMPARISON VIEWER\n'
if marker in s:s=s.split(marker)[0]
p.write_text(s+marker+'Open viewer.html to compare the dataset models with the reference images. Each building now includes a geometry/ folder with native BINVOX files and a voxel-derived OBJ. See VIEWER_README.txt and Geometry_Summary.csv for details, availability exceptions and usage.\n',encoding='utf8')
print('Verified',native_count,'native checksums and',len(verified),'derived OBJ volumes; wrote geometry provenance and usage guide.')
