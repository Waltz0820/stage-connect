import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:'Stage Connect',short_name:'Stage Connect',
    description:'2.5次元舞台とキャストをつなぐデジタルアーカイブ',
    start_url:'/',display:'browser',background_color:'#fcfcff',theme_color:'#0b1536',
    icons:[
      {src:'/brand/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},
      {src:'/brand/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},
      {src:'/brand/icon-maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'},
    ],
  };
}
