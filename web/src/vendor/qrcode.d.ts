export const QRCode: new (typeNumber: number, level: number) => { addData(s: string): void; make(): void; getModuleCount(): number; isDark(r: number, c: number): boolean };
export const QRErrorCorrectLevel: { L: number; M: number; Q: number; H: number };
