export async function checkInstallAssets(fetcher:typeof fetch=fetch):Promise<{ok:boolean;message:string}>{
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
  const options:RequestInit={credentials:'include',cache:'no-store',redirect:'error',signal:controller.signal};
  try{
    const response=await fetcher('/manifest.webmanifest',options);
    if(!response.ok||!/(application\/(manifest\+json|json))/.test(response.headers.get('content-type')??''))throw new Error('Manifest unavailable');
    const manifest:unknown=await response.json();
    if(!manifest||typeof manifest!=='object'||!('icons' in manifest)||!Array.isArray(manifest.icons)||!manifest.icons.length||manifest.icons.length>16)throw new Error('Invalid manifest');
    for(const icon of manifest.icons){
      if(!icon||typeof icon!=='object'||typeof icon.src!=='string'||!/^\/icons\/[A-Za-z0-9_-]+\.png$/.test(icon.src))throw new Error('Invalid icon path');
      const result=await fetcher(icon.src,options);if(!result.ok||!result.headers.get('content-type')?.startsWith('image/'))throw new Error('Icon unavailable');
    }
    return {ok:true,message:'Manifest and icons loaded with this browser’s sign-in. Use your browser’s Add to Home Screen option; installation and camera support still depend on the device.'};
  }catch{return {ok:false,message:'Install files could not be loaded with this browser’s sign-in. Open the app and sign in in Safari or Chrome, then retry. Access rules have not been changed.'};}
  finally{clearTimeout(timer);}
}
