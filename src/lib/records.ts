import { db, uid, nowIso, nextCounter, audit } from './db';
import type { MedDocument, Patient, Visit } from './types';
import { isValidGeId, patientName, timeStr, todayStr } from './utils';
import { DEFAULT_SERVICES, DEFAULT_TEMPLATES } from '../data/defaults';

export class DuplicatePatientError extends Error {
  constructor(public existing: Patient) {
    super(`პაციენტი ამ ნომრით უკვე რეგისტრირებულია: ${patientName(existing)} (ისტორია №${existing.cardNumber})`);
  }
}

export async function findByIdNumber(idNumber: string, exceptId?: string) {
  const n = idNumber.trim();
  if (!n) return undefined;
  return (await db.patients.where('idNumber').equals(n).toArray()).find((p) => p.id !== exceptId);
}

export function validatePatient(p: Partial<Patient>): Record<string, string> {
  const e: Record<string, string> = {};
  if (!p.lastName?.trim()) e.lastName = 'სავალდებულოა';
  if (!p.firstName?.trim()) e.firstName = 'სავალდებულოა';
  if (!p.birthDate) e.birthDate = 'სავალდებულოა';
  else if (p.birthDate > todayStr()) e.birthDate = 'თარიღი მომავალშია';
  if (p.idType === 'GE' && !isValidGeId(p.idNumber || '')) e.idNumber = 'პირადი ნომერი უნდა შედგებოდეს 11 ციფრისგან';
  if (p.idType === 'PASSPORT' && !(p.idNumber || '').trim()) e.idNumber = 'მიუთითეთ პასპორტის ნომერი';
  if (!p.phone?.trim()) e.phone = 'სავალდებულოა';
  return e;
}

/** ისტორიის ნომერი: წლის რიგითი ნომერი/წლის ბოლო ორი ციფრი — 1/26, 2/26 … 1000/26; ახალ წელს იწყება 1-დან */
async function cardFor(): Promise<Pick<Patient, 'cardNumber' | 'cardSource'>> {
  const year = String(new Date().getFullYear());
  const n = await nextCounter(`history:${year}`);
  return { cardNumber: `${n}/${year.slice(2)}`, cardSource: 'history' };
}

export async function createPatient(
  data: Omit<Patient, 'id' | 'cardNumber' | 'cardSource' | 'reservedJournalNo' | 'createdAt' | 'updatedAt' | 'createdBy'>,
  userId: string,
) {
  const dup = await findByIdNumber(data.idNumber);
  if (dup && data.idType !== 'NONE') throw new DuplicatePatientError(dup);
  const p: Patient = { ...data, id: uid(), ...(await cardFor()), createdAt: nowIso(), updatedAt: nowIso(), createdBy: userId };
  await db.patients.add(p);
  await audit('CREATE', 'Patient', p.id, `პაციენტის რეგისტრაცია: ${patientName(p)}, ისტორია №${p.cardNumber}`, p.id);
  return p;
}

export async function updatePatient(id: string, patch: Partial<Patient>) {
  const cur = await db.patients.get(id);
  if (!cur) throw new Error('პაციენტი ვერ მოიძებნა');
  if (patch.idNumber !== undefined && patch.idType !== 'NONE') {
    const dup = await findByIdNumber(patch.idNumber, id);
    if (dup) throw new DuplicatePatientError(dup);
  }
  const { cardNumber: _ignored, cardSource: _cs, reservedJournalNo: _r, id: _id, createdAt: _c, ...safe } = patch as Patient;
  // ისტორიის ნომერი არ იცვლება
  const card: Partial<Patient> = {};
  const changed = Object.keys(safe).filter((k) => JSON.stringify((cur as any)[k]) !== JSON.stringify((safe as any)[k]));
  await db.patients.update(id, { ...safe, ...card, updatedAt: nowIso() });
  if (changed.length) await audit('UPDATE', 'Patient', id, `შეიცვალა ველები: ${changed.join(', ')}`, id);
  if (card.cardNumber) await audit('UPDATE', 'Patient', id, `ბარათის ნომერი: ${cur.cardNumber} → ${card.cardNumber}`, id);
}

const emptyVisit = {
  complaintFlags: [] as string[],
  complaintTeeth: '',
  complaintsOther: '',
  complaints: '',
  anamnesisMorbi: '',
  anamnesisVitae: '',
  externalExam: '',
  intraoralExam: '',
  bite: '',
  mucosa: '',
  perioFlags: [] as string[],
  plaqueFlags: [] as string[],
  pocketDepth: '',
  perioOther: '',
  hygieneIndex: '',
  examPlan: [] as string[],
  examPlanOther: '',
  extraExams: '',
  diagnoses: [],
  treatment: '',
  procedures: [],
  anesthesia: '',
  recommendations: '',
  prescriptionNo: '',
  outcome: '',
};

/** ახალი შემთხვევა (initial) ან განმეორებითი ვიზიტი არსებულ შემთხვევაზე (followup) */
export async function newVisit(patientId: string, doctorId: string, userId: string, caseOf?: Visit): Promise<Visit> {
  const n = await nextCounter(`visit:${patientId}`);
  const patient = await db.patients.get(patientId);
  let journalNo: number;
  if (patient?.reservedJournalNo) {
    journalNo = patient.reservedJournalNo;
    await db.patients.update(patientId, { reservedJournalNo: undefined });
  } else journalNo = await nextCounter('journal');
  const caseNo = caseOf ? caseOf.caseNo : await nextCounter(`case:${patientId}`);
  const id = uid();
  const v: Visit = {
    ...emptyVisit,
    id,
    patientId,
    kind: caseOf ? 'followup' : 'initial',
    caseId: caseOf ? caseOf.caseId : id,
    caseNo,
    visitNo: n,
    journalNo,
    date: todayStr(),
    time: timeStr(),
    doctorId,
    visitType: caseOf ? 'repeat' : n === 1 ? 'first' : 'repeat',
    diagnoses: caseOf ? caseOf.diagnoses.map((d) => ({ ...d })) : [],
    procedures: [],
    status: 'draft',
    addenda: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    createdBy: userId,
  };
  await db.visits.add(v);
  await audit('CREATE', 'Visit', v.id, caseOf ? `შემთხვევა №${caseNo} — განმეორებითი ვიზიტი №${n}` : `ახალი შემთხვევა №${caseNo} (ფორმა IV-220-1/ა), ვიზიტი №${n}`, patientId);
  return v;
}

export async function newDocNumber(type: string, date = todayStr()) {
  const year = date.slice(0, 4);
  const n = await nextCounter(`doc:${type}:${year}`);
  return `${String(n).padStart(4, '0')}/${year}`;
}

export async function createDocument(d: Omit<MedDocument, 'id' | 'number' | 'createdAt' | 'updatedAt' | 'status'>) {
  const doc: MedDocument = { ...d, id: uid(), number: await newDocNumber(d.type, d.date), status: 'draft', createdAt: nowIso(), updatedAt: nowIso() };
  await db.documents.add(doc);
  await audit('CREATE', 'Document', doc.id, `დოკუმენტი „${doc.title}“ №${doc.number}`, doc.patientId);
  return doc;
}

export async function seedDefaults() {
  if ((await db.templates.count()) === 0) await db.templates.bulkAdd(DEFAULT_TEMPLATES);
  if ((await db.services.count()) === 0) await db.services.bulkAdd(DEFAULT_SERVICES);
}
