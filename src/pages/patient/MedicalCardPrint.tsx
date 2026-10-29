import React, { useMemo } from 'react';
import { db, useLive } from '../../lib/db';
import type { ClinicSettings, MedDocument, Patient } from '../../lib/types';
import { RADIOLOGY_LABELS } from '../../lib/types';
import { PrintPreview } from '../../components/Print';
import { fmtDate, userName } from '../../lib/utils';
import { usePatientCtx } from './Documents';
import { CaseSheet, groupCases } from './Visits';
import { LEGAL } from '../../data/forms220';

/** ფორმა №IV-220/ა „სტომატოლოგიური პაციენტის სამედიცინო ბარათი“ — ბრძანება №01-55/ნ, დანართი №1 */
export function Form220Sheet({ patient: p, clinic }: { patient: Patient; clinic: ClinicSettings }) {
  const line = (label: string, value?: React.ReactNode, wide?: boolean) => (
    <div className="row" style={wide ? { flexDirection: 'column', gap: 2 } : undefined}>
      <span className="lbl" style={{ fontWeight: 400 }}>
        {label}
      </span>
      <span className="val" style={wide ? { minHeight: '3.6em' } : undefined}>
        {value || ' '}
      </span>
    </div>
  );
  return (
    <div className="print-sheet">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div className="small" style={{ borderTop: '1px solid #000', paddingTop: 2, minWidth: 260 }}>
          <b style={{ fontSize: '11pt' }}>{clinic.legalName || clinic.name}</b>
          <div>სტომატოლოგიური მომსახურების მიმწოდებელი</div>
          <div>პირის/დაწესებულების დასახელება</div>
        </div>
        <b className="small">ფორმა №IV-220/ა</b>
      </div>
      <h1 style={{ marginTop: 28 }}>სტომატოლოგიური პაციენტის სამედიცინო ბარათი №{p.cardNumber}</h1>
      <p className="small" style={{ textAlign: 'center' }}>
        პირადი ნომერი: {p.idNumber || '—'} · ბარათი გახსნილია {fmtDate(p.createdAt.slice(0, 10))}
      </p>
      <div style={{ marginTop: 18 }}>
        {line('გვარი, სახელი', `${p.lastName} ${p.firstName}${p.fatherName ? ` (მამის სახ. ${p.fatherName})` : ''}`)}
        {line('სქესი', p.sex === 'M' ? 'მამრობითი' : 'მდედრობითი')}
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ flex: 1 }}>{line('დაბადების თარიღი', fmtDate(p.birthDate))}</div>
          <div style={{ flex: 1 }}>{line('ტელეფონი', [p.phone, p.phone2].filter(Boolean).join(', '))}</div>
        </div>
        {line('პირადი ნომერი (ასეთის არსებობის შემთხვევაში)', p.idType === 'GE' ? p.idNumber : p.idType === 'PASSPORT' ? `— (პასპორტი: ${p.idNumber}, ${p.citizenship})` : '—')}
        {line('მისამართი', p.address)}
        {line('სამუშაო ადგილი', p.workplace)}
        {p.guardianName && line('მშობელი / კანონიერი წარმომადგენელი', `${p.guardianName}${p.guardianRelation ? ` (${p.guardianRelation})` : ''}${p.guardianIdNumber ? `, პ/ნ ${p.guardianIdNumber}` : ''}${p.guardianPhone ? `, ტელ. ${p.guardianPhone}` : ''}`)}
        <div style={{ marginTop: 18 }}>{line('ალერგია (მათ შორის – საანესთეზიო საშუალებებზე)', p.allergies || 'არ აღენიშნება', true)}</div>
        {line('გადატანილი ან/და თანმხლები დაავადებები, მდგომარეობები:', [p.chronicDiseases, p.medications && `მუდმივად იღებს: ${p.medications}`, p.riskFlags.length ? `რისკ-ფაქტორები: ${p.riskFlags.join(', ')}` : '', p.bloodGroup && `სისხლის ჯგუფი: ${p.bloodGroup}`].filter(Boolean).join('\n'), true)}
        <div style={{ marginTop: 18 }}>{line('სადაზღვევო პოლისის ნომერი (ასეთის არსებობის შემთხვევაში)', p.insurancePolicy)}</div>
        {line('სადაზღვევო კომპანია (ასეთის არსებობის შემთხვევაში)', p.insurance)}
      </div>
      <p className="small" style={{ marginTop: 30, color: '#444' }}>
        {LEGAL.order0155}. დოკუმენტაცია წარმოებულია ელექტრონული საშუალებით (მუხ. 1.2).
      </p>
    </div>
  );
}

/** სრული ბარათი: IV-220/ა + ყველა გასინჯვის ფურცელი (IV-220-1/ა) + გაცემული დოკუმენტების ნუსხა */
export function MedicalCardPrint({ open, onClose, patient }: { open: boolean; onClose: () => void; patient: Patient }) {
  const { clinic, staff, visits, radiology } = usePatientCtx(patient);
  const docs = useLive(() => db.documents.where('patientId').equals(patient.id).toArray(), [patient.id], [] as MedDocument[]) as MedDocument[];
  const cases = useMemo(() => groupCases(visits).reverse(), [visits]);
  if (!open) return null;
  return (
    <PrintPreview open={open} onClose={onClose} title={`ფორმა №IV-220/ა — ისტორია №${patient.cardNumber}`}>
      <div>
        <Form220Sheet patient={patient} clinic={clinic} />
        {cases.map((c) => (
          <div key={c.initial.id} className="page-break" style={{ marginTop: 16 }}>
            <CaseSheet caseGroup={c} patient={patient} staff={staff} />
          </div>
        ))}
        {(docs.length > 0 || radiology.length > 0) && (
          <div className="page-break" style={{ marginTop: 16 }}>
            <div className="print-sheet" style={{ minHeight: 0 }}>
              <h1>ბარათზე დართული დოკუმენტები და კვლევები</h1>
              {docs.length > 0 && (
                <>
                  <h2>გაცემული/შედგენილი დოკუმენტები</h2>
                  <table>
                    <tbody>
                      {[...docs]
                        .sort((a, b) => a.date.localeCompare(b.date))
                        .map((d) => (
                          <tr key={d.id}>
                            <td>{fmtDate(d.date)}</td>
                            <td>№{d.number}</td>
                            <td>
                              {d.title}
                              {d.data?.kind ? ` — ${d.data.kind}` : ''}
                            </td>
                            <td>{userName(staff.find((s) => s.id === d.doctorId))}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </>
              )}
              {radiology.length > 0 && (
                <>
                  <h2>რენტგენოლოგიური კვლევები</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>თარიღი</th>
                        <th>კვლევა</th>
                        <th>კბილები</th>
                        <th>დოზა, მკზვ</th>
                        <th>დასკვნა</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...radiology]
                        .sort((a, b) => a.date.localeCompare(b.date))
                        .map((r) => (
                          <tr key={r.id}>
                            <td>{fmtDate(r.date)}</td>
                            <td>{RADIOLOGY_LABELS[r.kind]}</td>
                            <td>{r.teeth}</td>
                            <td>{r.dose}</td>
                            <td>{r.conclusion}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </PrintPreview>
  );
}
