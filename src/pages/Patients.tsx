import React, { useMemo, useState } from 'react';
import { AlertTriangle, Search, UserPlus, Users } from 'lucide-react';
import { db, useLive } from '../lib/db';
import type { Patient, Visit } from '../lib/types';
import { Badge, Button, Card, EmptyState, Input, Select } from '../components/ui';
import { PatientForm } from '../components/PatientForm';
import { navigate } from '../lib/router';
import { ageOf, fmtDate, isMinor, normalize, patientName } from '../lib/utils';

export function usePatientsWithLastVisit() {
  const patients = useLive(() => db.patients.toArray(), [], [] as Patient[]) as Patient[];
  const visits = useLive(() => db.visits.toArray(), [], [] as Visit[]) as Visit[];
  return useMemo(() => {
    const last = new Map<string, string>();
    const count = new Map<string, number>();
    visits.forEach((v) => {
      if ((last.get(v.patientId) || '') < v.date) last.set(v.patientId, v.date);
      count.set(v.patientId, (count.get(v.patientId) || 0) + 1);
    });
    return patients.map((p) => ({ ...p, lastVisit: last.get(p.id) || '', visitCount: count.get(p.id) || 0 }));
  }, [patients, visits]);
}

export type PatientRow = ReturnType<typeof usePatientsWithLastVisit>[number];

/** „12/26“ → დალაგების გასაღები (წელი, შემდეგ რიგითი ნომერი) */
export const historyKey = (n: string) => {
  const m = /^(\d+)\/(\d{2})$/.exec(n || '');
  return m ? Number(m[2]) * 1e6 + Number(m[1]) : 0;
};

export function matchPatient(p: Patient, q: string) {
  const s = normalize(q);
  if (!s) return true;
  const digits = s.replace(/\D/g, '');
  const hay = normalize(`${p.lastName} ${p.firstName} ${p.firstName} ${p.lastName} ${p.fatherName} ${p.idNumber} ${p.cardNumber} ${p.phone} ${p.phone2 || ''}`);
  if (hay.includes(s)) return true;
  return digits.length >= 3 && `${p.idNumber}${p.phone.replace(/\D/g, '')}${p.cardNumber.replace(/\D/g, '')}`.includes(digits);
}

export function PatientsTable({ rows, limit }: { rows: PatientRow[]; limit?: number }) {
  const shown = limit ? rows.slice(0, limit) : rows;
  return (
    <div className="overflow-x-auto -mx-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
            <th className="px-4 py-2 font-medium whitespace-nowrap">ისტორია №</th>
            <th className="px-2 py-2 font-medium">პაციენტი</th>
            <th className="px-2 py-2 font-medium">პირადი ნომერი</th>
            <th className="px-2 py-2 font-medium">დაბ. თარიღი</th>
            <th className="px-2 py-2 font-medium hidden md:table-cell">ტელეფონი</th>
            <th className="px-2 py-2 font-medium hidden md:table-cell">ბოლო ვიზიტი</th>
            <th className="px-4 py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {shown.map((p) => (
            <tr key={p.id} onClick={() => navigate('patient', p.id)} className="border-b border-slate-50 hover:bg-teal-50/60 cursor-pointer">
              <td className="px-4 py-2.5 font-mono text-xs text-slate-600 whitespace-nowrap">{p.cardNumber}</td>
              <td className="px-2 py-2.5">
                <span className="font-medium text-slate-900">{patientName(p)}</span>
                {p.fatherName && <span className="text-slate-400 text-xs"> ({p.fatherName})</span>}
                <div className="flex gap-1 mt-0.5">
                  {isMinor(p) && <Badge color="blue">არასრულწლოვანი</Badge>}
                  {(p.allergies?.trim() || p.riskFlags.length > 0) && (
                    <Badge color="red">
                      <AlertTriangle className="w-3 h-3" /> რისკი
                    </Badge>
                  )}
                  {p.archived && <Badge>არქივი</Badge>}
                </div>
              </td>
              <td className="px-2 py-2.5 font-mono text-xs">{p.idNumber || <span className="text-slate-400">—</span>}</td>
              <td className="px-2 py-2.5 text-xs">
                {fmtDate(p.birthDate)} <span className="text-slate-400">({ageOf(p.birthDate)})</span>
              </td>
              <td className="px-2 py-2.5 text-xs hidden md:table-cell">{p.phone}</td>
              <td className="px-2 py-2.5 text-xs hidden md:table-cell">{p.lastVisit ? fmtDate(p.lastVisit) : <span className="text-slate-400">—</span>}</td>
              <td className="px-4 py-2.5 text-right">
                <span className="text-xs font-medium text-teal-700">გახსნა →</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PatientsPage() {
  const rows = usePatientsWithLastVisit();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'name' | 'recent' | 'card'>('recent');
  const [showArchived, setShowArchived] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  const filtered = useMemo(() => {
    const r = rows.filter((p) => (showArchived || !p.archived) && matchPatient(p, q));
    if (sort === 'name') r.sort((a, b) => patientName(a).localeCompare(patientName(b), 'ka'));
    if (sort === 'card') r.sort((a, b) => historyKey(b.cardNumber) - historyKey(a.cardNumber));
    if (sort === 'recent') r.sort((a, b) => (b.lastVisit || b.createdAt).localeCompare(a.lastVisit || a.createdAt));
    return r;
  }, [rows, q, sort, showArchived]);

  const digitsOnly = /^\d{11}$/.test(q.trim());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">პაციენტების რეესტრი</h1>
        <Button variant="primary" icon={<UserPlus className="w-4 h-4" />} onClick={() => setNewOpen(true)}>
          ახალი პაციენტი
        </Button>
      </div>
      <Card>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input autoFocus className="pl-9" placeholder="ძებნა: გვარი, სახელი, პირადი ნომერი, ისტორიის №, ტელეფონი" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={sort} onChange={(e) => setSort(e.target.value as any)} className="w-auto">
            <option value="recent">ბოლო აქტივობით</option>
            <option value="name">ანბანით</option>
            <option value="card">ისტორიის ნომრით</option>
          </Select>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" className="accent-teal-600" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> არქივიც
          </label>
        </div>
        {filtered.length ? (
          <PatientsTable rows={filtered} />
        ) : (
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title={q ? 'პაციენტი ვერ მოიძებნა' : 'პაციენტები ჯერ არ არის'}
            text={digitsOnly ? `პირადი ნომრით ${q.trim()} პაციენტი არ არის რეგისტრირებული.` : undefined}
            action={
              <Button variant="primary" icon={<UserPlus className="w-4 h-4" />} onClick={() => setNewOpen(true)}>
                {digitsOnly ? 'ამ ნომრით რეგისტრაცია' : 'რეგისტრაცია'}
              </Button>
            }
          />
        )}
        <p className="text-xs text-slate-400 mt-3">სულ: {filtered.length}</p>
      </Card>
      <PatientForm open={newOpen} onClose={() => setNewOpen(false)} initialIdNumber={digitsOnly ? q.trim() : undefined} />
    </div>
  );
}
