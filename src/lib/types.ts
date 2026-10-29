export type Role = 'admin' | 'doctor' | 'assistant' | 'registrar';

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'ადმინისტრატორი',
  doctor: 'ექიმი-სტომატოლოგი',
  assistant: 'ასისტენტი / ექთანი',
  registrar: 'რეგისტრატორი',
};

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
  specialty?: string;
  /** სახელმწიფო სასერტიფიკატო / სარეგისტრაციო ნომერი */
  license?: string;
  phone?: string;
  pinHash: string;
  active: boolean;
  createdAt: string;
}

export interface ClinicSettings {
  name: string;
  legalName: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  /** სამედიცინო საქმიანობის ლიცენზია / ნებართვა */
  license: string;
  director: string;
  medicalDirector: string;
  /** ბეჭდვის ფორმებზე ქვედა ტექსტი */
  footerNote: string;
  logo?: string;
  autoLockMinutes: number;
}

export type IdType = 'GE' | 'PASSPORT' | 'NONE';

export interface Patient {
  id: string;
  /**
   * ისტორიის (სამედიცინო ბარათის, ფორმა №IV-220/ა) ნომერი: წლის რიგითი ნომერი/წელი — 1/26, 1000/26.
   * ენიჭება ერთხელ, პირველი რეგისტრაციისას, და აღარ იცვლება. პაციენტის იდენტიფიკაცია — პირადი ნომრით.
   */
  cardNumber: string;
  cardSource: 'history' | 'personalId' | 'journal';
  /** პირადი ნომრის არმქონე პაციენტისთვის დარეზერვებული ჟურნალის ნომერი (გამოიყენება პირველ ვიზიტზე) */
  reservedJournalNo?: number;
  idType: IdType;
  /** პირადი ნომერი (11 ციფრი) ან პასპორტის ნომერი */
  idNumber: string;
  firstName: string;
  lastName: string;
  fatherName: string;
  birthDate: string;
  sex: 'M' | 'F';
  citizenship: string;
  phone: string;
  phone2?: string;
  email?: string;
  address: string;
  workplace?: string;
  insurance?: string;
  insurancePolicy?: string;
  guardianName?: string;
  guardianIdNumber?: string;
  guardianRelation?: string;
  guardianPhone?: string;
  bloodGroup?: string;
  allergies: string;
  chronicDiseases: string;
  medications: string;
  /** რისკის ფაქტორები (ჰეპატიტი, აივ, ორსულობა, ანტიკოაგულანტები...) */
  riskFlags: string[];
  notes?: string;
  pdConsent: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  archived?: boolean;
}

export interface Diagnosis {
  code: string;
  text: string;
  teeth?: string;
  kind: 'main' | 'secondary' | 'complication';
}

export interface ProcedureItem {
  id: string;
  teeth: string;
  service: string;
  qty: number;
  price: number;
  note?: string;
}

export type RecordStatus = 'draft' | 'signed';

export interface Addendum {
  at: string;
  userId: string;
  text: string;
}

/**
 * ვიზიტი. ბრძანება №01-55/ნ, მუხ. 3: პაციენტის გასინჯვის ფურცელი (ფორმა №IV-220-1/ა) ივსება
 * ყოველ ახალ შემთხვევაზე; მასში ფიქსირდება პირველადი (kind='initial') და ყველა მომდევნო
 * (kind='followup') ვიზიტი ერთი შემთხვევის ფარგლებში. caseId = პირველადი ვიზიტის id.
 */
export interface Visit {
  id: string;
  patientId: string;
  kind: 'initial' | 'followup';
  caseId: string;
  /** შემთხვევის (გასინჯვის ფურცლის) რიგითი ნომერი ბარათში */
  caseNo: number;
  /** ვიზიტის რიგითი ნომერი ბარათში */
  visitNo: number;
  /** რეგისტრაციის ჟურნალის (ფორმა №IV-220-3/ა) რიგითი ნომერი */
  journalNo: number;
  complaintFlags: string[];
  complaintTeeth: string;
  complaintsOther: string;
  mucosa: string;
  perioFlags: string[];
  plaqueFlags: string[];
  pocketDepth: string;
  perioOther: string;
  examPlan: string[];
  examPlanOther: string;
  /** ელექტრონული რეცეპტის ნომერი (ბრძანება №01-16/ნ, 2022) */
  prescriptionNo: string;
  /** მკურნალობის შედეგი (ეპიკრიზი) — შემთხვევის დახურვისას */
  outcome: string;
  caseClosed?: boolean;
  caseClosedAt?: string;
  date: string;
  time: string;
  doctorId: string;
  visitType: 'first' | 'repeat' | 'urgent' | 'consult' | 'control';
  complaints: string;
  anamnesisMorbi: string;
  anamnesisVitae: string;
  externalExam: string;
  intraoralExam: string;
  bite: string;
  hygieneIndex: string;
  extraExams: string;
  diagnoses: Diagnosis[];
  treatment: string;
  procedures: ProcedureItem[];
  anesthesia: string;
  recommendations: string;
  nextVisit?: string;
  status: RecordStatus;
  signedAt?: string;
  signedBy?: string;
  addenda: Addendum[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type ToothStatus =
  | 'healthy'
  | 'caries'
  | 'filling'
  | 'endo'
  | 'crown'
  | 'missing'
  | 'implant'
  | 'bridge'
  | 'extract'
  | 'root'
  | 'pulpitis'
  | 'periodontitis'
  | 'veneer'
  | 'impacted';

export interface ToothRecord {
  status: ToothStatus;
  surfaces?: string;
  note?: string;
  mobility?: string;
}

export interface OdontogramSnapshot {
  id: string;
  patientId: string;
  date: string;
  teeth: Record<string, ToothRecord>;
  dentition: 'permanent' | 'mixed' | 'primary';
  note: string;
  createdBy: string;
}

export type RadiologyKind = 'periapical' | 'bitewing' | 'opg' | 'cbct' | 'trg' | 'occlusal' | 'photo' | 'scan' | 'other';

export const RADIOLOGY_LABELS: Record<RadiologyKind, string> = {
  periapical: 'პერიაპიკალური (კბილის) რენტგენი',
  bitewing: 'Bitewing (ინტერპროქსიმალური)',
  opg: 'ორთოპანტომოგრამა (OPG)',
  cbct: 'კონუსურ-სხივური კომპიუტერული ტომოგრაფია (CBCT)',
  trg: 'ტელერენტგენოგრამა (TRG)',
  occlusal: 'ოკლუზიური რენტგენი',
  photo: 'კლინიკური ფოტო',
  scan: 'ინტრაორალური სკანი / სხვა გამოსახულება',
  other: 'სხვა / გარე დაწესებულების კვლევა',
};

export interface RadiologyStudy {
  id: string;
  patientId: string;
  visitId?: string;
  date: string;
  kind: RadiologyKind;
  teeth: string;
  /** ეფექტური დოზა (მკზვ) — სხივური დატვირთვის აღრიცხვისთვის */
  dose?: string;
  description: string;
  conclusion: string;
  fileIds: string[];
  doctorId: string;
  createdAt: string;
  createdBy: string;
}

export interface StoredFile {
  id: string;
  patientId: string;
  ownerId: string;
  name: string;
  mime: string;
  size: number;
  blob: Blob;
  thumb?: string;
  createdAt: string;
}

export interface MedDocument {
  id: string;
  patientId: string;
  visitId?: string;
  type: string;
  /** დოკუმენტის რეგისტრაციის ნომერი (ჟურნალის ნომერი) */
  number: string;
  date: string;
  title: string;
  data: Record<string, any>;
  status: RecordStatus;
  doctorId: string;
  signedAt?: string;
  signedBy?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  duration: number;
  reason: string;
  status: 'planned' | 'confirmed' | 'arrived' | 'done' | 'cancelled' | 'noshow';
  note?: string;
  createdAt: string;
}

/** პაციენტზე დარიცხული/დაგეგმილი მომსახურება (წინასწარ, გადახდამდე) */
export interface Charge {
  id: string;
  patientId: string;
  date: string;
  serviceId?: string;
  code: string;
  name: string;
  group: string;
  teeth: string;
  qty: number;
  price: number;
  /** ფასდაკლება % */
  discount: number;
  /** planned — დაგეგმილი (ჯერ არ შესრულებულა); done — შესრულებული, ირიცხება ბალანსში */
  status: 'planned' | 'done' | 'cancelled';
  visitId?: string;
  note: string;
  createdAt: string;
  createdBy: string;
}

export interface Payment {
  id: string;
  patientId: string;
  date: string;
  amount: number;
  method: 'cash' | 'card' | 'transfer' | 'insurance';
  note: string;
  createdAt: string;
  createdBy: string;
}

export interface Template {
  id: string;
  category: string;
  title: string;
  text: string;
  builtIn?: boolean;
}

export interface ServiceItem {
  id: string;
  code: string;
  name: string;
  price: number;
  group: string;
}

export interface IcdEntry {
  code: string;
  text: string;
  custom?: boolean;
}

export interface AuditEntry {
  id?: number;
  at: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  patientId?: string;
  details: string;
}
