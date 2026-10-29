import React, { useMemo, useState } from 'react';
import { CalendarDays, ClipboardEdit, Search, UserPlus, Users, Stethoscope } from 'lucide-react';
import { db, useLive } from '../lib/db';
import type { Appointment, MedDocument, Patient, User, Visit } from '../lib/types';
import { Badge, Button, Card, EmptyState, Input } from '../components/ui';
import { PatientForm } from '../components/PatientForm';
import { PatientsTable, matchPatient, usePatientsWithLastVisit } from './Patients';
import { navigate } from '../lib/router';
import { fmtDate, longDateKa, patientName, todayStr, userName } from '../lib/utils';
import { useSession } from '../lib/session';
import { APPT_STATUS } from './Appointments';

export function Dashboard() {
  const { user } = useSession();
  const rows = usePatientsWithLastVisit();
  const today = todayStr();
  const appts = (useLive(() => db.appointments.where('date').equals(today).toArray(), [today], [] as Appointment[]) as Appointment[]).sort((a, b) =>
    a.time.localeCompare(b.time),
  );
  const visitsToday = useLive(() => db.visits.where('date').equals(today).count(), [today], 0) as number;
  const drafts = useLive(() => db.visits.filter((v) => v.status === 'draft').toArray(), [], [] as Visit[]) as Visit[];
  const draftDocs = useLive(() => db.documents.filter((d) => d.status === 'draft').count(), [], 0) as number;
  const users = useLive(() => db.users.toArray(), [], [] as User[]) as User[];
  const [q, setQ] = useState('');
  const [newOpen, setNewOpen] = useState(false);

  const pmap = useMemo(() => new Map(rows.map((p) => [p.id, p as Patient])), [rows]);
  const active = rows.filter((p) => !p.archived);
  const filtered = useMemo(
    () => active.filter((p) => matchPatient(p, q)).sort((a, b) => (b.lastVisit || b.createdAt).localeCompare(a.lastVisit || a.createdAt)),
    [active, q],
  );

  const stats = [
    { label: 'პაციენტები', value: active.length, icon: Users, color: 'text-teal-600 bg-teal-50' },
    { label: 'დღევანდელი ჩაწერები', value: appts.filter((a) => a.status !== 'cancelled').length, icon: CalendarDays, color: 'text-sky-600 bg-sky-50' },
    { label: 'დღევანდელი ვიზიტები', value: visitsToday, icon: Stethoscope, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'ხელმოუწერელი ჩანაწერები', value: drafts.length + draftDocs, icon: ClipboardEdit, color: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">გამარჯობა, {user?.firstName}</h1>
          <p className="text-sm text-slate-500">{longDateKa()}</p>
        </div>
        <Button variant="primary" icon={<UserPlus className="w-4 h-4" />} onClick={() => setNewOpen(true)}>
          ახალი პაციენტი
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold leading-none">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card
          className="xl:col-span-2"
          title="პაციენტების ჩამონათვალი"
          actions={
            <Button size="sm" variant="ghost" onClick={() => navigate('patients')}>
              სრული რეესტრი →
            </Button>
          }
        >
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input className="pl-9" placeholder="სწრაფი ძებნა: გვარი, პირადი ნომერი, ბარათის №, ტელეფონი" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {filtered.length ? (
            <PatientsTable rows={filtered} limit={q ? 50 : 15} />
          ) : (
            <EmptyState icon={<Users className="w-6 h-6" />} title={q ? 'ვერ მოიძებნა' : 'პაციენტები ჯერ არ არის'} action={<Button onClick={() => setNewOpen(true)}>რეგისტრაცია</Button>} />
          )}
        </Card>

        <div className="space-y-5">
          <Card
            title="დღევანდელი ჩაწერები"
            actions={
              <Button size="sm" variant="ghost" onClick={() => navigate('appointments')}>
                კალენდარი →
              </Button>
            }
            bodyClass="p-0"
          >
            {appts.length === 0 && <p className="p-4 text-sm text-slate-500">დღეს ჩაწერები არ არის.</p>}
            <ul className="divide-y divide-slate-100">
              {appts.map((a) => {
                const p = pmap.get(a.patientId);
                const st = APPT_STATUS[a.status];
                return (
                  <li key={a.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 cursor-pointer" onClick={() => p && navigate('patient', p.id)}>
                    <span className="font-mono text-sm font-semibold w-12">{a.time}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p ? patientName(p) : '—'}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {a.reason} · {userName(users.find((u) => u.id === a.doctorId))}
                      </p>
                    </div>
                    <Badge color={st.color}>{st.label}</Badge>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card title="დასასრულებელი ჩანაწერები" bodyClass="p-0">
            {drafts.length === 0 && <p className="p-4 text-sm text-slate-500">ყველა ვიზიტი ხელმოწერილია.</p>}
            <ul className="divide-y divide-slate-100">
              {drafts.slice(0, 8).map((v) => {
                const p = pmap.get(v.patientId);
                return (
                  <li key={v.id} className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer" onClick={() => navigate('patient', v.patientId, 'visits', v.id)}>
                    <p className="text-sm font-medium">{p ? patientName(p) : '—'}</p>
                    <p className="text-xs text-slate-500">
                      ვიზიტი №{v.visitNo} · {fmtDate(v.date)} · <span className="text-amber-700">შავი ვერსია</span>
                    </p>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
      <PatientForm open={newOpen} onClose={() => setNewOpen(false)} initialIdNumber={/^\d{11}$/.test(q.trim()) ? q.trim() : undefined} />
    </div>
  );
}

export type { MedDocument };
