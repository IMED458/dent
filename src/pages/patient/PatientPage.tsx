import React, { useState } from 'react';
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  Banknote,
  ClipboardList,
  FileText,
  History,
  IdCard,
  Pencil,
  Printer,
  Scan,
  Smile,
  Stethoscope,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { db, useLive, deletePatientCascade, audit } from '../../lib/db';
import type { AuditEntry, Patient } from '../../lib/types';
import { Badge, Button, Card, EmptyState, Tabs, useUi } from '../../components/ui';
import { PatientForm } from '../../components/PatientForm';
import { navigate } from '../../lib/router';
import { ageOf, fmtDate, fmtDateTime, isMinor, patientName } from '../../lib/utils';
import { useSession } from '../../lib/session';
import { updatePatient } from '../../lib/records';
import { VisitsTab } from './Visits';
import { OdontogramTab } from './Odontogram';
import { RadiologyTab } from './Radiology';
import { DocumentsTab } from './Documents';
import { FinanceTab } from './Finance';
import { OverviewTab } from './Overview';
import { MedicalCardPrint } from './MedicalCardPrint';

type TabId = 'overview' | 'visits' | 'odontogram' | 'radiology' | 'documents' | 'finance' | 'history';

export function PatientPage({ patientId, tab, sub }: { patientId: string; tab?: string; sub?: string }) {
  const patient = useLive(() => db.patients.get(patientId), [patientId], null as any) as Patient | undefined | null;
  const counts = useLive(
    async () => ({
      visits: await db.visits.where('patientId').equals(patientId).count(),
      radiology: await db.radiology.where('patientId').equals(patientId).count(),
      documents: await db.documents.where('patientId').equals(patientId).count(),
    }),
    [patientId],
    { visits: 0, radiology: 0, documents: 0 },
  )!;
  const [editOpen, setEditOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const ui = useUi();
  const { can } = useSession();
  const current = (tab as TabId) || 'overview';

  if (patient === null) return <div className="text-slate-400 p-8">იტვირთება…</div>;
  if (!patient)
    return (
      <EmptyState
        title="პაციენტი ვერ მოიძებნა"
        action={
          <Button onClick={() => navigate('patients')} icon={<ArrowLeft className="w-4 h-4" />}>
            რეესტრში დაბრუნება
          </Button>
        }
      />
    );

  const setTab = (t: TabId) => navigate('patient', patientId, t);
  const risky = patient.allergies?.trim() || patient.riskFlags.length > 0;

  const toggleArchive = async () => {
    await updatePatient(patient.id, { archived: !patient.archived });
    ui.toast(patient.archived ? 'ბარათი აქტიურია' : 'ბარათი გადატანილია არქივში');
  };

  const remove = async () => {
    const ok = await ui.confirm({
      title: 'პაციენტის სრული წაშლა',
      text: `წაიშლება ${patientName(patient)}-ის ბარათი, ყველა ვიზიტი, დოკუმენტი და რადიოლოგიური გამოსახულება. სამედიცინო დოკუმენტაციის შენახვის ვალდებულების გამო რეკომენდებულია „არქივი“. გსურთ მაინც წაშლა?`,
      danger: true,
      okLabel: 'სამუდამოდ წაშლა',
    });
    if (!ok) return;
    await deletePatientCascade(patient.id);
    await audit('DELETE', 'Patient', patient.id, `წაიშალა პაციენტი ${patientName(patient)}, ბარათი №${patient.cardNumber}`);
    ui.toast('პაციენტი წაიშალა');
    navigate('patients');
  };

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('patients')} className="no-print flex items-center gap-1 text-sm text-slate-500 hover:text-teal-700">
        <ArrowLeft className="w-4 h-4" /> პაციენტების რეესტრი
      </button>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center text-lg font-semibold shrink-0">
            {patient.lastName[0]}
            {patient.firstName[0]}
          </div>
          <div className="flex-1 min-w-[240px]">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">{patientName(patient)}</h1>
              {patient.fatherName && <span className="text-slate-500 text-sm">მამის სახ.: {patient.fatherName}</span>}
              {isMinor(patient) && <Badge color="blue">არასრულწლოვანი</Badge>}
              {patient.archived && <Badge>არქივი</Badge>}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <ClipboardList className="w-4 h-4 text-slate-400" /> ბარათი №<b className="font-mono">{patient.cardNumber}</b>
              </span>
              <span className="flex items-center gap-1">
                <IdCard className="w-4 h-4 text-slate-400" />
                {patient.idType === 'GE' ? 'პ/ნ' : patient.idType === 'PASSPORT' ? 'პასპორტი' : 'დოკ.'}: <b className="font-mono">{patient.idNumber || '—'}</b>
              </span>
              <span>
                {fmtDate(patient.birthDate)} ({ageOf(patient.birthDate)} წ.) · {patient.sex === 'M' ? 'მამრ.' : 'მდედრ.'}
              </span>
              <span>{patient.phone}</span>
              {patient.insurance && <span>დაზღვევა: {patient.insurance}</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 no-print">
            <Button icon={<Pencil className="w-4 h-4" />} onClick={() => setEditOpen(true)} disabled={!can('register')}>
              რედაქტირება
            </Button>
            <Button icon={<Printer className="w-4 h-4" />} onClick={() => setCardOpen(true)}>
              ბარათის ბეჭდვა
            </Button>
            {can('admin') && (
              <>
                <Button variant="ghost" icon={<Archive className="w-4 h-4" />} onClick={toggleArchive}>
                  {patient.archived ? 'არქივიდან' : 'არქივი'}
                </Button>
                <Button variant="ghost" className="text-red-600" icon={<Trash2 className="w-4 h-4" />} onClick={remove} title="წაშლა" />
              </>
            )}
          </div>
        </div>
        {risky && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              {patient.allergies?.trim() && (
                <p>
                  <b>ალერგია:</b> {patient.allergies}
                </p>
              )}
              {patient.riskFlags.length > 0 && (
                <p>
                  <b>რისკ-ფაქტორები:</b> {patient.riskFlags.join(', ')}
                </p>
              )}
            </div>
          </div>
        )}
        {!patient.pdConsent && (
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 no-print">
            პერსონალური მონაცემების დამუშავებაზე თანხმობა არ არის მონიშნული — დაბეჭდეთ ფორმა „დოკუმენტები“ განყოფილებიდან.
          </p>
        )}
      </div>

      <Tabs<TabId>
        value={current}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'მიმოხილვა', icon: <UserIcon className="w-4 h-4" /> },
          { id: 'visits', label: 'ვიზიტები / დღიური', icon: <Stethoscope className="w-4 h-4" />, count: counts.visits },
          { id: 'odontogram', label: 'ოდონტოგრამა', icon: <Smile className="w-4 h-4" /> },
          { id: 'radiology', label: 'რადიოლოგია', icon: <Scan className="w-4 h-4" />, count: counts.radiology },
          { id: 'documents', label: 'დოკუმენტები / ფორმები', icon: <FileText className="w-4 h-4" />, count: counts.documents },
          { id: 'finance', label: 'ფინანსები', icon: <Banknote className="w-4 h-4" /> },
          { id: 'history', label: 'ცვლილებების ისტორია', icon: <History className="w-4 h-4" /> },
        ]}
      />

      {current === 'overview' && <OverviewTab patient={patient} />}
      {current === 'visits' && <VisitsTab patient={patient} openId={sub} />}
      {current === 'odontogram' && <OdontogramTab patient={patient} />}
      {current === 'radiology' && <RadiologyTab patient={patient} openId={sub} />}
      {current === 'documents' && <DocumentsTab patient={patient} openId={sub} />}
      {current === 'finance' && <FinanceTab patient={patient} />}
      {current === 'history' && <HistoryTab patientId={patient.id} />}

      <PatientForm open={editOpen} onClose={() => setEditOpen(false)} patient={patient} />
      <MedicalCardPrint open={cardOpen} onClose={() => setCardOpen(false)} patient={patient} />
    </div>
  );
}

function HistoryTab({ patientId }: { patientId: string }) {
  const rows = (useLive(() => db.audit.where('patientId').equals(patientId).toArray(), [patientId], [] as AuditEntry[]) as AuditEntry[]).sort((a, b) =>
    b.at.localeCompare(a.at),
  );
  return (
    <Card title="ცვლილებების ჟურნალი (აუდიტი)" bodyClass="p-0">
      {rows.length === 0 && <p className="p-4 text-sm text-slate-500">ჩანაწერები არ არის.</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-50">
                <td className="px-4 py-2 text-xs text-slate-500 whitespace-nowrap">{fmtDateTime(r.at)}</td>
                <td className="px-2 py-2 text-xs font-medium whitespace-nowrap">{r.userName}</td>
                <td className="px-2 py-2 text-xs">
                  <Badge color={r.action === 'DELETE' ? 'red' : r.action === 'SIGN' ? 'green' : r.action === 'CREATE' ? 'teal' : 'slate'}>{r.action}</Badge>
                </td>
                <td className="px-4 py-2 text-xs text-slate-700">{r.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
