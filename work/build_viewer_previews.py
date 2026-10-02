from pathlib import Path
from PIL import Image
import json
BASE=Path(__file__).resolve().parents[1];ROOT=BASE/'Precedent_Images';ASSETS=ROOT/'viewer_assets';Image.MAX_IMAGE_PIXELS=None
p=ASSETS/'catalog.js';data=json.loads(p.read_text(encoding='utf8')[len('window.ARCH_CATALOG='):-1]);count=0
for b in data:
 for a in b['imageFiles']:
  if max(a['width'],a['height'])<=1600:continue
  dest=ASSETS/'previews'/b['folder']/(Path(a['file']).stem+'.jpg');dest.parent.mkdir(parents=True,exist_ok=True)
  if not dest.exists():
   with Image.open(ROOT/b['folder']/a['file']) as im:
    im.thumbnail((1600,1600))
    if im.mode in ['RGBA','LA']:
     bg=Image.new('RGB',im.size,'white');bg.paste(im,mask=im.getchannel('A'));im=bg
    im.convert('RGB').save(dest,'JPEG',quality=90)
  a['previewPath']=str(dest.relative_to(ROOT)).replace('\\','/');count+=1
p.write_text('window.ARCH_CATALOG='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';',encoding='utf8');print('Optimized display copies:',count,'; full-resolution originals retained.')
