import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { db, useLive } from '../lib/db';
import type { MedDocument, Patient, User } from '../lib/types';
import { Badge, Button, Card, Field, Input, Select } from '../components/ui';
import { DOC_TYPES, docType } from '../documents/registry';
import { navigate } from '../lib/router';
import { downloadBlob, fmtDate, patientName, todayStr, userName } from '../lib/utils';

/** გაცემული დოკუმენტების სარეგისტრაციო ჟურნალი (მაგ. ფორმა №IV-100/ა) */
export function JournalPage() {
  const docs = useLive(() => db.documents.toArray(), [], [] as MedDocument[]) as MedDocument[];
  const patients = useLive(() => db.patients.toArray(), [], [] as Patient[]) as Patient[];
  const users = useLive(() => db.users.toArray(), [], [] as User[]) as User[];
  const [type, setType] = useState('form100');
  const year = todayStr().slice(0, 4);
  const [from, setFrom] = useState(`${year}-01-01`);
  const [to, setTo] = useState(todayStr());
  const pmap = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);

  const rows = docs
    .filter((d) => (!type || d.type === type) && d.date >= from && d.date <= to)
    .sort((a, b) => a.date.localeCompare(b.date) || a.number.localeCompare(b.number));

  const csv = () => {
    const esc = (s: any) => `"${String(s ?? '').replace(/"/g, '""')}"`;
    const lines = [
      ['№', 'თარიღი', 'დოკუმენტი', 'პაციენტი', 'პირადი №', 'ბარათი №', 'ექიმი', 'სტატუსი'].map(esc).join(','),
      ...rows.map((d) => {
        const p = pmap.get(d.patientId);
        return [d.number, fmtDate(d.date), d.title, p ? patientName(p) : '', p?.idNumber, p?.cardNumber, userName(users.find((u) => u.id === d.doctorId)), d.status === 'signed' ? 'დასრულებული' : 'შავი'].map(esc).join(',');
      }),
    ];
    downloadBlob(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }), `journal-${type || 'all'}-${from}_${to}.csv`);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">დოკუმენტების სარეგისტრაციო ჟურნალი</h1>
      <Card
        actions={
          <Button size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={csv}>
            ექსპორტი (CSV / Excel)
          </Button>
        }
        title={`${rows.length} ჩანაწერი`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <Field label="დოკუმენტის ტიპი">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">ყველა</option>
              {DOC_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.formCode ? `${t.formCode} — ` : ''}
                  {t.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="დან">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="მდე">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
        <div className="overflow-x-auto -mx-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="px-4 py-2 font-medium">№</th>
                <th className="px-2 py-2 font-medium">თარიღი</th>
                <th className="px-2 py-2 font-medium">დოკუმენტი</th>
                <th className="px-2 py-2 font-medium">პაციენტი</th>
                <th className="px-2 py-2 font-medium">ექიმი</th>
                <th className="px-4 py-2 font-medium">სტატუსი</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => {
                const p = pmap.get(d.patientId);
                return (
                  <tr key={d.id} onClick={() => navigate('patient', d.patientId, 'documents', d.id)} className="border-b border-slate-50 hover:bg-teal-50/60 cursor-pointer">
                    <td className="px-4 py-2 font-mono text-xs">{d.number}</td>
                    <td className="px-2 py-2 text-xs">{fmtDate(d.date)}</td>
                    <td className="px-2 py-2">
                      {d.title}
                      {docType(d.type)?.formCode && <span className="text-xs text-slate-500"> · {docType(d.type)!.formCode}</span>}
                    </td>
                    <td className="px-2 py-2">
                      {p ? patientName(p) : '—'} <span className="text-xs text-slate-500 font-mono">{p?.idNumber}</span>
                    </td>
                    <td className="px-2 py-2 text-xs">{userName(users.find((u) => u.id === d.doctorId))}</td>
                    <td className="px-4 py-2">{d.status === 'signed' ? <Badge color="green">დასრულებული</Badge> : <Badge color="amber">შავი</Badge>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
