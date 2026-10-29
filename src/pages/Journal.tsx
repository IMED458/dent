import React, { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { db, useLive, useClinic } from '../lib/db';
import type { MedDocument, Patient, User, Visit } from '../lib/types';
import { Badge, Button, Card, Field, Input, Select, Tabs } from '../components/ui';
import { PrintPreview } from '../components/Print';
import { DOC_TYPES, docType } from '../documents/registry';
import { navigate } from '../lib/router';
import { downloadBlob, fmtDate, patientName, todayStr, userName } from '../lib/utils';

export function JournalPage() {
  const [tab, setTab] = useState<'reg' | 'docs'>('reg');
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">ჟურნალები</h1>
      <Tabs<'reg' | 'docs'>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'reg', label: 'სტომატოლოგიური პაციენტის რეგისტრაციის ჟურნალი (IV-220-3/ა)' },
          { id: 'docs', label: 'გაცემული ცნობები და დოკუმენტები (IV-100/ა და სხვ.)' },
        ]}
      />
      {tab === 'reg' ? <RegistrationJournal /> : <DocsJournal />}
    </div>
  );
}

/**
 * ფორმა №IV-220-3/ა „სტომატოლოგიური პაციენტის რეგისტრაციის ჟურნალი“ (ბრძანება №01-55/ნ, მუხ. 5, დანართი №4):
 * ფიქსირდება პაციენტის მომართვიანობა, დიაგნოზი და ჩატარებული აქტივობები (გამოკვლევები, მკურნალობა).
 */
function RegistrationJournal() {
  const visits = useLive(() => db.visits.toArray(), [], [] as Visit[]) as Visit[];
  const patients = useLive(() => db.patients.toArray(), [], [] as Patient[]) as Patient[];
  const users = useLive(() => db.users.toArray(), [], [] as User[]) as User[];
  const clinic = useClinic();
  const year = todayStr().slice(0, 4);
  const [from, setFrom] = useState(`${year}-01-01`);
  const [to, setTo] = useState(todayStr());
  const [printOpen, setPrintOpen] = useState(false);
  const pmap = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);
  const rows = visits.filter((v) => v.date >= from && v.date <= to).sort((a, b) => (a.journalNo || 0) - (b.journalNo || 0));
  const row = (v: Visit) => {
    const p = pmap.get(v.patientId);
    const d = users.find((u) => u.id === v.doctorId);
    return {
      no: v.journalNo,
      date: fmtDate(v.date),
      first: p?.firstName || '',
      last: p?.lastName || '',
      id: p?.idType === 'GE' ? p.idNumber : '',
      dob: fmtDate(p?.birthDate),
      address: p?.address || '',
      phone: p?.phone || '',
      dx: v.diagnoses.map((x) => `${x.code} ${x.text}${x.teeth ? ` (კბ. ${x.teeth})` : ''}`).join('; '),
      act: [v.examPlan?.length ? `გამოკვლევა: ${v.examPlan.join(', ')}` : '', (v.treatment || '').trim().replace(/[.。]+$/, ''), v.procedures.map((x) => x.service + (x.teeth ? ` (კბ. ${x.teeth})` : '')).join(', ')].filter(Boolean).join('. '),
      doctor: d?.lastName || '',
      other: `ისტ. №${p?.cardNumber || ''}; შემთხ. №${v.caseNo}${v.kind === 'followup' ? ' (განმ.)' : ''}`,
      note: v.status === 'signed' ? '' : 'ხელმოუწერელი',
    };
  };
  const HEAD = ['№', 'თარიღი', 'სახელი', 'გვარი', 'პირადი ნომერი', 'დაბადების თარიღი', 'მისამართი', 'ტელეფონი', 'დიაგნოზი ICD-10', 'ჩატარებული გამოკვლევები და მკურნალობა', 'ექიმის გვარი', 'სხვა*', 'შენიშვნა'];
  const csv = () => {
    const esc = (x: any) => `"${String(x ?? '').replace(/"/g, '""')}"`;
    const lines = [HEAD.map(esc).join(','), ...rows.map((v) => Object.values(row(v)).map(esc).join(','))];
    downloadBlob(new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }), `IV-220-3_${from}_${to}.csv`);
  };
  const table = (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-left text-slate-500 border-b border-slate-200">
          {HEAD.map((h) => (
            <th key={h} className="px-2 py-2 font-medium align-bottom">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((v) => {
          const r = row(v);
          return (
            <tr key={v.id} onClick={() => navigate('patient', v.patientId, 'visits', v.id)} className="border-b border-slate-50 hover:bg-teal-50/60 cursor-pointer align-top">
              {Object.values(r).map((x, i) => (
                <td key={i} className="px-2 py-1.5">
                  {x}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
  return (
    <Card
      title={`ფორმა №IV-220-3/ა — ${rows.length} ჩანაწერი`}
      actions={
        <>
          <Button size="sm" icon={<Printer className="w-3.5 h-3.5" />} onClick={() => setPrintOpen(true)}>
            ბეჭდვა
          </Button>
          <Button size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={csv}>
            CSV / Excel
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Field label="დან">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="მდე">
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
      </div>
      <div className="overflow-x-auto -mx-4">{table}</div>
      <p className="text-[11px] text-slate-400 mt-3">* სერვისის მიმწოდებელი უფლებამოსილია ცხრილის თავისუფალ გრაფაში დააფიქსიროს სხვა, მისთვის საჭირო ინფორმაცია. ჟურნალი ივსება ავტომატურად ყოველი ვიზიტიდან.</p>
      <PrintPreview open={printOpen} onClose={() => setPrintOpen(false)} title={`ფორმა IV-220-3/ა ${fmtDate(from)}–${fmtDate(to)}`}>
        <div className="print-sheet landscape">
          <div style={{ display: 'flex', justifyContent: 'space-between' }} className="small">
            <div>
              <b>{clinic.legalName || clinic.name}</b>
              <div>სტომატოლოგიური მომსახურების მიმწოდებელი პირის/დაწესებულების დასახელება</div>
            </div>
            <b>ფორმა №IV-220-3/ა</b>
          </div>
          <h1>სტომატოლოგიური პაციენტის რეგისტრაციის ჟურნალი</h1>
          <p className="small" style={{ textAlign: 'center' }}>
            {fmtDate(from)} — {fmtDate(to)}
          </p>
          <table className="journal" style={{ marginTop: 8 }}>
            <colgroup>
              {[4, 7, 7, 8, 9, 7, 9, 8, 12, 13, 6, 7, 3].map((w, i) => (
                <col key={i} style={{ width: `${w}%` }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {HEAD.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id}>
                  {Object.values(row(v)).map((x, i) => (
                    <td key={i}>{x}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="small" style={{ marginTop: 6 }}>
            * სერვისის მიმწოდებელი უფლებამოსილია ცხრილის თავისუფალ გრაფაში დააფიქსიროს სხვა, მისთვის საჭირო ინფორმაცია
          </p>
        </div>
      </PrintPreview>
    </Card>
  );
}

/** გაცემული დოკუმენტების სარეგისტრაციო ჟურნალი — ფორმა №IV-100/ა აღირიცხება სპეციალურ ჟურნალში რიგითი ნომრით (№338/ნ, დანართი №1, მუხ. 2.3) */
function DocsJournal() {
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
      ['№', 'თარიღი', 'დოკუმენტი', 'პაციენტი', 'პირადი №', 'ისტორია №', 'ექიმი', 'სტატუსი'].map(esc).join(','),
      ...rows.map((d) => {
        const p = pmap.get(d.patientId);
        return [d.number, fmtDate(d.date), d.title, p ? patientName(p) : '', p?.idNumber, p?.cardNumber, userName(users.find((u) => u.id === d.doctorId)), d.status === 'signed' ? 'დასრულებული' : 'შავი'].map(esc).join(',');
      }),
    ];
    downloadBlob(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }), `journal-${type || 'all'}-${from}_${to}.csv`);
  };

  return (
    <div className="space-y-4">
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
