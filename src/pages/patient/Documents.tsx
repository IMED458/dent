import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Copy, FilePlus2, FileText, Lock, Plus, Printer, Trash2, Unlock } from 'lucide-react';
import { db, useLive, nowIso, audit, useClinic } from '../../lib/db';
import type { MedDocument, Patient, RadiologyStudy, ServiceItem, Visit } from '../../lib/types';
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Select, useUi } from '../../components/ui';
import { DiagnosisEditor, TemplateText } from '../../components/clinical';
import { DOC_TYPES, docType, type DocCtx, type DocType, type FieldDef } from '../../documents/registry';
import { useSession } from '../../lib/session';
import { createDocument } from '../../lib/records';
import { navigate } from '../../lib/router';
import { fmtDate, fmtDateTime, money, patientName, todayStr, userName, cls } from '../../lib/utils';
import { PrintPreview } from '../../components/Print';
import { useStaff } from './Visits';

export function usePatientCtx(patient: Patient) {
  const clinic = useClinic();
  const staff = useStaff();
  const visits = useLive(() => db.visits.where('patientId').equals(patient.id).toArray(), [patient.id], [] as Visit[]) as Visit[];
  const radiology = useLive(() => db.radiology.where('patientId').equals(patient.id).toArray(), [patient.id], [] as RadiologyStudy[]) as RadiologyStudy[];
  return { clinic, staff, visits, radiology };
}

export function DocumentsTab({ patient, openId }: { patient: Patient; openId?: string }) {
  const docs = (useLive(() => db.documents.where('patientId').equals(patient.id).toArray(), [patient.id], [] as MedDocument[]) as MedDocument[]).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const { clinic, staff, visits, radiology } = usePatientCtx(patient);
  const { user, can } = useSession();
  const ui = useUi();
  const [pickOpen, setPickOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const handledNew = useRef<string | null>(null);

  // „new:<type>:<visitId?>“ — ახალი დოკუმენტის შექმნა ბმულიდან (მაგ. ვიზიტიდან „ფორმა 100“)
  useEffect(() => {
    if (!openId?.startsWith('new:') || busy || !staff.length || handledNew.current === openId) return;
    handledNew.current = openId;
    const [, type, visitId] = openId.split(':');
    create(type, visitId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId, staff.length]);

  const create = async (type: string, visitId?: string) => {
    const t = docType(type);
    if (!t) return;
    setBusy(true);
    try {
      const visit = visits.find((v) => v.id === visitId) || (visitId ? await db.visits.get(visitId) : undefined);
      const doctorId = visit?.doctorId || (user!.role === 'doctor' || user!.role === 'admin' ? user!.id : staff.find((s) => s.role === 'doctor')?.id || user!.id);
      const ctx: DocCtx = { patient, clinic, staff, visits, radiology, visit, doctor: staff.find((s) => s.id === doctorId), me: user! };
      const doc = await createDocument({
        patientId: patient.id,
        visitId: visit?.id,
        type,
        date: todayStr(),
        title: t.title,
        data: t.prefill(ctx),
        doctorId,
        createdBy: user!.id,
      });
      setPickOpen(false);
      navigate('patient', patient.id, 'documents', doc.id);
    } finally {
      setBusy(false);
    }
  };

  const open = docs.find((d) => d.id === openId);
  const groups = useMemo(() => {
    const m = new Map<string, DocType[]>();
    DOC_TYPES.forEach((t) => m.set(t.group, [...(m.get(t.group) || []), t]));
    return [...m.entries()];
  }, []);

  return (
    <div className="space-y-4">
      <Card
        title="პაციენტის დოკუმენტები"
        actions={
          can('clinical') && (
            <Button variant="primary" size="sm" icon={<FilePlus2 className="w-3.5 h-3.5" />} onClick={() => setPickOpen(true)}>
              ახალი დოკუმენტი
            </Button>
          )
        }
        bodyClass="p-0"
      >
        {docs.length === 0 ? (
          <EmptyState icon={<FileText className="w-6 h-6" />} title="დოკუმენტები ჯერ არ არის" text="ფორმა 100, ინფორმირებული თანხმობები, მიმართვები და სხვ. იქმნება მხოლოდ ამ პაციენტის ბარათიდან და ავტომატურად ივსება მისი მონაცემებით." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-2 font-medium">№</th>
                  <th className="px-2 py-2 font-medium">დოკუმენტი</th>
                  <th className="px-2 py-2 font-medium">თარიღი</th>
                  <th className="px-2 py-2 font-medium">ექიმი</th>
                  <th className="px-4 py-2 font-medium">სტატუსი</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} onClick={() => navigate('patient', patient.id, 'documents', d.id)} className="border-b border-slate-50 hover:bg-teal-50/60 cursor-pointer">
                    <td className="px-4 py-2.5 font-mono text-xs">{d.number}</td>
                    <td className="px-2 py-2.5">
                      <span className="font-medium">{d.title}</span>
                      {docType(d.type)?.formCode && <span className="text-xs text-slate-500"> · {docType(d.type)!.formCode}</span>}
                      {d.type === 'consent' && d.data.kind && <span className="block text-xs text-slate-500">{d.data.kind}</span>}
                    </td>
                    <td className="px-2 py-2.5 text-xs">{fmtDate(d.date)}</td>
                    <td className="px-2 py-2.5 text-xs">{userName(staff.find((s) => s.id === d.doctorId))}</td>
                    <td className="px-4 py-2.5">{d.status === 'signed' ? <Badge color="green">დასრულებული</Badge> : <Badge color="amber">შავი ვერსია</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={pickOpen} onClose={() => setPickOpen(false)} title={`ახალი დოკუმენტი — ${patientName(patient)}`} size="lg">
        <div className="space-y-5">
          {groups.map(([g, list]) => (
            <div key={g}>
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">{g}</h4>
              <div className="grid sm:grid-cols-2 gap-2">
                {list.map((t) => (
                  <button key={t.id} disabled={busy} onClick={() => create(t.id)} className="text-left rounded-lg border border-slate-200 p-3 hover:border-teal-400 hover:bg-teal-50 disabled:opacity-50">
                    <p className="text-sm font-semibold">
                      {t.title} {t.formCode && <span className="text-teal-700 font-normal">· {t.formCode}</span>}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{t.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-slate-400">დოკუმენტი ავტომატურად შეივსება პაციენტის ბარათიდან (ბოლო ვიზიტი, დიაგნოზები, კვლევები). ყველა ველი რედაქტირებადია ხელმოწერამდე.</p>
        </div>
      </Modal>

      {open && (
        <DocumentEditor
          key={open.id}
          doc={open}
          ctx={{ patient, clinic, staff, visits, radiology, visit: visits.find((v) => v.id === open.visitId), doctor: staff.find((s) => s.id === open.doctorId), me: user! }}
          onClose={() => navigate('patient', patient.id, 'documents')}
        />
      )}
    </div>
  );
}

function DocumentEditor({ doc, ctx, onClose }: { doc: MedDocument; ctx: DocCtx; onClose: () => void }) {
  const t = docType(doc.type);
  const [d, setD] = useState<MedDocument>(doc);
  const [dirty, setDirty] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const { user, can } = useSession();
  const ui = useUi();
  const locked = d.status === 'signed';
  const readOnly = locked || !can('clinical');
  const doctors = ctx.staff.filter((s) => s.role === 'doctor' || s.role === 'admin');

  const save = async (next = d) => {
    const { id, ...rest } = next;
    await db.documents.update(id, { ...rest, updatedAt: nowIso() });
    setDirty(false);
  };

  useEffect(() => {
    if (!dirty || locked) return;
    const tm = setTimeout(() => save(), 1000);
    return () => clearTimeout(tm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, dirty]);

  if (!t) return null;

  const setField = (key: string, value: any) => {
    setD((s) => ({ ...s, data: t.onChange ? t.onChange(key, value, s.data) : { ...s.data, [key]: value } }));
    setDirty(true);
  };

  const finalize = async () => {
    const missing = t.fields.filter((f) => f.required && (Array.isArray(d.data[f.key]) ? !d.data[f.key].length : !String(d.data[f.key] ?? '').trim()));
    if (missing.length) return ui.toast(`შეავსეთ: ${missing.map((m) => m.label).join(', ')}`, 'err');
    const ok = await ui.confirm({ title: 'დოკუმენტის დასრულება', text: 'დასრულების შემდეგ დოკუმენტის რედაქტირება დაიბლოკება. დაბეჭდეთ და მოაწერინეთ ხელი პაციენტს.', okLabel: 'დასრულება' });
    if (!ok) return;
    const next = { ...d, status: 'signed' as const, signedAt: nowIso(), signedBy: user!.id };
    setD(next);
    await save(next);
    await audit('SIGN', 'Document', d.id, `დასრულდა „${d.title}“ №${d.number}`, d.patientId);
    ui.toast('დოკუმენტი დასრულებულია');
  };

  const unlock = async () => {
    const reason = await ui.prompt({ title: 'დოკუმენტის განბლოკვა', text: 'მიზეზი (ჩაიწერება აუდიტში):', okLabel: 'განბლოკვა' });
    if (!reason) return;
    const next = { ...d, status: 'draft' as const, signedAt: undefined, signedBy: undefined };
    setD(next);
    await save(next);
    await audit('UNSIGN', 'Document', d.id, `განიბლოკა „${d.title}“ №${d.number}. მიზეზი: ${reason}`, d.patientId);
  };

  const remove = async () => {
    const ok = await ui.confirm({ title: 'დოკუმენტის წაშლა', text: `წაიშალოს „${d.title}“ №${d.number}?`, danger: true, okLabel: 'წაშლა' });
    if (!ok) return;
    await db.documents.delete(d.id);
    await audit('DELETE', 'Document', d.id, `წაიშალა „${d.title}“ №${d.number}`, d.patientId);
    onClose();
  };

  const duplicate = async () => {
    const copy = await createDocument({ patientId: d.patientId, visitId: d.visitId, type: d.type, date: todayStr(), title: d.title, data: d.data, doctorId: d.doctorId, createdBy: user!.id });
    navigate('patient', d.patientId, 'documents', copy.id);
    ui.toast(`შეიქმნა ასლი №${copy.number}`);
  };

  const printCtx: DocCtx = { ...ctx, doctor: ctx.staff.find((s) => s.id === d.doctorId) };

  return (
    <Modal
      open
      onClose={() => (dirty && save(), onClose())}
      size="xl"
      title={
        <span className="flex flex-wrap items-center gap-2">
          {t.title} {t.formCode && <span className="text-teal-700 text-sm">({t.formCode})</span>} <span className="font-mono text-sm text-slate-500">№{d.number}</span>
          {locked ? (
            <Badge color="green">
              <Lock className="w-3 h-3" /> დასრულებული {fmtDateTime(d.signedAt)}
            </Badge>
          ) : (
            <Badge color="amber">შავი ვერსია{dirty ? ' · ინახება…' : ''}</Badge>
          )}
        </span>
      }
      footer={
        <>
          {!locked && can('clinical') && <Button variant="danger" icon={<Trash2 className="w-4 h-4" />} onClick={remove}>წაშლა</Button>}
          {locked && can('admin') && <Button variant="ghost" icon={<Unlock className="w-4 h-4" />} onClick={unlock}>განბლოკვა</Button>}
          <Button icon={<Copy className="w-4 h-4" />} onClick={duplicate} disabled={!can('clinical')}>
            ასლის შექმნა
          </Button>
          <Button icon={<Printer className="w-4 h-4" />} onClick={() => (dirty && save(), setPrintOpen(true))}>
            გადახედვა / ბეჭდვა
          </Button>
          {!locked && can('clinical') && (
            <Button variant="success" icon={<CheckCircle2 className="w-4 h-4" />} onClick={finalize}>
              დასრულება
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <b>პაციენტი:</b> {patientName(ctx.patient)} · პ/ნ {ctx.patient.idNumber || '—'} · ბარათი №{ctx.patient.cardNumber}
          <span className="block mt-0.5 text-slate-400">სამართლებრივი საფუძველი: {t.legal}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="დოკუმენტის თარიღი">
            <Input type="date" value={d.date} disabled={readOnly} onChange={(e) => (setD((s) => ({ ...s, date: e.target.value })), setDirty(true))} />
          </Field>
          <Field label="ექიმი" className="sm:col-span-2">
            <Select value={d.doctorId} disabled={readOnly} onChange={(e) => (setD((s) => ({ ...s, doctorId: e.target.value })), setDirty(true))}>
              {doctors.map((u) => (
                <option key={u.id} value={u.id}>
                  {userName(u)} {u.license ? `(სერტ. №${u.license})` : ''}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {t.fields.map((f) => (
            <div key={f.key} className={cls(f.full && 'sm:col-span-2')}>
              <DocField f={f} value={d.data[f.key]} onChange={(v) => setField(f.key, v)} disabled={readOnly} />
            </div>
          ))}
        </div>
      </div>
      <PrintPreview open={printOpen} onClose={() => setPrintOpen(false)} title={`${t.title} №${d.number} — ${patientName(ctx.patient)}`}>
        <t.Print doc={d} c={printCtx} />
      </PrintPreview>
    </Modal>
  );
}

function DocField({ f, value, onChange, disabled }: { f: FieldDef; value: any; onChange: (v: any) => void; disabled?: boolean }) {
  switch (f.kind) {
    case 'textarea':
      return <TemplateText label={f.label} category={f.category || 'general'} value={value || ''} onChange={onChange} disabled={disabled} rows={f.rows || 3} required={f.required} />;
    case 'diagnoses':
      return (
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-1">
            {f.label}
            {f.required && <span className="text-red-500"> *</span>}
          </p>
          <DiagnosisEditor value={value || []} onChange={onChange} disabled={disabled} />
        </div>
      );
    case 'select':
      return (
        <Field label={f.label} required={f.required}>
          <Select value={value || ''} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
            {f.options!.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </Select>
        </Field>
      );
    case 'date':
      return (
        <Field label={f.label} required={f.required}>
          <Input type="date" value={value || ''} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
        </Field>
      );
    case 'check':
      return (
        <label className="flex items-center gap-2 text-sm mt-5">
          <input type="checkbox" className="accent-teal-600" checked={!!value} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
          {f.label}
        </label>
      );
    case 'items':
      return <PlanItems value={value || []} onChange={onChange} disabled={disabled} label={f.label} />;
    default:
      return (
        <Field label={f.label} required={f.required} hint={f.hint}>
          <Input value={value || ''} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
        </Field>
      );
  }
}

type PlanItem = { stage: string; teeth: string; service: string; qty: number; price: number };

function PlanItems({ value, onChange, disabled, label }: { value: PlanItem[]; onChange: (v: PlanItem[]) => void; disabled?: boolean; label: string }) {
  const services = useLive(() => db.services.toArray(), [], [] as ServiceItem[]) as ServiceItem[];
  const set = (i: number, patch: Partial<PlanItem>) => onChange(value.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const sum = value.reduce((s, i) => s + (Number(i.qty) || 1) * (Number(i.price) || 0), 0);
  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 mb-1">{label}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[620px]">
          <thead>
            <tr className="text-xs text-slate-500 text-left">
              <th className="pr-2 py-1 w-28">ეტაპი</th>
              <th className="pr-2 py-1 w-20">კბილი</th>
              <th className="pr-2 py-1">მომსახურება</th>
              <th className="pr-2 py-1 w-16">რაოდ.</th>
              <th className="pr-2 py-1 w-24">ფასი</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {value.map((it, i) => (
              <tr key={i}>
                <td className="pr-2 py-1">
                  <Input className="py-1.5" value={it.stage} disabled={disabled} onChange={(e) => set(i, { stage: e.target.value })} />
                </td>
                <td className="pr-2 py-1">
                  <Input className="py-1.5" value={it.teeth} disabled={disabled} onChange={(e) => set(i, { teeth: e.target.value })} />
                </td>
                <td className="pr-2 py-1">
                  <Input
                    className="py-1.5"
                    list="plan-svc"
                    value={it.service}
                    disabled={disabled}
                    onChange={(e) => {
                      const s = services.find((x) => x.name === e.target.value);
                      set(i, { service: e.target.value, ...(s ? { price: s.price } : {}) });
                    }}
                  />
                </td>
                <td className="pr-2 py-1">
                  <Input className="py-1.5" type="number" min={1} value={it.qty} disabled={disabled} onChange={(e) => set(i, { qty: Number(e.target.value) || 1 })} />
                </td>
                <td className="pr-2 py-1">
                  <Input className="py-1.5" type="number" min={0} value={it.price} disabled={disabled} onChange={(e) => set(i, { price: Number(e.target.value) || 0 })} />
                </td>
                <td>
                  {!disabled && (
                    <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="p-1 text-slate-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <datalist id="plan-svc">
          {services.map((s) => (
            <option key={s.id} value={s.name} />
          ))}
        </datalist>
      </div>
      <div className="flex items-center justify-between mt-2">
        {!disabled ? (
          <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => onChange([...value, { stage: value[value.length - 1]?.stage || 'I ეტაპი', teeth: '', service: '', qty: 1, price: 0 }])}>
            პუნქტის დამატება
          </Button>
        ) : (
          <span />
        )}
        <span className="text-sm font-semibold">ჯამი: {money(sum)}</span>
      </div>
    </div>
  );
}
