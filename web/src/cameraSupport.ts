declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => {
      detect: (video: HTMLVideoElement) => Promise<{ rawValue?: string }[]>;
    };
  }
}

export type BarcodeDetectorCtor = new (options: { formats: string[] }) => {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue?: string }[]>;
};

export type ScanEngine = 'native' | 'polyfill';

const hasWindow = () => typeof window !== 'undefined';

/** True when this page can open a camera (HTTPS or localhost, getUserMedia present). Does not require native BarcodeDetector. */
export function cameraHardwareSupported(): boolean {
  return hasWindow() && window.isSecureContext && !!window.navigator?.mediaDevices?.getUserMedia;
}

export function nativeBarcodeDetectorAvailable(): boolean {
  return hasWindow() && typeof window.BarcodeDetector === 'function';
}

/** Back-compat name used by check-in screens: open the camera when hardware allows; the polyfill loads later if needed. */
export const cameraScanSupported = () => cameraHardwareSupported();

export function cameraErrorMessage(error: unknown): string {
  const name = error && typeof error === 'object' && 'name' in error ? String((error as { name?: string }).name) : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Camera permission was denied. Allow camera access in this browser’s site settings, then reopen the scanner. You can also paste the ticket code.';
  }
  if (name === 'NotFoundError') return 'No camera was found. Paste the ticket code instead.';
  if (name === 'NotReadableError') return 'The camera is busy or unavailable. Close other camera apps, or paste the ticket code.';
  return 'Camera QR scanning is unavailable here. Use HTTPS, or paste the ticket code.';
}

export function polyfillLoadErrorMessage(): string {
  return 'The QR scanner could not load. Close the camera and paste the ticket code.';
}

export async function loadBarcodeDetectorPonyfill(): Promise<BarcodeDetectorCtor> {
  const { BarcodeDetector, setZXingModuleOverrides } = await import('barcode-detector/ponyfill');
  // Same-origin reader wasm (COEP require-corp). Do not use the package's jsDelivr default.
  const wasmUrl = new URL('../node_modules/zxing-wasm/dist/reader/zxing_reader.wasm', import.meta.url).href;
  setZXingModuleOverrides({
    locateFile: (file: string, prefix: string) => (file.includes('zxing_reader.wasm') ? wasmUrl : `${prefix}${file}`),
  });
  return BarcodeDetector as BarcodeDetectorCtor;
}

export async function ensureBarcodeDetector(
  loadPonyfill: () => Promise<BarcodeDetectorCtor> = loadBarcodeDetectorPonyfill,
): Promise<{ Detector: BarcodeDetectorCtor; engine: ScanEngine }> {
  if (nativeBarcodeDetectorAvailable() && window.BarcodeDetector) {
    return { Detector: window.BarcodeDetector, engine: 'native' };
  }
  const Detector = await loadPonyfill();
  return { Detector, engine: 'polyfill' };
}

export function videoTrackOf(stream: MediaStream): MediaStreamTrack | undefined {
  return stream.getVideoTracks()[0];
}

export function trackSupportsTorch(track: MediaStreamTrack | undefined): boolean {
  if (!track || typeof track.getCapabilities !== 'function') return false;
  const caps = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
  return !!caps.torch;
}

export async function setTrackTorch(track: MediaStreamTrack, on: boolean): Promise<void> {
  await track.applyConstraints({ advanced: [{ torch: on }] as unknown as MediaTrackConstraintSet[] });
}

export function stopMediaStream(stream: MediaStream | null | undefined, video?: HTMLVideoElement | null): void {
  stream?.getTracks().forEach((track) => {
    try { track.stop(); } catch { /* already stopped */ }
  });
  if (video) video.srcObject = null;
}

export async function openBackCamera(): Promise<MediaStream> {
  const attempts: MediaStreamConstraints[] = [
    { video: { facingMode: { ideal: 'environment' } }, audio: false },
    { video: { facingMode: 'environment' }, audio: false },
    { video: true, audio: false },
  ];
  let last: unknown;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      last = error;
    }
  }
  throw last instanceof Error ? last : new Error('No camera was found.');
}
