import React, { useMemo, useState } from 'react';
import { Check, FileText, Plus, Printer, Search, Settings2, Trash2, Undo2 } from 'lucide-react';
import { db, useLive, uid, nowIso, audit, useClinic } from '../../lib/db';
import type { Charge, Patient, Payment, ServiceItem, Visit } from '../../lib/types';
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Select, useUi } from '../../components/ui';
import { useSession } from '../../lib/session';
import { cls, fmtDate, lineTotal, money, normalize, parseMoney, patientName, round2, todayStr, userName } from '../../lib/utils';
import { PrintPreview } from '../../components/Print';
import { SheetHeader, Signatures } from '../../documents/common';
import { navigate } from '../../lib/router';
import { useStaff } from './Visits';

export const PAY_METHODS: Record<Payment['method'], string> = { cash: 'ნაღდი', card: 'ბარათი', transfer: 'გადარიცხვა', insurance: 'სადაზღვევო' };

/** ფინანსური სტრიქონი — ხელით დამატებული მომსახურება ან ვიზიტის მანიპულაცია */
export interface FinLine {
  key: string;
  source: 'charge' | 'visit';
  charge?: Charge;
  visit?: Visit;
  date: string;
  code: string;
  name: string;
  teeth: string;
  qty: number;
  price: number;
  discount: number;
  total: number;
  status: Charge['status'];
}

/**
 * ბალანსი:
 *  შესრულებული = შესრულებული მომსახურება (ხელით დამატებული, სტატუსი „შესრულდა“) + ვიზიტებში შეტანილი მანიპულაციები
 *  დავალიანება = შესრულებული − გადახდილი (უარყოფითი = ავანსი)
 *  დაგეგმილი — ჯერ შეუსრულებელი მომსახურება, ბალანსში არ ირიცხება, ჩანს ხარჯთაღრიცხვაში
 */
export function usePatientBalance(patientId: string) {
  const visits = useLive(() => db.visits.where('patientId').equals(patientId).toArray(), [patientId], [] as Visit[]) as Visit[];
  const payments = useLive(() => db.payments.where('patientId').equals(patientId).toArray(), [patientId], [] as Payment[]) as Payment[];
  const charges = useLive(() => db.charges.where('patientId').equals(patientId).toArray(), [patientId], [] as Charge[]) as Charge[];
  return useMemo(() => {
    const lines: FinLine[] = [
      ...charges.map((c) => ({
        key: c.id,
        source: 'charge' as const,
        charge: c,
        date: c.date,
        code: c.code,
        name: c.name,
        teeth: c.teeth,
        qty: c.qty,
        price: c.price,
        discount: c.discount || 0,
        total: lineTotal(c.qty, c.price, c.discount),
        status: c.status,
      })),
      ...visits.flatMap((v) =>
        v.procedures.map((p) => ({
          key: `${v.id}:${p.id}`,
          source: 'visit' as const,
          visit: v,
          date: v.date,
          code: '',
          name: p.service,
          teeth: p.teeth,
          qty: p.qty,
          price: p.price,
          discount: 0,
          total: lineTotal(p.qty, p.price),
          status: 'done' as const,
        })),
      ),
    ].sort((a, b) => b.date.localeCompare(a.date));
    const sum = (xs: FinLine[]) => round2(xs.reduce((s, x) => s + x.total, 0));
    const charged = sum(lines.filter((l) => l.status === 'done'));
    const planned = sum(lines.filter((l) => l.status === 'planned'));
    const paid = round2(payments.reduce((s, p) => s + (Number(p.amount) || 0), 0));
    return { visits, payments, charges, lines, charged, planned, paid, balance: round2(charged - paid) };
  }, [visits, payments, charges]);
}

export function FinanceTab({ patient }: { patient: Patient }) {
  const fin = usePatientBalance(patient.id);
  const { user, can } = useSession();
  const ui = useUi();
  const staff = useStaff();
  const [addOpen, setAddOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [receipt, setReceipt] = useState<Payment | null>(null);
  const [estimateOpen, setEstimateOpen] = useState(false);
  const [f, setF] = useState({ date: todayStr(), amount: '', method: 'cash' as Payment['method'], note: '' });

  const addPayment = async () => {
    const amount = parseMoney(f.amount);
    if (!(amount > 0)) return ui.toast('მიუთითეთ თანხა', 'err');
    const p: Payment = { id: uid(), patientId: patient.id, date: f.date, amount, method: f.method, note: f.note, createdAt: nowIso(), createdBy: user!.id };
    await db.payments.add(p);
    await audit('CREATE', 'Payment', p.id, `გადახდა ${money(amount)} (${PAY_METHODS[f.method]})`, patient.id);
    setPayOpen(false);
    setF({ date: todayStr(), amount: '', method: 'cash', note: '' });
    ui.toast('გადახდა დარეგისტრირდა');
    setReceipt(p);
  };

  const removePayment = async (p: Payment) => {
    if (!(await ui.confirm({ title: 'გადახდის წაშლა', text: `${money(p.amount)} — ${fmtDate(p.date)}`, danger: true, okLabel: 'წაშლა' }))) return;
    await db.payments.delete(p.id);
    await audit('DELETE', 'Payment', p.id, `წაიშალა გადახდა ${money(p.amount)}`, patient.id);
  };

  const setStatus = async (c: Charge, status: Charge['status']) => {
    await db.charges.update(c.id, { status, date: status === 'done' && c.status === 'planned' ? todayStr() : c.date });
    await audit('UPDATE', 'Charge', c.id, `${c.name}: ${STATUS[c.status].label} → ${STATUS[status].label}`, patient.id);
  };

  const removeCharge = async (c: Charge) => {
    if (!(await ui.confirm({ title: 'მომსახურების წაშლა', text: `${c.name} — ${money(lineTotal(c.qty, c.price, c.discount))}`, danger: true, okLabel: 'წაშლა' }))) return;
    await db.charges.delete(c.id);
    await audit('DELETE', 'Charge', c.id, `წაიშალა მომსახურება ${c.name}`, patient.id);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="შესრულებული მომსახურება" value={money(fin.charged)} />
        <Stat label="გადახდილი" value={money(fin.paid)} />
        <Stat
          label={fin.balance > 0 ? 'დავალიანება' : fin.balance < 0 ? 'ავანსი (ზედმეტად გადახდილი)' : 'ბალანსი'}
          value={money(Math.abs(fin.balance))}
          tone={fin.balance > 0 ? 'text-red-600' : 'text-emerald-600'}
        />
        <Stat label="დაგეგმილი (შეუსრულებელი)" value={money(fin.planned)} tone="text-sky-700" />
      </div>

      <Card
        title="მომსახურება"
        bodyClass="p-0"
        actions={
          <>
            {can('admin') && (
              <Button size="sm" variant="ghost" icon={<Settings2 className="w-3.5 h-3.5" />} onClick={() => navigate('settings', 'services')}>
                პრეისკურანტი
              </Button>
            )}
            <Button size="sm" icon={<FileText className="w-3.5 h-3.5" />} onClick={() => setEstimateOpen(true)} disabled={!fin.lines.length}>
              ხარჯთაღრიცხვა / ანგარიში
            </Button>
            {can('finance') || can('clinical') ? (
              <Button size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setAddOpen(true)}>
                მომსახურების დამატება
              </Button>
            ) : null}
          </>
        }
      >
        {fin.lines.length === 0 ? (
          <EmptyState title="მომსახურება ჯერ არ არის" text="დაამატეთ კონსულტაცია, მანიპულაციები, რენტგენი და სხვ. — გადახდამდეც. „დაგეგმილი“ არ ირიცხება ბალანსში, „შესრულებული“ — ირიცხება." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-2 font-medium">თარიღი</th>
                  <th className="px-2 py-2 font-medium">მომსახურება</th>
                  <th className="px-2 py-2 font-medium">კბილი</th>
                  <th className="px-2 py-2 font-medium text-right">რაოდ.</th>
                  <th className="px-2 py-2 font-medium text-right">ფასი</th>
                  <th className="px-2 py-2 font-medium text-right">ფასდ.</th>
                  <th className="px-2 py-2 font-medium text-right">ჯამი</th>
                  <th className="px-2 py-2 font-medium">სტატუსი</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {fin.lines.map((l) => (
                  <tr key={l.key} className={cls('border-b border-slate-50', l.status === 'cancelled' && 'opacity-50 line-through')}>
                    <td className="px-4 py-2 text-xs text-slate-500 whitespace-nowrap">{fmtDate(l.date)}</td>
                    <td className="px-2 py-2">
                      {l.name}
                      {l.code && <span className="text-xs text-slate-400"> · {l.code}</span>}
                      {l.source === 'visit' && (
                        <button className="block text-[11px] text-teal-700 hover:underline" onClick={() => navigate('patient', patient.id, 'visits', l.visit!.id)}>
                          ვიზიტი №{l.visit!.visitNo}
                        </button>
                      )}
                    </td>
                    <td className="px-2 py-2 text-xs">{l.teeth}</td>
                    <td className="px-2 py-2 text-right">{l.qty}</td>
                    <td className="px-2 py-2 text-right whitespace-nowrap">{money(l.price)}</td>
                    <td className="px-2 py-2 text-right text-xs">{l.discount ? `${l.discount}%` : ''}</td>
                    <td className="px-2 py-2 text-right font-medium whitespace-nowrap">{money(l.total)}</td>
                    <td className="px-2 py-2">
                      <Badge color={STATUS[l.status].color}>{STATUS[l.status].label}</Badge>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right">
                      {l.charge && (can('finance') || can('clinical')) && (
                        <>
                          {l.status === 'planned' && (
                            <button title="შესრულდა" onClick={() => setStatus(l.charge!, 'done')} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {l.status === 'done' && (
                            <button title="დაგეგმილზე დაბრუნება" onClick={() => setStatus(l.charge!, 'planned')} className="p-1 text-slate-500 hover:bg-slate-100 rounded">
                              <Undo2 className="w-4 h-4" />
                            </button>
                          )}
                          {l.status !== 'cancelled' && (
                            <button title="გაუქმება" onClick={() => setStatus(l.charge!, 'cancelled')} className="p-1 text-slate-400 hover:bg-slate-100 rounded text-xs">
                              ✕
                            </button>
                          )}
                          <button title="წაშლა" onClick={() => removeCharge(l.charge!)} className="p-1 text-slate-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title="გადახდები"
        bodyClass="p-0"
        actions={
          can('finance') && (
            <Button
              size="sm"
              variant="primary"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => (setF((s) => ({ ...s, amount: fin.balance > 0 ? String(fin.balance) : '' })), setPayOpen(true))}
            >
              გადახდის მიღება
            </Button>
          )
        }
      >
        {fin.payments.length === 0 && <p className="p-4 text-sm text-slate-500">გადახდები არ არის. შესაძლებელია ავანსის მიღებაც.</p>}
        <table className="w-full text-sm">
          <tbody>
            {[...fin.payments]
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
                      <button onClick={() => removePayment(p)} className="p-1 text-slate-400 hover:text-red-600" title="წაშლა">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>

      {addOpen && <AddServicesModal patient={patient} onClose={() => setAddOpen(false)} />}

      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        size="sm"
        title="გადახდის მიღება"
        footer={
          <>
            <Button onClick={() => setPayOpen(false)}>გაუქმება</Button>
            <Button variant="primary" onClick={addPayment}>
              შენახვა და ქვითარი
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            მიმდინარე {fin.balance >= 0 ? 'დავალიანება' : 'ავანსი'}: <b>{money(Math.abs(fin.balance))}</b>
          </p>
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
          <Receipt p={receipt} patient={patient} balanceAfter={fin.balance} />
        </PrintPreview>
      )}
      {estimateOpen && (
        <PrintPreview open onClose={() => setEstimateOpen(false)} title={`ანგარიში — ${patientName(patient)}`}>
          <Estimate patient={patient} fin={fin} />
        </PrintPreview>
      )}
    </div>
  );
}

const STATUS: Record<Charge['status'], { label: string; color: 'blue' | 'green' | 'slate' }> = {
  planned: { label: 'დაგეგმილი', color: 'blue' },
  done: { label: 'შესრულდა', color: 'green' },
  cancelled: { label: 'გაუქმდა', color: 'slate' },
};

type Draft = { key: string; service?: ServiceItem; code: string; name: string; group: string; teeth: string; qty: number; price: number; discount: number };

/** პრეისკურანტიდან მომსახურების (ერთის ან რამდენიმის) დამატება */
export function AddServicesModal({ patient, onClose, visitId }: { patient: Patient; onClose: () => void; visitId?: string }) {
  const services = (useLive(() => db.services.toArray(), [], [] as ServiceItem[]) as ServiceItem[]).sort(
    (a, b) => a.group.localeCompare(b.group, 'ka') || a.code.localeCompare(b.code),
  );
  const { user, can } = useSession();
  const ui = useUi();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Draft[]>([]);
  const [date, setDate] = useState(todayStr());
  const [status, setStatus] = useState<Charge['status']>('done');
  const [note, setNote] = useState('');

  const shown = services.filter((s) => !q || normalize(`${s.code} ${s.name} ${s.group}`).includes(normalize(q)));
  const groups = [...new Set(shown.map((s) => s.group))];
  const add = (s?: ServiceItem) =>
    setItems((xs) => [...xs, { key: uid(), service: s, code: s?.code || '', name: s?.name || q.trim(), group: s?.group || 'სხვა', teeth: '', qty: 1, price: s?.price || 0, discount: 0 }]);
  const set = (k: string, patch: Partial<Draft>) => setItems((xs) => xs.map((x) => (x.key === k ? { ...x, ...patch } : x)));
  const total = round2(items.reduce((s, i) => s + lineTotal(i.qty, i.price, i.discount), 0));

  const save = async () => {
    const valid = items.filter((i) => i.name.trim());
    if (!valid.length) return ui.toast('აირჩიეთ მომსახურება', 'err');
    const rows: Charge[] = valid.map((i) => ({
      id: uid(),
      patientId: patient.id,
      date,
      serviceId: i.service?.id,
      code: i.code,
      name: i.name.trim(),
      group: i.group,
      teeth: i.teeth,
      qty: Math.max(1, Math.round(Number(i.qty) || 1)),
      price: round2(i.price),
      discount: Math.min(100, Math.max(0, Number(i.discount) || 0)),
      status,
      visitId,
      note,
      createdAt: nowIso(),
      createdBy: user!.id,
    }));
    await db.charges.bulkAdd(rows);
    await audit('CREATE', 'Charge', rows[0].id, `დაემატა ${rows.length} მომსახურება (${STATUS[status].label}), ჯამი ${money(total)}`, patient.id);
    ui.toast(`დაემატა ${rows.length} მომსახურება — ${money(total)}`);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={`მომსახურების დამატება — ${patientName(patient)}`}
      footer={
        <>
          <span className="mr-auto text-sm">
            სულ: <b>{money(total)}</b>
          </span>
          <Button onClick={onClose}>გაუქმება</Button>
          <Button variant="primary" onClick={save} disabled={!items.length}>
            დამატება ({items.length})
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-4">
        <div>
          <div className="relative mb-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input autoFocus className="pl-9" placeholder="ძებნა: კონსულტაცია, რენტგენი, ბჟენი, კოდი…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-slate-200">
            {groups.map((g) => (
              <div key={g}>
                <p className="sticky top-0 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">{g}</p>
                {shown
                  .filter((s) => s.group === g)
                  .map((s) => (
                    <button key={s.id} onClick={() => add(s)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-teal-50 border-b border-slate-50">
                      <span>
                        {s.name} <span className="text-xs text-slate-400">{s.code}</span>
                      </span>
                      <span className="font-medium whitespace-nowrap">{money(s.price)}</span>
                    </button>
                  ))}
              </div>
            ))}
            {shown.length === 0 && (
              <div className="p-3 text-sm text-slate-500">
                პრეისკურანტში ვერ მოიძებნა.{' '}
                {q.trim() && (
                  <button className="text-teal-700 underline" onClick={() => add()}>
                    „{q.trim()}“ — ფასის ხელით მითითებით
                  </button>
                )}
              </div>
            )}
          </div>
          {can('admin') && (
            <button className="mt-2 text-xs text-teal-700 hover:underline" onClick={() => (onClose(), navigate('settings', 'services'))}>
              პრეისკურანტის რედაქტირება (დამატება, წაშლა, ფასების შეცვლა) →
            </button>
          )}
        </div>
        <div className="space-y-3 min-w-0">
          <div className="grid grid-cols-2 gap-3">
            <Field label="თარიღი">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="სტატუსი" hint={status === 'planned' ? 'არ ირიცხება ბალანსში, ჩანს ხარჯთაღრიცხვაში' : 'ირიცხება ბალანსში (დავალიანება)'}>
              <Select value={status} onChange={(e) => setStatus(e.target.value as Charge['status'])}>
                <option value="done">შესრულდა (დარიცხვა)</option>
                <option value="planned">დაგეგმილი (წინასწარ)</option>
              </Select>
            </Field>
          </div>
          {items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">აირჩიეთ მომსახურება მარცხენა სიიდან — შეიძლება რამდენიმე ერთად.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="text-xs text-slate-500 text-left">
                    <th className="pr-2 py-1">მომსახურება</th>
                    <th className="pr-2 py-1 w-20">კბილი</th>
                    <th className="pr-2 py-1 w-16">რაოდ.</th>
                    <th className="pr-2 py-1 w-24">ფასი ₾</th>
                    <th className="pr-2 py-1 w-16">ფასდ.%</th>
                    <th className="pr-2 py-1 w-24 text-right">ჯამი</th>
                    <th className="w-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.key}>
                      <td className="pr-2 py-1">
                        <Input className="py-1.5" value={i.name} onChange={(e) => set(i.key, { name: e.target.value })} />
                      </td>
                      <td className="pr-2 py-1">
                        <Input className="py-1.5" value={i.teeth} onChange={(e) => set(i.key, { teeth: e.target.value })} />
                      </td>
                      <td className="pr-2 py-1">
                        <Input className="py-1.5" type="number" min={1} value={i.qty} onChange={(e) => set(i.key, { qty: Math.max(1, Number(e.target.value) || 1) })} />
                      </td>
                      <td className="pr-2 py-1">
                        <Input className="py-1.5" type="number" min={0} step="0.01" value={i.price} onChange={(e) => set(i.key, { price: Number(e.target.value) || 0 })} />
                      </td>
                      <td className="pr-2 py-1">
                        <Input className="py-1.5" type="number" min={0} max={100} value={i.discount} onChange={(e) => set(i.key, { discount: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} />
                      </td>
                      <td className="pr-2 py-1 text-right font-medium whitespace-nowrap">{money(lineTotal(i.qty, i.price, i.discount))}</td>
                      <td>
                        <button onClick={() => setItems((xs) => xs.filter((x) => x.key !== i.key))} className="p-1 text-slate-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Field label="შენიშვნა">
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>
      </div>
    </Modal>
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

function Estimate({ patient, fin }: { patient: Patient; fin: ReturnType<typeof usePatientBalance> }) {
  const clinic = useClinic();
  const done = fin.lines.filter((l) => l.status === 'done');
  const planned = fin.lines.filter((l) => l.status === 'planned');
  const table = (rows: FinLine[], title: string) =>
    rows.length > 0 && (
      <>
        <h2>{title}</h2>
        <table>
          <thead>
            <tr>
              <th style={{ width: '12%' }}>თარიღი</th>
              <th>მომსახურება</th>
              <th style={{ width: '10%' }}>კბილი</th>
              <th style={{ width: '7%' }}>რაოდ.</th>
              <th style={{ width: '12%' }}>ფასი</th>
              <th style={{ width: '8%' }}>ფასდ.</th>
              <th style={{ width: '13%' }}>ჯამი</th>
            </tr>
          </thead>
          <tbody>
            {[...rows].reverse().map((l) => (
              <tr key={l.key}>
                <td>{fmtDate(l.date)}</td>
                <td>
                  {l.name}
                  {l.code ? ` (${l.code})` : ''}
                </td>
                <td>{l.teeth}</td>
                <td className="num">{l.qty}</td>
                <td className="num">{money(l.price)}</td>
                <td className="num">{l.discount ? `${l.discount}%` : ''}</td>
                <td className="num">{money(l.total)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={6} style={{ textAlign: 'right' }}>
                <b>ჯამი:</b>
              </td>
              <td className="num">
                <b>{money(round2(rows.reduce((s, x) => s + x.total, 0)))}</b>
              </td>
            </tr>
          </tbody>
        </table>
      </>
    );
  return (
    <div className="print-sheet">
      <SheetHeader clinic={clinic} right={<div>{fmtDate(todayStr())}</div>} />
      <h1>ანგარიში / ხარჯთაღრიცხვა</h1>
      <p style={{ textAlign: 'center' }}>
        {patientName(patient)} · პ/ნ {patient.idNumber || '—'} · ისტორია №{patient.cardNumber}
      </p>
      {table(done, 'შესრულებული მომსახურება')}
      {table(planned, 'დაგეგმილი მომსახურება (წინასწარი ხარჯთაღრიცხვა)')}
      <table style={{ marginTop: 12, width: '55%', marginLeft: 'auto' }}>
        <tbody>
          <tr>
            <td>შესრულებული მომსახურება</td>
            <td className="num">{money(fin.charged)}</td>
          </tr>
          <tr>
            <td>გადახდილი</td>
            <td className="num">{money(fin.paid)}</td>
          </tr>
          <tr>
            <td>
              <b>{fin.balance >= 0 ? 'გადასახდელი (დავალიანება)' : 'ავანსი'}</b>
            </td>
            <td className="num">
              <b>{money(Math.abs(fin.balance))}</b>
            </td>
          </tr>
          {fin.planned > 0 && (
            <tr>
              <td>დაგეგმილი მომსახურების ღირებულება</td>
              <td className="num">{money(fin.planned)}</td>
            </tr>
          )}
        </tbody>
      </table>
      <Signatures left="კლინიკის წარმომადგენელი" right={`პაციენტი: ${patientName(patient)}`} />
    </div>
  );
}

function Receipt({ p, patient, balanceAfter }: { p: Payment; patient: Patient; balanceAfter: number }) {
  const clinic = useClinic();
  return (
    <div className="print-sheet" style={{ minHeight: 0 }}>
      <SheetHeader clinic={clinic} />
      <h1>გადახდის ქვითარი</h1>
      <p style={{ textAlign: 'center' }}>{fmtDate(p.date)}</p>
      <table style={{ marginTop: 12 }}>
        <tbody>
          <tr>
            <td style={{ width: '35%' }}>გადამხდელი</td>
            <td>
              {patientName(patient)} (პ/ნ {patient.idNumber || '—'}, ისტორია №{patient.cardNumber})
            </td>
          </tr>
          <tr>
            <td>თანხა</td>
            <td>
              <b>{money(p.amount)}</b>
            </td>
          </tr>
          <tr>
            <td>გადახდის მეთოდი</td>
            <td>{PAY_METHODS[p.method]}</td>
          </tr>
          <tr>
            <td>დანიშნულება</td>
            <td>სტომატოლოგიური მომსახურება{p.note ? ` — ${p.note}` : ''}</td>
          </tr>
          <tr>
            <td>ნაშთი გადახდის შემდეგ</td>
            <td>{balanceAfter > 0 ? `დავალიანება ${money(balanceAfter)}` : balanceAfter < 0 ? `ავანსი ${money(-balanceAfter)}` : 'დავალიანება არ არის'}</td>
          </tr>
        </tbody>
      </table>
      <Signatures left="მიმღები" right="გადამხდელი" />
    </div>
  );
}
