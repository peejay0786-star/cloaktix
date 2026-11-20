// Door camera scanner: native BarcodeDetector when present, lazy ponyfill otherwise.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  cameraErrorMessage,
  cameraScanSupported,
  ensureBarcodeDetector,
  openBackCamera,
  polyfillLoadErrorMessage,
  setTrackTorch,
  stopMediaStream,
  trackSupportsTorch,
  videoTrackOf,
  type ScanEngine,
} from './cameraSupport';

export { cameraScanSupported } from './cameraSupport';

function scanDebugEnabled(): boolean {
  try {
    return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1';
  } catch {
    return false;
  }
}

export function Scanner({
  onCode,
  onClose,
  onPaste,
  title,
  doorLabel,
  admittedCount,
  pendingCount,
  previewTorch,
}: {
  onCode: (c: string) => void;
  onClose: () => void;
  onPaste?: () => void;
  title?: string;
  doorLabel?: string;
  admittedCount?: number;
  pendingCount?: number;
  previewTorch?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [engine, setEngine] = useState<ScanEngine | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(!!previewTorch);
  const trackRef = useRef<MediaStreamTrack | undefined>(undefined);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let stopped = false;
    const release = () => {
      stopMediaStream(stream, video.current);
      stream = null;
      trackRef.current = undefined;
    };
    void (async () => {
      try {
        if (!cameraScanSupported()) throw new Error('Unsupported scanner');
        let detected: Awaited<ReturnType<typeof ensureBarcodeDetector>>;
        try {
          detected = await ensureBarcodeDetector();
        } catch {
          if (!stopped) setError(polyfillLoadErrorMessage());
          return;
        }
        if (stopped) return;
        setEngine(detected.engine);
        const detector = new detected.Detector({ formats: ['qr_code'] });
        stream = await openBackCamera();
        if(stopped||!video.current){release();return;}
        const track = videoTrackOf(stream);
        trackRef.current = track;
        setTorchAvailable(trackSupportsTorch(track) || !!previewTorch);
        video.current.srcObject = stream;
        video.current.muted = true;
        await video.current.play();
        if (stopped) { release(); return; }
        setReady(true);
        while (!stopped && video.current) {
          const codes = await detector.detect(video.current).catch(() => []);
          const value = codes[0]?.rawValue;
          if (!stopped && value) {
            stopped = true;
            release();
            onCode(value);
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      } catch (e) {
        release();
        if (!stopped) setError(cameraErrorMessage(e));
      }
    })();
    return () => {
      stopped = true;
      release();
    };
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.classList.add('door-overlay-open');
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.classList.remove('door-overlay-open');
    };
  }, []);

  const toggleTorch = () => {
    const track = trackRef.current;
    const next = !torchOn;
    if (!track) {
      if (previewTorch) setTorchOn(next);
      return;
    }
    void setTrackTorch(track, next).then(() => setTorchOn(next)).catch(() => { if (previewTorch) setTorchOn(next); else setTorchAvailable(false); });
  };

  const eventName = title?.trim() || 'Check-in';
  const showCount = typeof admittedCount === 'number' && Number.isFinite(admittedCount);
  const showPending = typeof pendingCount === 'number' && pendingCount > 0;
  const showTorch = torchAvailable;
  const showDebug = scanDebugEnabled() && engine;

  const node = (
    <div className="scanner-screen" role="dialog" aria-modal="true" aria-label="Ticket QR camera">
      <header className="top">
        <span className="brand">
          <img src="/brand/cloaktix_lockup_transparent_on-dark.svg" alt="CloakTix" />
        </span>
        <div className="scanner-heading">
          <span className="scanner-event-name">{eventName}</span>
          {doorLabel ? <span className="tag">{doorLabel}</span> : null}
        </div>
        <div className="right">
          <button type="button" onClick={onClose} aria-label="Close scanner">Close</button>
        </div>
      </header>
      <div className="scanner-body">
        <div className="card scanner-view-card">
          <div className="scanner-viewport">
            <video ref={video} className="scanner-video" muted playsInline autoPlay aria-label="Ticket QR camera preview" />
            <div className="scanner-shade" aria-hidden="true">
              <div className="scanner-hole">
                <span className="scanner-corner c1" />
                <span className="scanner-corner c2" />
                <span className="scanner-corner c3" />
                <span className="scanner-corner c4" />
                <span className="scanner-sweep" />
              </div>
            </div>
          </div>
        </div>
        <div className="card scanner-panel">
          {!error && <p className="scanner-hint">{ready ? 'Align the QR inside the frame' : 'Starting camera…'}</p>}
          {!ready && !error && <p role="status" className="muted small">Allow camera access when your browser asks.</p>}
          {error && <p role="alert" className="warn">{error}</p>}
          {(showCount || showPending) ? (
            <div className="organizer-summary-stats scanner-stats">
              {showCount ? <span><b>{admittedCount}</b> admitted</span> : null}
              {showPending ? <span><b>{pendingCount}</b> to record</span> : null}
            </div>
          ) : null}
          <div className="cta-row">
            {onPaste ? (
              <button type="button" onClick={() => { onPaste(); onClose(); }}>Paste code</button>
            ) : null}
            {showTorch ? (
              <button type="button" onClick={toggleTorch} aria-pressed={torchOn}>
                {torchOn ? 'Torch off' : 'Torch'}
              </button>
            ) : null}
          </div>
          {showDebug && engine === 'polyfill' && <p className="scanner-engine">QR engine: ZXing (wasm) when BarcodeDetector is missing</p>}
          {showDebug && engine === 'native' && <p className="scanner-engine">QR engine: native BarcodeDetector</p>}
        </div>
      </div>
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}
