declare global {interface Window {BarcodeDetector?:new(options:{formats:string[]})=>{detect:(video:HTMLVideoElement)=>Promise<{rawValue?:string}[]>};}}
export const cameraScanSupported=()=>typeof window!=='undefined'&&window.isSecureContext&&typeof window.BarcodeDetector==='function'&&typeof navigator!=='undefined'&&!!navigator.mediaDevices?.getUserMedia;
export function cameraErrorMessage(error:unknown):string{
  const name=error&&typeof error==='object'&&'name' in error?error.name:'';
  if(name==='NotAllowedError'||name==='SecurityError')return 'Camera permission was denied. Allow camera access in this browser’s site settings, then reopen the scanner. You can also paste the ticket code.';
  if(name==='NotFoundError')return 'No camera was found. Paste the ticket code instead.';
  if(name==='NotReadableError')return 'The camera is busy or unavailable. Close other camera apps, or paste the ticket code.';
  return 'Camera QR scanning is unavailable here. Use HTTPS and a browser with native QR detection, or paste the ticket code.';
}
