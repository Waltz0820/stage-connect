// Deterministic size/format exports from the supplied-design extraction.
// Run from next-app: node scripts/export-brand-assets.mjs
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const source = 'assets/brand/stage-connect-symbol-source.png';
const trimmed = await sharp(source).trim().toBuffer();
await sharp(trimmed).resize({height:256}).png().toFile('public/brand/stage-connect-mark.png');
const square = async(size,fill=0.88) => sharp({create:{width:size,height:size,channels:4,background:'#fcfcff'}})
  .composite([{input:await sharp(trimmed).resize({width:Math.round(size*fill),height:Math.round(size*fill),fit:'inside'}).toBuffer(),gravity:'centre'}]).png().toBuffer();
for (const size of [16,32,48,64,192,512]) await writeFile(`public/brand/icon-${size}.png`,await square(size,size<=64?0.94:0.8));
// Keep the whole bounding rectangle inside the central maskable safe circle.
await writeFile('public/brand/icon-maskable-512.png',await square(512,0.55));
await writeFile('app/icon.png',await square(512,0.8));
await writeFile('app/apple-icon.png',await square(180,0.76));
const sizes=[16,32,48];
const images=await Promise.all(sizes.map(size=>square(size,0.94)));
const header=Buffer.alloc(6+sizes.length*16);
header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);
let offset=header.length;
for(let index=0;index<sizes.length;index++){
  const entry=6+index*16;
  header[entry]=sizes[index];header[entry+1]=sizes[index];
  header.writeUInt16LE(1,entry+4);header.writeUInt16LE(32,entry+6);
  header.writeUInt32LE(images[index].length,entry+8);header.writeUInt32LE(offset,entry+12);
  offset+=images[index].length;
}
await writeFile('app/favicon.ico',Buffer.concat([header,...images]));
console.log('Brand mark, favicon (16/32/48), Apple touch icon, and 192/512 home-screen icons exported.');
