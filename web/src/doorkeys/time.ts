/** Door-key times in the viewer's zone, in the short forms the spec uses ("Sat 2:00 AM", "in 5 h", "5 h 12 min"). */
const HOUR = 3_600_000, MINUTE = 60_000;

export function clockTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
export function dayTime(ms: number): string {
  return `${new Date(ms).toLocaleDateString('en-US', { weekday: 'short' })} ${clockTime(ms)}`;
}
/** "5 h 12 min", "45 min", "less than a minute". */
export function duration(ms: number): string {
  if (ms < MINUTE) return 'less than a minute';
  const h = Math.floor(ms / HOUR), m = Math.floor((ms % HOUR) / MINUTE);
  return h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${m} min`;
}
/** "in 5 h" (rounded to the hour above one hour), or "Expired". */
export function untilLabel(target: number, now: number): string {
  const left = target - now;
  if (left <= 0) return 'Expired';
  return left >= HOUR ? `in ${Math.round(left / HOUR)} h` : `in ${duration(left)}`;
}
/** Value for <input type="datetime-local"> in the viewer's zone. */
export function toLocalInput(ms: number): string {
  const d = new Date(ms), p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
export function fromLocalInput(value: string): number {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? new Date(value).getTime() : Number.NaN;
}
