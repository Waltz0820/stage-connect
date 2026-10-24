// Deterministic exports: preserve the original symbol; use the current SC wordmark for icons.
// Run from next-app: node scripts/export-brand-assets.mjs
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';

const source = 'assets/brand/stage-connect-symbol-source.png';
const trimmed = await sharp(source).trim().toBuffer();
await sharp(trimmed).resize({height:256}).png().toFile('public/brand/stage-connect-mark.png');
// Outlined Arial Black letters match the editorial logo without requiring a font at export time.
const favicon = await readFile('assets/brand/stage-connect-favicon.svg');
const square = async(size,fill=1) => sharp({create:{width:size,height:size,channels:4,background:'#fff'}})
  .composite([{input:await sharp(favicon,{density:300}).resize({width:Math.round(size*fill),height:Math.round(size*fill),fit:'inside'}).toBuffer(),gravity:'centre'}]).png().toBuffer();
for (const size of [16,32,48,64,192,512]) await writeFile(`public/brand/icon-${size}.png`,await square(size));
// Keep the whole bounding rectangle inside the central maskable safe circle.
await writeFile('public/brand/icon-maskable-512.png',await square(512,0.72));
await writeFile('app/icon.png',await square(512));
await writeFile('app/apple-icon.png',await square(180));
const sizes=[16,32,48];
const images=await Promise.all(sizes.map(size=>square(size)));
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
