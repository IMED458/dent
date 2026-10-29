import React from 'react';
import { CalendarPlus, FilePlus2, ImagePlus, Stethoscope, FileText } from 'lucide-react';
import { db, useLive } from '../../lib/db';
import type { Appointment, OdontogramSnapshot, Patient, StoredFile } from '../../lib/types';
import { RADIOLOGY_LABELS } from '../../lib/types';
import { Badge, Button, Card } from '../../components/ui';
import { diagnosisLine } from '../../components/clinical';
import { navigate } from '../../lib/router';
import { ageLabel, fmtDate, money, todayStr, userName } from '../../lib/utils';
import { newVisit } from '../../lib/records';
import { useSession } from '../../lib/session';
import { usePatientCtx } from './Documents';
import { usePatientBalance } from './Finance';
import { OdontogramChart } from './Odontogram';
import { APPT_STATUS } from '../Appointments';

export function OverviewTab({ patient }: { patient: Patient }) {
  const { visits, radiology, staff } = usePatientCtx(patient);
  const { balance } = usePatientBalance(patient.id);
  const { user, can } = useSession();
  const appts = (useLive(() => db.appointments.where('patientId').equals(patient.id).toArray(), [patient.id], [] as Appointment[]) as Appointment[])
    .filter((a) => a.date >= todayStr() && a.status !== 'cancelled')
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const odo = (useLive(() => db.odontograms.where('patientId').equals(patient.id).toArray(), [patient.id], [] as OdontogramSnapshot[]) as OdontogramSnapshot[]).sort((a, b) =>
    b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
  )[0];
  const thumbs = useLive(() => db.files.where('patientId').equals(patient.id).limit(8).toArray(), [patient.id], [] as StoredFile[]) as StoredFile[];
  const sorted = [...visits].sort((a, b) => b.visitNo - a.visitNo);
  const diagnoses = sorted.flatMap((v) => v.diagnoses.map((d) => ({ ...d, date: v.date }))).filter((d) => d.code);

  const startVisit = async () => {
    const v = await newVisit(patient.id, user!.role === 'doctor' || user!.role === 'admin' ? user!.id : staff.find((s) => s.role === 'doctor')?.id || user!.id, user!.id);
    navigate('patient', patient.id, 'visits', v.id);
  };

  const info: [string, React.ReactNode][] = [
    ['მამის სახელი', patient.fatherName],
    ['დაბადების თარიღი', `${fmtDate(patient.birthDate)} (${ageLabel(patient.birthDate)})`],
    ['მოქალაქეობა', patient.citizenship],
    ['ტელეფონი', [patient.phone, patient.phone2].filter(Boolean).join(', ')],
    ['ელ. ფოსტა', patient.email],
    ['მისამართი', patient.address],
    ['სამუშაო ადგილი', patient.workplace],
    ['დაზღვევა', [patient.insurance, patient.insurancePolicy].filter(Boolean).join(' · ')],
    ['სისხლის ჯგუფი', patient.bloodGroup],
    ['კანონიერი წარმომადგენელი', patient.guardianName && `${patient.guardianName} (${patient.guardianRelation || ''}) ${patient.guardianPhone || ''}`],
  ];

  return (
    <div className="space-y-4">
      {can('clinical') && (
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" icon={<Stethoscope className="w-4 h-4" />} onClick={startVisit}>
            ახალი ვიზიტი
          </Button>
          <Button icon={<ImagePlus className="w-4 h-4" />} onClick={() => navigate('patient', patient.id, 'radiology', 'new')}>
            რენტგენის / ფოტოს ატვირთვა
          </Button>
          <Button icon={<FilePlus2 className="w-4 h-4" />} onClick={() => navigate('patient', patient.id, 'documents', 'new:form100')}>
            ფორმა №IV-100/ა
          </Button>
          <Button icon={<FileText className="w-4 h-4" />} onClick={() => navigate('patient', patient.id, 'documents', 'new:consent')}>
            ინფორმირებული თანხმობა
          </Button>
          <Button icon={<CalendarPlus className="w-4 h-4" />} onClick={() => navigate('appointments', `new:${patient.id}`)}>
            ჩაწერა
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card title="პირადი მონაცემები">
          <dl className="space-y-1.5 text-sm">
            {info
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="w-40 shrink-0 text-slate-500">{k}</dt>
                  <dd className="text-slate-800">{v}</dd>
                </div>
              ))}
          </dl>
        </Card>
        <Card title="სამედიცინო ანამნეზი">
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-slate-500 text-xs">ალერგია</dt>
              <dd className={patient.allergies ? 'text-red-700 font-medium' : ''}>{patient.allergies || 'არ აღენიშნება'}</dd>
            </div>
            <div>
              <dt className="text-slate-500 text-xs">თანმხლები დაავადებები</dt>
              <dd>{patient.chronicDiseases || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500 text-xs">მედიკამენტები</dt>
              <dd>{patient.medications || '—'}</dd>
            </div>
            {patient.riskFlags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {patient.riskFlags.map((r) => (
                  <Badge key={r} color="red">
                    {r}
                  </Badge>
                ))}
              </div>
            )}
            {patient.notes && <p className="text-xs text-slate-600 bg-slate-50 rounded p-2">{patient.notes}</p>}
          </dl>
        </Card>
        <Card title="მიმდინარე მდგომარეობა">
          <div className="space-y-2 text-sm">
            <p>
              ვიზიტები: <b>{visits.length}</b> · ბოლო: <b>{sorted[0] ? fmtDate(sorted[0].date) : '—'}</b>
            </p>
            <p>
              ბალანსი: <b className={balance > 0 ? 'text-red-600' : 'text-emerald-600'}>{balance > 0 ? `დავალიანება ${money(balance)}` : balance < 0 ? `ავანსი ${money(-balance)}` : '0.00 ₾'}</b>
            </p>
            <div>
              <p className="text-xs text-slate-500 mb-1">მომავალი ჩაწერები</p>
              {appts.length === 0 && <p className="text-slate-400 text-xs">არ არის</p>}
              {appts.slice(0, 4).map((a) => (
                <p key={a.id} className="text-xs">
                  {fmtDate(a.date)} {a.time} — {a.reason} <Badge color={APPT_STATUS[a.status].color}>{APPT_STATUS[a.status].label}</Badge>
                </p>
              ))}
            </div>
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="დიაგნოზების ისტორია (ICD-10)" bodyClass="p-0">
          {diagnoses.length === 0 && <p className="p-4 text-sm text-slate-500">დიაგნოზები ჯერ არ არის.</p>}
          <ul className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
            {diagnoses.map((d, i) => (
              <li key={i} className="px-4 py-2 text-sm flex gap-3">
                <span className="text-xs text-slate-500 w-20 shrink-0">{fmtDate(d.date)}</span>
                <span>{diagnosisLine(d)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card
          title="ოდონტოგრამა"
          actions={
            <Button size="sm" variant="ghost" onClick={() => navigate('patient', patient.id, 'odontogram')}>
              გახსნა →
            </Button>
          }
        >
          {odo ? <OdontogramChart teeth={odo.teeth} dentition={odo.dentition} small /> : <p className="text-sm text-slate-500">ოდონტოგრამა ჯერ არ არის შევსებული.</p>}
        </Card>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="ბოლო ვიზიტები" bodyClass="p-0">
          {sorted.length === 0 && <p className="p-4 text-sm text-slate-500">ვიზიტები არ არის.</p>}
          <ul className="divide-y divide-slate-50">
            {sorted.slice(0, 6).map((v) => (
              <li key={v.id} className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer" onClick={() => navigate('patient', patient.id, 'visits', v.id)}>
                <p className="text-sm font-medium">
                  №{v.visitNo} · {fmtDate(v.date)} · {userName(staff.find((s) => s.id === v.doctorId))}{' '}
                  {v.status === 'draft' && <Badge color="amber">შავი</Badge>}
                </p>
                <p className="text-xs text-slate-600 line-clamp-1">{v.diagnoses.map(diagnosisLine).join('; ') || v.complaints}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card
          title="რადიოლოგია"
          actions={
            <Button size="sm" variant="ghost" onClick={() => navigate('patient', patient.id, 'radiology')}>
              ყველა →
            </Button>
          }
        >
          {thumbs.length === 0 ? (
            <p className="text-sm text-slate-500">გამოსახულებები არ არის.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {thumbs.map((f) => (
                <button key={f.id} onClick={() => navigate('patient', patient.id, 'radiology')} className="w-24 h-20 rounded-lg overflow-hidden bg-slate-900">
                  {f.thumb ? <img src={f.thumb} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] text-slate-300">{f.name}</span>}
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-500 mt-2">{radiology.length} კვლევა{radiology[0] ? ` · ბოლო: ${RADIOLOGY_LABELS[[...radiology].sort((a, b) => b.date.localeCompare(a.date))[0].kind]}` : ''}</p>
        </Card>
      </div>
    </div>
  );
}
