import type { Patient, User } from './types';

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const timeStr = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** YYYY-MM-DD (or ISO) → DD.MM.YYYY */
export function fmtDate(v?: string) {
  if (!v) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : v;
}

export function fmtDateTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${fmtDate(toLocalDate(d))} ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`;
}

function toLocalDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ageOf(birthDate?: string, at = new Date()) {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (isNaN(b.getTime())) return null;
  let a = at.getFullYear() - b.getFullYear();
  const m = at.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && at.getDate() < b.getDate())) a--;
  return a;
}

export function ageLabel(birthDate?: string) {
  const a = ageOf(birthDate);
  return a === null ? '' : `${a} წლის`;
}

/**
 * „პაციენტის უფლებების შესახებ“ კანონი, მუხ. 41: 16 წლამდე პაციენტს მომსახურება ეწევა მხოლოდ
 * მშობლის/კანონიერი წარმომადგენლის თანხმობით; 16 წელს მიღწეული არასრულწლოვანი თავად აცხადებს
 * თანხმობას, რის შესახებაც ეცნობება ნათესავს ან კანონიერ წარმომადგენელს.
 */
export const needsRepresentative = (p: Pick<Patient, 'birthDate'>) => {
  const a = ageOf(p.birthDate);
  return a !== null && a < 16;
};

export const isMinor = (p: Pick<Patient, 'birthDate'>) => {
  const a = ageOf(p.birthDate);
  return a !== null && a < 18;
};

export const patientName = (p?: Pick<Patient, 'firstName' | 'lastName'> | null) =>
  p ? `${p.lastName} ${p.firstName}`.trim() : '';

export const userName = (u?: Pick<User, 'firstName' | 'lastName'> | null) =>
  u ? `${u.firstName} ${u.lastName}`.trim() : '';

export const isValidGeId = (v: string) => /^\d{11}$/.test(v);

export const money = (n: number) =>
  `${(Math.round((n || 0) * 100) / 100).toLocaleString('ka-GE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₾`;

export async function hashPin(pin: string, salt: string) {
  const input = `${salt}:${pin}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback for non-secure contexts (FNV-1a, 2 rounds)
  let h1 = 0x811c9dc5,
    h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    h1 = Math.imul(h1 ^ input.charCodeAt(i), 16777619);
    h2 = Math.imul(h2 ^ input.charCodeAt(input.length - 1 - i), 16777619);
  }
  return `f${(h1 >>> 0).toString(16)}${(h2 >>> 0).toString(16)}`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function readAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** Creates a small JPEG thumbnail for an image blob (returns undefined for non-images). */
export async function makeThumb(file: Blob, max = 320): Promise<string | undefined> {
  if (!file.type.startsWith('image/')) return undefined;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.width * scale));
    c.height = Math.max(1, Math.round(img.height * scale));
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.8);
  } catch {
    return undefined;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ');

export function normalize(s: string) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

const KA_MONTHS = ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი', 'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'];
const KA_WEEKDAYS = ['კვირა', 'ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი'];

/** „ხუთშაბათი, 29 ოქტომბერი 2026“ — ბრაუზერის ლოკალისგან დამოუკიდებლად */
export function longDateKa(d = new Date()) {
  return `${KA_WEEKDAYS[d.getDay()]}, ${d.getDate()} ${KA_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export const weekdayShortKa = (d: Date) => KA_WEEKDAYS[d.getDay()].slice(0, 3);
