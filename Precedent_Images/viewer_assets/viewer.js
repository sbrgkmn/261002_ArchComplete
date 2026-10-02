/* Offline geometry + reference-image comparison. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),catalog=window.ARCH_CATALOG;
  let building,source,filter='all',visibleImages=[],imageIndex=0,mesh,meshData,worker,request=0,grid,box;
  let reviews={};try{reviews=JSON.parse(localStorage.getItem('archcomplete-reviews-v1')||'{}');}catch(e){}
  const storageKey='archcomplete-reviews-v1';
  const viewport=$('viewport');let renderer,scene,camera,controls;
  const clipping=new THREE.Plane(new THREE.Vector3(0,-1,0),.5);let cutSign=1;
  try {
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0xedf0ec);renderer.localClippingEnabled=true;renderer.outputEncoding=THREE.sRGBEncoding;viewport.append(renderer.domElement);
    scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-1,1,1,-1,.001,100);camera.position.set(1,1,1);
    controls=new THREE.OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.12;controls.minZoom=.2;controls.maxZoom=30;
    scene.add(new THREE.HemisphereLight(0xffffff,0x667971,.48));const light=new THREE.DirectionalLight(0xfff4df,.7);light.position.set(2,4,3);scene.add(light);const fill=new THREE.DirectionalLight(0xd6e9ff,.15);fill.position.set(-3,1,-2);scene.add(fill);
    new ResizeObserver(resize).observe(viewport);
    (function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);})();
  } catch(e){$('loading').textContent='3D requires WebGL in Chrome or Edge. Reference images are still available. '+e.message;}
  function resize(){if(!renderer)return;const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h,false);const aspect=w/h;camera.left=-aspect*.65;camera.right=aspect*.65;camera.top=.65;camera.bottom=-.65;camera.updateProjectionMatrix();}
  function basis(){const up=new THREE.Vector3();up[$('up').value.toLowerCase()]=1;const right=$('up').value==='X'?new THREE.Vector3(0,0,1):new THREE.Vector3(1,0,0);const front=new THREE.Vector3().crossVectors(right,up);return {up,right,front};}
  function setView(view='iso'){
    if(!box||!camera)return;const {up,right,front}=basis();const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
    let direction=right.clone().addScaledVector(up,.72).addScaledVector(front,.95);camera.up.copy(up);
    if(view==='top'){direction=up.clone();camera.up.copy(front).negate();}if(view==='front')direction=front;if(view==='side')direction=right;
    camera.position.copy(center).add(direction.normalize().multiplyScalar(3));controls.target.copy(center);camera.zoom=.98/Math.max(size.x,size.y,size.z,.15);camera.updateProjectionMatrix();camera.lookAt(center);controls.update();
    document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  }
  function refreshGrid(){
    if(!scene||!box)return;if(grid){scene.remove(grid);grid.geometry.dispose();grid.material.dispose();}
    const center=box.getCenter(new THREE.Vector3()),axis=$('up').value.toLowerCase();center[axis]=box.min[axis]-.007;
    grid=new THREE.GridHelper(1.6,16,0xb4c4bb,0xd6dfd7);grid.position.copy(center);grid.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),basis().up);grid.material.transparent=true;grid.material.opacity=.65;scene.add(grid);
  }
  function drawList(){
    const q=$('search').value.trim().toLowerCase();$('list').replaceChildren();
    const matches=catalog.filter(b=>(b.building+' '+b.dataset_identifier+' '+b.notes).toLowerCase().includes(q));
    for(const b of matches){const btn=document.createElement('button');btn.className=b===building?'active':'';btn.setAttribute('aria-current',b===building?'true':'false');btn.title=b.building;
      const num=document.createElement('span');num.className='num';num.textContent=String(b.number).padStart(2,'0');const dot=document.createElement('span');dot.className='dot'+(b.originalAvailable?'':' amber');dot.textContent='●';const name=document.createElement('span');name.textContent=b.building;btn.append(num,dot,name);btn.onclick=()=>{location.hash=b.folder;};$('list').append(btn);}
    if(!matches.length){const p=document.createElement('p');p.textContent='No matching precedents.';$('list').append(p);}
  }
  function chooseBuilding(){
    const slug=decodeURIComponent(location.hash.slice(1));building=catalog.find(b=>b.folder===slug)||catalog[0];drawList();
    $('title').textContent=building.building;$('number').textContent=`PRECEDENT ${String(building.number).padStart(2,'0')} / 98`;$('galleryLink').href=building.folder+'/index.html';$('datasetId').textContent=building.dataset_identifier;$('buildingNotes').textContent=building.notes;$('imageCoverage').textContent='Image coverage: '+building.coverage;
    $('geometryManifest').href=building.folder+'/geometry/geometry.json';$('fileLinks').replaceChildren();
    if(building.derivedObj){const a=document.createElement('a');a.href=building.folder+'/'+building.derivedObj.file;a.download='';a.textContent='Ready-made OBJ · '+building.derivedObj.resolution+'³';$('fileLinks').append(a);}
    for(const file of building.geometry){const a=document.createElement('a');a.href=building.folder+'/'+file.file;a.download='';a.textContent=(file.kind==='Original'?'Original':`Aug. ${file.augmentation_angle}°`)+` · ${file.resolution}³`;a.title=file.file;$('fileLinks').append(a);}
    $('variant').replaceChildren();if(building.originalAvailable)$('variant').add(new Option('Original building','original'));
    const angles=[...new Set(building.geometry.filter(f=>f.kind==='Augmented').map(f=>f.augmentation_angle))].sort((a,b)=>a-b);
    for(const angle of angles)$('variant').add(new Option(`Augmented · ${angle}°`,'aug_'+angle));
    $('variant').value=building.originalAvailable?'original':'aug_0';$('resolution').replaceChildren();populateResolution();
    $('reviewStatus').value=reviews[building.folder]?.status||'unchecked';$('reviewNotes').value=reviews[building.folder]?.notes||'';$('saveStatus').textContent='Saved in this browser';
    filter='all';document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b.dataset.filter==='all'));filterImages();loadGeometry();
  }
  function available(){const value=$('variant').value;return building.geometry.filter(f=>value==='original'?f.kind==='Original':f.kind==='Augmented'&&f.augmentation_angle===Number(value.slice(4)));}
  function populateResolution(){const previous=Number($('resolution').value);$('resolution').replaceChildren();const opts=available().filter(f=>f.resolution<=256).sort((a,b)=>a.resolution-b.resolution);for(const f of opts)$('resolution').add(new Option(f.resolution+'³',String(f.resolution)));$('resolution').value=opts.some(f=>f.resolution===previous)?String(previous):(opts.some(f=>f.resolution===128)?'128':String(opts[0].resolution));}
  function getPayload(b){return new Promise((resolve,reject)=>{if(window.ARCH_GEOMETRY?.[b.folder])return resolve(window.ARCH_GEOMETRY[b.folder]);const s=document.createElement('script');s.src=b.folder+'/geometry/viewer_data.js';s.onload=()=>{s.remove();resolve(window.ARCH_GEOMETRY[b.folder]);};s.onerror=()=>{s.remove();reject(Error('Could not open the local geometry file. Keep viewer.html beside the building folders.'));};document.head.append(s);});}
  async function loadGeometry(){
    const id=++request;const b=building;source=available().find(f=>f.resolution===Number($('resolution').value));if(worker)worker.terminate();worker=null;meshData=null;$('exportObj').disabled=true;$('nativeDownload').href=b.folder+'/'+source.file;
    const augmented=source.kind==='Augmented';$('notice').hidden=!augmented;$('notice').textContent=(b.originalAvailable?'Augmented variant selected.':'Only augmented geometry is present for this precedent in the public dataset.')+' This geometry has been deformed; do not treat differences from the photographs as an error in the original building.';
    $('modelBadge').textContent=augmented?'AUGMENTED VARIANT':'ORIGINAL DATASET MODEL';$('meshStats').textContent='Preparing surface…';
    if(!renderer)return;$('loading').hidden=false;$('loading').textContent='Building voxel surface…';if(mesh){scene.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();mesh=null;}
    try {
      const payload=await getPayload(b);if(id!==request)return;
      const blobURL=URL.createObjectURL(new Blob(['('+archMeshWorker.toString()+')()'],{type:'text/javascript'}));worker=new Worker(blobURL);URL.revokeObjectURL(blobURL);
      worker.onmessage=({data})=>{
        if(data.id!==request)return;worker.terminate();worker=null;if(data.error){$('loading').textContent=data.error;$('meshStats').textContent='Geometry could not be loaded';return;}
        meshData=data;const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(data.positions,3));geometry.setAttribute('normal',new THREE.BufferAttribute(data.normals,3));geometry.setIndex(new THREE.BufferAttribute(data.indices,1));geometry.computeBoundingBox();
        const material=new THREE.MeshStandardMaterial({color:0x748e81,roughness:.9,metalness:0,side:THREE.DoubleSide,wireframe:$('wire').checked});mesh=new THREE.Mesh(geometry,material);scene.add(mesh);box=geometry.boundingBox.clone();refreshGrid();setView();$('cutAxis').value='none';$('cut').value=100;cutSign=1;updateCut();$('loading').hidden=true;$('exportObj').disabled=false;$('meshStats').textContent=`${data.resolution}³ · ${data.occupied.toLocaleString()} voxels · ${(data.indices.length/3).toLocaleString()} triangles`;
      };
      worker.onerror=e=>{$('loading').textContent='Surface processing failed: '+e.message;};worker.postMessage({id,compressed:payload.files[source.key]});
    }catch(e){if(id===request){$('loading').textContent=e.message;$('meshStats').textContent='Geometry could not be loaded';}}
  }
  function updateCut(){const axis=$('cutAxis').value,enabled=axis!=='none';$('cut').disabled=!enabled;$('flipCut').disabled=!enabled;$('cutValue').textContent=$('cut').value+'%';if(!mesh)return;
    if(enabled){const a=axis.toLowerCase(),position=box.min[a]+(box.max[a]-box.min[a])*Number($('cut').value)/100;clipping.normal.set(0,0,0);clipping.normal[a]=-cutSign;clipping.constant=position*cutSign;mesh.material.clippingPlanes=[clipping];}else mesh.material.clippingPlanes=[];mesh.material.needsUpdate=true;
  }
  function filterImages(){visibleImages=building.imageFiles.filter(a=>filter==='all'||(filter==='plan'?a.view_type.includes('Plan'):a.view_type.toLowerCase().startsWith(filter)));imageIndex=0;showImage();}
  function showImage(){
    $('thumbnails').replaceChildren();$('photoCount').textContent=`${visibleImages.length} IMAGES`;$('noImages').hidden=!!visibleImages.length;$('mainImage').hidden=!visibleImages.length;const image=visibleImages[imageIndex];
    for(const [i,a] of visibleImages.entries()){const btn=document.createElement('button');btn.className=i===imageIndex?'active':'';btn.title=a.view_type.replaceAll('_',' ')+' · '+a.width+' × '+a.height;btn.setAttribute('aria-label',btn.title);const im=document.createElement('img');im.src=a.thumbnail||building.folder+'/'+a.file;im.alt=a.view_type.replaceAll('_',' ');btn.append(im);btn.onclick=()=>{imageIndex=i;showImage();};$('thumbnails').append(btn);}
    $('previousImage').disabled=$('nextImage').disabled=visibleImages.length<2;$('imageZoom').value=1;zoomImage();
    for(const id of ['openImage','imageSource'])$(id).hidden=!image;
    if(!image){$('mainImage').removeAttribute('src');$('caption').textContent=$('dimensions').textContent=$('imageType').textContent='';return;}
    $('mainImage').src=image.previewPath||building.folder+'/'+image.file;$('mainImage').alt=building.building+' — '+image.view_type.replaceAll('_',' ');$('mainImage').onerror=()=>{$('noImages').hidden=false;$('noImages').textContent='Image could not be opened. Use the source link below.';};
    $('imageType').textContent=`${imageIndex+1}/${visibleImages.length} · ${image.view_type.replaceAll('_',' ')}`;$('dimensions').textContent=`Original: ${image.width.toLocaleString()} × ${image.height.toLocaleString()} px`;$('openImage').href=building.folder+'/'+image.file;$('imageSource').href=image.source_page;$('caption').textContent=image.caption.trim();
  }
  function zoomImage(){const zoom=Number($('imageZoom').value),im=$('mainImage');im.classList.toggle('zoomed',zoom>1);im.style.width=zoom>1?$('imageStage').clientWidth*zoom+'px':'';im.style.height=zoom>1?$('imageStage').clientHeight*zoom+'px':'';$('imageStage').scrollTo(0,0);}
  function saveReview(){reviews[building.folder]={building:building.building,dataset_identifier:building.dataset_identifier,status:$('reviewStatus').value,notes:$('reviewNotes').value,geometry:source?.key,image:visibleImages[imageIndex]?.file||null,updated:new Date().toISOString()};try{localStorage.setItem(storageKey,JSON.stringify(reviews));$('saveStatus').textContent='Saved in this browser';}catch(e){$('saveStatus').textContent='Browser storage unavailable — export notes to keep them.';}}
  function download(text,type,filename){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
  function objText(){if(!meshData)return '';const lines=['# ArchComplete voxel-derived surface; not original CAD','# '+building.dataset_identifier,'# Source: '+source.archive_path,'# Native BINVOX scale and translation applied; physical units unspecified.'];const p=meshData.positions,ix=meshData.indices;for(let i=0;i<p.length;i+=3)lines.push('v '+[0,1,2].map(k=>((p[i+k]+.5)*source.scale+source.translate[k]).toFixed(7)).join(' '));for(let i=0;i<ix.length;i+=3)lines.push(`f ${ix[i]+1} ${ix[i+1]+1} ${ix[i+2]+1}`);return lines.join('\n')+'\n';}
  $('search').oninput=drawList;$('variant').onchange=()=>{populateResolution();loadGeometry();};$('resolution').onchange=loadGeometry;
  document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));$('fit').onclick=()=>setView();$('up').onchange=()=>{refreshGrid();setView();};$('wire').onchange=()=>{if(mesh)mesh.material.wireframe=$('wire').checked;};$('cutAxis').onchange=updateCut;$('cut').oninput=updateCut;$('flipCut').onclick=()=>{cutSign*=-1;updateCut();};
  document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));filterImages();});
  $('previousImage').onclick=()=>{imageIndex=(imageIndex-1+visibleImages.length)%visibleImages.length;showImage();};$('nextImage').onclick=()=>{imageIndex=(imageIndex+1)%visibleImages.length;showImage();};$('imageZoom').oninput=zoomImage;
  $('reviewStatus').onchange=saveReview;$('reviewNotes').oninput=saveReview;$('exportReviews').onclick=()=>download(JSON.stringify({collection:'ArchComplete',exported:new Date().toISOString(),reviews:Object.values(reviews)},null,2),'application/json','ArchComplete_Review_Notes.json');
  $('exportObj').onclick=()=>download(objText(),'text/plain',building.folder+'_'+source.key+'_Voxel_Surface.obj');
  // Read-only inspection hook for local verification and reproducible mesh exports.
  window.archViewer={get current(){return {folder:building?.folder,source:source?.key,loaded:!!meshData,resolution:meshData?.resolution,occupied:meshData?.occupied,surfaceVoxelFaces:meshData?.surfaceVoxelFaces,triangles:meshData?.indices.length/3};},get mesh(){return meshData;},objText};
  window.addEventListener('hashchange',chooseBuilding);chooseBuilding();
})();
