import React from 'react';
import type { ClinicSettings, Diagnosis, MedDocument, Patient, RadiologyStudy, User, Visit } from '../lib/types';
import { RADIOLOGY_LABELS } from '../lib/types';
import { ageOf, fmtDate, isMinor, money, patientName, todayStr, userName } from '../lib/utils';
import { diagnosisLine } from '../components/clinical';
import { Box, FooterNote, Row, SheetHeader, Signatures } from './common';
import { DEFAULT_TEMPLATES } from '../data/defaults';

export interface DocCtx {
  patient: Patient;
  clinic: ClinicSettings;
  doctor?: User;
  visit?: Visit;
  visits: Visit[];
  radiology: RadiologyStudy[];
  staff: User[];
  me: User;
}

export type FieldKind = 'text' | 'textarea' | 'date' | 'select' | 'diagnoses' | 'items' | 'check';

export interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  options?: string[];
  category?: string;
  full?: boolean;
  required?: boolean;
  hint?: string;
  rows?: number;
}

export interface DocType {
  id: string;
  title: string;
  formCode?: string;
  group: 'ოფიციალური ფორმები' | 'თანხმობები' | 'ცნობები და მიმართვები' | 'გეგმა და ფინანსები' | 'სხვა';
  description: string;
  legal: string;
  fields: FieldDef[];
  prefill: (c: DocCtx) => Record<string, any>;
  Print: React.FC<{ doc: MedDocument; c: DocCtx }>;
  /** მოცემული პროცედურის ტიპის არჩევისას ავტომატურად ცვლის სხვა ველებს */
  onChange?: (key: string, value: any, data: Record<string, any>) => Record<string, any>;
}

const tpl = (title: string) => DEFAULT_TEMPLATES.find((t) => t.title === title && t.category === 'consentRisks')?.text || '';

const allDiagnoses = (visits: Visit[]): Diagnosis[] => {
  const seen = new Set<string>();
  const out: Diagnosis[] = [];
  [...visits]
    .sort((a, b) => b.date.localeCompare(a.date))
    .forEach((v) =>
      v.diagnoses.forEach((d) => {
        const k = `${d.code}|${d.teeth || ''}`;
        if (d.code && !seen.has(k)) {
          seen.add(k);
          out.push(d);
        }
      }),
    );
  return out;
};

const patientLine = (p: Patient) => `${patientName(p)}${p.fatherName ? ` (მამის სახ. ${p.fatherName})` : ''}`;
const doctorLine = (u?: User) => (u ? `${userName(u)}${u.license ? `, სერტ. №${u.license}` : ''}` : '');
const signerName = (p: Patient) => (isMinor(p) && p.guardianName ? `${p.guardianName} (${p.guardianRelation || 'კანონიერი წარმომადგენელი'})` : patientName(p));

const DocNo = ({ doc }: { doc: MedDocument }) => (
  <>
    <div>№ {doc.number}</div>
    <div>{fmtDate(doc.date)}</div>
  </>
);

const PatientTable = ({ p, extra }: { p: Patient; extra?: React.ReactNode }) => (
  <table style={{ margin: '8px 0' }}>
    <tbody>
      <tr>
        <td style={{ width: '50%' }}>
          <b>პაციენტი:</b> {patientLine(p)}
        </td>
        <td>
          <b>{p.idType === 'PASSPORT' ? 'პასპორტი' : 'პირადი №'}:</b> {p.idNumber || '—'}
        </td>
      </tr>
      <tr>
        <td>
          <b>დაბადების თარიღი:</b> {fmtDate(p.birthDate)} ({ageOf(p.birthDate)} წ.)
        </td>
        <td>
          <b>სამედიცინო ბარათი №:</b> {p.cardNumber}
        </td>
      </tr>
      <tr>
        <td colSpan={2}>
          <b>მისამართი:</b> {p.address || '—'} · <b>ტელ.:</b> {p.phone}
        </td>
      </tr>
      {extra}
    </tbody>
  </table>
);

const Diags = ({ list }: { list?: Diagnosis[] }) => (
  <>{list?.length ? list.map((d, i) => <div key={i}>{diagnosisLine(d)}</div>) : ' '}</>
);

// ---------------------------------------------------------------------------

const form100: DocType = {
  id: 'form100',
  title: 'ცნობა ჯანმრთელობის მდგომარეობის შესახებ',
  formCode: 'ფორმა №IV-100/ა',
  group: 'ოფიციალური ფორმები',
  description: 'ამონაწერი სამედიცინო ბარათიდან — გაიცემა პაციენტის მოთხოვნით სამსახურში, სასწავლებელში, სადაზღვევოში და სხვ. წარსადგენად.',
  legal:
    'საქართველოს შრომის, ჯანმრთელობისა და სოციალური დაცვის მინისტრის 2007 წლის 9 აგვისტოს №338/ნ ბრძანება „სამედიცინო დოკუმენტაციის... ფორმების დამტკიცების შესახებ“ — ფორმა №IV-100/ა.',
  fields: [
    { key: 'presentTo', label: 'ცნობა წარსადგენია (სად)', kind: 'text', full: true, required: true },
    { key: 'workplace', label: 'სამუშაო ადგილი და თანამდებობა', kind: 'text', full: true },
    { key: 'visitDates', label: 'დაწესებულებაში მიმართვის / მკურნალობის თარიღები', kind: 'text', full: true },
    { key: 'diagnoses', label: 'სრული დიაგნოზი (ICD-10)', kind: 'diagnoses', full: true, required: true },
    { key: 'pastDiseases', label: 'გადატანილი დაავადებები', kind: 'textarea', category: 'anamnesisVitae', full: true },
    { key: 'anamnesis', label: 'მოკლე ანამნეზი', kind: 'textarea', category: 'anamnesisMorbi', full: true },
    { key: 'exams', label: 'ჩატარებული დიაგნოსტიკური კვლევები', kind: 'textarea', category: 'extraExams', full: true },
    { key: 'treatment', label: 'ჩატარებული მკურნალობა', kind: 'textarea', category: 'treatment', full: true, rows: 4 },
    { key: 'condition', label: 'მდგომარეობა ცნობის გაცემისას', kind: 'textarea', category: 'general', full: true, rows: 2 },
    { key: 'recommendations', label: 'სამკურნალო და შრომითი რეკომენდაციები', kind: 'textarea', category: 'recommendations', full: true },
  ],
  prefill: ({ patient, visit, visits, radiology }) => {
    const src = visit ? [visit] : visits;
    const dates = [...src].map((v) => v.date).sort();
    return {
      presentTo: 'მოთხოვნის ადგილზე',
      workplace: patient.workplace || '',
      visitDates: dates.length ? (dates.length === 1 ? `ამბულატორიულად: ${fmtDate(dates[0])}` : `ამბულატორიულად: ${fmtDate(dates[0])} — ${fmtDate(dates[dates.length - 1])}`) : '',
      diagnoses: visit ? visit.diagnoses : allDiagnoses(visits),
      pastDiseases: [patient.chronicDiseases, patient.allergies && `ალერგია: ${patient.allergies}`].filter(Boolean).join('. '),
      anamnesis: src.map((v) => [v.complaints, v.anamnesisMorbi].filter(Boolean).join(' ')).filter(Boolean).join('\n'),
      exams: [
        ...src.map((v) => v.extraExams).filter(Boolean),
        ...radiology.filter((r) => !visit || r.visitId === visit.id || r.date === visit.date).map((r) => `${fmtDate(r.date)} — ${RADIOLOGY_LABELS[r.kind]}${r.teeth ? ` (კბ. ${r.teeth})` : ''}${r.conclusion ? `: ${r.conclusion}` : ''}`),
      ].join('\n'),
      treatment: src
        .map((v) => `${fmtDate(v.date)}: ${[v.treatment, v.procedures.map((p) => `${p.service}${p.teeth ? ` (კბ. ${p.teeth})` : ''}`).join(', ')].filter(Boolean).join(' ')}`)
        .join('\n'),
      condition: 'დამაკმაყოფილებელი',
      recommendations: visit?.recommendations || [...visits].sort((a, b) => b.date.localeCompare(a.date))[0]?.recommendations || '',
    };
  },
  Print: ({ doc, c }) => {
    const d = doc.data;
    const p = c.patient;
    return (
      <div className="print-sheet">
        <SheetHeader clinic={c.clinic} formCode="ფორმა №IV-100/ა" right={<div className="small">დამტკიცებულია №338/ნ ბრძანებით</div>} />
        <h1>ცნობა ჯანმრთელობის მდგომარეობის შესახებ</h1>
        <p style={{ textAlign: 'center' }}>
          № {doc.number} · გაცემის თარიღი: {fmtDate(doc.date)}
        </p>
        <Row label="1. ცნობა წარსადგენია:" value={d.presentTo} />
        <Row label="2. სამედიცინო დაწესებულების დასახელება და მისამართი:" value={[c.clinic.legalName || c.clinic.name, c.clinic.address].filter(Boolean).join(', ')} />
        <Row label="3. პაციენტის სახელი, გვარი:" value={patientLine(p)} />
        <Row label="4. დაბადების თარიღი:" value={`${fmtDate(p.birthDate)} (${ageOf(p.birthDate)} წ.)`} />
        <Row label="5. პირადი ნომერი:" value={p.idNumber} />
        <Row label="6. მისამართი:" value={p.address} />
        <Row label="7. სამუშაო ადგილი და თანამდებობა:" value={d.workplace} />
        <Row label="8. მიმართვის / მკურნალობის თარიღები:" value={d.visitDates} />
        <Box label="9. სრული დიაგნოზი (ICD-10):" value={<Diags list={d.diagnoses} />} />
        <Box label="10. გადატანილი დაავადებები:" value={d.pastDiseases} />
        <Box label="11. მოკლე ანამნეზი:" value={d.anamnesis} />
        <Box label="12. ჩატარებული დიაგნოსტიკური კვლევები:" value={d.exams} />
        <Box label="13. ჩატარებული მკურნალობა:" value={d.treatment} />
        <Box label="14. მდგომარეობა ცნობის გაცემისას:" value={d.condition} />
        <Box label="15. სამკურნალო და შრომითი რეკომენდაციები:" value={d.recommendations} />
        <Signatures left={`მკურნალი ექიმი: ${doctorLine(c.doctor)}`} center={`სამედიცინო დირექტორი: ${c.clinic.medicalDirector || ''}`} right="ბ.ა." />
        <FooterNote clinic={c.clinic} />
      </div>
    );
  },
};

const CONSENT_KINDS = ['თერაპიული მკურნალობა', 'ენდოდონტიური მკურნალობა', 'კბილის ექსტრაქცია / ქირურგია', 'დენტალური იმპლანტაცია', 'ორთოპედიული მკურნალობა', 'ორთოდონტიული მკურნალობა', 'ადგილობრივი ანესთეზია', 'რენტგენოლოგიური კვლევა'];

const consent: DocType = {
  id: 'consent',
  title: 'ინფორმირებული თანხმობა სამედიცინო მომსახურებაზე',
  group: 'თანხმობები',
  description: 'წერილობითი ინფორმირებული თანხმობა სტომატოლოგიურ მანიპულაციაზე (ქირურგია, ანესთეზია, ენდოდონტია, იმპლანტაცია და სხვ.).',
  legal:
    'საქართველოს კანონი „პაციენტის უფლებების შესახებ“ (მუხ. 18, 22–25) და „ჯანმრთელობის დაცვის შესახებ“ — ქირურგიული ოპერაციისა და ზოგადი/ადგილობრივი ანესთეზიისთვის აუცილებელია წერილობითი თანხმობა; 18 წლამდე პაციენტის ნაცვლად თანხმობას აცხადებს კანონიერი წარმომადგენელი.',
  fields: [
    { key: 'kind', label: 'სამედიცინო მომსახურების სახე', kind: 'select', options: CONSENT_KINDS, required: true },
    { key: 'teeth', label: 'კბილ(ებ)ი / მიდამო', kind: 'text' },
    { key: 'procedure', label: 'დაგეგმილი მანიპულაციის აღწერა', kind: 'textarea', category: 'treatment', full: true, required: true },
    { key: 'diagnoses', label: 'დიაგნოზი', kind: 'diagnoses', full: true },
    { key: 'risks', label: 'შესაძლო რისკები და გართულებები', kind: 'textarea', category: 'consentRisks', full: true, rows: 5 },
    { key: 'alternatives', label: 'ალტერნატიული მეთოდები / უარის შედეგები', kind: 'textarea', category: 'consentAlternatives', full: true },
    { key: 'anesthesia', label: 'ანესთეზიის სახე', kind: 'text', full: true },
    { key: 'cost', label: 'სავარაუდო ღირებულება (₾)', kind: 'text' },
  ],
  prefill: ({ visit, visits }) => {
    const v = visit || [...visits].sort((a, b) => b.date.localeCompare(a.date))[0];
    return {
      kind: CONSENT_KINDS[0],
      teeth: v?.diagnoses.map((d) => d.teeth).filter(Boolean).join(', ') || '',
      procedure: v?.treatment || '',
      diagnoses: v?.diagnoses || [],
      risks: tpl(CONSENT_KINDS[0]),
      alternatives: DEFAULT_TEMPLATES.find((t) => t.id === 'tl1')?.text || '',
      anesthesia: v?.anesthesia || 'ადგილობრივი (ინფილტრაციული/გამტარებლობითი)',
      cost: '',
    };
  },
  onChange: (key, value, data) => (key === 'kind' ? { ...data, kind: value, risks: tpl(value) || data.risks } : { ...data, [key]: value }),
  Print: ({ doc, c }) => {
    const d = doc.data;
    const p = c.patient;
    const minor = isMinor(p);
    return (
      <div className="print-sheet">
        <SheetHeader clinic={c.clinic} right={<DocNo doc={doc} />} />
        <h1>პაციენტის ინფორმირებული თანხმობა</h1>
        <p style={{ textAlign: 'center', fontWeight: 700 }}>{d.kind}</p>
        <PatientTable
          p={p}
          extra={
            minor || p.guardianName ? (
              <tr>
                <td colSpan={2}>
                  <b>კანონიერი წარმომადგენელი:</b> {p.guardianName} {p.guardianRelation && `(${p.guardianRelation})`} {p.guardianIdNumber && `· პ/ნ ${p.guardianIdNumber}`}
                </td>
              </tr>
            ) : undefined
          }
        />
        <p>
          მე, <b>{signerName(p)}</b>, ვადასტურებ, რომ ექიმმა <b>{doctorLine(c.doctor)}</b> ჩემთვის გასაგებ ენაზე მომაწოდა სრული, ობიექტური და დროული ინფორმაცია:
        </p>
        <Box label="დიაგნოზი / ჯანმრთელობის მდგომარეობა:" value={<Diags list={d.diagnoses} />} />
        <Box label={`დაგეგმილი სამედიცინო მომსახურება${d.teeth ? ` (კბ. ${d.teeth})` : ''}:`} value={d.procedure} />
        <Box label="ანესთეზია:" value={d.anesthesia} />
        <Box label="შესაძლო რისკები და გართულებები:" value={d.risks} />
        <Box label="ალტერნატიული მეთოდები და მკურნალობაზე უარის შესაძლო შედეგები:" value={d.alternatives} />
        {d.cost && <Row label="სავარაუდო ღირებულება:" value={`${d.cost} ₾`} />}
        <div className="small" style={{ marginTop: 8 }}>
          <p>ვადასტურებ, რომ:</p>
          <ul style={{ paddingLeft: 18, listStyle: 'disc' }}>
            <li>მქონდა შესაძლებლობა დამესვა კითხვები და მივიღე ამომწურავი პასუხები;</li>
            <li>ექიმს მივაწოდე სრული ინფორმაცია ჩემი ჯანმრთელობის მდგომარეობის, ალერგიის, მიღებული მედიკამენტების{p.sex === 'F' ? ' და ორსულობის' : ''} შესახებ;</li>
            <li>ვიცი, რომ მკურნალობის შედეგი არ შეიძლება იყოს 100%-ით გარანტირებული და ორგანიზმის ინდივიდუალური რეაქცია შეიძლება განსხვავდებოდეს;</li>
            <li>ვაცნობიერებ, რომ მანიპულაციის მიმდინარეობისას გაუთვალისწინებელი გარემოების დადგომისას ექიმი იმოქმედებს ჩემი ჯანმრთელობის ინტერესებიდან გამომდინარე;</li>
            <li>მაქვს უფლება ნებისმიერ ეტაპზე უარი ვთქვა მომსახურებაზე, რისი შედეგებიც ამიხსნეს.</li>
          </ul>
          <p style={{ marginTop: 6 }}>
            ნებაყოფლობით <b>ვაცხადებ თანხმობას</b> ზემოაღნიშნულ სამედიცინო მომსახურებაზე.
          </p>
        </div>
        <Signatures left={`${minor ? 'კანონიერი წარმომადგენელი' : 'პაციენტი'}: ${signerName(p)}`} center={`ექიმი: ${doctorLine(c.doctor)}`} right={`თარიღი: ${fmtDate(doc.date)}`} />
        <FooterNote clinic={c.clinic}>საფუძველი: საქართველოს კანონი „პაციენტის უფლებების შესახებ“, მუხლები 18, 22–25.</FooterNote>
      </div>
    );
  },
};

const pdConsent: DocType = {
  id: 'pdConsent',
  title: 'თანხმობა პერსონალური მონაცემების დამუშავებაზე',
  group: 'თანხმობები',
  description: 'ჯანმრთელობასთან დაკავშირებული (განსაკუთრებული კატეგორიის) მონაცემების დამუშავებაზე წერილობითი თანხმობა.',
  legal: 'საქართველოს კანონი „პერსონალურ მონაცემთა დაცვის შესახებ“ (2023) — განსაკუთრებული კატეგორიის მონაცემების დამუშავება; „პაციენტის უფლებების შესახებ“ — კონფიდენციალურობა.',
  fields: [
    { key: 'purposes', label: 'დამუშავების მიზნები', kind: 'textarea', full: true, rows: 3 },
    { key: 'sharing', label: 'მონაცემების მიმღებები', kind: 'textarea', full: true, rows: 2 },
    { key: 'sms', label: 'თანახმაა SMS / სატელეფონო შეხსენებებზე', kind: 'check' },
    { key: 'photo', label: 'თანახმაა კლინიკური ფოტოების გამოყენებაზე სამეცნიერო/სასწავლო მიზნით (ანონიმურად)', kind: 'check' },
  ],
  prefill: () => ({
    purposes:
      'სამედიცინო მომსახურების გაწევა, სამედიცინო დოკუმენტაციის წარმოება და შენახვა კანონით დადგენილი ვადით, დიაგნოსტიკური კვლევების (მ.შ. რენტგენოლოგიური გამოსახულებების) შენახვა, ანგარიშსწორება, კანონით გათვალისწინებული ანგარიშგება.',
    sharing: 'სადაზღვევო კომპანია (დაზღვევის არსებობისას), კანონით უფლებამოსილი სახელმწიფო ორგანოები, მიმართვის შემთხვევაში — სხვა სამედიცინო დაწესებულება/ლაბორატორია.',
    sms: true,
    photo: false,
  }),
  Print: ({ doc, c }) => {
    const d = doc.data;
    const p = c.patient;
    return (
      <div className="print-sheet">
        <SheetHeader clinic={c.clinic} right={<DocNo doc={doc} />} />
        <h1>თანხმობა პერსონალური მონაცემების დამუშავებაზე</h1>
        <PatientTable p={p} />
        <p>
          მე, <b>{signerName(p)}</b>, „პერსონალურ მონაცემთა დაცვის შესახებ“ საქართველოს კანონის შესაბამისად, ვაცხადებ თანხმობას, რომ <b>{c.clinic.legalName || c.clinic.name}</b>
          {c.clinic.taxId && ` (ს/კ ${c.clinic.taxId})`} დაამუშაოს ჩემი{isMinor(p) ? ' (ჩემი შვილის/მეურვეობის ქვეშ მყოფის)' : ''} პერსონალური მონაცემები, მათ შორის ჯანმრთელობასთან დაკავშირებული განსაკუთრებული კატეგორიის მონაცემები.
        </p>
        <Box label="დამუშავების მიზნები:" value={d.purposes} />
        <Box label="მონაცემების შესაძლო მიმღებები:" value={d.sharing} />
        <p className="small" style={{ marginTop: 6 }}>
          {d.sms ? '☑' : '☐'} თანახმა ვარ ვიზიტის შეხსენებისა და ინფორმაციის მიღებაზე SMS-ით / ტელეფონით.
          <br />{d.photo ? '☑' : '☐'} თანახმა ვარ ჩემი კლინიკური ფოტოების ანონიმურად გამოყენებაზე სამეცნიერო/სასწავლო მიზნით.
        </p>
        <p className="small" style={{ marginTop: 6 }}>
          ჩემთვის ცნობილია, რომ მაქვს უფლება მოვითხოვო ინფორმაცია ჩემი მონაცემების დამუშავების შესახებ, მათი გაცნობა, ასლის მიღება, გასწორება, განახლება და დამუშავების შეწყვეტა, ასევე თანხმობის
          გამოხმობა, გარდა იმ შემთხვევებისა, როდესაც მონაცემების შენახვა სავალდებულოა კანონით (სამედიცინო დოკუმენტაცია). საჩივრის შეტანა შესაძლებელია პერსონალურ მონაცემთა დაცვის სამსახურში.
        </p>
        <Signatures left={`${isMinor(p) ? 'კანონიერი წარმომადგენელი' : 'პაციენტი'}: ${signerName(p)}`} right={`თარიღი: ${fmtDate(doc.date)}`} />
        <FooterNote clinic={c.clinic} />
      </div>
    );
  },
};

const refusal: DocType = {
  id: 'refusal',
  title: 'უარი სამედიცინო მომსახურებაზე',
  group: 'თანხმობები',
  description: 'პაციენტის წერილობითი უარი შეთავაზებულ კვლევაზე/მკურნალობაზე, შედეგების განმარტებით.',
  legal: 'საქართველოს კანონი „პაციენტის უფლებების შესახებ“ — მუხ. 22: ქმედუნარიან პაციენტს უფლება აქვს უარი თქვას სამედიცინო მომსახურებაზე.',
  fields: [
    { key: 'service', label: 'სამედიცინო მომსახურება, რაზეც პაციენტი უარს აცხადებს', kind: 'textarea', category: 'treatment', full: true, required: true },
    { key: 'consequences', label: 'უარის შესაძლო შედეგები (განმარტებულია პაციენტისთვის)', kind: 'textarea', category: 'consentAlternatives', full: true, rows: 4 },
    { key: 'reason', label: 'პაციენტის მიერ დასახელებული მიზეზი', kind: 'textarea', full: true, rows: 2 },
  ],
  prefill: () => ({ service: '', consequences: 'დაავადების პროგრესირება, ტკივილი, ინფექციის გავრცელება, ანთებითი გართულებები, კბილის დაკარგვა, მკურნალობის გართულება და გაძვირება მომავალში.', reason: '' }),
  Print: ({ doc, c }) => {
    const d = doc.data;
    const p = c.patient;
    return (
      <div className="print-sheet">
        <SheetHeader clinic={c.clinic} right={<DocNo doc={doc} />} />
        <h1>უარი სამედიცინო მომსახურებაზე</h1>
        <PatientTable p={p} />
        <p>
          მე, <b>{signerName(p)}</b>, ექიმის <b>{doctorLine(c.doctor)}</b> მიერ სრული ინფორმაციის მიღების შემდეგ, ნებაყოფლობით ვაცხადებ <b>უარს</b> შემდეგ სამედიცინო მომსახურებაზე:
        </p>
        <Box label="სამედიცინო მომსახურება:" value={d.service} />
        <Box label="უარის შესაძლო შედეგები, რომლებიც ამიხსნეს:" value={d.consequences} />
        {d.reason && <Box label="უარის მიზეზი:" value={d.reason} />}
        <p className="small">ვადასტურებ, რომ შედეგებზე პასუხისმგებლობას ვიღებ საკუთარ თავზე და კლინიკას პრეტენზია არ მაქვს.</p>
        <Signatures left={`${isMinor(p) ? 'კანონიერი წარმომადგენელი' : 'პაციენტი'}: ${signerName(p)}`} center={`ექიმი: ${doctorLine(c.doctor)}`} right={`თარიღი: ${fmtDate(doc.date)}`} />
        <FooterNote clinic={c.clinic} />
      </div>
    );
  },
};

const referral: DocType = {
  id: 'referral',
  title: 'მიმართვა კონსულტაციაზე / კვლევაზე',
  group: 'ცნობები და მიმართვები',
  description: 'მიმართვა სხვა სპეციალისტთან, დაწესებულებაში, ლაბორატორიაში ან რადიოლოგიურ კვლევაზე.',
  legal: 'სამედიცინო დოკუმენტაციის წარმოების წესი (№338/ნ); „ჯანმრთელობის დაცვის შესახებ“ საქართველოს კანონი.',
  fields: [
    { key: 'to', label: 'ვის / სად', kind: 'text', full: true, required: true },
    { key: 'type', label: 'მიმართვის ტიპი', kind: 'select', options: ['კონსულტაცია', 'რადიოლოგიური კვლევა', 'ლაბორატორიული კვლევა', 'ჰოსპიტალიზაცია', 'მკურნალობის გაგრძელება'] },
    { key: 'urgency', label: 'სასწრაფოობა', kind: 'select', options: ['გეგმიური', 'სასწრაფო'] },
    { key: 'diagnoses', label: 'დიაგნოზი', kind: 'diagnoses', full: true },
    { key: 'reason', label: 'მიმართვის მიზანი / საკითხი', kind: 'textarea', category: 'referralReason', full: true, required: true },
    { key: 'summary', label: 'მოკლე ანამნეზი და ჩატარებული მკურნალობა', kind: 'textarea', category: 'treatment', full: true, rows: 4 },
  ],
  prefill: ({ visit, visits }) => {
    const v = visit || [...visits].sort((a, b) => b.date.localeCompare(a.date))[0];
    return { to: '', type: 'კონსულტაცია', urgency: 'გეგმიური', diagnoses: v?.diagnoses || [], reason: '', summary: v ? [v.complaints, v.treatment].filter(Boolean).join('\n') : '' };
  },
  Print: ({ doc, c }) => {
    const d = doc.data;
    return (
      <div className="print-sheet">
        <SheetHeader clinic={c.clinic} right={<DocNo doc={doc} />} />
        <h1>მიმართვა</h1>
        <p style={{ textAlign: 'center' }}>
          {d.type} · {d.urgency}
        </p>
        <Row label="ადრესატი:" value={d.to} />
        <PatientTable p={c.patient} />
        <Box label="დიაგნოზი (ICD-10):" value={<Diags list={d.diagnoses} />} />
        <Box label="მიმართვის მიზანი:" value={d.reason} />
        <Box label="მოკლე ანამნეზი, ჩატარებული კვლევა და მკურნალობა:" value={d.summary} />
        <Row label="ალერგია:" value={c.patient.allergies || 'არ აღენიშნება'} />
        <Signatures left={`მიმმართველი ექიმი: ${doctorLine(c.doctor)}`} right="ბ.ა." />
        <FooterNote clinic={c.clinic} />
      </div>
    );
  },
};

const extract: DocType = {
  id: 'extract',
  title: 'ამონაწერი სამედიცინო ბარათიდან',
  group: 'ცნობები და მიმართვები',
  description: 'ამონაწერი ამბულატორიული სტომატოლოგიური ბარათიდან — ჩატარებული მკურნალობის სრული ისტორია.',
  legal: '„პაციენტის უფლებების შესახებ“ საქართველოს კანონი — მუხ. 18: პაციენტს უფლება აქვს მიიღოს ინფორმაცია და ასლი მისი სამედიცინო დოკუმენტაციიდან.',
  fields: [
    { key: 'period', label: 'პერიოდი', kind: 'text', full: true },
    { key: 'diagnoses', label: 'დიაგნოზები', kind: 'diagnoses', full: true },
    { key: 'history', label: 'ჩატარებული მკურნალობის ქრონოლოგია', kind: 'textarea', full: true, rows: 10 },
    { key: 'recommendations', label: 'რეკომენდაციები', kind: 'textarea', category: 'recommendations', full: true },
  ],
  prefill: ({ visits }) => {
    const s = [...visits].sort((a, b) => a.date.localeCompare(b.date));
    return {
      period: s.length ? `${fmtDate(s[0].date)} — ${fmtDate(s[s.length - 1].date)}` : '',
      diagnoses: allDiagnoses(visits),
      history: s
        .map((v) => `${fmtDate(v.date)} (ვიზიტი №${v.visitNo}): ${v.diagnoses.map(diagnosisLine).join('; ')}${v.treatment ? `. ${v.treatment}` : ''}`)
        .join('\n'),
      recommendations: s[s.length - 1]?.recommendations || '',
    };
  },
  Print: ({ doc, c }) => {
    const d = doc.data;
    return (
      <div className="print-sheet">
        <SheetHeader clinic={c.clinic} right={<DocNo doc={doc} />} />
        <h1>ამონაწერი ამბულატორიული სტომატოლოგიური ბარათიდან</h1>
        <PatientTable p={c.patient} />
        <Row label="მკურნალობის პერიოდი:" value={d.period} />
        <Box label="დიაგნოზები (ICD-10):" value={<Diags list={d.diagnoses} />} />
        <Box label="ჩატარებული მკურნალობა:" value={d.history} />
        <Box label="რეკომენდაციები:" value={d.recommendations} />
        <Signatures left={`მკურნალი ექიმი: ${doctorLine(c.doctor)}`} right="ბ.ა." />
        <FooterNote clinic={c.clinic} />
      </div>
    );
  },
};

const visitCert: DocType = {
  id: 'visitCert',
  title: 'ცნობა კლინიკაში ვიზიტის შესახებ',
  group: 'ცნობები და მიმართვები',
  description: 'მოკლე ცნობა სამსახურში/სასწავლებელში წარსადგენად, რომ პაციენტი იმყოფებოდა სტომატოლოგიურ კლინიკაში.',
  legal: 'შიდა ფორმა. დიაგნოზი არ მიეთითება პაციენტის თანხმობის გარეშე (კონფიდენციალურობა).',
  fields: [
    { key: 'presentTo', label: 'წარსადგენად', kind: 'text', full: true },
    { key: 'date', label: 'ვიზიტის თარიღი', kind: 'date' },
    { key: 'from', label: 'დრო (დან)', kind: 'text' },
    { key: 'to', label: 'დრო (მდე)', kind: 'text' },
    { key: 'showDiagnosis', label: 'ცნობაში მიეთითოს დიაგნოზი (პაციენტის თანხმობით)', kind: 'check' },
    { key: 'diagnoses', label: 'დიაგნოზი', kind: 'diagnoses', full: true },
  ],
  prefill: ({ visit }) => ({ presentTo: 'მოთხოვნის ადგილზე', date: visit?.date || todayStr(), from: visit?.time || '', to: '', showDiagnosis: false, diagnoses: visit?.diagnoses || [] }),
  Print: ({ doc, c }) => {
    const d = doc.data;
    return (
      <div className="print-sheet" style={{ minHeight: 0 }}>
        <SheetHeader clinic={c.clinic} right={<DocNo doc={doc} />} />
        <h1>ცნობა</h1>
        <p style={{ marginTop: 12 }}>
          გაიცა <b>{patientLine(c.patient)}</b>-ზე (პ/ნ {c.patient.idNumber || '—'}, დაბ. {fmtDate(c.patient.birthDate)}) იმის შესახებ, რომ იგი <b>{fmtDate(d.date)}</b>
          {d.from && `-ს ${d.from}${d.to ? `–${d.to}` : ''} საათზე`} იმყოფებოდა {c.clinic.legalName || c.clinic.name}-ში სტომატოლოგიურ ვიზიტზე.
        </p>
        {d.showDiagnosis && <Box label="დიაგნოზი:" value={<Diags list={d.diagnoses} />} />}
        <Row label="ცნობა წარსადგენია:" value={d.presentTo} />
        <Signatures left={`ექიმი: ${doctorLine(c.doctor)}`} right="ბ.ა." />
      </div>
    );
  },
};

const xrayReport: DocType = {
  id: 'xrayReport',
  title: 'რენტგენოლოგიური კვლევის დასკვნა',
  group: 'ცნობები და მიმართვები',
  description: 'რენტგენოლოგიური/CBCT კვლევის ოქმი და დასკვნა.',
  legal: 'იონიზირებელი გამოსხივების წყაროებთან მუშაობისას დოზის აღრიცხვა — „ბირთვული და რადიაციული უსაფრთხოების შესახებ“ საქართველოს კანონი.',
  fields: [
    { key: 'kind', label: 'კვლევის სახე', kind: 'select', options: Object.values(RADIOLOGY_LABELS) },
    { key: 'studyDate', label: 'კვლევის თარიღი', kind: 'date' },
    { key: 'teeth', label: 'კბილები / მიდამო', kind: 'text' },
    { key: 'dose', label: 'ეფექტური დოზა (მკზვ)', kind: 'text' },
    { key: 'description', label: 'აღწერა', kind: 'textarea', category: 'xrayDescription', full: true, rows: 5 },
    { key: 'conclusion', label: 'დასკვნა', kind: 'textarea', category: 'xrayConclusion', full: true, rows: 3 },
  ],
  prefill: ({ radiology }) => {
    const r = [...radiology].sort((a, b) => b.date.localeCompare(a.date))[0];
    return r
      ? { kind: RADIOLOGY_LABELS[r.kind], studyDate: r.date, teeth: r.teeth, dose: r.dose || '', description: r.description, conclusion: r.conclusion }
      : { kind: RADIOLOGY_LABELS.periapical, studyDate: todayStr(), teeth: '', dose: '', description: '', conclusion: '' };
  },
  Print: ({ doc, c }) => {
    const d = doc.data;
    return (
      <div className="print-sheet">
        <SheetHeader clinic={c.clinic} right={<DocNo doc={doc} />} />
        <h1>რენტგენოლოგიური კვლევის ოქმი</h1>
        <PatientTable p={c.patient} />
        <Row label="კვლევის სახე:" value={d.kind} />
        <Row label="კვლევის თარიღი:" value={fmtDate(d.studyDate)} />
        <Row label="კბილები / მიდამო:" value={d.teeth} />
        <Row label="ეფექტური დოზა:" value={d.dose && `${d.dose} მკზვ`} />
        <Box label="აღწერა:" value={d.description} />
        <Box label="დასკვნა:" value={d.conclusion} />
        <Signatures left={`ექიმი: ${doctorLine(c.doctor)}`} right="ბ.ა." />
        <FooterNote clinic={c.clinic} />
      </div>
    );
  },
};

const plan: DocType = {
  id: 'plan',
  title: 'მკურნალობის გეგმა და ხარჯთაღრიცხვა',
  group: 'გეგმა და ფინანსები',
  description: 'ეტაპობრივი მკურნალობის გეგმა ფასებით — პაციენტის გასაცნობად და ხელმოსაწერად.',
  legal: '„პაციენტის უფლებების შესახებ“ — პაციენტს უფლება აქვს წინასწარ მიიღოს ინფორმაცია მომსახურების ღირებულების შესახებ.',
  fields: [
    { key: 'diagnoses', label: 'დიაგნოზები', kind: 'diagnoses', full: true },
    { key: 'items', label: 'გეგმის პუნქტები', kind: 'items', full: true },
    { key: 'discount', label: 'ფასდაკლება (%)', kind: 'text' },
    { key: 'validUntil', label: 'გეგმა მოქმედებს', kind: 'date' },
    { key: 'notes', label: 'შენიშვნა', kind: 'textarea', category: 'general', full: true, rows: 2 },
  ],
  prefill: ({ visits }) => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return { diagnoses: allDiagnoses(visits), items: [], discount: '', validUntil: d.toISOString().slice(0, 10), notes: 'ფასები შეიძლება შეიცვალოს მკურნალობის მიმდინარეობისას კლინიკური სიტუაციის შეცვლის შემთხვევაში, პაციენტთან შეთანხმებით.' };
  },
  Print: ({ doc, c }) => {
    const d = doc.data;
    const items: { stage: string; teeth: string; service: string; qty: number; price: number }[] = d.items || [];
    const sum = items.reduce((s, i) => s + (Number(i.qty) || 1) * (Number(i.price) || 0), 0);
    const disc = Math.min(100, Math.max(0, Number(d.discount) || 0));
    return (
      <div className="print-sheet">
        <SheetHeader clinic={c.clinic} right={<DocNo doc={doc} />} />
        <h1>მკურნალობის გეგმა და ხარჯთაღრიცხვა</h1>
        <PatientTable p={c.patient} />
        <Box label="დიაგნოზები:" value={<Diags list={d.diagnoses} />} />
        <table style={{ marginTop: 8 }}>
          <thead>
            <tr>
              <th>#</th>
              <th>ეტაპი</th>
              <th>კბილი</th>
              <th>მომსახურება</th>
              <th>რაოდ.</th>
              <th>ფასი</th>
              <th>ჯამი</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i, k) => (
              <tr key={k}>
                <td>{k + 1}</td>
                <td>{i.stage}</td>
                <td>{i.teeth}</td>
                <td>{i.service}</td>
                <td>{i.qty}</td>
                <td>{money(Number(i.price))}</td>
                <td>{money((Number(i.qty) || 1) * Number(i.price))}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={6} style={{ textAlign: 'right' }}>
                ჯამი:
              </td>
              <td>{money(sum)}</td>
            </tr>
            {disc > 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'right' }}>
                  ფასდაკლება {disc}%:
                </td>
                <td>−{money((sum * disc) / 100)}</td>
              </tr>
            )}
            <tr>
              <td colSpan={6} style={{ textAlign: 'right' }}>
                <b>სულ გადასახდელი:</b>
              </td>
              <td>
                <b>{money(sum * (1 - disc / 100))}</b>
              </td>
            </tr>
          </tbody>
        </table>
        {d.validUntil && <Row label="გეგმა მოქმედებს:" value={fmtDate(d.validUntil)} />}
        <Box label="შენიშვნა:" value={d.notes} />
        <p className="small">გავეცანი მკურნალობის გეგმას და ღირებულებას, მივიღე ამომწურავი ინფორმაცია და ვეთანხმები.</p>
        <Signatures left={`პაციენტი: ${signerName(c.patient)}`} right={`ექიმი: ${doctorLine(c.doctor)}`} />
      </div>
    );
  },
};

const free: DocType = {
  id: 'free',
  title: 'თავისუფალი ფორმის დოკუმენტი',
  group: 'სხვა',
  description: 'ნებისმიერი სხვა დოკუმენტი — სათაური და ტექსტი შაბლონებით.',
  legal: '—',
  fields: [
    { key: 'heading', label: 'სათაური', kind: 'text', full: true, required: true },
    { key: 'body', label: 'ტექსტი', kind: 'textarea', category: 'general', full: true, rows: 12 },
    { key: 'patientSigns', label: 'პაციენტის ხელმოწერის ველი', kind: 'check' },
  ],
  prefill: () => ({ heading: '', body: '', patientSigns: false }),
  Print: ({ doc, c }) => (
    <div className="print-sheet">
      <SheetHeader clinic={c.clinic} right={<DocNo doc={doc} />} />
      <h1>{doc.data.heading}</h1>
      <PatientTable p={c.patient} />
      <div style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{doc.data.body}</div>
      <Signatures left={`ექიმი: ${doctorLine(c.doctor)}`} right={doc.data.patientSigns ? `პაციენტი: ${signerName(c.patient)}` : 'ბ.ა.'} />
    </div>
  ),
};

export const DOC_TYPES: DocType[] = [form100, consent, pdConsent, refusal, referral, extract, visitCert, xrayReport, plan, free];
export const docType = (id: string) => DOC_TYPES.find((d) => d.id === id);
