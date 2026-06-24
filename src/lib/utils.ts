export function formatDate(ts: number | undefined | null): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateRelative(ts: number | undefined | null): string {
  if (!ts) return '—';
  const d = new Date(ts);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Heute';
  if (diffDays === 1) return 'Morgen';
  if (diffDays === -1) return 'Gestern';
  if (diffDays < 0) return `Vor ${Math.abs(diffDays)} Tagen`;
  if (diffDays < 7) return `In ${diffDays} Tagen`;
  return formatDate(ts);
}

export function isOverdue(ts: number | undefined | null): boolean {
  if (!ts) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return ts < today.getTime();
}

export function isToday(ts: number | undefined | null): boolean {
  if (!ts) return false;
  const d = new Date(ts), today = new Date();
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}

export function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export function todayStart(): number {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime();
}

export function todayEnd(): number {
  const d = new Date(); d.setHours(23, 59, 59, 999); return d.getTime();
}

export function daysFromNow(days: number): number {
  const d = new Date(); d.setDate(d.getDate() + days); d.setHours(0, 0, 0, 0); return d.getTime();
}

export function csvEscape(val: string | null | undefined): string {
  if (!val) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function dateToInputValue(ts: number | undefined | null): string {
  if (!ts) return '';
  return new Date(ts).toISOString().split('T')[0];
}

export function inputValueToTs(val: string): number | undefined {
  if (!val) return undefined;
  return new Date(val).getTime();
}
