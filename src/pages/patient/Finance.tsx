import React, { useState } from 'react';
import { Plus, Printer, Trash2 } from 'lucide-react';
import { db, useLive, uid, nowIso, audit, useClinic } from '../../lib/db';
import type { Patient, Payment, Visit } from '../../lib/types';
import { Badge, Button, Card, Field, Input, Modal, Select, useUi } from '../../components/ui';
import { useSession } from '../../lib/session';
import { fmtDate, money, patientName, todayStr, userName } from '../../lib/utils';
import { PrintPreview } from '../../components/Print';
import { SheetHeader, Signatures } from '../../documents/common';
import { useStaff } from './Visits';

export const PAY_METHODS: Record<Payment['method'], string> = { cash: 'ნაღდი', card: 'ბარათი', transfer: 'გადარიცხვა', insurance: 'სადაზღვევო' };

export function usePatientBalance(patientId: string) {
  const visits = useLive(() => db.visits.where('patientId').equals(patientId).toArray(), [patientId], [] as Visit[]) as Visit[];
  const payments = useLive(() => db.payments.where('patientId').equals(patientId).toArray(), [patientId], [] as Payment[]) as Payment[];
  const charged = visits.reduce((s, v) => s + v.procedures.reduce((a, p) => a + p.qty * p.price, 0), 0);
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  return { visits, payments, charged, paid, balance: charged - paid };
}

export function FinanceTab({ patient }: { patient: Patient }) {
  const { visits, payments, charged, paid, balance } = usePatientBalance(patient.id);
  const { user, can } = useSession();
  const ui = useUi();
  const staff = useStaff();
  const [open, setOpen] = useState(false);
  const [receipt, setReceipt] = useState<Payment | null>(null);
  const [f, setF] = useState({ date: todayStr(), amount: '', method: 'cash' as Payment['method'], note: '' });

  const add = async () => {
    const amount = Math.round(Number(f.amount.replace(',', '.')) * 100) / 100;
    if (!(amount > 0)) return ui.toast('მიუთითეთ თანხა', 'err');
    const p: Payment = { id: uid(), patientId: patient.id, date: f.date, amount, method: f.method, note: f.note, createdAt: nowIso(), createdBy: user!.id };
    await db.payments.add(p);
    await audit('CREATE', 'Payment', p.id, `გადახდა ${money(amount)} (${PAY_METHODS[f.method]})`, patient.id);
    setOpen(false);
    setF({ date: todayStr(), amount: '', method: 'cash', note: '' });
    ui.toast('გადახდა დარეგისტრირდა');
  };

  const remove = async (p: Payment) => {
    if (!(await ui.confirm({ title: 'გადახდის წაშლა', text: `${money(p.amount)} — ${fmtDate(p.date)}`, danger: true, okLabel: 'წაშლა' }))) return;
    await db.payments.delete(p.id);
    await audit('DELETE', 'Payment', p.id, `წაიშალა გადახდა ${money(p.amount)}`, patient.id);
  };

  const charges = visits
    .flatMap((v) => v.procedures.map((p) => ({ ...p, date: v.date, visitNo: v.visitNo, signed: v.status === 'signed' })))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="დარიცხული" value={money(charged)} />
        <Stat label="გადახდილი" value={money(paid)} />
        <Stat label={balance >= 0 ? 'დავალიანება' : 'ავანსი / ზედმეტობა'} value={money(Math.abs(balance))} tone={balance > 0 ? 'text-red-600' : 'text-emerald-600'} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="შესრულებული მომსახურება (ვიზიტებიდან)" bodyClass="p-0">
          {charges.length === 0 && <p className="p-4 text-sm text-slate-500">მანიპულაციები ვიზიტებში არ არის შეტანილი.</p>}
          <table className="w-full text-sm">
            <tbody>
              {charges.map((c) => (
                <tr key={c.id} className="border-b border-slate-50">
                  <td className="px-4 py-2 text-xs text-slate-500 whitespace-nowrap">
                    {fmtDate(c.date)}
                    <br />№{c.visitNo}
                  </td>
                  <td className="px-2 py-2">
                    {c.service} {c.teeth && <span className="text-slate-500">(კბ. {c.teeth})</span>} {c.qty > 1 && `×${c.qty}`}
                    {!c.signed && <Badge color="amber" className="ml-1">შავი</Badge>}
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap font-medium">{money(c.qty * c.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card
          title="გადახდები"
          bodyClass="p-0"
          actions={
            can('finance') && (
              <Button size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => (setF((s) => ({ ...s, amount: balance > 0 ? String(balance) : '' })), setOpen(true))}>
                გადახდის მიღება
              </Button>
            )
          }
        >
          {payments.length === 0 && <p className="p-4 text-sm text-slate-500">გადახდები არ არის.</p>}
          <table className="w-full text-sm">
            <tbody>
              {[...payments]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((p) => (
                  <tr key={p.id} className="border-b border-slate-50">
                    <td className="px-4 py-2 text-xs text-slate-500">{fmtDate(p.date)}</td>
                    <td className="px-2 py-2">
                      {PAY_METHODS[p.method]} {p.note && <span className="text-slate-500 text-xs">· {p.note}</span>}
                      <span className="block text-[11px] text-slate-400">{userName(staff.find((s) => s.id === p.createdBy))}</span>
                    </td>
                    <td className="px-2 py-2 text-right font-medium whitespace-nowrap">{money(p.amount)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      <button onClick={() => setReceipt(p)} className="p-1 text-slate-500 hover:text-teal-700" title="ქვითარი">
                        <Printer className="w-4 h-4" />
                      </button>
                      {can('admin') && (
                        <button onClick={() => remove(p)} className="p-1 text-slate-400 hover:text-red-600" title="წაშლა">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="sm"
        title="გადახდის მიღება"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>გაუქმება</Button>
            <Button variant="primary" onClick={add}>
              შენახვა
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="თანხა (₾)" required>
            <Input autoFocus inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="თარიღი">
              <Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
            </Field>
            <Field label="გადახდის მეთოდი">
              <Select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value as Payment['method'] })}>
                {Object.entries(PAY_METHODS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="შენიშვნა">
            <Input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
          </Field>
        </div>
      </Modal>
      {receipt && (
        <PrintPreview open onClose={() => setReceipt(null)} title={`ქვითარი — ${patientName(patient)}`}>
          <Receipt p={receipt} patient={patient} />
        </PrintPreview>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-lg sm:text-xl font-semibold mt-1 ${tone || ''}`}>{value}</p>
    </div>
  );
}

function Receipt({ p, patient }: { p: Payment; patient: Patient }) {
  const clinic = useClinic();
  return (
    <div className="print-sheet" style={{ minHeight: 0 }}>
      <SheetHeader clinic={clinic} />
      <h1>გადახდის ქვითარი</h1>
      <p style={{ textAlign: 'center' }}>{fmtDate(p.date)}</p>
      <table style={{ marginTop: 12 }}>
        <tbody>
          <tr>
            <td>
              <b>გადამხდელი:</b> {patientName(patient)} (პ/ნ {patient.idNumber || '—'})
            </td>
          </tr>
          <tr>
            <td>
              <b>თანხა:</b> {money(p.amount)}
            </td>
          </tr>
          <tr>
            <td>
              <b>გადახდის მეთოდი:</b> {PAY_METHODS[p.method]}
            </td>
          </tr>
          <tr>
            <td>
              <b>დანიშნულება:</b> სტომატოლოგიური მომსახურება{p.note ? ` — ${p.note}` : ''}
            </td>
          </tr>
        </tbody>
      </table>
      <Signatures left="მიმღები" right="გადამხდელი" />
    </div>
  );
}
