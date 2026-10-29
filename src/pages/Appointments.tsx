import React, { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { db, useLive, uid, nowIso, audit } from '../lib/db';
import type { Appointment, Patient, User } from '../lib/types';
import { Badge, Button, Card, Field, Input, Modal, Select, Textarea, useUi } from '../components/ui';
import { PatientPicker } from '../components/clinical';
import { useRoute, navigate } from '../lib/router';
import { cls, fmtDate, patientName, todayStr, userName, weekdayShortKa } from '../lib/utils';

export const APPT_STATUS: Record<Appointment['status'], { label: string; color: 'slate' | 'teal' | 'amber' | 'red' | 'blue' | 'green' | 'violet' }> = {
  planned: { label: 'დაგეგმილი', color: 'slate' },
  confirmed: { label: 'დადასტურებული', color: 'blue' },
  arrived: { label: 'მოვიდა', color: 'violet' },
  done: { label: 'შესრულდა', color: 'green' },
  cancelled: { label: 'გაუქმდა', color: 'red' },
  noshow: { label: 'არ გამოცხადდა', color: 'amber' },
};

const addDays = (d: string, n: number) => {
  const x = new Date(d + 'T12:00:00');
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
};

export function AppointmentsPage() {
  const route = useRoute();
  const [date, setDate] = useState(todayStr());
  const [view, setView] = useState<'day' | 'week'>('day');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [edit, setEdit] = useState<Partial<Appointment> | null>(null);
  const users = useLive(() => db.users.toArray(), [], [] as User[]) as User[];
  const patients = useLive(() => db.patients.toArray(), [], [] as Patient[]) as Patient[];
  const doctors = users.filter((u) => u.active && (u.role === 'doctor' || u.role === 'admin'));
  const pmap = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);

  const from = view === 'day' ? date : addDays(date, -((new Date(date + 'T12:00:00').getDay() + 6) % 7));
  const to = view === 'day' ? date : addDays(from, 6);
  const appts = (useLive(() => db.appointments.where('date').between(from, to, true, true).toArray(), [from, to], [] as Appointment[]) as Appointment[])
    .filter((a) => !doctorFilter || a.doctorId === doctorFilter)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  useEffect(() => {
    const p = route[1];
    if (p?.startsWith('new:')) {
      setEdit({ patientId: p.slice(4), date: todayStr(), time: '10:00', duration: 30, status: 'planned', reason: '', doctorId: doctors[0]?.id });
      navigate('appointments');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route[1], doctors.length]);

  const days = view === 'day' ? [date] : Array.from({ length: 7 }, (_, i) => addDays(from, i));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">ჩაწერები / კალენდარი</h1>
        <Button variant="primary" icon={<CalendarPlus className="w-4 h-4" />} onClick={() => setEdit({ date, time: '10:00', duration: 30, status: 'planned', reason: '', doctorId: doctorFilter || doctors[0]?.id })}>
          ახალი ჩაწერა
        </Button>
      </div>
      <Card>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Button size="sm" icon={<ChevronLeft className="w-4 h-4" />} onClick={() => setDate(addDays(date, view === 'day' ? -1 : -7))} />
          <Input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="w-auto py-1.5" />
          <Button size="sm" icon={<ChevronRight className="w-4 h-4" />} onClick={() => setDate(addDays(date, view === 'day' ? 1 : 7))} />
          <Button size="sm" variant="ghost" onClick={() => setDate(todayStr())}>
            დღეს
          </Button>
          <div className="flex rounded-lg border border-slate-300 overflow-hidden ml-2">
            {(['day', 'week'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={cls('px-3 py-1.5 text-xs', view === v ? 'bg-teal-600 text-white' : 'bg-white')}>
                {v === 'day' ? 'დღე' : 'კვირა'}
              </button>
            ))}
          </div>
          <Select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)} className="w-auto py-1.5 ml-auto">
            <option value="">ყველა ექიმი</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {userName(d)}
              </option>
            ))}
          </Select>
        </div>
        <div className={cls('grid gap-3', view === 'week' ? 'grid-cols-1 md:grid-cols-7' : 'grid-cols-1')}>
          {days.map((d) => {
            const list = appts.filter((a) => a.date === d);
            return (
              <div key={d} className={cls('rounded-lg', view === 'week' && 'bg-slate-50 p-2 min-h-[120px]', d === todayStr() && view === 'week' && 'ring-2 ring-teal-400')}>
                {view === 'week' && (
                  <p className="text-xs font-semibold text-slate-600 mb-2">
                    {weekdayShortKa(new Date(d + 'T12:00:00'))} {fmtDate(d).slice(0, 5)}
                  </p>
                )}
                {list.length === 0 && <p className="text-xs text-slate-400 py-2">{view === 'day' ? 'ამ დღეს ჩაწერები არ არის.' : '—'}</p>}
                <div className="space-y-1.5">
                  {list.map((a) => {
                    const p = pmap.get(a.patientId);
                    return (
                      <div key={a.id} onClick={() => setEdit(a)} className={cls('rounded-lg border bg-white px-3 py-2 cursor-pointer hover:border-teal-400', a.status === 'cancelled' && 'opacity-50 line-through')}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-semibold">{a.time}</span>
                          <span className="text-xs text-slate-400">{a.duration} წთ</span>
                          <Badge color={APPT_STATUS[a.status].color}>{APPT_STATUS[a.status].label}</Badge>
                        </div>
                        <p className="text-sm font-medium mt-0.5">{p ? patientName(p) : '—'}</p>
                        <p className="text-xs text-slate-500">
                          {a.reason} · {userName(users.find((u) => u.id === a.doctorId))}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      {edit && <AppointmentModal appt={edit} doctors={doctors} existing={appts} onClose={() => setEdit(null)} />}
    </div>
  );
}

function AppointmentModal({ appt, doctors, existing, onClose }: { appt: Partial<Appointment>; doctors: User[]; existing: Appointment[]; onClose: () => void }) {
  const ui = useUi();
  const [f, setF] = useState<Partial<Appointment>>(appt);
  const set = <K extends keyof Appointment>(k: K, v: Appointment[K]) => setF((s) => ({ ...s, [k]: v }));

  const save = async () => {
    if (!f.patientId) return ui.toast('აირჩიეთ პაციენტი', 'err');
    if (!f.doctorId || !f.date || !f.time) return ui.toast('შეავსეთ ექიმი, თარიღი და დრო', 'err');
    const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
    const all = await db.appointments.where('date').equals(f.date).toArray();
    const clash = all.find(
      (a) => a.id !== f.id && a.doctorId === f.doctorId && a.status !== 'cancelled' && toMin(a.time) < toMin(f.time!) + (f.duration || 30) && toMin(f.time!) < toMin(a.time) + a.duration,
    );
    if (clash && !(await ui.confirm({ title: 'დროის გადაფარვა', text: `ექიმს ამ დროს უკვე აქვს ჩაწერა (${clash.time}). შევინახო მაინც?`, okLabel: 'შენახვა' }))) return;
    const rec: Appointment = {
      id: f.id || uid(),
      patientId: f.patientId,
      doctorId: f.doctorId,
      date: f.date,
      time: f.time,
      duration: f.duration || 30,
      reason: f.reason || '',
      status: f.status || 'planned',
      note: f.note,
      createdAt: f.createdAt || nowIso(),
    };
    await db.appointments.put(rec);
    await audit(f.id ? 'UPDATE' : 'CREATE', 'Appointment', rec.id, `ჩაწერა ${fmtDate(rec.date)} ${rec.time} — ${APPT_STATUS[rec.status].label}`, rec.patientId);
    ui.toast('ჩაწერა შენახულია');
    onClose();
  };

  const remove = async () => {
    if (!f.id || !(await ui.confirm({ title: 'ჩაწერის წაშლა', danger: true, okLabel: 'წაშლა' }))) return;
    await db.appointments.delete(f.id);
    await audit('DELETE', 'Appointment', f.id, `წაიშალა ჩაწერა ${fmtDate(f.date)} ${f.time}`, f.patientId);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={f.id ? 'ჩაწერის რედაქტირება' : 'ახალი ჩაწერა'}
      footer={
        <>
          {f.id && (
            <Button variant="danger" icon={<Trash2 className="w-4 h-4" />} onClick={remove}>
              წაშლა
            </Button>
          )}
          {f.patientId && (
            <Button variant="ghost" onClick={() => navigate('patient', f.patientId!)}>
              ბარათის გახსნა
            </Button>
          )}
          <Button onClick={onClose}>გაუქმება</Button>
          <Button variant="primary" onClick={save}>
            შენახვა
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="პაციენტი" required>
          <PatientPicker value={f.patientId} onChange={(p) => set('patientId', p?.id as any)} />
        </Field>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="თარიღი">
            <Input type="date" value={f.date || ''} onChange={(e) => set('date', e.target.value)} />
          </Field>
          <Field label="დრო">
            <Input type="time" step={300} value={f.time || ''} onChange={(e) => set('time', e.target.value)} />
          </Field>
          <Field label="ხანგრძლივობა">
            <Select value={f.duration || 30} onChange={(e) => set('duration', Number(e.target.value))}>
              {[15, 30, 45, 60, 90, 120, 180].map((m) => (
                <option key={m} value={m}>
                  {m} წთ
                </option>
              ))}
            </Select>
          </Field>
          <Field label="სტატუსი">
            <Select value={f.status || 'planned'} onChange={(e) => set('status', e.target.value as Appointment['status'])}>
              {Object.entries(APPT_STATUS).map(([k, s]) => (
                <option key={k} value={k}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="ექიმი">
          <Select value={f.doctorId || ''} onChange={(e) => set('doctorId', e.target.value)}>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {userName(d)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="მიზეზი / მომსახურება">
          <Input value={f.reason || ''} onChange={(e) => set('reason', e.target.value)} placeholder="კონსულტაცია, მკურნალობა, ჰიგიენა…" />
        </Field>
        <Field label="შენიშვნა">
          <Textarea rows={2} value={f.note || ''} onChange={(e) => set('note', e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
