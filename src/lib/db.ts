import Dexie, { liveQuery, type Table } from 'dexie';
import { useEffect, useState } from 'react';
import type {
  Appointment,
  AuditEntry,
  ClinicSettings,
  IcdEntry,
  MedDocument,
  OdontogramSnapshot,
  Patient,
  Payment,
  RadiologyStudy,
  ServiceItem,
  StoredFile,
  Template,
  User,
  Visit,
} from './types';

interface KV {
  key: string;
  value: any;
}

class ClinicDB extends Dexie {
  kv!: Table<KV, string>;
  users!: Table<User, string>;
  patients!: Table<Patient, string>;
  visits!: Table<Visit, string>;
  documents!: Table<MedDocument, string>;
  radiology!: Table<RadiologyStudy, string>;
  files!: Table<StoredFile, string>;
  odontograms!: Table<OdontogramSnapshot, string>;
  appointments!: Table<Appointment, string>;
  payments!: Table<Payment, string>;
  templates!: Table<Template, string>;
  services!: Table<ServiceItem, string>;
  customIcd!: Table<IcdEntry, string>;
  audit!: Table<AuditEntry, number>;

  constructor() {
    super('dent-clinic');
    this.version(1).stores({
      kv: 'key',
      users: 'id, role',
      patients: 'id, &cardNumber, idNumber, lastName, phone, createdAt',
      visits: 'id, patientId, date, doctorId',
      documents: 'id, patientId, type, date, number',
      radiology: 'id, patientId, date',
      files: 'id, patientId, ownerId',
      odontograms: 'id, patientId, date',
      appointments: 'id, date, patientId, doctorId',
      payments: 'id, patientId, date',
      templates: 'id, category',
      services: 'id, group',
      customIcd: 'code',
      audit: '++id, at, patientId, entityId',
    });
    // v2: ბრძანება №01-55/ნ — ბარათის ნომერი პირადი ნომრით/ჟურნალის ნომრით, შემთხვევები (IV-220-1/ა), ჟურნალი (IV-220-3/ა)
    this.version(2)
      .stores({ visits: 'id, patientId, date, doctorId, caseId, journalNo' })
      .upgrade(async (tx) => {
        const kv = tx.table('kv');
        let j: number = (await kv.get('counter:journal'))?.value || 0;
        const visits = (await tx.table('visits').toArray()).sort((a: any, b: any) => String(a.createdAt).localeCompare(String(b.createdAt)));
        const firstJournal = new Map<string, number>();
        const maxVisit = new Map<string, number>();
        for (const v of visits) {
          j += 1;
          if (!firstJournal.has(v.patientId)) firstJournal.set(v.patientId, j);
          maxVisit.set(v.patientId, Math.max(maxVisit.get(v.patientId) || 0, v.visitNo || 0));
          await tx.table('visits').update(v.id, {
            kind: 'initial',
            caseId: v.id,
            caseNo: v.visitNo,
            journalNo: j,
            complaintFlags: [],
            complaintTeeth: '',
            complaintsOther: '',
            mucosa: '',
            perioFlags: [],
            plaqueFlags: [],
            pocketDepth: '',
            perioOther: '',
            examPlan: [],
            examPlanOther: '',
            prescriptionNo: '',
            outcome: '',
          });
        }
        for (const p of await tx.table('patients').toArray()) {
          if (p.idType === 'GE' && /^\d{11}$/.test(p.idNumber || '')) {
            await tx.table('patients').update(p.id, { cardNumber: p.idNumber, cardSource: 'personalId' });
          } else {
            const n = firstJournal.get(p.id) ?? ++j;
            await tx.table('patients').update(p.id, { cardNumber: String(n), cardSource: 'journal', reservedJournalNo: firstJournal.has(p.id) ? undefined : n });
          }
        }
        for (const [pid, n] of maxVisit) await kv.put({ key: `counter:case:${pid}`, value: n });
        await kv.put({ key: 'counter:journal', value: j });
      });
  }
}

export const db = new ClinicDB();

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const nowIso = () => new Date().toISOString();

/** React hook over Dexie liveQuery — re-renders whenever the queried tables change. */
export function useLive<T>(query: () => Promise<T> | T, deps: unknown[], initial?: T): T | undefined {
  const [value, setValue] = useState<T | undefined>(initial);
  useEffect(() => {
    const sub = liveQuery(query).subscribe({
      next: (v) => setValue(v),
      error: (e) => console.error('liveQuery', e),
    });
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return value;
}

export async function getKV<T>(key: string, fallback: T): Promise<T> {
  const row = await db.kv.get(key);
  return row ? (row.value as T) : fallback;
}

export async function setKV(key: string, value: any) {
  await db.kv.put({ key, value });
}

/** Atomically increments and returns a named counter. */
export async function nextCounter(name: string): Promise<number> {
  return db.transaction('rw', db.kv, async () => {
    const cur = await getKV<number>(`counter:${name}`, 0);
    const next = cur + 1;
    await setKV(`counter:${name}`, next);
    return next;
  });
}

export const DEFAULT_CLINIC: ClinicSettings = {
  name: 'სტომატოლოგიური კლინიკა',
  legalName: '',
  taxId: '',
  address: '',
  phone: '',
  email: '',
  license: '',
  director: '',
  medicalDirector: '',
  footerNote: '',
  autoLockMinutes: 15,
};

export async function getClinic(): Promise<ClinicSettings> {
  return { ...DEFAULT_CLINIC, ...(await getKV<Partial<ClinicSettings>>('clinic', {})) };
}

export function useClinic(): ClinicSettings {
  return useLive(getClinic, [], DEFAULT_CLINIC) as ClinicSettings;
}

let auditUser: { id: string; name: string } = { id: 'system', name: 'სისტემა' };
export function setAuditUser(u: { id: string; name: string } | null) {
  auditUser = u || { id: 'system', name: 'სისტემა' };
}

export async function audit(action: string, entity: string, entityId: string, details: string, patientId?: string) {
  await db.audit.add({
    at: nowIso(),
    userId: auditUser.id,
    userName: auditUser.name,
    action,
    entity,
    entityId,
    patientId,
    details,
  });
}

export async function deletePatientCascade(patientId: string) {
  await db.transaction(
    'rw',
    [db.patients, db.visits, db.documents, db.radiology, db.files, db.odontograms, db.appointments, db.payments],
    async () => {
      await db.visits.where('patientId').equals(patientId).delete();
      await db.documents.where('patientId').equals(patientId).delete();
      await db.radiology.where('patientId').equals(patientId).delete();
      await db.files.where('patientId').equals(patientId).delete();
      await db.odontograms.where('patientId').equals(patientId).delete();
      await db.appointments.where('patientId').equals(patientId).delete();
      await db.payments.where('patientId').equals(patientId).delete();
      await db.patients.delete(patientId);
    },
  );
}

// ---------- Backup ----------

const blobToDataUrl = (b: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(b);
  });

const dataUrlToBlob = async (u: string) => (await fetch(u)).blob();

const BACKUP_TABLES = [
  'kv',
  'users',
  'patients',
  'visits',
  'documents',
  'radiology',
  'files',
  'odontograms',
  'appointments',
  'payments',
  'templates',
  'services',
  'customIcd',
  'audit',
] as const;

export async function exportBackup(): Promise<Blob> {
  const out: Record<string, any[]> = {};
  for (const t of BACKUP_TABLES) {
    const rows = await (db as any)[t].toArray();
    if (t === 'files') {
      out[t] = await Promise.all(rows.map(async (f: StoredFile) => ({ ...f, blob: await blobToDataUrl(f.blob) })));
    } else out[t] = rows;
  }
  const payload = { app: 'dent-clinic', version: 1, exportedAt: nowIso(), data: out };
  return new Blob([JSON.stringify(payload)], { type: 'application/json' });
}

export async function importBackup(file: File) {
  const json = JSON.parse(await file.text());
  if (json?.app !== 'dent-clinic' || !json.data) throw new Error('ფაილი არ არის ამ პროგრამის სარეზერვო ასლი');
  const files = await Promise.all(
    (json.data.files || []).map(async (f: any) => ({ ...f, blob: await dataUrlToBlob(f.blob) })),
  );
  await db.transaction('rw', BACKUP_TABLES.map((t) => (db as any)[t]), async () => {
    for (const t of BACKUP_TABLES) {
      await (db as any)[t].clear();
      const rows = t === 'files' ? files : json.data[t] || [];
      if (rows.length) await (db as any)[t].bulkPut(rows);
    }
  });
}
