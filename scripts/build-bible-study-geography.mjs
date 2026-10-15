// Small, locally shipped maps: Natural Earth coastlines + OpenBible.info locations.
import { mkdir, writeFile } from 'node:fs/promises';
const urls = {
  places: 'https://www.openbible.info/geo/data/merged.txt',
  land: 'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json',
};
const [tsv, topology] = await Promise.all([
  fetch(urls.places).then(r => { if (!r.ok) throw new Error('Location download failed'); return r.text(); }),
  fetch(urls.land).then(r => { if (!r.ok) throw new Error('Coastline download failed'); return r.json(); }),
]);
const aliases = { Gen:'GEN', Exod:'EXO', Lev:'LEV', Num:'NUM', Deut:'DEU', Josh:'JOS', Judg:'JDG', Ruth:'RUT', '1 Sam':'1SA', '2 Sam':'2SA', '1 Kgs':'1KI', '2 Kgs':'2KI', '1 Chr':'1CH', '2 Chr':'2CH', Ezra:'EZR', Neh:'NEH', Esth:'EST', Job:'JOB', Ps:'PSA', Prov:'PRO', Eccl:'ECC', Song:'SNG', Isa:'ISA', Jer:'JER', Lam:'LAM', Ezek:'EZK', Dan:'DAN', Hos:'HOS', Joel:'JOL', Amos:'AMO', Obad:'OBA', Jonah:'JON', Mic:'MIC', Nah:'NAM', Hab:'HAB', Zeph:'ZEP', Hag:'HAG', Zech:'ZEC', Mal:'MAL', Matt:'MAT', Mark:'MRK', Luke:'LUK', John:'JHN', Acts:'ACT', Rom:'ROM', '1 Cor':'1CO', '2 Cor':'2CO', Gal:'GAL', Eph:'EPH', Phil:'PHP', Col:'COL', '1 Thess':'1TH', '2 Thess':'2TH', '1 Tim':'1TI', '2 Tim':'2TI', Titus:'TIT', Phlm:'PHM', Heb:'HEB', Jas:'JAS', '1 Pet':'1PE', '2 Pet':'2PE', '1 John':'1JN', '2 John':'2JN', '3 John':'3JN', Jude:'JUD', Rev:'REV' };
const places = [], chapters = {};
for (const line of tsv.split('\n').filter(line => line && !line.startsWith('#'))) {
  const [name, root, lat, lon, refs] = line.split('\t');
  if (!lat || !lon || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) continue;
  const index = places.push([name, Number(Number(lat).toFixed(4)), Number(Number(lon).toFixed(4))]) - 1;
  for (const reference of (refs || '').split(', ')) {
    const match = reference.match(/^(.*?) (\d+):/);
    if (!match || !aliases[match[1]]) continue;
    const key = `${aliases[match[1]]}.${match[2]}`;
    const chapter = chapters[key] ||= [];
    if (!chapter.includes(index)) chapter.push(index);
  }
}
function arc(index) {
  let x=0,y=0;
  const points=topology.arcs[index<0?~index:index].map(([dx,dy])=>{x+=dx;y+=dy;return [x*topology.transform.scale[0]+topology.transform.translate[0],y*topology.transform.scale[1]+topology.transform.translate[1]].map(n=>Number(n.toFixed(3)));});
  return index<0?points.reverse():points;
}
const land = topology.objects.land.geometries.flatMap(geometry => geometry.type==='Polygon'?geometry.arcs:geometry.arcs.flatMap(polygon=>polygon)).map(ring=>ring.flatMap((id,i)=>arc(id).slice(i?1:0)));
await mkdir(new URL('../assets/bible-study/',import.meta.url),{recursive:true});
await writeFile(new URL('../assets/bible-study/geography.json',import.meta.url),JSON.stringify({ places,chapters,land }));
console.log(`Bible Study geography: ${places.length} places across ${Object.keys(chapters).length} chapters.`);
