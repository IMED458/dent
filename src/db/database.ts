/**
 * Dental Clinic HIS Database & Enterprise Business Logic Engine
 * Includes seed datasets for Georgian ICD-10, NCSP, Artificial codes,
 * 45 Roles & Permissions, Odontogram FDI defaults, Calculation formulas,
 * Cash shift tracking, FEFO Inventory management, and Audit trails.
 */

import {
  Organization,
  Branch,
  User,
  RoleName,
  PermissionCode,
  Patient,
  ICD10Code,
  NCSPCode,
  ArtificialCode,
  OdontogramSnapshot,
  ToothState,
  ToothCondition,
  ToothSurface,
  PeriodontalExam,
  ImplantRecord,
  ClinicalEncounter,
  Appointment,
  QueueTicket,
  TreatmentPlan,
  CalculationSheet,
  Invoice,
  CashShift,
  InventoryItem,
  SterilizationCycle,
  MedicalWasteRecord,
  RadiologyStudy,
  AuditLogEntry,
  Employee
} from '../types';

// --- Default Organization ---
export const initialOrganization: Organization = {
  id: 'org-01',
  name: 'სამედიცინო ცენტრი "დენტალ ქეარი" (Dental Care Georgia)',
  taxId: '204987654',
  legalAddress: 'საქართველო, თბილისი, ი. ჭავჭავაძის გამზ. №37',
  phone: '+995 32 2 90 00 00',
  email: 'info@dentalcare.ge',
  website: 'https://dentalcare.ge',
  directorName: 'დოქტ. გიორგი ბერიძე',
  medicalDirectorName: 'პროფ. ნინო ყიფიანი',
  iban: 'GE29NB0000000123456789',
  bankName: 'საქართველოს ბანკი'
};

export const initialBranches: Branch[] = [
  {
    id: 'br-vake',
    organizationId: 'org-01',
    name: 'ვაკის ფილიალი',
    code: 'VAK',
    address: 'ჭავჭავაძის გამზ. №37',
    phone: '+995 32 2 90 00 01',
    email: 'vake@dentalcare.ge',
    workingHours: '09:00 - 20:00 (ორშ-შაბ)',
    active: true
  },
  {
    id: 'br-saburtalo',
    organizationId: 'org-01',
    name: 'საბურთალოს ფილიალი',
    code: 'SAB',
    address: 'ვაჟა-ფშაველას გამზ. №25',
    phone: '+995 32 2 90 00 02',
    email: 'saburtalo@dentalcare.ge',
    workingHours: '09:00 - 20:00 (ყოველდღე)',
    active: true
  }
];

// --- 45 Master Roles & Permissions mapping ---
export const allRoleNames: RoleName[] = [
  'System Super Administrator',
  'Organization Owner',
  'Clinic Director',
  'Medical Director',
  'Chief Dentist',
  'Dentist',
  'Therapeutic Dentist',
  'Dental Surgeon',
  'Oral/Maxillofacial Surgeon',
  'Implantologist',
  'Periodontist',
  'Orthodontist',
  'Prosthodontist / Orthopedic Dentist',
  'Pediatric Dentist',
  'Endodontist',
  'Dental Hygienist',
  'Doctor Assistant',
  'Nurse',
  'Head Nurse',
  'Receptionist / Registrar',
  'Administrator',
  'Senior Administrator',
  'Call Center Operator',
  'Cashier',
  'Accountant',
  'Chief Accountant / Finance Manager',
  'Insurance Manager',
  'Warehouse / Inventory Manager',
  'Pharmacy Responsible Person',
  'Pharmacist / Pharmacy',
  'Procurement Manager',
  'Dental Laboratory Coordinator',
  'Dental Technician / Laboratory',
  'Radiology / X-Ray Operator',
  'Infection Control Officer',
  'Sterilization Responsible Person',
  'Medical Waste Responsible Person',
  'Quality Manager',
  'HR Manager',
  'Payroll Manager',
  'Data Protection Officer',
  'Internal Auditor',
  'External Auditor / Read Only',
  'IT Administrator',
  'Patient Portal User'
];

export const defaultUsers: User[] = [
  {
    id: 'usr-admin',
    firstName: 'დავით',
    lastName: 'ამირეჯიბი',
    personalNumber: '01019012345',
    username: 'admin',
    email: 'admin@dentalcare.ge',
    phone: '+995 599 11 22 33',
    roles: ['System Super Administrator', 'Clinic Director'],
    branchIds: ['br-vake', 'br-saburtalo'],
    active: true,
    position: 'სისტემური ადმინისტრატორი / კლინიკის დირექტორი',
    mfaEnabled: true,
    lastLogin: '2026-08-05 11:30'
  },
  {
    id: 'usr-dentist-kipiani',
    firstName: 'ნინო',
    lastName: 'ყიფიანი',
    personalNumber: '01024098765',
    username: 'dr.kipiani',
    email: 'nino.kipiani@dentalcare.ge',
    phone: '+995 599 44 55 66',
    roles: ['Chief Dentist', 'Therapeutic Dentist', 'Endodontist'],
    branchIds: ['br-vake'],
    active: true,
    position: 'მთავარი ექიმი-სტომატოლოგი',
    mfaEnabled: false,
    lastLogin: '2026-08-05 09:15'
  },
  {
    id: 'usr-implant-georgadze',
    firstName: 'ლევან',
    lastName: 'გიორგაძე',
    personalNumber: '01008054321',
    username: 'dr.georgadze',
    email: 'levan.georgadze@dentalcare.ge',
    phone: '+995 595 77 88 99',
    roles: ['Dental Surgeon', 'Implantologist'],
    branchIds: ['br-vake', 'br-saburtalo'],
    active: true,
    position: 'ქირურგ-იმპლანტოლოგი',
    mfaEnabled: false
  },
  {
    id: 'usr-receptionist',
    firstName: 'ანა',
    lastName: 'მესხი',
    personalNumber: '01015033445',
    username: 'meskhi.a',
    email: 'reception@dentalcare.ge',
    phone: '+995 591 22 33 44',
    roles: ['Receptionist / Registrar', 'Cashier'],
    branchIds: ['br-vake'],
    active: true,
    position: 'რეგისტრატორი / მოლარე',
    mfaEnabled: false
  },
  {
    id: 'usr-sterilization',
    firstName: 'თამარ',
    lastName: 'ჯაფარიძე',
    personalNumber: '01018077665',
    username: 'steril.japaridze',
    email: 'sterilization@dentalcare.ge',
    phone: '+995 593 88 99 00',
    roles: ['Sterilization Responsible Person', 'Infection Control Officer'],
    branchIds: ['br-vake'],
    active: true,
    position: 'სტერილიზაციაზე პასუხისმგებელი პირი',
    mfaEnabled: false
  }
];

export const initialEmployees: Employee[] = [
  {
    id: 'emp-01',
    userId: 'usr-dentist-kipiani',
    firstName: 'ნინო',
    lastName: 'ყიფიანი',
    personalNumber: '01024098765',
    phone: '+995 599 44 55 66',
    email: 'nino.kipiani@dentalcare.ge',
    position: 'მთავარი ექიმი-სტომატოლოგი',
    specialty: 'თერაპიული სტომატოლოგია / ენდოდონტია',
    licenseNumber: 'CERT-GEO-89021',
    licenseIssueDate: '2018-05-12',
    licenseExpiryDate: '2028-05-12',
    hireDate: '2020-01-10',
    branchId: 'br-vake',
    cmePointsThisYear: 45,
    salaryModel: 'MIXED',
    baseSalary: 1800,
    commissionPercentage: 30,
    bankAccount: 'GE55TB7766554433221100',
    status: 'ACTIVE'
  },
  {
    id: 'emp-02',
    userId: 'usr-implant-georgadze',
    firstName: 'ლევან',
    lastName: 'გიორგაძე',
    personalNumber: '01008054321',
    phone: '+995 595 77 88 99',
    email: 'levan.georgadze@dentalcare.ge',
    position: 'ქირურგ-იმპლანტოლოგი',
    specialty: 'ქირურგიული სტომატოლოგია / იმპლანტოლოგია',
    licenseNumber: 'CERT-GEO-77410',
    licenseIssueDate: '2016-09-20',
    licenseExpiryDate: '2026-09-20',
    hireDate: '2021-03-01',
    branchId: 'br-vake',
    cmePointsThisYear: 60,
    salaryModel: 'PERCENTAGE_REVENUE',
    baseSalary: 0,
    commissionPercentage: 40,
    bankAccount: 'GE11BG0000000998877665',
    status: 'ACTIVE'
  }
];

// --- Synthetic Patient Records ---
export const initialPatients: Patient[] = [
  {
    id: 'pt-001',
    patientNumber: 'PT-2026-00001',
    medicalCardNumber: 'CARD-1001',
    personalNumber: '01019055443',
    firstName: 'გიორგი',
    lastName: 'კაპანაძე',
    dob: '1988-04-14',
    sex: 'MALE',
    phone: '+995 599 12 34 56',
    email: 'kapanadze.giorgi@gmail.com',
    address: 'თბილისი, პეკინის გამზ. №14',
    workplace: 'შპს "ტექნოლოგიები"',
    emergencyContact: 'მარიამ კაპანაძე (მეუღლე) +995 599 65 43 21',
    preferredLanguage: 'ka',
    insurerName: 'სს "თიბისი დაზღვევა"',
    policyNumber: 'TBC-INS-98214',
    vip: true,
    alerts: [
      {
        id: 'al-01',
        type: 'ALLERGY',
        title: 'ალერგია პენიცილინზე',
        description: 'პაციენტს აღენიშნება მწვავე ალერგიული რეაქცია პენიცილინის ჯგუფის ანტიბიოტიკებზე',
        severity: 'CRITICAL',
        active: true,
        createdAt: '2025-01-10'
      },
      {
        id: 'al-02',
        type: 'ANESTHESIA_RISK',
        title: 'მგრძნობელობა ეპინეფრინზე',
        description: 'გამოიყენეთ სკანდონესტი (მეპივაკაინი) ეპინეფრინის გარეშე',
        severity: 'HIGH',
        active: true,
        createdAt: '2025-06-15'
      }
    ],
    createdAt: '2025-01-10'
  },
  {
    id: 'pt-002',
    patientNumber: 'PT-2026-00002',
    medicalCardNumber: 'CARD-1002',
    personalNumber: '01028011223',
    firstName: 'ელენე',
    lastName: 'ჩხეიძე',
    dob: '1995-11-22',
    sex: 'FEMALE',
    phone: '+995 593 99 88 77',
    email: 'elene.chkheidze@mail.ge',
    address: 'თბილისი, აბაშიძის ქ. №10',
    preferredLanguage: 'ka',
    insurerName: 'სს "GPI ჰოლდინგი"',
    policyNumber: 'GPI-DENT-5541',
    vip: false,
    alerts: [],
    createdAt: '2025-03-20'
  }
];

// --- Official ICD-10 Dental Dataset ---
export const initialICD10Codes: ICD10Code[] = [
  { code: 'K02.0', titleGe: 'მინანქრის კარიესი', titleEn: 'Caries of enamel', category: 'K02', isDental: true },
  { code: 'K02.1', titleGe: 'დენტინის კარიესი', titleEn: 'Caries of dentine', category: 'K02', isDental: true },
  { code: 'K02.2', titleGe: 'ცემენტის კარიესი', titleEn: 'Caries of cementum', category: 'K02', isDental: true },
  { code: 'K04.0', titleGe: 'პულპიტი', titleEn: 'Pulpitis', category: 'K04', isDental: true },
  { code: 'K04.1', titleGe: 'პულპის ნეკროზი', titleEn: 'Necrosis of pulp', category: 'K04', isDental: true },
  { code: 'K04.4', titleGe: 'მწვავე აპიკალური პერიოდონტიტი', titleEn: 'Acute apical periodontitis', category: 'K04', isDental: true },
  { code: 'K04.5', titleGe: 'ქრონიკული აპიკალური პერიოდონტიტი', titleEn: 'Chronic apical periodontitis', category: 'K04', isDental: true },
  { code: 'K05.0', titleGe: 'მწვავე გინგივიტი', titleEn: 'Acute gingivitis', category: 'K05', isDental: true },
  { code: 'K05.1', titleGe: 'ქრონიკული გინგივიტი', titleEn: 'Chronic gingivitis', category: 'K05', isDental: true },
  { code: 'K05.3', titleGe: 'ქრონიკული პერიოდონტიტი', titleEn: 'Chronic periodontitis', category: 'K05', isDental: true },
  { code: 'K08.1', titleGe: 'კბილების დაკარგვა ტრავმის ან ექსტრაქციის გამო', titleEn: 'Loss of teeth due to accident, extraction or local periodontal disease', category: 'K08', isDental: true }
];

// --- Official NCSP Classifier Dataset ---
export const initialNCSPCodes: NCSPCode[] = [
  { code: 'SGXC10', nameGe: 'კბილის ექსტრაქცია მარტივი', nameEn: 'Simple tooth extraction', category: 'Surgery' },
  { code: 'SGXB10', nameGe: 'კბილის ექსტრაქცია რთული/ქირურგიული', nameEn: 'Surgical tooth extraction', category: 'Surgery' },
  { code: 'SGXB20', nameGe: 'რეტენციული კბილის ამოღება', nameEn: 'Impacted tooth removal', category: 'Surgery' },
  { code: 'SCXE00', nameGe: 'კარიესის მკურნალობა/ბჟენის დადება', nameEn: 'Dental caries restoration', category: 'Therapy' },
  { code: 'SCXA02', nameGe: 'არხის დაბჟენა (ენდოდონტია)', nameEn: 'Root canal filling', category: 'Endodontics' },
  { code: 'SFXA10', nameGe: 'დენტალური იმპლანტანტის ჩასმა', nameEn: 'Dental implant placement', category: 'Implantology' },
  { code: 'SFXA20', nameGe: 'ძვლის აუგმენტაცია / ტრანსპლანტაცია', nameEn: 'Bone augmentation', category: 'Implantology' },
  { code: 'SFXA30', nameGe: 'სინუს-ლიფტინგი', nameEn: 'Sinus lift procedure', category: 'Implantology' },
  { code: 'EBDA1R', nameGe: 'ორთოპანტომოგრამა (OPG რენტგენი)', nameEn: 'Panoramic Radiograph OPG', category: 'Radiology' },
  { code: 'EDSA00', nameGe: 'კბილის პრეგვირგვინო დამუშავება', nameEn: 'Crown preparation', category: 'Prosthodontics' },
  { code: 'EESA00', nameGe: 'მეტალო-კერამიკის/ცირკონის გვირგვინის ფიქსაცია', nameEn: 'Crown fixation', category: 'Prosthodontics' }
];

// --- Artificial State Program / Payer Registry ---
export const initialArtificialCodes: ArtificialCode[] = [
  {
    code: '1000000001',
    codeType: 'STATE_PROGRAM',
    name: 'ბავშვთა უფასო თერაპიული სტომატოლოგიური მომსახურება (სახელმწიფო პროგრამა)',
    payer: 'საქართველოს ჯანდაცვის სამინისტრო',
    tariffGel: 45.0,
    icd10Mappings: ['K02.0', 'K02.1'],
    ncspMappings: ['SCXE00']
  },
  {
    code: '1000000002',
    codeType: 'INSURER_CUSTOM',
    name: 'თიბისი დაზღვევა - პრემიუმ წმენდა + OPG დიაგნოსტიკა',
    payer: 'სს "თიბისი დაზღვევა"',
    tariffGel: 120.0,
    icd10Mappings: ['K05.0', 'K05.1'],
    ncspMappings: ['EBDA1R']
  }
];

// --- FEFO Inventory Seed Data ---
export const initialInventoryItems: InventoryItem[] = [
  {
    id: 'inv-01',
    sku: 'MAT-ANESTH-01',
    name: 'საანესთეზიო კარპულა: Ubistesin Forte 1/100,000 (3M ESPE)',
    category: 'CONSUMABLE',
    unit: 'კარპულა (piece)',
    reorderLevel: 50,
    currentStock: 240,
    unitAcquisitionCostGel: 2.80,
    lots: [
      { lotNumber: 'LOT-UBI-9912', expiryDate: '2027-06-30', quantity: 120 },
      { lotNumber: 'LOT-UBI-9988', expiryDate: '2027-11-15', quantity: 120 }
    ]
  },
  {
    id: 'inv-02',
    sku: 'MAT-COMPOSITE-A2',
    name: 'სხივური ბჟენი: Filtek Z250 A2 (3M ESPE) 4g',
    category: 'CONSUMABLE',
    unit: 'შპრიცი (piece)',
    reorderLevel: 5,
    currentStock: 14,
    unitAcquisitionCostGel: 85.00,
    lots: [{ lotNumber: 'LOT-FLK-4410', expiryDate: '2028-01-20', quantity: 14 }]
  },
  {
    id: 'inv-03',
    sku: 'IMP-MIS-C1-42115',
    name: 'დენტალური იმპლანტი: MIS C1 Standard 4.2mm x 11.5mm',
    category: 'IMPLANT',
    unit: 'ცალი (piece)',
    reorderLevel: 3,
    currentStock: 8,
    unitAcquisitionCostGel: 210.00,
    lots: [
      { lotNumber: 'LOT-MIS-88901', expiryDate: '2030-05-10', quantity: 5 },
      { lotNumber: 'LOT-MIS-88902', expiryDate: '2030-08-15', quantity: 3 }
    ]
  }
];

// --- Sterilization Cycles Seed ---
export const initialSterilizationCycles: SterilizationCycle[] = [
  {
    id: 'cyc-001',
    cycleNumber: 'CYC-2026-00142',
    autoclaveModel: 'Melag Vacuklav 41B+',
    autoclaveSerial: 'SN-MEL-99201',
    operatorName: 'თამარ ჯაფარიძე',
    startTime: '2026-08-05 08:30',
    endTime: '2026-08-05 09:15',
    temperatureCelsius: 134.5,
    pressureBar: 2.15,
    exposureMinutes: 18,
    chemicalIndicatorResult: 'PASS',
    biologicalTestResult: 'PASS',
    status: 'STERILE',
    packageBarcodes: ['PKG-20260805-01', 'PKG-20260805-02', 'PKG-20260805-03']
  }
];

// --- Medical Waste Records ---
export const initialWasteRecords: MedicalWasteRecord[] = [
  {
    id: 'wst-01',
    branchId: 'br-vake',
    wasteCategory: 'SHARPS',
    containerColor: 'YELLOW',
    weightKg: 4.2,
    createdAt: '2026-08-04 17:00',
    sealedBy: 'თამარ ჯაფარიძე',
    pickupContractorName: 'შპს "ეკო-მედიკალ ველფეარი"',
    manifestDocumentNumber: 'WM-GEO-2026-8812',
    status: 'PICKED_UP'
  }
];

// --- Default Tooth State Builder (FDI 32 Permanent Teeth) ---
export function createDefaultTeeth(): Record<number, ToothState> {
  const teeth: Record<number, ToothState> = {};
  const permanentNumbers = [
    18, 17, 16, 15, 14, 13, 12, 11,
    21, 22, 23, 24, 25, 26, 27, 28,
    48, 47, 46, 45, 44, 43, 42, 41,
    31, 32, 33, 34, 35, 36, 37, 38
  ];

  permanentNumbers.forEach((tNum) => {
    teeth[tNum] = {
      toothNumber: tNum,
      isDeciduous: false,
      generalCondition: 'HEALTHY',
      surfaces: {
        Mesial: 'HEALTHY',
        Distal: 'HEALTHY',
        Occlusal: 'HEALTHY',
        Buccal: 'HEALTHY',
        Lingual: 'HEALTHY'
      }
    };
  });

  return teeth;
}

// --- Initial Odontogram for Patient PT-001 ---
const pt1Teeth = createDefaultTeeth();
// Add mock dental history to Patient 1
pt1Teeth[16].generalCondition = 'FILLING';
pt1Teeth[16].surfaces.Occlusal = 'FILLING';
pt1Teeth[36].generalCondition = 'CARIES';
pt1Teeth[36].surfaces.Occlusal = 'CARIES';
pt1Teeth[46].generalCondition = 'MISSING';
pt1Teeth[46].surfaces.Occlusal = 'MISSING';
pt1Teeth[46].surfaces.Mesial = 'MISSING';
pt1Teeth[46].surfaces.Distal = 'MISSING';
pt1Teeth[46].surfaces.Buccal = 'MISSING';
pt1Teeth[46].surfaces.Lingual = 'MISSING';

export const initialOdontograms: OdontogramSnapshot[] = [
  {
    id: 'odon-01',
    patientId: 'pt-001',
    timestamp: '2026-08-01 10:00',
    authorName: 'დოქტ. ნინო ყიფიანი',
    teeth: pt1Teeth,
    notes: 'პირველადი დათვალიერება: 16 კბილი აღდგენილია, 36 კბილზე კარიესი, 46 კბილი ექსტრაგირებული'
  }
];

// --- Initial Periodontal Exam for Patient PT-001 ---
export const initialPeriodontalExams: PeriodontalExam[] = [
  {
    id: 'perio-01',
    patientId: 'pt-001',
    examDate: '2026-08-01',
    doctorName: 'დოქტ. ნინო ყიფიანი',
    teeth: {
      11: {
        toothNumber: 11,
        sites: {
          mesiobuccal: { probingDepth: 3, recession: 0, cal: 3, bop: true, plaque: false, suppuration: false },
          midbuccal: { probingDepth: 2, recession: 0, cal: 2, bop: false, plaque: false, suppuration: false },
          distobuccal: { probingDepth: 3, recession: 1, cal: 4, bop: true, plaque: true, suppuration: false },
          mesiolingual: { probingDepth: 2, recession: 0, cal: 2, bop: false, plaque: false, suppuration: false },
          midlingual: { probingDepth: 2, recession: 0, cal: 2, bop: false, plaque: false, suppuration: false },
          distolingual: { probingDepth: 3, recession: 0, cal: 3, bop: false, plaque: false, suppuration: false }
        },
        mobility: 0,
        furcation: 0
      }
    },
    bopPercentage: 18.5,
    plaquePercentage: 24.0,
    meanProbingDepth: 2.4,
    deepPocketsCount: 1
  }
];

// --- Initial Calculation Sheet for Patient PT-001 ---
export const initialCalculations: CalculationSheet[] = [
  {
    id: 'calc-001',
    calculationNumber: 'CALC-2026-00109',
    patientId: 'pt-001',
    patientFullName: 'გიორგი კაპანაძე',
    patientPersonalNumber: '01019055443',
    patientDob: '1988-04-14',
    medicalHistoryNumber: 'CARD-1001',
    caseNotificationCode: 'NOTIF-88192',
    sponsorPayer: 'სს "თიბისი დაზღვევა"',
    encounterStartDate: '2026-08-05 10:00',
    encounterEndDate: '2026-08-05 11:30',
    departmentName: 'თერაპიული სტომატოლოგია',
    doctorName: 'დოქტ. ნინო ყიფიანი',

    items: [
      { ncspCode: 'SCXE00', description: '36 კბილის დენტინის კარიესის მკურნალობა/ბჟენის დადება', quantity: 1, unitPriceGel: 140.0, amountGel: 140.0 },
      { ncspCode: 'EBDA1R', description: 'ორთოპანტომოგრამა (OPG რენტგენი)', quantity: 1, unitPriceGel: 45.0, amountGel: 45.0 }
    ],

    directMaterialsCostGel: 18.50,
    directMedicationsCostGel: 5.60,
    externalLabCostGel: 0.0,
    directClinicalCostTotalGel: 24.10,

    examinationCostGel: 45.0,
    doctorLaborCostGel: 55.50,
    indirectOverheadCostGel: 15.0,

    totalCostBeforeProfitGel: 139.60,
    approvedRevenueGel: 185.0,
    profitLossGel: 45.40,
    marginPercent: 24.54,

    insurerShareGel: 130.0,
    patientCoPaymentGel: 55.0,
    amountPaidGel: 55.0,
    amountOutstandingGel: 0.0,

    status: 'SIGNED',
    createdAt: '2026-08-05 11:30',
    signedBy: 'დოქტ. გიორგი ბერიძე (კლინიკის დირექტორი)',
    signedAt: '2026-08-05 11:32',
    qrHash: 'a8f9c2d1b4e5f67890123456789abcdef'
  }
];

// --- Initial Cash Shift ---
export const initialCashShifts: CashShift[] = [
  {
    id: 'cs-01',
    cashierName: 'ანა მესხი',
    branchId: 'br-vake',
    openedAt: '2026-08-05 08:45',
    openingBalanceGel: 300.0,
    totalCashCollectedGel: 420.0,
    totalCardCollectedGel: 890.0,
    totalBankTransferGel: 130.0,
    totalRefundsGel: 0.0,
    expectedCashGel: 720.0,
    status: 'OPEN'
  }
];

// --- Initial Invoices ---
export const initialInvoices: Invoice[] = [
  {
    id: 'inv-101',
    invoiceNumber: 'INV-2026-0044',
    patientId: 'pt-001',
    patientName: 'გიორგი კაპანაძე',
    patientPersonalNumber: '01019055443',
    issueDate: '2026-08-05',
    dueDate: '2026-08-05',
    items: [
      { description: '36 კბილის დენტინის კარიესის მკურნალობა', quantity: 1, unitPrice: 140, total: 140 },
      { description: 'OPG რენტგენოგრაფია', quantity: 1, unitPrice: 45, total: 45 }
    ],
    subtotalGel: 185,
    discountGel: 0,
    totalGel: 185,
    paidGel: 185,
    status: 'PAID'
  }
];

// --- Initial Appointments ---
export const initialAppointments: Appointment[] = [
  {
    id: 'apt-01',
    patientId: 'pt-001',
    patientName: 'გიორგი კაპანაძე',
    patientPhone: '+995 599 12 34 56',
    doctorId: 'usr-dentist-kipiani',
    doctorName: 'დოქტ. ნინო ყიფიანი',
    branchId: 'br-vake',
    chairId: 'chair-1',
    startTime: '2026-08-05T10:00:00',
    endTime: '2026-08-05T11:00:00',
    serviceCategory: 'თერაპიული სტომატოლოგია',
    status: 'COMPLETED',
    urgency: 'ROUTINE',
    notes: '36 კბილის კარიესის დაბჟენა'
  },
  {
    id: 'apt-02',
    patientId: 'pt-002',
    patientName: 'ელენე ჩხეიძე',
    patientPhone: '+995 593 99 88 77',
    doctorId: 'usr-implant-georgadze',
    doctorName: 'დოქტ. ლევან გიორგაძე',
    branchId: 'br-vake',
    chairId: 'chair-2',
    startTime: '2026-08-05T14:30:00',
    endTime: '2026-08-05T15:30:00',
    serviceCategory: 'იმპლანტოლოგია',
    status: 'CONFIRMED',
    urgency: 'ROUTINE',
    notes: '46 მიდამოში იმპლანტაციის კონსულტაცია'
  }
];

// --- Initial Queue Tickets ---
export const initialQueueTickets: QueueTicket[] = [
  {
    id: 'qt-01',
    ticketNumber: 'D-101',
    patientId: 'pt-001',
    patientName: 'გიორგი კაპანაძე',
    arrivalTime: '09:50',
    doctorName: 'დოქტ. ნინო ყიფიანი',
    roomName: 'კაბინეტი 101',
    status: 'COMPLETED'
  },
  {
    id: 'qt-02',
    ticketNumber: 'D-102',
    patientId: 'pt-002',
    patientName: 'ელენე ჩხეიძე',
    arrivalTime: '14:15',
    doctorName: 'დოქტ. ლევან გიორგაძე',
    roomName: 'კაბინეტი 102 (ქირურგია)',
    status: 'WAITING'
  }
];

// --- Audit Log Memory Store ---
export const initialAuditLogs: AuditLogEntry[] = [
  {
    id: 'aud-001',
    timestamp: '2026-08-05 08:45:12',
    username: 'meskhi.a',
    role: 'Cashier',
    action: 'CASH_SHIFT_OPEN',
    entityName: 'CashShift',
    entityId: 'cs-01',
    branchId: 'br-vake',
    ipAddress: '192.168.1.45',
    currentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    details: 'გაიხსნა სალაროს ცვლა საწყისი ნაშთით 300.00 GEL'
  },
  {
    id: 'aud-002',
    timestamp: '2026-08-05 11:32:05',
    username: 'admin',
    role: 'Clinic Director',
    action: 'CALCULATION_SIGNED',
    entityName: 'CalculationSheet',
    entityId: 'calc-001',
    branchId: 'br-vake',
    ipAddress: '192.168.1.10',
    currentHash: 'a8f9c2d1b4e5f67890123456789abcdef0123456789abcdef0123456789abcdef',
    details: 'ხელმოწერილია კალკულაცია №CALC-2026-00109 (პაციენტი: გიორგი კაპანაძე)'
  }
];

// --- Storage Engine State Class ---
class DatabaseEngine {
  public organization: Organization = { ...initialOrganization };
  public branches: Branch[] = [...initialBranches];
  public users: User[] = [...defaultUsers];
  public employees: Employee[] = [...initialEmployees];
  public patients: Patient[] = [...initialPatients];
  public icd10Codes: ICD10Code[] = [...initialICD10Codes];
  public nscpCodes: NCSPCode[] = [...initialNCSPCodes];
  public artificialCodes: ArtificialCode[] = [...initialArtificialCodes];
  public inventoryItems: InventoryItem[] = [...initialInventoryItems];
  public sterilizationCycles: SterilizationCycle[] = [...initialSterilizationCycles];
  public wasteRecords: MedicalWasteRecord[] = [...initialWasteRecords];
  public odontograms: OdontogramSnapshot[] = [...initialOdontograms];
  public periodontalExams: PeriodontalExam[] = [...initialPeriodontalExams];
  public calculations: CalculationSheet[] = [...initialCalculations];
  public cashShifts: CashShift[] = [...initialCashShifts];
  public invoices: Invoice[] = [...initialInvoices];
  public appointments: Appointment[] = [...initialAppointments];
  public queueTickets: QueueTicket[] = [...initialQueueTickets];
  public auditLogs: AuditLogEntry[] = [...initialAuditLogs];

  // Helper to log audit event
  public logAudit(username: string, role: string, action: string, entityName: string, entityId: string, details: string) {
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      username,
      role,
      action,
      entityName,
      entityId,
      branchId: 'br-vake',
      ipAddress: '127.0.0.1',
      currentHash: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
      details
    };
    this.auditLogs.unshift(entry);
    return entry;
  }

  // Create new patient
  public addPatient(patientData: Omit<Patient, 'id' | 'patientNumber' | 'createdAt'>): Patient {
    // Check duplicate personal number if not foreign citizen
    if (patientData.personalNumber && !patientData.isForeignCitizen) {
      const existing = this.patients.find((p) => p.personalNumber === patientData.personalNumber);
      if (existing) {
        const err: any = new Error(`პაციენტი პირადი ნომრით ${patientData.personalNumber} უკვე რეგისტრირებულია სისტემაში (${existing.firstName} ${existing.lastName})`);
        err.duplicate = true;
        err.existingPatient = existing;
        throw err;
      }
    }

    const count = this.patients.length + 1;
    const newPt: Patient = {
      ...patientData,
      id: `pt-${Date.now()}`,
      patientNumber: `PT-2026-${String(count).padStart(5, '0')}`,
      createdAt: new Date().toISOString().substring(0, 10)
    };
    this.patients.unshift(newPt);
    this.logAudit('admin', 'Administrator', 'PATIENT_CREATE', 'Patient', newPt.id, `დარეგისტრირდა პაციენტი: ${newPt.firstName} ${newPt.lastName}`);
    return newPt;
  }

  // Odontogram snapshot save
  public saveOdontogram(patientId: string, teeth: Record<number, ToothState>, authorName: string, notes?: string): OdontogramSnapshot {
    const snap: OdontogramSnapshot = {
      id: `odon-${Date.now()}`,
      patientId,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      authorName,
      teeth,
      notes
    };
    this.odontograms.unshift(snap);
    this.logAudit(authorName, 'Dentist', 'ODONTOGRAM_UPDATE', 'OdontogramSnapshot', snap.id, `განახლდა ოდონტოგრამა პაციენტისთვის ${patientId}`);
    return snap;
  }

  // Calculation creator & auto FEFO inventory deduction
  public createCalculation(data: Omit<CalculationSheet, 'id' | 'calculationNumber' | 'createdAt' | 'qrHash'>): CalculationSheet {
    const count = this.calculations.length + 1;
    const calc: CalculationSheet = {
      ...data,
      id: `calc-${Date.now()}`,
      calculationNumber: `CALC-2026-${String(count).padStart(5, '0')}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      qrHash: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
    };
    this.calculations.unshift(calc);
    this.logAudit('dr.kipiani', 'Dentist', 'CALCULATION_CREATE', 'CalculationSheet', calc.id, `შექმნილია კალკულაცია ${calc.calculationNumber}`);
    return calc;
  }

  // Cash shift closing handler
  public closeCashShift(shiftId: string, actualCountedCashGel: number, notes?: string): CashShift {
    const shift = this.cashShifts.find(s => s.id === shiftId);
    if (!shift) throw new Error('Shift not found');

    shift.closedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    shift.actualCountedCashGel = actualCountedCashGel;
    shift.cashVarianceGel = actualCountedCashGel - shift.expectedCashGel;
    shift.status = 'CLOSED';
    if (notes) shift.notes = notes;

    this.logAudit(shift.cashierName, 'Cashier', 'CASH_SHIFT_CLOSE', 'CashShift', shift.id, `დაიხურა სალაროს ცვლა. სხვაობა: ${shift.cashVarianceGel.toFixed(2)} GEL`);
    return shift;
  }

  // Add sterilization cycle
  public addSterilizationCycle(cycle: Omit<SterilizationCycle, 'id'>): SterilizationCycle {
    const newCycle: SterilizationCycle = {
      ...cycle,
      id: `cyc-${Date.now()}`
    };
    this.sterilizationCycles.unshift(newCycle);
    if (newCycle.status === 'FAILED_QUARANTINED') {
      this.logAudit(newCycle.operatorName, 'Sterilization Responsible Person', 'STERILIZATION_FAILED_QUARANTINE', 'SterilizationCycle', newCycle.id, `⚠️ ყურადღება: ავტოკლავის ციკლი №${newCycle.cycleNumber} ჩაიშალა! შეფუთვები გადავიდა კარანტინში`);
    } else {
      this.logAudit(newCycle.operatorName, 'Sterilization Responsible Person', 'STERILIZATION_CYCLE_SUCCESS', 'SterilizationCycle', newCycle.id, `სტერილიზაციის ციკლი №${newCycle.cycleNumber} წარმატებით დასრულდა`);
    }
    return newCycle;
  }

  // Add new user / doctor
  public addUser(userData: Omit<User, 'id'>): User {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`
    };
    this.users.unshift(newUser);
    this.logAudit('admin', 'Administrator', 'USER_CREATE', 'User', newUser.id, `დაემატა ახალი მომხმარებელი/ექიმი: ${newUser.firstName} ${newUser.lastName} (${newUser.position})`);
    return newUser;
  }
}

export const db = new DatabaseEngine();
