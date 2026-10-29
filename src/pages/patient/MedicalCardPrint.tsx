import React from 'react';
import { db, useLive } from '../../lib/db';
import type { MedDocument, OdontogramSnapshot, Patient } from '../../lib/types';
import { RADIOLOGY_LABELS } from '../../lib/types';
import { PrintPreview } from '../../components/Print';
import { Box, Row, SheetHeader, Signatures } from '../../documents/common';
import { ageOf, fmtDate, patientName, userName } from '../../lib/utils';
import { diagnosisLine } from '../../components/clinical';
import { usePatientCtx } from './Documents';
import { OdontogramChart, OdontogramTable } from './Odontogram';
import { VisitSheet } from './Visits';

/** ამბულატორიული სტომატოლოგიური პაციენტის სამედიცინო ბარათი — ყველა მონაცემი ერთ დოკუმენტად */
export function MedicalCardPrint({ open, onClose, patient }: { open: boolean; onClose: () => void; patient: Patient }) {
  const { clinic, staff, visits, radiology } = usePatientCtx(patient);
  const docs = useLive(() => db.documents.where('patientId').equals(patient.id).toArray(), [patient.id], [] as MedDocument[]) as MedDocument[];
  const odo = (useLive(() => db.odontograms.where('patientId').equals(patient.id).toArray(), [patient.id], [] as OdontogramSnapshot[]) as OdontogramSnapshot[]).sort(
    (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
  )[0];
  const sorted = [...visits].sort((a, b) => a.visitNo - b.visitNo);
  const diag = sorted.flatMap((v) => v.diagnoses.map((d) => ({ ...d, date: v.date }))).filter((d) => d.code);
  if (!open) return null;
  return (
    <PrintPreview open={open} onClose={onClose} title={`სამედიცინო ბარათი №${patient.cardNumber} — ${patientName(patient)}`}>
      <div>
        <div className="print-sheet">
          <SheetHeader clinic={clinic} right={<div>ბარათი № {patient.cardNumber}</div>} />
          <h1>ამბულატორიული სტომატოლოგიური პაციენტის სამედიცინო ბარათი</h1>
          <p style={{ textAlign: 'center' }} className="small">
            ბარათი გახსნილია: {fmtDate(patient.createdAt.slice(0, 10))}
          </p>
          <h2>1. პაციენტის მონაცემები</h2>
          <Row label="გვარი, სახელი, მამის სახელი:" value={`${patientName(patient)} ${patient.fatherName || ''}`} />
          <Row label={patient.idType === 'PASSPORT' ? 'პასპორტის №:' : 'პირადი ნომერი:'} value={patient.idNumber} />
          <Row label="დაბადების თარიღი, ასაკი, სქესი:" value={`${fmtDate(patient.birthDate)}, ${ageOf(patient.birthDate)} წ., ${patient.sex === 'M' ? 'მამრობითი' : 'მდედრობითი'}`} />
          <Row label="მოქალაქეობა:" value={patient.citizenship} />
          <Row label="მისამართი:" value={patient.address} />
          <Row label="ტელეფონი:" value={[patient.phone, patient.phone2].filter(Boolean).join(', ')} />
          <Row label="სამუშაო ადგილი:" value={patient.workplace} />
          <Row label="დაზღვევა:" value={[patient.insurance, patient.insurancePolicy].filter(Boolean).join(', ')} />
          {patient.guardianName && <Row label="კანონიერი წარმომადგენელი:" value={`${patient.guardianName} (${patient.guardianRelation || ''}), პ/ნ ${patient.guardianIdNumber || '—'}, ${patient.guardianPhone || ''}`} />}
          <h2>2. სამედიცინო ანამნეზი</h2>
          <Row label="ალერგია:" value={patient.allergies || 'არ აღენიშნება'} />
          <Row label="თანმხლები დაავადებები:" value={patient.chronicDiseases} />
          <Row label="მედიკამენტები:" value={patient.medications} />
          <Row label="სისხლის ჯგუფი:" value={patient.bloodGroup} />
          <Row label="რისკ-ფაქტორები:" value={patient.riskFlags.join(', ')} />
          <h2>3. დიაგნოზები (ICD-10)</h2>
          <Box
            label=""
            value={
              diag.length
                ? diag.map((d, i) => (
                    <div key={i}>
                      {fmtDate(d.date)} — {diagnosisLine(d)}
                    </div>
                  ))
                : '—'
            }
          />
          <h2>4. ოდონტოგრამა {odo && `(${fmtDate(odo.date)})`}</h2>
          {odo ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                <OdontogramChart teeth={odo.teeth} dentition={odo.dentition} small />
              </div>
              <OdontogramTable teeth={odo.teeth} />
            </>
          ) : (
            <p className="small">არ არის შევსებული.</p>
          )}
          <h2>5. რენტგენოლოგიური კვლევები / სხივური დატვირთვა</h2>
          {radiology.length ? (
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
          ) : (
            <p className="small">—</p>
          )}
          <h2>6. გაცემული დოკუმენტები</h2>
          {docs.length ? (
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
          ) : (
            <p className="small">—</p>
          )}
          <Signatures left={`სამედიცინო დირექტორი: ${clinic.medicalDirector || ''}`} right="ბ.ა." />
        </div>
        {sorted.map((v) => (
          <div key={v.id} className="page-break" style={{ marginTop: 16 }}>
            <VisitSheet visit={v} patient={patient} staff={staff} />
          </div>
        ))}
      </div>
    </PrintPreview>
  );
}
