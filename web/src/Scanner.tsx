// Native camera scanner with a manual-code fallback.
import { useEffect, useRef, useState } from 'react';
import { cameraScanSupported, cameraErrorMessage } from './cameraSupport';
export { cameraScanSupported } from './cameraSupport';
export function Scanner({onCode,onClose}:{onCode:(c:string)=>void;onClose:()=>void}){
  const video=useRef<HTMLVideoElement>(null);const [error,setError]=useState('');const [ready,setReady]=useState(false);
  useEffect(()=>{
    let stream:MediaStream|null=null;let stopped=false;const release=()=>stream?.getTracks().forEach(track=>track.stop());
    void(async()=>{try{
      if(!cameraScanSupported())throw new Error('Unsupported scanner');
      const Detector=window.BarcodeDetector;
      if(!Detector)throw new Error('Unsupported scanner');const detector=new Detector({formats:['qr_code']});
      stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
      if(stopped||!video.current){release();return;}
      video.current.srcObject=stream;await video.current.play();if(stopped){release();return;}setReady(true);
      while(!stopped&&video.current){
        const codes=await detector.detect(video.current).catch(()=>[]);
        if(!stopped&&codes[0]?.rawValue){stopped=true;release();onCode(codes[0].rawValue);break;}
        await new Promise(resolve=>setTimeout(resolve,250));
      }
    }catch(e){release();if(!stopped)setError(cameraErrorMessage(e));}})();
    return()=>{stopped=true;release();};
  },[]);
  return <div className="scanner"><video ref={video} muted playsInline aria-label="Ticket QR camera preview"/>{!ready&&!error&&<p role="status">Allow camera access when your browser asks.</p>}{error&&<p role="alert" className="warn small">{error}</p>}<p className="small muted">QR detection runs on this device. If scanning is unavailable, close the camera and paste the ticket code. Camera support varies by browser.</p><button type="button" onClick={onClose}>Close camera</button></div>;
}
