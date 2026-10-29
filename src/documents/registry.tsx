import React from 'react';
import type { ClinicSettings, Diagnosis, MedDocument, Patient, RadiologyStudy, User, Visit } from '../lib/types';
import { RADIOLOGY_LABELS } from '../lib/types';
import { ageOf, fmtDate, isMinor, money, needsRepresentative, patientName, todayStr, userName } from '../lib/utils';
import { diagnosisLine } from '../components/clinical';
import { Box, FooterNote, Row, SheetHeader, Signatures } from './common';
import { DEFAULT_TEMPLATES } from '../data/defaults';
import { CONSENT_220_2, LEGAL } from '../data/forms220';

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
/** ხელმომწერი: 16 წლამდე — მშობელი/კანონიერი წარმომადგენელი, 16+ — თავად პაციენტი (პაციენტის უფლებების კანონი, მუხ. 41) */
const signerName = (p: Patient) =>
  needsRepresentative(p) ? `${p.guardianName || '________________'} (${p.guardianRelation || 'მშობელი/კანონიერი წარმომადგენელი'})` : patientName(p);
const signerRole = (p: Patient) => (needsRepresentative(p) ? 'მშობელი/კანონიერი წარმომადგენელი' : 'პაციენტი');

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

const COURSE = ['', 'მწვავე', 'ქვემწვავე', 'ქრონიკული', 'მორეციდივე'];

/** ფორმა №IV-100/ა — ბრძანება №338/ნ (ცვლ. №230/ნ 2008, №01-42/ნ 2013, №01-73/ნ 2020), დანართი №2 */
const form100: DocType = {
  id: 'form100',
  title: 'ცნობა ჯანმრთელობის მდგომარეობის შესახებ',
  formCode: 'ფორმა №IV-100/ა',
  group: 'ოფიციალური ფორმები',
  description: 'გაიცემა მხოლოდ იმ დაავადებისთვის, რომლის გამოც პაციენტმა მიმართა დაწესებულებას. აღირიცხება სპეციალურ ჟურნალში რიგითი ნომრით.',
  legal: `${LEGAL.order338}. ხელს აწერს მკურნალი ექიმი და დაწესებულების ხელმძღვანელი/მოადგილე, მოწმდება ბეჭდით (დანართი №1, მუხ. 2.2); ცნობა გაიცემა მხოლოდ იმ დაავადებისთვის, რომლის გამოც პაციენტმა მიმართა (დანართი №3, მუხ. 2).`,
  fields: [
    { key: 'sendTo', label: '2. დაწესებულების დასახელება, მისამართი, სადაც იგზავნება ცნობა', kind: 'text', full: true, required: true },
    { key: 'workplace', label: '7. სამუშაო ადგილი და თანამდებობა (მოსწავლე/სტუდენტი — სასწავლებელი, კლასი/კურსი)', kind: 'text', full: true },
    { key: 'dateVisit', label: '8ა. ექიმთან მიმართვის თარიღი', kind: 'date', required: true },
    { key: 'dateReferInpatient', label: '8ბ. სტაციონარში გაგზავნის თარიღი', kind: 'date' },
    { key: 'dateAdmit', label: '8გ. სტაციონარში მოთავსების თარიღი', kind: 'date' },
    { key: 'dateDischarge', label: '8დ. გაწერის თარიღი', kind: 'date' },
    { key: 'conclusion', label: '9. დასკვნა ჯანმრთელობის მდგომარეობის შესახებ („ჯანმრთელი“, „პრაქტიკულად ჯანმრთელი“) — თუ დიაგნოზი არ ეთითება', kind: 'text', full: true },
    { key: 'diagnoses', label: '9. სრული დიაგნოზი (ძირითადი დაავადება, თანმხლები დაავადებები, გართულებები) შესაბამისი ICD-10 კოდის მითითებით', kind: 'diagnoses', full: true },
    { key: 'pastDiseases', label: '10. გადატანილი დაავადებები (მათ შორის ბავშვთა ინფექციური)', kind: 'textarea', category: 'anamnesisVitae', full: true, rows: 2 },
    { key: 'anamnesis', label: '11. მოკლე ანამნეზი', kind: 'textarea', category: 'anamnesisMorbi', full: true },
    { key: 'exams', label: '12. ჩატარებული დიაგნოსტიკური გამოკვლევები და კონსულტაციები', kind: 'textarea', category: 'extraExams', full: true },
    { key: 'course', label: '13. ავადმყოფობის მიმდინარეობა', kind: 'select', options: COURSE },
    { key: 'treatment', label: '14. ჩატარებული მკურნალობა', kind: 'textarea', category: 'treatment', full: true, rows: 4 },
    { key: 'stateReferral', label: '15. მდგომარეობა სტაციონარში გაგზავნისას', kind: 'textarea', category: 'general', full: true, rows: 2 },
    { key: 'stateDischarge', label: '16. მდგომარეობა სტაციონარიდან გაწერისას', kind: 'textarea', category: 'general', full: true, rows: 2 },
    { key: 'recommendations', label: '17. სამკურნალო და შრომითი რეკომენდაციები', kind: 'textarea', category: 'recommendations', full: true },
  ],
  prefill: ({ patient, visit, visits, radiology }) => {
    // ცნობა გაიცემა მხოლოდ იმ დაავადებისთვის, რომლის გამოც პაციენტმა მიმართა (№338/ნ, დანართი №3, მუხ. 2) — ერთი შემთხვევის ფარგლებში
    const anchor = visit || [...visits].sort((a, b) => b.date.localeCompare(a.date) || b.visitNo - a.visitNo)[0];
    const caseVisits = anchor ? visits.filter((v) => (v.caseId || v.id) === (anchor.caseId || anchor.id)) : [];
    const src = (caseVisits.length ? caseVisits : anchor ? [anchor] : []).sort((a, b) => a.date.localeCompare(b.date) || a.visitNo - b.visitNo);
    const last = src[src.length - 1];
    const dx = (last || visit)?.diagnoses || [];
    return {
      sendTo: 'მოთხოვნის ადგილზე წარსადგენად',
      workplace: patient.workplace || '',
      dateVisit: src[0]?.date || todayStr(),
      dateReferInpatient: '',
      dateAdmit: '',
      dateDischarge: '',
      conclusion: '',
      diagnoses: dx,
      pastDiseases: patient.chronicDiseases || '',
      anamnesis: src.map((v) => [v.complaints, v.anamnesisMorbi].filter(Boolean).join(' ')).filter(Boolean).join('\n'),
      exams: [
        ...src.map((v) => v.extraExams).filter(Boolean),
        ...radiology.filter((r) => !src.length || src.some((v) => r.visitId === v.id || r.date === v.date)).map((r) => `${fmtDate(r.date)} — ${RADIOLOGY_LABELS[r.kind]}${r.teeth ? ` (კბ. ${r.teeth})` : ''}${r.conclusion ? `: ${r.conclusion}` : ''}`),
      ].join('\n'),
      course: '',
      treatment: src
        .map((v) => `${fmtDate(v.date)}: ${[v.treatment, v.procedures.map((p) => `${p.service}${p.teeth ? ` (კბ. ${p.teeth})` : ''}`).join(', ')].filter(Boolean).join(' ')}`)
        .join('\n'),
      stateReferral: '',
      stateDischarge: '',
      recommendations: last?.recommendations || '',
    };
  },
  Print: ({ doc, c }) => {
    const d = doc.data;
    const p = c.patient;
    const age = ageOf(p.birthDate) ?? 99;
    const dx: Diagnosis[] = d.diagnoses || [];
    const kindLbl = { main: 'ძირითადი დაავადება', secondary: 'თანმხლები დაავადება', complication: 'გართულება' } as const;
    const issuer = [c.clinic.legalName || c.clinic.name, c.clinic.address, c.clinic.phone && `ტელ.: ${c.clinic.phone}`].filter(Boolean).join(', ');
    return (
      <div className="print-sheet">
        <div style={{ textAlign: 'right' }} className="small">
          <b>სამედიცინო დოკუმენტაცია ფორმა №IV-100/ა</b>
          <div>რეგისტრაციის № {doc.number}</div>
        </div>
        <h1>ცნობა</h1>
        <p style={{ textAlign: 'center', fontWeight: 700, marginTop: -2 }}>ჯანმრთელობის მდგომარეობის შესახებ</p>
        <Row label="1. ცნობის გამცემი დაწესებულების დასახელება, მისამართი, საკონტაქტო ინფორმაცია:" value={issuer} wide />
        <Row label="2. დაწესებულების დასახელება, მისამართი, სადაც იგზავნება ცნობა:" value={d.sendTo} wide />
        <Row label="3. პაციენტის სახელი და გვარი:" value={`${p.firstName} ${p.lastName}`} />
        <Row label="4. დაბადების თარიღი (რიცხვი/თვე/წელი):" value={fmtDate(p.birthDate).replace(/\./g, '/')} />
        <Row label="5. პირადი ნომერი:" value={age >= 16 ? p.idNumber : '— (ივსება 16 წელს მიღწეული პირის შემთხვევაში)'} />
        <Row label="6. მისამართი:" value={[p.address, p.phone && `ტელ.: ${p.phone}`].filter(Boolean).join(', ')} />
        <Row label="7. სამუშაო ადგილი და თანამდებობა (მოსწავლის/სტუდენტის შემთხვევაში — სასწავლებელი, კლასი/კურსი):" value={d.workplace} wide />
        <div className="row">
          <span className="lbl">8. თარიღები:</span>
        </div>
        <div style={{ paddingLeft: 16 }}>
          <Row label="ა) ექიმთან მიმართვის" value={fmtDate(d.dateVisit)} />
          <Row label="ბ) სტაციონარში გაგზავნის" value={fmtDate(d.dateReferInpatient)} />
          <Row label="გ) სტაციონარში მოთავსების" value={fmtDate(d.dateAdmit)} />
          <Row label="დ) გაწერის" value={fmtDate(d.dateDischarge)} />
        </div>
        <Box
          label="9. დასკვნა ჯანმრთელობის მდგომარეობის შესახებ ან სრული დიაგნოზი (ძირითადი დაავადება, თანმხლები დაავადებები, გართულებები) შესაბამისი ICD-10 კოდის მითითებით:"
          value={
            <>
              {d.conclusion && <div>{d.conclusion}</div>}
              {dx.map((x, i) => (
                <div key={i}>
                  {kindLbl[x.kind]} — {x.text}
                  {x.teeth ? ` (კბ. ${x.teeth})` : ''} ({x.code})
                </div>
              ))}
            </>
          }
        />
        <Box label="10. გადატანილი დაავადებები:" value={d.pastDiseases} />
        <Box label="11. მოკლე ანამნეზი:" value={d.anamnesis} />
        <Box label="12. ჩატარებული დიაგნოსტიკური გამოკვლევები და კონსულტაციები:" value={d.exams} />
        <Row label="13. ავადმყოფობის მიმდინარეობა:" value={d.course} />
        <Box label="14. ჩატარებული მკურნალობა:" value={d.treatment} />
        <Row label="15. მდგომარეობა სტაციონარში გაგზავნისას:" value={d.stateReferral} />
        <Row label="16. მდგომარეობა სტაციონარიდან გაწერისას:" value={d.stateDischarge} />
        <Box label="17. სამკურნალო და შრომითი რეკომენდაციები:" value={d.recommendations} />
        <Row label="18. მკურნალი ექიმი (ექიმი-სპეციალისტი):" value={c.doctor ? `${c.doctor.specialty ? c.doctor.specialty + ' — ' : ''}${userName(c.doctor)}${c.doctor.license ? `, სახელმწ. სერტიფიკატი №${c.doctor.license}` : ''}` : ''} wide />
        <div className="row" style={{ marginTop: 14 }}>
          <span className="lbl">19. დაწესებულების ხელმძღვანელის/ხელმძღვანელის მოადგილის/მკურნალი ექიმის ხელმოწერა:</span>
          <span className="val">{c.clinic.director ? `${c.clinic.director}` : ''}</span>
        </div>
        <div className="row" style={{ marginTop: 10, justifyContent: 'space-between' }}>
          <span>
            <span className="lbl">20. ცნობის გაცემის თარიღი:</span> {fmtDate(doc.date)}
          </span>
          <span className="lbl">ბეჭდის ადგილი</span>
        </div>
        <FooterNote clinic={c.clinic} />
      </div>
    );
  },
};

const CONSENT_KINDS = ['თერაპიული მკურნალობა', 'ენდოდონტიური მკურნალობა', 'კბილის ექსტრაქცია / ქირურგია', 'დენტალური იმპლანტაცია', 'ორთოპედიული მკურნალობა', 'ორთოდონტიული მკურნალობა', 'ადგილობრივი ანესთეზია', 'რენტგენოლოგიური კვლევა'];

/** ფორმა №IV-220-2/ა — ბრძანება №01-55/ნ, დანართი №3 (ოფიციალური ტექსტი) + დამატებითი ინფორმაცია (მუხ. 1.4) */
const consent: DocType = {
  id: 'consent',
  title: 'პაციენტის წერილობითი ინფორმირებული თანხმობა სამედიცინო მომსახურების გაწევაზე',
  formCode: 'ფორმა №IV-220-2/ა',
  group: 'ოფიციალური ფორმები',
  description: 'ივსება მკურნალი ექიმის მიერ, პაციენტის ან კანონიერი წარმომადგენლის თანდასწრებით, მომსახურების გაწევამდე.',
  legal: `${LEGAL.order0155}, მუხ. 4; ${LEGAL.patientRights}, მუხ. 22 (პ. 1, 2.ა, 2.ლ, 3) და მუხ. 41 — 16 წლამდე თანხმობას აცხადებს მშობელი/კანონიერი წარმომადგენელი.`,
  fields: [
    { key: 'kind', label: 'სამედიცინო მომსახურების სახე', kind: 'select', options: CONSENT_KINDS, required: true },
    { key: 'teeth', label: 'კბილ(ებ)ი / მიდამო', kind: 'text' },
    { key: 'procedure', label: 'სამედიცინო მომსახურების მიზანი და მიმდინარეობა', kind: 'textarea', category: 'treatment', full: true, required: true },
    { key: 'diagnoses', label: 'დიაგნოზი', kind: 'diagnoses', full: true },
    { key: 'risks', label: 'თავისებურებანი და შესაძლო გართულებები', kind: 'textarea', category: 'consentRisks', full: true, rows: 5 },
    { key: 'alternatives', label: 'ალტერნატიული მეთოდები / უარის შემთხვევაში დამდგარი შედეგი', kind: 'textarea', category: 'consentAlternatives', full: true },
    { key: 'anesthesia', label: 'ანესთეზიის სახე', kind: 'text', full: true },
    { key: 'cost', label: 'ღირებულება (₾)', kind: 'text' },
  ],
  prefill: ({ visit, visits }) => {
    const v = visit || [...visits].sort((a, b) => b.date.localeCompare(a.date))[0];
    return {
      kind: CONSENT_KINDS[0],
      teeth: v?.complaintTeeth || v?.diagnoses.map((d) => d.teeth).filter(Boolean).join(', ') || '',
      procedure: v?.treatment || '',
      diagnoses: v?.diagnoses || [],
      risks: tpl(CONSENT_KINDS[0]),
      alternatives: DEFAULT_TEMPLATES.find((t) => t.id === 'tl1')?.text || '',
      anesthesia: v?.anesthesia || 'ადგილობრივი (ინფილტრაციული/გამტარებლობითი)',
      cost: v ? String(v.procedures.reduce((s, p) => s + p.qty * p.price, 0) || '') : '',
    };
  },
  onChange: (key, value, data) => (key === 'kind' ? { ...data, kind: value, risks: tpl(value) || data.risks } : { ...data, [key]: value }),
  Print: ({ doc, c }) => {
    const d = doc.data;
    const p = c.patient;
    const rep = needsRepresentative(p);
    const teen = !rep && isMinor(p);
    return (
      <div className="print-sheet">
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: 4 }} className="small">
          <div>
            <b>{c.clinic.legalName || c.clinic.name}</b>
            <div>სტომატოლოგიური მომსახურების მიმწოდებელი პირის/დაწესებულების დასახელება</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <b>ფორმა №IV-220-2/ა</b>
            <div>
              № {doc.number} · ბარათი №{p.cardNumber}
            </div>
          </div>
        </div>
        <h1 style={{ marginTop: 14 }}>{CONSENT_220_2.title}</h1>
        <div className="row" style={{ marginTop: 14 }}>
          <span className="lbl">მე</span>
          <span className="val">{rep ? `${signerName(p)} — კანონიერი წარმომადგენელი; პაციენტი: ${patientName(p)}, დაბ. ${fmtDate(p.birthDate)}` : `${patientName(p)} (პ/ნ ${p.idNumber || '—'})`}</span>
        </div>
        <p className="small" style={{ textAlign: 'center', marginTop: -2 }}>
          (სახელი, გვარი)
        </p>
        <p style={{ marginTop: 8, textAlign: 'justify' }}>{CONSENT_220_2.patientText}</p>
        <div className="row" style={{ marginTop: 18 }}>
          <span className="lbl">პაციენტის (ან პაციენტის კანონიერი წარმომადგენლის) ხელმოწერა</span>
          <span className="val"></span>
        </div>
        <div className="row" style={{ marginTop: 22 }}>
          <span className="lbl">მე, ექიმი</span>
          <span className="val">{c.doctor ? userName(c.doctor) : ''}</span>
        </div>
        <p className="small" style={{ textAlign: 'center', marginTop: -2 }}>
          (სახელი, გვარი)
        </p>
        <p style={{ marginTop: 8, textAlign: 'justify' }}>{CONSENT_220_2.doctorText}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
          <div className="row" style={{ flex: 1 }}>
            <span className="lbl">ხელმოწერა</span>
            <span className="val" style={{ maxWidth: 200 }}></span>
          </div>
          <div>
            <span className="lbl">თარიღი</span> „{doc.date.slice(8, 10)}“ {fmtDate(doc.date).slice(3)}
          </div>
        </div>
        {teen && (
          <p className="small" style={{ marginTop: 10 }}>
            პაციენტი 16 წელს მიღწეული არასრულწლოვანია და თანხმობას აცხადებს თავად; გადაწყვეტილების შესახებ ეცნობა ნათესავს/კანონიერ წარმომადგენელს: {p.guardianName || '________________'} (მუხ. 41.3).
          </p>
        )}
        <h2 style={{ marginTop: 20, borderTop: '1px solid #000', paddingTop: 8 }}>მიწოდებული ინფორმაცია (ფორმის დამატება, ბრძანება №01-55/ნ, მუხ. 1.4)</h2>
        <Row label="სამედიცინო მომსახურება:" value={`${d.kind}${d.teeth ? `, კბ. ${d.teeth}` : ''}`} />
        <Box label="დიაგნოზი:" value={<Diags list={d.diagnoses} />} />
        <Box label="მიზანი და მიმდინარეობა:" value={d.procedure} />
        <Row label="ანესთეზია:" value={d.anesthesia} />
        <Box label="თავისებურებანი და შესაძლო გართულებები:" value={d.risks} />
        <Box label="ალტერნატიული მეთოდები; უარის შემთხვევაში დამდგარი შედეგი:" value={d.alternatives} />
        {d.cost && <Row label="ღირებულება:" value={`${d.cost} ₾`} />}
      </div>
    );
  },
};

const pdConsent: DocType = {
  id: 'pdConsent',
  title: 'თანხმობა პერსონალური მონაცემების დამუშავებაზე',
  group: 'თანხმობები',
  description: 'ჯანმრთელობასთან დაკავშირებული (განსაკუთრებული კატეგორიის) მონაცემების დამუშავებაზე წერილობითი თანხმობა.',
  legal: 'საქართველოს კანონი „პერსონალურ მონაცემთა დაცვის შესახებ“; „პაციენტის უფლებების შესახებ“ კანონი, მუხ. 27–28 (კონფიდენციალობა). არასავალდებულო, დამატებითი ფორმა.',
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
          {c.clinic.taxId && ` (ს/კ ${c.clinic.taxId})`} დაამუშაოს ჩემი{needsRepresentative(p) ? ' (ჩემი შვილის/მეურვეობის ქვეშ მყოფის)' : ''} პერსონალური მონაცემები, მათ შორის ჯანმრთელობასთან დაკავშირებული განსაკუთრებული კატეგორიის მონაცემები.
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
        <Signatures left={`${signerRole(p)}: ${signerName(p)}`} right={`თარიღი: ${fmtDate(doc.date)}`} />
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
  legal: '„პაციენტის უფლებების შესახებ“ კანონი, მუხ. 23: ქმედუნარიან პაციენტს უფლება აქვს მკურნალობის ნებისმიერ ეტაპზე უარი განაცხადოს სამედიცინო მომსახურებაზე; იგი ამომწურავად უნდა იყოს ინფორმირებული უარის მოსალოდნელი შედეგების შესახებ.',
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
        <Signatures left={`${signerRole(p)}: ${signerName(p)}`} center={`ექიმი: ${doctorLine(c.doctor)}`} right={`თარიღი: ${fmtDate(doc.date)}`} />
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
  legal: 'შიდა ფორმა (ბრძანება №01-55/ნ, მუხ. 1.4 — მიმწოდებელი უფლებამოსილია შემოიღოს დამატებითი ფორმები).',
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
  legal: 'ბრძანება №01-55/ნ, მუხ. 1.5: პაციენტს, ხოლო მისი თანხმობის ან ქმედუუნარობის შემთხვევაში — ნათესავს ან კანონიერ წარმომადგენელს, უფლება აქვს მოითხოვოს სტომატოლოგიური სამედიცინო დოკუმენტაციის ან მისი ცალკეული ფორმის ასლი.',
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
  legal: 'შიდა ფორმა (ბრძანება №01-55/ნ, მუხ. 1.4). კვლევის შედეგი აისახება გასინჯვის ფურცელში (ფორმა №IV-220-1/ა) — „კონსულტაცია/გამოკვლევის შედეგი“.',
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
  legal: '„პაციენტის უფლებების შესახებ“ კანონი, მუხ. 18.1.ა — ინფორმაცია მომსახურების საფასურისა და ანაზღაურების ფორმების შესახებ.',
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
