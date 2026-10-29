import { db, uid, nowIso, nextCounter } from '../lib/db';
import { createPatient, newVisit } from '../lib/records';
import { hashPin, todayStr } from '../lib/utils';
import type { Patient, User } from '../lib/types';

const base: Omit<Patient, 'id' | 'cardNumber' | 'cardSource' | 'reservedJournalNo' | 'createdAt' | 'updatedAt' | 'createdBy' | 'firstName' | 'lastName' | 'idNumber' | 'birthDate' | 'sex'> = {
  idType: 'GE',
  fatherName: '',
  citizenship: 'საქართველო',
  phone: '',
  address: 'თბილისი',
  allergies: '',
  chronicDiseases: '',
  medications: '',
  riskFlags: [],
  pdConsent: true,
};

/** სადემონსტრაციო (გამოგონილი) პაციენტები — პირადი ნომრები შეგნებულად არარეალურია */
export async function loadDemoData(adminId: string) {
  const docId = uid();
  const doctor: User = {
    id: docId,
    firstName: 'ნინო',
    lastName: 'ბერიძე',
    role: 'doctor',
    specialty: 'ექიმი-სტომატოლოგი (თერაპევტი)',
    license: '00-0000',
    pinHash: await hashPin('1111', docId),
    active: true,
    createdAt: nowIso(),
  };
  await db.users.add(doctor);

  const p1 = await createPatient(
    { ...base, firstName: 'გიორგი', lastName: 'დემოშვილი', fatherName: 'დავითი', idNumber: '00000000001', birthDate: '1988-04-12', sex: 'M', phone: '555 00 00 01', allergies: 'პენიცილინი', riskFlags: ['ალერგია ანტიბიოტიკზე'] },
    adminId,
  );
  const p2 = await createPatient(
    { ...base, firstName: 'მარიამ', lastName: 'სატესტო', fatherName: 'ლევანი', idNumber: '00000000002', birthDate: '1995-09-30', sex: 'F', phone: '555 00 00 02', chronicDiseases: 'არტერიული ჰიპერტენზია', medications: 'ლიზინოპრილი 10 მგ', riskFlags: ['არტერიული ჰიპერტენზია'] },
    adminId,
  );
  await createPatient(
    { ...base, firstName: 'ლუკა', lastName: 'ნიმუშაძე', fatherName: 'ირაკლი', idNumber: '00000000003', birthDate: '2015-02-18', sex: 'M', phone: '555 00 00 03', guardianName: 'ირაკლი ნიმუშაძე', guardianRelation: 'მამა', guardianIdNumber: '00000000004', guardianPhone: '555 00 00 03' },
    adminId,
  );

  const v = await newVisit(p1.id, docId, adminId);
  await db.visits.update(v.id, {
    complaintTeeth: '36',
    complaintFlags: ['გამღიზიანებლით გამოწვეული მიზეზობრივი ხასიათის ტკივილი'],
    complaints: 'ხანმოკლე ტკივილი ცივი და ტკბილი საკვების მიღებისას 36 კბილის მიდამოში.',
    bite: 'ორთოგნათიული',
    mucosa: 'ფიზიოლოგიური ფერის, ტენიანი',
    plaqueFlags: ['რბილი', 'ღრძილზედა'],
    examPlan: ['ანამნეზის შეკრება', 'სახისა და პირის ღრუს დათვალიერება', 'თერმოდიაგნოსტიკა', 'ვიზიორენტგენოგრაფიული გამოკვლევა'],
    extraExams: 'ვიზიორენტგენოგრაფია: 36 კბილის ოკლუზიურ ზედაპირზე დენტინის ფარგლებში კარიესული ღრუ, პერიაპიკალური ცვლილებების გარეშე.',
    anamnesisVitae: 'ალერგია პენიცილინზე. სხვა თანმხლებ დაავადებებს უარყოფს.',
    externalExam: 'სახე სიმეტრიულია. რეგიონული ლიმფური კვანძები არ ისინჯება.',
    intraoralExam: '36 კბილის ოკლუზიურ ზედაპირზე კარიესული ღრუ დარბილებული დენტინით. ზონდირება მტკივნეულია ემალ-დენტინის საზღვარზე. პერკუსია უმტკივნეულო.',
    diagnoses: [{ code: 'K02.1', text: 'დენტინის კარიესი', teeth: '36', kind: 'main' }],
    anesthesia: 'ინფილტრაციული ანესთეზია: Sol. Articaini 4% + Epinephrini 1:100 000 — 1.7 მლ.',
    treatment: '36 კბილის კარიესული ღრუს პრეპარირება, ადჰეზიური სისტემა, კომპოზიტური ბჟენი. ოკლუზიის კორექცია, გაპრიალება.',
    procedures: [
      { id: uid(), teeth: '36', service: 'ადგილობრივი ანესთეზია', qty: 1, price: 15 },
      { id: uid(), teeth: '36', service: 'კომპოზიტური ბჟენი', qty: 1, price: 120 },
    ],
    recommendations: '2 საათის განმავლობაში თავი შეიკავოს საღებავი საკვებისგან. პროფილაქტიკური ვიზიტი 6 თვეში.',
    status: 'signed',
    signedAt: nowIso(),
    signedBy: docId,
  });
  await db.odontograms.add({
    id: uid(),
    patientId: p1.id,
    date: todayStr(),
    dentition: 'permanent',
    note: 'პირველადი გასინჯვა',
    createdBy: docId,
    teeth: { '36': { status: 'filling', surfaces: 'O' }, '46': { status: 'endo' }, '18': { status: 'missing' }, '27': { status: 'caries', surfaces: 'D' }, '16': { status: 'crown' } },
  });
  await db.payments.add({ id: uid(), patientId: p1.id, date: todayStr(), amount: 135, method: 'card', note: 'ვიზიტი №1', createdAt: nowIso(), createdBy: adminId });

  const now = new Date();
  const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;
  await db.appointments.bulkAdd([
    { id: uid(), patientId: p2.id, doctorId: docId, date: todayStr(), time: hh(Math.min(now.getHours() + 1, 19)), duration: 60, reason: 'პროფესიული ჰიგიენა', status: 'confirmed', createdAt: nowIso() },
    { id: uid(), patientId: p1.id, doctorId: docId, date: todayStr(), time: hh(Math.min(now.getHours() + 2, 20)), duration: 30, reason: 'საკონტროლო ვიზიტი', status: 'planned', createdAt: nowIso() },
  ]);
  await nextCounter('demo-loaded');
}
