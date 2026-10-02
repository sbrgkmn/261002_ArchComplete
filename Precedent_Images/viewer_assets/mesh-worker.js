/* Exact exposed-voxel meshing. No smoothing or model inference. */
function archMeshWorker() {
  self.onmessage=async ({data:task})=>{
    try {
      const compressed=Uint8Array.from(atob(task.compressed),c=>c.charCodeAt(0));
      const stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
      const raw=new Uint8Array(await new Response(stream).arrayBuffer());
      let end=-1;for(let i=0;i<Math.min(raw.length,4096)-4;i++)if(raw[i]===100&&raw[i+1]===97&&raw[i+2]===116&&raw[i+3]===97&&raw[i+4]===10){end=i+5;break;}
      if(end<0)throw Error('Missing BINVOX data header.');
      const header=new TextDecoder().decode(raw.slice(0,end));const m=header.match(/dim (\d+) (\d+) (\d+)/);if(!m)throw Error('Missing grid dimensions.');
      const d=Number(m[1]);if(d!==Number(m[2])||d!==Number(m[3])||d>256)throw Error('Preview supports cubic grids up to 256³. Download larger native files below.');
      const grid=new Uint8Array(d*d*d);let offset=0,occupied=0;
      for(let i=end;i<raw.length;i+=2){const val=raw[i],n=raw[i+1];if(n===undefined||offset+n>grid.length)throw Error('Invalid RLE stream.');if(val){grid.fill(1,offset,offset+n);occupied+=n;}offset+=n;}
      if(offset!==grid.length)throw Error('Voxel count mismatch.');
      // BINVOX storage: x outermost, z next, y fastest. Coordinates remain x,y,z.
      const stride=[d*d,1,d],positions=[],normals=[],indices=[];let area=0;
      for(let axis=0;axis<3;axis++){
        const u=(axis+1)%3,v=(axis+2)%3,mask=new Int8Array(d*d);
        for(let s=0;s<=d;s++){
          for(let j=0;j<d;j++)for(let i=0;i<d;i++){
            const at=i*stride[u]+j*stride[v]+s*stride[axis];
            const a=s>0?grid[at-stride[axis]]:0,b=s<d?grid[at]:0;
            const face=a===b?0:(a?1:-1);mask[j*d+i]=face;if(face)area++;
          }
          for(let j=0;j<d;j++)for(let i=0;i<d;){
            const sign=mask[j*d+i];if(!sign){i++;continue;}
            let w=1;while(i+w<d&&mask[j*d+i+w]===sign)w++;
            let h=1;outer:while(j+h<d){for(let k=0;k<w;k++)if(mask[(j+h)*d+i+k]!==sign)break outer;h++;}
            const p=[0,0,0];p[axis]=s;p[u]=i;p[v]=j;
            const points=[p.slice(),p.slice(),p.slice(),p.slice()];points[1][u]+=w;points[2][u]+=w;points[2][v]+=h;points[3][v]+=h;
            const start=positions.length/3;
            for(const q of points){positions.push(q[0]/d-.5,q[1]/d-.5,q[2]/d-.5);normals.push(axis===0?sign:0,axis===1?sign:0,axis===2?sign:0);}
            if(sign>0)indices.push(start,start+1,start+2,start,start+2,start+3);else indices.push(start,start+2,start+1,start,start+3,start+2);
            for(let y=0;y<h;y++)mask.fill(0,(j+y)*d+i,(j+y)*d+i+w);i+=w;
          }
        }
      }
      const p=new Float32Array(positions),n=new Float32Array(normals),idx=new Uint32Array(indices);
      self.postMessage({id:task.id,positions:p,normals:n,indices:idx,resolution:d,occupied,surfaceVoxelFaces:area,quads:indices.length/6},[p.buffer,n.buffer,idx.buffer]);
    } catch(e){self.postMessage({id:task.id,error:e.message});}
  };
}
