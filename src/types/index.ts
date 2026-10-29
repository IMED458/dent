/**
 * Georgian Dental Clinic HIS / ERP / CRM Master Types
 */

// --- 1. Organization & Hierarchy ---
export interface Organization {
  id: string;
  name: string;
  taxId: string;
  legalAddress: string;
  phone: string;
  email: string;
  website: string;
  logoUrl?: string;
  directorName: string;
  medicalDirectorName: string;
  iban: string;
  bankName: string;
}

export interface Branch {
  id: string;
  organizationId: string;
  name: string; // e.g. "Vake Branch", "Saburtalo Branch"
  code: string;
  address: string;
  phone: string;
  email: string;
  workingHours: string;
  active: boolean;
}

export interface Department {
  id: string;
  branchId: string;
  name: string; // e.g. "Therapy", "Surgery", "Orthodontics", "Radiology"
  code: string;
}

export interface Room {
  id: string;
  departmentId: string;
  name: string; // e.g. "Cabinet 101"
  roomNumber: string;
}

export interface DentalChair {
  id: string;
  roomId: string;
  chairNumber: string;
  name: string; // e.g. "Chair A"
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'STERILIZING';
}

// --- 2. Roles & Permissions (45 Roles) ---
export type RoleName =
  | 'System Super Administrator'
  | 'Organization Owner'
  | 'Clinic Director'
  | 'Medical Director'
  | 'Chief Dentist'
  | 'Dentist'
  | 'Therapeutic Dentist'
  | 'Dental Surgeon'
  | 'Oral/Maxillofacial Surgeon'
  | 'Implantologist'
  | 'Periodontist'
  | 'Orthodontist'
  | 'Prosthodontist / Orthopedic Dentist'
  | 'Pediatric Dentist'
  | 'Endodontist'
  | 'Dental Hygienist'
  | 'Doctor Assistant'
  | 'Nurse'
  | 'Head Nurse'
  | 'Receptionist / Registrar'
  | 'Administrator'
  | 'Senior Administrator'
  | 'Call Center Operator'
  | 'Cashier'
  | 'Accountant'
  | 'Chief Accountant / Finance Manager'
  | 'Insurance Manager'
  | 'Warehouse / Inventory Manager'
  | 'Pharmacy Responsible Person'
  | 'Pharmacist / Pharmacy'
  | 'Procurement Manager'
  | 'Dental Laboratory Coordinator'
  | 'Dental Technician / Laboratory'
  | 'Radiology / X-Ray Operator'
  | 'Infection Control Officer'
  | 'Sterilization Responsible Person'
  | 'Medical Waste Responsible Person'
  | 'Quality Manager'
  | 'HR Manager'
  | 'Payroll Manager'
  | 'Data Protection Officer'
  | 'Internal Auditor'
  | 'External Auditor / Read Only'
  | 'IT Administrator'
  | 'Patient Portal User';

export type PermissionCode =
  | 'patient.view'
  | 'patient.create'
  | 'patient.edit'
  | 'patient.export'
  | 'patient.delete'
  | 'medical_record.view'
  | 'medical_record.create'
  | 'medical_record.sign'
  | 'medical_record.addendum'
  | 'appointment.view'
  | 'appointment.create'
  | 'appointment.edit'
  | 'appointment.cancel'
  | 'odontogram.view'
  | 'odontogram.edit'
  | 'periodontology.manage'
  | 'implantology.manage'
  | 'orthodontics.manage'
  | 'radiology.view'
  | 'radiology.upload'
  | 'prescription.create'
  | 'inventory.view'
  | 'inventory.manage'
  | 'pharmacy.manage'
  | 'accounting.view'
  | 'accounting.manage'
  | 'payroll.view'
  | 'payroll.manage'
  | 'insurance.view'
  | 'insurance.manage'
  | 'sterilization.manage'
  | 'waste.manage'
  | 'reports.view'
  | 'reports.export'
  | 'users.manage'
  | 'settings.manage'
  | 'audit.view'
  | 'privacy.manage'
  | 'dayclose.manage'
  | 'calculation.manage';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  personalNumber: string;
  username: string;
  email: string;
  phone: string;
  roles: RoleName[];
  branchIds: string[];
  active: boolean;
  position: string;
  employeeId?: string;
  mfaEnabled: boolean;
  lastLogin?: string;
}

// --- 3. HR & Employees ---
export interface Employee {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  personalNumber: string;
  phone: string;
  email: string;
  position: string;
  specialty: string;
  licenseNumber: string;
  licenseIssueDate: string;
  licenseExpiryDate: string;
  hireDate: string;
  branchId: string;
  cmePointsThisYear: number;
  salaryModel: 'FIXED' | 'HOURLY' | 'PERCENTAGE_REVENUE' | 'PERCENTAGE_SERVICE' | 'MIXED';
  baseSalary: number;
  commissionPercentage: number;
  bankAccount: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
}

// --- 4. Patients & Alerts ---
export interface PatientAlert {
  id: string;
  type: 'ALLERGY' | 'ANESTHESIA_RISK' | 'ANTICOAGULANT' | 'PREGNANCY' | 'DIABETES' | 'CARDIOVASCULAR' | 'HEPATITIS' | 'PACEMAKER' | 'OTHER';
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  active: boolean;
  createdAt: string;
}

export interface Patient {
  id: string;
  patientNumber: string; // e.g. "PT-2026-00421"
  medicalCardNumber: string; // e.g. "CARD-8912"
  personalNumber: string; // 11 digits Georgian ID or Passport Number
  isForeignCitizen?: boolean;
  passportNumber?: string;
  citizenshipCountry?: string;
  isMinor?: boolean;
  guardianName?: string;
  guardianPersonalNumber?: string;
  guardianPhone?: string;
  guardianRelation?: string;
  firstName: string;
  lastName: string;
  dob: string;
  sex: 'MALE' | 'FEMALE';
  phone: string;
  email: string;
  address: string;
  workplace?: string;
  emergencyContact?: string;
  preferredLanguage: 'ka' | 'en' | 'ru';
  insurerName?: string;
  policyNumber?: string;
  vip: boolean;
  alerts: PatientAlert[];
  createdAt: string;
}

// --- 5. Classifiers & Codes ---
export interface ICD10Code {
  code: string; // e.g. "K02.1"
  titleGe: string; // e.g. "დენტინის კარიესი"
  titleEn: string;
  category: string;
  isDental: boolean;
}

export interface NCSPCode {
  code: string; // e.g. "SGXC10"
  nameGe: string; // e.g. "კბილის ექსტრაქცია მარტივი"
  nameEn: string;
  category: string;
}

export interface ArtificialCode {
  code: string; // e.g. "1000000001"
  codeType: 'STATE_PROGRAM' | 'INSURER_CUSTOM' | 'INTERNAL';
  name: string;
  payer: string;
  tariffGel: number;
  icd10Mappings: string[];
  ncspMappings: string[];
}

// --- 6. Odontogram & Dental Surfaces ---
export type ToothSurface = 'Mesial' | 'Distal' | 'Occlusal' | 'Buccal' | 'Lingual';

export type ToothCondition =
  | 'HEALTHY'
  | 'CARIES'
  | 'FILLING'
  | 'CROWN'
  | 'BRIDGE_PONTIC'
  | 'MISSING'
  | 'IMPLANT'
  | 'ENDODONTIC_TREATED'
  | 'EXTRACT_PLANNED'
  | 'RETAINED_ROOT'
  | 'VENEER'
  | 'FRACTURE';

export interface SurfaceState {
  surface: ToothSurface;
  condition: ToothCondition;
  icd10Code?: string;
  ncspCode?: string;
  notes?: string;
}

export interface ToothState {
  toothNumber: number; // 11-18, 21-28, 31-38, 41-48 (Permanent) or 51-55, 61-65, 71-75, 81-85 (Deciduous)
  isDeciduous: boolean;
  generalCondition: ToothCondition;
  surfaces: Record<ToothSurface, ToothCondition>;
  mobilityGrade?: number; // 0, 1, 2, 3
  hasImplant?: boolean;
  implantLotNumber?: string;
  notes?: string;
}

export interface OdontogramSnapshot {
  id: string;
  patientId: string;
  timestamp: string;
  authorName: string;
  teeth: Record<number, ToothState>;
  notes?: string;
}

// --- 7. Periodontology 6-Point Chart ---
export interface PeriodontalSite {
  probingDepth: number; // mm (1-12)
  recession: number; // mm
  cal: number; // Clinical Attachment Loss (probingDepth + recession)
  bop: boolean; // Bleeding on Probing
  plaque: boolean;
  suppuration: boolean;
}

export interface ToothPeriodontalRecord {
  toothNumber: number;
  sites: {
    mesiobuccal: PeriodontalSite;
    midbuccal: PeriodontalSite;
    distobuccal: PeriodontalSite;
    mesiolingual: PeriodontalSite;
    midlingual: PeriodontalSite;
    distolingual: PeriodontalSite;
  };
  mobility: 0 | 1 | 2 | 3;
  furcation: 0 | 1 | 2 | 3;
}

export interface PeriodontalExam {
  id: string;
  patientId: string;
  examDate: string;
  doctorName: string;
  teeth: Record<number, ToothPeriodontalRecord>;
  bopPercentage: number;
  plaquePercentage: number;
  meanProbingDepth: number;
  deepPocketsCount: number; // >= 5mm
}

// --- 8. Implantology & Traceability ---
export interface ImplantRecord {
  id: string;
  patientId: string;
  toothSite: number;
  manufacturer: string;
  systemModel: string;
  diameterMm: number;
  lengthMm: number;
  lotNumber: string;
  serialNumber: string;
  placementDate: string;
  surgeonName: string;
  insertionTorqueNcm: number;
  boneGraftUsed: boolean;
  graftLotNumber?: string;
  membraneLotNumber?: string;
  status: 'PLANNED' | 'HEALING' | 'PROSTHETIZED' | 'FAILED';
  notes?: string;
}

// --- 9. Encounters & Clinical Notes (IV-220-1/ა) ---
export interface ClinicalEncounter {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  branchId: string;
  date: string;
  complaints: string;
  examinationFindings: string;
  diagnosisIcd10: string[];
  proceduresNcsp: string[];
  affectedTeeth: number[];
  vitalSigns?: {
    bloodPressure?: string;
    pulse?: number;
    temperature?: number;
  };
  treatmentDone: string;
  prescriptions: Array<{
    medication: string;
    dosage: string;
    frequency: string;
    durationDays: number;
    instructions: string;
  }>;
  signed: boolean;
  signedBy?: string;
  signedAt?: string;
  addendums: Array<{
    id: string;
    author: string;
    createdAt: string;
    note: string;
  }>;
}

// --- 10. Appointments & Queue ---
export type AppointmentStatus =
  | 'REQUESTED'
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'ARRIVED'
  | 'WAITING'
  | 'IN_TREATMENT'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  branchId: string;
  chairId: string;
  startTime: string; // ISO string
  endTime: string;
  serviceCategory: string;
  status: AppointmentStatus;
  urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  notes?: string;
}

export interface QueueTicket {
  id: string;
  ticketNumber: string; // e.g. "D-102"
  patientId: string;
  patientName: string;
  arrivalTime: string;
  doctorName: string;
  roomName: string;
  status: 'ARRIVED' | 'WAITING' | 'IN_ROOM' | 'COMPLETED';
}

// --- 11. Treatment Plan ---
export interface TreatmentPlanItem {
  id: string;
  toothNumber?: number;
  serviceId: string;
  serviceName: string;
  ncspCode: string;
  icd10Code: string;
  quantity: number;
  listPriceGel: number;
  discountGel: number;
  insurerShareGel: number;
  patientShareGel: number;
  status: 'PROPOSED' | 'ACCEPTED' | 'COMPLETED';
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  createdAt: string;
  title: string;
  status: 'DRAFT' | 'PROPOSED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED';
  items: TreatmentPlanItem[];
  totalListPriceGel: number;
  totalDiscountGel: number;
  totalInsurerShareGel: number;
  totalPatientShareGel: number;
}

// --- 12. Calculation Engine (Georgian Official Format) ---
export interface CalculationSheet {
  id: string;
  calculationNumber: string; // e.g. "CALC-2026-0089"
  patientId: string;
  patientFullName: string;
  patientPersonalNumber: string;
  patientDob: string;
  medicalHistoryNumber: string;
  caseNotificationCode?: string;
  sponsorPayer: string;
  encounterStartDate: string;
  encounterEndDate: string;
  departmentName: string;
  doctorName: string;

  // Table items
  items: Array<{
    ncspCode: string;
    description: string;
    quantity: number;
    unitPriceGel: number;
    amountGel: number;
  }>;

  // Consumed materials cost
  directMaterialsCostGel: number;
  directMedicationsCostGel: number;
  externalLabCostGel: number;
  directClinicalCostTotalGel: number;

  examinationCostGel: number;
  doctorLaborCostGel: number;
  indirectOverheadCostGel: number;

  totalCostBeforeProfitGel: number;
  approvedRevenueGel: number;
  profitLossGel: number;
  marginPercent: number;

  insurerShareGel: number;
  patientCoPaymentGel: number;
  amountPaidGel: number;
  amountOutstandingGel: number;

  status: 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'SIGNED' | 'CLOSED';
  createdAt: string;
  signedBy?: string;
  signedAt?: string;
  qrHash: string;
}

// --- 13. Financial Invoicing & Cash Desk ---
export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientPersonalNumber: string;
  issueDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotalGel: number;
  discountGel: number;
  totalGel: number;
  paidGel: number;
  status: 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
}

export interface CashShift {
  id: string;
  cashierName: string;
  branchId: string;
  openedAt: string;
  closedAt?: string;
  openingBalanceGel: number;
  totalCashCollectedGel: number;
  totalCardCollectedGel: number;
  totalBankTransferGel: number;
  totalRefundsGel: number;
  expectedCashGel: number;
  actualCountedCashGel?: number;
  cashVarianceGel?: number;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
}

// --- 14. Inventory & Sterilization ---
export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: 'CONSUMABLE' | 'MEDICATION' | 'IMPLANT' | 'STERILIZATION' | 'RETAIL';
  unit: string; // e.g. "box", "piece", "ml", "gram"
  reorderLevel: number;
  currentStock: number;
  unitAcquisitionCostGel: number;
  lots: Array<{
    lotNumber: string;
    expiryDate: string;
    quantity: number;
  }>;
}

export interface SterilizationCycle {
  id: string;
  cycleNumber: string; // e.g. "CYC-2026-0412"
  autoclaveModel: string;
  autoclaveSerial: string;
  operatorName: string;
  startTime: string;
  endTime: string;
  temperatureCelsius: number;
  pressureBar: number;
  exposureMinutes: number;
  chemicalIndicatorResult: 'PASS' | 'FAIL';
  biologicalTestResult: 'PASS' | 'FAIL' | 'PENDING';
  status: 'STERILE' | 'FAILED_QUARANTINED';
  packageBarcodes: string[];
}

// --- 15. Medical Waste & Infection Control ---
export interface MedicalWasteRecord {
  id: string;
  branchId: string;
  wasteCategory: 'SHARPS' | 'ANATOMICAL' | 'INFECTIOUS_HAZARDOUS' | 'NON_HAZARDOUS';
  containerColor: 'YELLOW' | 'RED' | 'BLACK';
  weightKg: number;
  createdAt: string;
  sealedBy: string;
  pickupContractorName: string;
  manifestDocumentNumber: string;
  status: 'STORED' | 'PICKED_UP';
}

// --- 16. Radiology DICOM / X-Ray ---
export interface RadiologyStudy {
  id: string;
  patientId: string;
  patientName: string;
  modality: 'PERIAPICAL' | 'PANORAMIC_OPG' | 'CBCT' | 'CEPHALOMETRIC';
  studyDate: string;
  toothRegion?: string;
  imageUrl: string;
  doctorNotes?: string;
  pregnancyConfirmedSafe: boolean;
  radiationDosemGy?: number;
}

// --- 17. System Audit Log ---
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  username: string;
  role: string;
  action: string; // e.g. "PATIENT_VIEW", "CALCULATION_SIGNED", "STERILIZATION_QUARANTINED"
  entityName: string;
  entityId: string;
  branchId: string;
  ipAddress: string;
  previousValueHash?: string;
  currentHash: string;
  details: string;
}
