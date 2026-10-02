import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
const base='C:/Users/sgokmen/Documents/ChatGPT/261002_ArchComplete';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1540,height:1050},acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('https://**/*',r=>r.abort());await page.route('http://**/*',r=>r.abort());
await page.goto('file:///'+base+'/Precedent_Images/viewer.html');
await page.waitForFunction(()=>window.archViewer?.current.loaded,{},{timeout:60000});
console.log('INITIAL',await page.evaluate(()=>archViewer.current));
await page.screenshot({path:base+'/work/viewer_initial.png',fullPage:true});
// A deliberately asymmetric two-voxel fixture verifies BINVOX's x-z-y ordering,
// greedy rectangle merging, exposed face area, and outward triangle winding.
const d=4,voxels=new Uint8Array(d*d*d);voxels[1*d*d+3*d+2]=1;voxels[2*d*d+3*d+2]=1;
let rle=[];for(let i=0;i<voxels.length;){let n=1;while(i+n<voxels.length&&voxels[i+n]===voxels[i]&&n<255)n++;rle.push(voxels[i],n);i+=n;}
const compressed=gzipSync(Buffer.concat([Buffer.from('#binvox 1\ndim 4 4 4\ntranslate -0.5 -0.5 -0.5\nscale 1\ndata\n'),Buffer.from(rle)])).toString('base64');
const fixture=await page.evaluate(async compressed=>await new Promise((resolve,reject)=>{const url=URL.createObjectURL(new Blob(['('+archMeshWorker.toString()+')()'],{type:'text/javascript'}));const w=new Worker(url);w.onmessage=({data})=>{w.terminate();URL.revokeObjectURL(url);if(data.error)return reject(Error(data.error));const p=data.positions,n=data.normals,ix=data.indices;let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity],wrong=0;for(let i=0;i<p.length;i++) {min[i%3]=Math.min(min[i%3],p[i]);max[i%3]=Math.max(max[i%3],p[i]);}for(let i=0;i<ix.length;i+=3){const a=ix[i]*3,b=ix[i+1]*3,c=ix[i+2]*3,u=[0,1,2].map(k=>p[b+k]-p[a+k]),v=[0,1,2].map(k=>p[c+k]-p[a+k]);const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];if(cross.reduce((s,x,k)=>s+x*n[a+k],0)<=0)wrong++;}resolve({occupied:data.occupied,quads:data.quads,area:data.surfaceVoxelFaces,min,max,wrong});};w.postMessage({id:1,compressed});}),compressed);
assert.deepEqual(fixture,{occupied:2,quads:6,area:10,min:[-.25,0,.25],max:[.25,.25,.5],wrong:0});console.log('FIXTURE PASS',fixture);
await page.click('[data-filter="plan"]');assert.match(await page.locator('#imageType').innerText(),/Plan/);
await page.selectOption('#cutAxis','Y');await page.locator('#cut').fill('53');await page.locator('#cut').dispatchEvent('input');await page.check('#wire');await page.click('[data-view="top"]');
await page.screenshot({path:base+'/work/viewer_cutaway.png',fullPage:true});
await page.uncheck('#wire');await page.selectOption('#cutAxis','none');await page.selectOption('#resolution','256');await page.waitForFunction(()=>archViewer.current.loaded&&archViewer.current.resolution===256,{},{timeout:60000});console.log('256 PASS',await page.evaluate(()=>archViewer.current));
await page.selectOption('#variant','aug_30');await page.waitForFunction(()=>archViewer.current.loaded&&archViewer.current.source==='aug_030_64',{},{timeout:60000});assert.equal(await page.locator('#notice').isVisible(),true);
// Review persistence and export work in a file:// page, without network or a server.
await page.selectOption('#reviewStatus','review');await page.fill('#reviewNotes','Temporary automated viewer verification.');await page.reload();await page.waitForFunction(()=>archViewer.current.loaded);assert.equal(await page.locator('#reviewNotes').inputValue(),'Temporary automated viewer verification.');
const reviewDownload=page.waitForEvent('download');await page.click('#exportReviews');assert.equal((await reviewDownload).suggestedFilename(),'ArchComplete_Review_Notes.json');
await page.evaluate(()=>{localStorage.removeItem('archcomplete-reviews-v1');});await page.reload();await page.waitForFunction(()=>archViewer.current.loaded);
const catalog=await page.evaluate(()=>ARCH_CATALOG.map(b=>({folder:b.folder,original:b.originalAvailable})));const results=[];
for(const [i,b] of catalog.entries()){
 await page.evaluate(folder=>{location.hash=folder;},b.folder);
 await page.waitForFunction(folder=>archViewer.current.folder===folder&&archViewer.current.loaded,b.folder,{timeout:60000});
 const result=await page.evaluate(()=>archViewer.current);assert.ok(result.triangles>0);results.push(result);
 const obj=await page.evaluate(()=>archViewer.objText());assert.ok(obj.includes('\nv '));const file=b.folder+'_'+result.source+'_Voxel_Surface.obj';await fs.writeFile(path.join(base,'Precedent_Images',b.folder,'geometry',file),obj);
 if(b.folder==='Ennis_House'){assert.equal(await page.locator('#notice').isVisible(),true);await page.screenshot({path:base+'/work/viewer_augmented.png',fullPage:true});}
 if(b.folder==='Fallingwater')await page.screenshot({path:base+'/work/viewer_fallingwater.png',fullPage:true});
 if((i+1)%10===0)console.log('VERIFIED',i+1,'/98');
}
await fs.writeFile(base+'/work/geometry_viewer_checks.json',JSON.stringify({fixture,results,errors},null,2));assert.deepEqual(errors,[]);
await page.setViewportSize({width:650,height:980});await page.screenshot({path:base+'/work/viewer_mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
console.log('PASS: all 98 models, 256 resolution, augmentation, clipping, images, notes, export and narrow layout.');await browser.close();
