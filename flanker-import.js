// Gorilla task-jczz Flanker: response events only; no practice or fixation.
export const REQUIRED=['Participant Public ID','display','Zone Name','Type','Reaction Time','Correct','Response'];
export function calculateFlanker(rows,expectedParticipant=''){
 if(!rows.length)throw Error('No Gorilla rows found.');
 for(const k of REQUIRED)if(!(k in rows[0]))throw Error('Missing Gorilla column: '+k);
 const blocks=/^Block\d+$/i,types=['Congruent','Incongruent','Neutral'];
 const candidate=rows.filter(r=>blocks.test(String(r.display||'').trim())&&String(r['Zone Name']||'').trim().toLowerCase()==='zone1'&&types.some(t=>t.toLowerCase()===String(r.Type||'').trim().toLowerCase()));
 if(!candidate.length)throw Error('No response events in test blocks (Block1, Block2, …).');
 const participants=[...new Set(candidate.map(r=>String(r['Participant Public ID']||'').trim()))];
 if(participants.length!==1||!participants[0])throw Error('File must contain exactly one participant. Found: '+participants.join(', '));
 const participant=participants[0];
 if(expectedParticipant&&participant.toUpperCase()!==expectedParticipant.trim().toUpperCase())throw Error(`Gorilla participant ${participant} does not match selected participant ${expectedParticipant}. No scores were imported.`);
 const med=a=>{if(!a.length)return null;const x=[...a].sort((a,b)=>a-b),m=x.length>>1;return x.length%2?x[m]:(x[m-1]+x[m])/2};
 const round=x=>Math.round((x+Number.EPSILON)*10000)/10000;
 const by=Object.fromEntries(types.map(t=>[t,[]]));
 for(const r of candidate){const t=types.find(t=>t.toLowerCase()===String(r.Type).trim().toLowerCase());
  const rt=Number(r['Reaction Time']);const hasRT=String(r['Reaction Time']??'').trim()!==''&&Number.isFinite(rt)&&rt>=0;
  const response=String(r.Response??'').trim();const correct=String(r.Correct??'').trim();
  if(!hasRT&&!response)throw Error('A test response event lacks both response and reaction time; cannot establish trial accuracy.');
  if(!['','0','1'].includes(correct))throw Error('Unrecognized Correct value: '+correct);
  by[t].push({correct:correct==='1',rt:hasRT?rt:null});
 }
 const counts={},scores={};let allN=0,allCorrect=0;
 for(let i=0;i<types.length;i++){const t=types[i],tr=by[t],n=tr.length,c=tr.filter(x=>x.correct).length,validRT=tr.filter(x=>x.correct&&x.rt!==null&&x.rt>=200).map(x=>x.rt);
  if(!n)throw Error('No test trials for '+t);
  counts[t]={trials:n,correct:c,rtEligible:validRT.length};allN+=n;allCorrect+=c;
  scores[2*i+2]=round(100*c/n);
  const median=med(validRT);if(median!==null)scores[2*i+1]=round(median);
 }
 scores[7]=round(100*allCorrect/allN);
 return {participant,responses:scores,counts,allTrials:allN,correctTrials:allCorrect,excludedPractice:rows.filter(r=>String(r.display||'').toLowerCase().includes('practice')&&String(r['Zone Name']||'').toLowerCase()==='zone1').length,rtInterference:scores[3]!==undefined&&scores[1]!==undefined?round(scores[3]-scores[1]):null,accuracyInterference:round(scores[2]-scores[4])};
}
export function parseCSV(text){const records=[];let row=[],field='',quoted=false;const s=String(text).replace(/^\uFEFF/,'');for(let i=0;i<s.length;i++){const c=s[i];if(quoted){if(c==='"'&&s[i+1]==='"'){field+='"';i++}else if(c==='"')quoted=false;else field+=c}else if(c==='"')quoted=true;else if(c===','){row.push(field);field=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&s[i+1]==='\n')i++;row.push(field);if(row.some(x=>x!==''))records.push(row);row=[];field=''}else field+=c}if(quoted)throw Error('Unclosed CSV quote');row.push(field);if(row.some(x=>x!==''))records.push(row);if(records.length<2)throw Error('CSV contains no data rows');const head=records.shift().map(x=>x.trim());return records.map(r=>Object.fromEntries(head.map((h,i)=>[h,r[i]??''])))}
export async function readGorillaFile(file){if(/\.csv$/i.test(file.name))return parseCSV(await file.text());if(!/\.xlsx$/i.test(file.name))throw Error('Choose Gorilla .xlsx or .csv');
 const zip=await JSZip.loadAsync(file),parse=x=>new DOMParser().parseFromString(x,'application/xml');
 const workbook=zip.file('xl/workbook.xml');if(!workbook)throw Error('Invalid Excel workbook');const wb=parse(await workbook.async('text'));
 const sheets=[...wb.getElementsByTagName('sheet')];const target=sheets.find(x=>x.getAttribute('name')==='Data')||sheets[0];if(!target)throw Error('No worksheet');
 const rid=target.getAttribute('r:id')||target.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');
 const relfile=zip.file('xl/_rels/workbook.xml.rels');if(!relfile)throw Error('Workbook relationships missing');const rel=parse(await relfile.async('text'));const link=[...rel.getElementsByTagName('Relationship')].find(x=>x.getAttribute('Id')===rid);if(!link)throw Error('Cannot locate Data worksheet');
 const targetPath=link.getAttribute('Target');const path=targetPath.startsWith('/')?targetPath.slice(1):'xl/'+targetPath.replace(/^\.\.\//,'');const sheet=zip.file(path);if(!sheet)throw Error('Data worksheet missing: '+path);
 let strings=[];const shared=zip.file('xl/sharedStrings.xml');if(shared){const d=parse(await shared.async('text'));strings=[...d.getElementsByTagName('si')].map(n=>n.textContent)}
 const doc=parse(await sheet.async('text'));if(doc.getElementsByTagName('parsererror').length)throw Error('Invalid worksheet XML');const raw=[];
 for(const r of doc.getElementsByTagName('row')){let values=[];for(const c of r.getElementsByTagName('c')){const ref=c.getAttribute('r'),letters=ref?.match(/^[A-Z]+/)?.[0];if(!letters)continue;let index=0;for(const x of letters)index=index*26+x.charCodeAt(0)-64;const t=c.getAttribute('t'),v=c.getElementsByTagName('v')[0]?.textContent??'',inline=c.getElementsByTagName('is')[0];values[index-1]=t==='s'?strings[Number(v)]??'':t==='inlineStr'?inline?.textContent??'':v}raw.push(values)}
 if(raw.length<2)throw Error('Data worksheet is empty');const head=raw.shift().map(x=>String(x??'').trim());return raw.map(r=>Object.fromEntries(head.map((h,i)=>[h,r[i]??''])));
}
