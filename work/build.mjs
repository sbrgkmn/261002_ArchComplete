import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const base = 'C:/Users/sgokmen/Documents/ChatGPT/261002_ArchComplete';
const out = `${base}/outputs/archcomplete_buildings`;
const files = JSON.parse(await fs.readFile(`${base}/research/building_files.json`, 'utf8'));
const ids = Object.keys(files).sort();
const names = `Villa Muller
Muuratsalo Experimental House
Maison Louise Carre
La Rotonda
Villa Cornaro
Villa Foscari
Trail House
Leo Henriksen House
Antivilla
Alhamra Villa
Neuhofweg House
Bahia Azul House
Eames House
House with One Wall
Garden House
Maison D’artiste
Orbital House
Maison Dordogne
Robie House
Winton Guest House
Boomer Residence
Ennis House
Fallingwater
Jacob House
House N
Haus Schröder
Schminke Haus
Vitra-Haus
128 House
Care House of the Wind Chinmey
Nasu Tepee
Elrod House
Goldstein Residence
Herning School Center
Small House
Okurayama Apartement
Lotus House
Meteorite Cabin
Sky House
Villa Savoye
House at Mols Hills
Glass House (Lina Bo Bardi)
Fisher Building
Farnsworth House
Villa Tugendhat
Casa Luís Barragan
House N10
Minas House
Casa en Djerba
Container House
Melnikov House
nCaved House
Double House
Juul House
Lovell House
VDL
Solo House
Casa das Canoas
Villa Glashütte
Radius House
House II
House VI
Glass House (Philip Johnson)
Bailey House
Stahl House
Wu House
Cornered House
Rambla Climate House
Maison à Bordeaux
Chiswick House
Smith House
Vanna Venturi House
Lowell Beach House
Moriyama House
House of Concrete Experiments
House NA
Nine Square Grid House
Naked House
Triangle House
Brick Vault House
Narrow Brick House
Ex-Of-In House
Y-House
Toy Blocks House 1
Hare House
The Dark Chalet
Gropius House
Meisterhaus
House for a Young Couple in Tokyo
Moore House
The Miller House
Wall House
S House
Weissenhof 14–15
Sagaponac House
Giovannitti House
Brant House
Schindler House`.split('\n');
assert.equal(ids.length, 98);
assert.equal(names.length, ids.length);
const archive = 'https://drive.google.com/file/d/1tg78R_WkyCPVBpsG9uJnYkV5JAie3a2D/view';
const repo = 'https://gitlab.cg.tuwien.ac.at/srasoulzadeh/archcomplete';
const records = ids.map((id,i) => {
  const paths = files[id];
  const originals = paths.filter(p=>!p.includes('TARGETAUGMENTED'));
  const augmented = paths.filter(p=>p.includes('TARGETAUGMENTED'));
  assert.ok([0,4].includes(originals.length));
  assert.ok([0,12].includes(augmented.length));
  return { name:names[i], id, original: originals.length>0, augmented:augmented.length,
    availability: originals.length ? (augmented.length ? 'Original + augmented' : 'Original only') : 'Augmented only' };
}).sort((a,b)=>a.name.localeCompare(b.name,'en'));
assert.equal(records.filter(r=>r.original).length,95);
assert.equal(records.filter(r=>r.augmented).length,95);
assert.equal(records.reduce((a,r)=>a+r.augmented,0),1140);
await fs.writeFile(`${base}/research/building_records.json`,JSON.stringify(records,null,2));

const wb = Workbook.create();
const sheet = wb.worksheets.add('Buildings');
const scope = wb.worksheets.add('Dataset scope');
for(const s of [sheet,scope]) { s.showGridLines=false; s.tabColor='#243B53'; }
const end = records.length+6;
sheet.getRange(`A1:D${end}`).format.font={name:'Arial',size:10,color:'#243B53'};
sheet.getRange(`A1:D${end}`).format.verticalAlignment='center';
sheet.getRange('A2').values=[['ArchComplete building list']];
sheet.getRange('A2').format.font={size:16,bold:true};
sheet.getRange('A3').values=[['98 buildings in the public BINVOX archive']];
sheet.getRange('A4').values=[['Source spellings retained. See Dataset scope for coverage.']];
sheet.getRange('A4').format.font={size:10,italic:true,color:'#627D98'};
sheet.getRange('A2:D2').format.borders={bottom:{style:'thin',color:'#9FB3C8'}};
sheet.getRange('A6:D6').values=[['Building name (from filename)','Dataset identifier (base filename)','Archive availability','Source link']];
sheet.getRange(`A7:D${end}`).values=records.map(r=>[r.name,r.id,r.availability,'Dataset archive']);
const table = sheet.tables.add(`A6:D${end}`,true,'ArchCompleteBuildings');
table.showFilterButton=true;
sheet.getRange('A6:D6').format={fill:'#243B53',font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},horizontalAlignment:'center',verticalAlignment:'center',rowHeight:30};
sheet.getRange(`A7:D${end}`).format.rowHeight=36;
sheet.getRange(`A7:C${end}`).format.wrapText=true;
sheet.getRange(`D7:D${end}`).format.font={color:'#1565C0'};
sheet.getRange(`A1:A${end}`).format.columnWidth=49;
sheet.getRange(`B1:B${end}`).format.columnWidth=82;
sheet.getRange(`C1:C${end}`).format.columnWidth=25;
sheet.getRange(`D1:D${end}`).format.columnWidth=20;
sheet.freezePanes.freezeRows(6);
for(let i=0;i<records.length;i++) {
  if(i%2===1)sheet.getRange(`A${i+7}:D${i+7}`).format.fill='#F0F4F8';
  if(records[i].availability==='Augmented only')sheet.getRange(`C${i+7}`).format.fill='#FFF0CB';
}

const scopeRows = [
 ['Scope','All distinct base building identifiers found in the currently linked public BINVOX.zip archive. Retrieved October 2, 2026.'],
 ['Unique building identifiers',98],
 ['Original buildings',95],
 ['Buildings with augmented samples',95],
 ['Original files across four resolutions',380],
 ['Augmented files at resolution 64',1140],
 ['Total model files in archive',1520],
 ['Deduplication','The same building at different resolutions counts once. Augmentation suffixes _0, _30, …, _330 are removed from base identifiers.'],
 ['Original folder names','TARGET_064_BINVOX; TARGET_128_BINVOX; TARGET_256_BINVOX; TARGET_512_BINVOX. Each contains the same 95 identifiers.'],
 ['Augmented folder name','TARGETAUGMENTED_064_BINVOX. Contains 12 samples for each of 95 identifiers.'],
 ['Augmented only','Muuratsalo Experimental House; La Rotonda; Ennis House.'],
 ['Original only','Meteorite Cabin; Lowell Beach House; Hare House.'],
 ['Coverage limitation','The paper reports 1,500 models including augmentation. The linked release has 1,235 files at resolution 64 (95 original + 1,140 augmented). This workbook establishes the released archive inventory, not a verified roster of every model used in the published experiments.'],
 ['Names and identifiers','Building names are readable versions of source filenames, not independently verified official names. Source spellings such as “Jacob House”, “Lowell Beach House”, “Okurayama Apartement”, and “Wind Chinmey” are retained. Glass House entries are distinguished by the architect encoded in the filename.'],
 ['Filename handling','Dataset identifiers are base filenames without .binvox or augmentation suffixes. ZIP filenames were decoded as UTF-8. Author/modeler tokens and source spelling are preserved. __MACOSX metadata, directories, and .DS_Store files are excluded.'],
 ['Repository',repo],
 ['Download script',`${repo}/-/blob/main/dat/dl_data.py`],
 ['Dataset archive',archive],
 ['Paper, dataset section','https://arxiv.org/html/2412.17957v2#S3'],
 ['Supplement, augmentation method','https://ars.els-cdn.com/content/image/1-s2.0-S0097849325003188-mmc1.pdf']
];
scope.getRange('A1:B24').format.font={name:'Arial',size:10,color:'#243B53'};
scope.getRange('A1:B24').format.verticalAlignment='center';
scope.getRange('A2').values=[['Dataset scope and sources']];
scope.getRange('A2').format.font={size:16,bold:true};
scope.getRange('A2:B2').format.borders={bottom:{style:'thin',color:'#9FB3C8'}};
scope.getRange('A4:B23').values=scopeRows;
scope.getRange('A1:A24').format.columnWidth=39;
scope.getRange('B1:B24').format.columnWidth=113;
scope.getRange('A4:B23').format.rowHeight=34;
scope.getRange('B4:B23').format.wrapText=true;
scope.getRange('A4:A23').format.font={bold:true};
for(let i=0;i<scopeRows.length;i++){
 const row=i+4;
 if(i%2===0)scope.getRange(`A${row}:B${row}`).format.fill='#F0F4F8';
 if(typeof scopeRows[i][1]==='number')scope.getRange(`B${row}`).setNumberFormat('#,##0');
}
scope.getRange('A16:B18').format.rowHeight=62;
scope.getRange('B19:B23').format.font={color:'#1565C0'};
wb.recalculate();
assert.equal(sheet.getRange(`A7:B${end}`).values.length,98);
assert.equal(new Set(sheet.getRange(`B7:B${end}`).values.flat()).size,98);
console.log((await wb.inspect({kind:'table',range:'Buildings!A6:D11',include:'values,formulas',tableMaxRows:6,tableMaxCols:4,maxChars:3000})).ndjson);
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:20},maxChars:1000})).ndjson);
await fs.mkdir(out,{recursive:true});
for(const [name,range,file] of [['Buildings','A1:D17','buildings_preview'],['Dataset scope','A1:B23','scope_preview']]){
 const png=await wb.render({sheetName:name,range,scale:1,format:'png'});
 await fs.writeFile(`${base}/work/${file}.png`,new Uint8Array(await png.arrayBuffer()));
}
await (await SpreadsheetFile.exportXlsx(wb)).save(`${out}/ArchComplete_Buildings.xlsx`);
console.log(JSON.stringify({buildings:records.length,output:`${out}/ArchComplete_Buildings.xlsx`}));
