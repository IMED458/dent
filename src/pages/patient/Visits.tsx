import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FilePlus2,
  FileText,
  FolderCheck,
  FolderOpen,
  Lock,
  MessageSquarePlus,
  Plus,
  Printer,
  Stethoscope,
  Trash2,
  Unlock,
  Wand2,
} from 'lucide-react';
import { db, useLive, nowIso, audit, uid, useClinic } from '../../lib/db';
import type { MedDocument, Patient, ProcedureItem, ServiceItem, Template, User, Visit } from '../../lib/types';
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Select, Textarea, useUi } from '../../components/ui';
import { DiagnosisEditor, TemplateText, diagnosisLine, useTemplates } from '../../components/clinical';
import { useSession } from '../../lib/session';
import { newVisit } from '../../lib/records';
import { navigate } from '../../lib/router';
import { ageOf, cls, fmtDate, fmtDateTime, money, patientName, userName } from '../../lib/utils';
import type { VisitTemplateBody } from '../../data/defaults';
import { COMPLAINT_FLAGS, EXAM_PLAN, LEGAL, PERIO_FLAGS, PLAQUE_FLAGS, SURGICAL_HINTS } from '../../data/forms220';
import { PrintPreview } from '../../components/Print';
import { SheetHeader } from '../../documents/common';
import { OdontogramChart } from './Odontogram';
import type { OdontogramSnapshot } from '../../lib/types';

export const VISIT_TYPES: Record<Visit['visitType'], string> = {
  first: 'პირველადი',
  repeat: 'განმეორებითი',
  urgent: 'გადაუდებელი',
  consult: 'კონსულტაცია',
  control: 'საკონტროლო',
};

export function useStaff() {
  return useLive(() => db.users.toArray(), [], [] as User[]) as User[];
}

export type CaseGroup = { initial: Visit; followups: Visit[] };

/** ვიზიტების დაჯგუფება შემთხვევებად (ფორმა №IV-220-1/ა) */
export function groupCases(visits: Visit[]): CaseGroup[] {
  const map = new Map<string, CaseGroup>();
  [...visits]
    .sort((a, b) => a.visitNo - b.visitNo)
    .forEach((v) => {
      const key = v.caseId || v.id;
      if (v.kind !== 'followup' || !map.has(key)) map.set(key, { initial: map.get(key)?.initial || v, followups: map.get(key)?.followups || [] });
      if (v.kind === 'followup') map.get(key)!.followups.push(v);
    });
  return [...map.values()].sort((a, b) => b.initial.caseNo - a.initial.caseNo);
}

const defaultDoctor = (user: User, staff: User[]) =>
  user.role === 'doctor' || user.role === 'admin' ? user.id : staff.find((s) => s.role === 'doctor' && s.active)?.id || user.id;

/** წერილობითი ინფორმირებული თანხმობის საჭიროება (პაციენტის უფლებების კანონი, მუხ. 22) */
export function consentRequirement(patient: Patient, visits: Visit[]): 'required' | 'recommended' {
  const age = ageOf(patient.birthDate) ?? 99;
  const surgical = visits.some((v) =>
    [v.treatment, ...v.procedures.map((p) => p.service)].some((t) => SURGICAL_HINTS.some((h) => (t || '').toLowerCase().includes(h))),
  );
  return age < 18 || surgical ? 'required' : 'recommended';
}

export function VisitsTab({ patient, openId }: { patient: Patient; openId?: string }) {
  const visits = useLive(() => db.visits.where('patientId').equals(patient.id).toArray(), [patient.id], [] as Visit[]) as Visit[];
  const cases = useMemo(() => groupCases(visits), [visits]);
  const staff = useStaff();
  const { user, can } = useSession();
  const ui = useUi();

  const createCase = async () => {
    const v = await newVisit(patient.id, defaultDoctor(user!, staff), user!.id);
    navigate('patient', patient.id, 'visits', v.id);
    ui.toast(`გაიხსნა შემთხვევა №${v.caseNo} — ფორმა №IV-220-1/ა`);
  };

  const addFollowup = async (c: CaseGroup) => {
    const last = c.followups[c.followups.length - 1] || c.initial;
    const v = await newVisit(patient.id, last.doctorId || defaultDoctor(user!, staff), user!.id, last);
    navigate('patient', patient.id, 'visits', v.id);
    ui.toast(`შემთხვევა №${v.caseNo} — განმეორებითი ვიზიტი №${v.visitNo}`);
  };

  const selected = visits.find((v) => v.id === openId);
  const selectedCase = selected ? cases.find((c) => c.initial.id === (selected.caseId || selected.id)) : undefined;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[290px_1fr] gap-4">
      <Card
        title="გასინჯვის ფურცლები"
        bodyClass="p-0"
        actions={
          can('clinical') && (
            <Button size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />} onClick={createCase}>
              ახალი შემთხვევა
            </Button>
          )
        }
      >
        <p className="px-4 pt-2 pb-1 text-[11px] text-slate-500">ფორმა №IV-220-1/ა ივსება ყოველ ახალ შემთხვევაზე; განმეორებითი ვიზიტები იწერება იმავე ფურცელზე.</p>
        {cases.length === 0 && <p className="p-4 text-sm text-slate-500">შემთხვევები ჯერ არ არის.</p>}
        <div className="max-h-72 xl:max-h-[75vh] overflow-y-auto divide-y divide-slate-100">
          {cases.map((c) => (
            <div key={c.initial.id} className="py-1">
              <button
                onClick={() => navigate('patient', patient.id, 'visits', c.initial.id)}
                className={cls('w-full text-left px-4 py-2', c.initial.id === openId ? 'bg-teal-50 border-l-2 border-teal-600' : 'hover:bg-slate-50')}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold flex items-center gap-1.5">
                    {c.initial.caseClosed ? <FolderCheck className="w-4 h-4 text-slate-400" /> : <FolderOpen className="w-4 h-4 text-teal-600" />}
                    შემთხვევა №{c.initial.caseNo}
                  </span>
                  {c.initial.caseClosed ? <Badge>დახურული</Badge> : <Badge color="teal">მიმდინარე</Badge>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {fmtDate(c.initial.date)} · ვიზიტი №{c.initial.visitNo} {c.initial.status === 'draft' && <span className="text-amber-700">· შავი</span>}
                </p>
                {c.initial.diagnoses[0] && <p className="text-xs text-slate-700 mt-0.5 line-clamp-2">{diagnosisLine(c.initial.diagnoses[0])}</p>}
              </button>
              {c.followups.map((f) => (
                <button
                  key={f.id}
                  onClick={() => navigate('patient', patient.id, 'visits', f.id)}
                  className={cls('w-full text-left pl-10 pr-4 py-1.5 text-xs', f.id === openId ? 'bg-teal-50 border-l-2 border-teal-600' : 'hover:bg-slate-50')}
                >
                  ↳ ვიზიტი №{f.visitNo} · {fmtDate(f.date)} {f.status === 'draft' ? <span className="text-amber-700">· შავი</span> : <span className="text-emerald-700">· ✓</span>}
                </button>
              ))}
              {!c.initial.caseClosed && can('clinical') && (
                <button onClick={() => addFollowup(c)} className="ml-10 mb-1 text-[11px] font-medium text-teal-700 hover:underline">
                  + განმეორებითი ვიზიტი
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>
      {selected && selectedCase ? (
        <VisitEditor key={selected.id} visit={selected} caseGroup={selectedCase} patient={patient} staff={staff} onAddFollowup={() => addFollowup(selectedCase)} />
      ) : (
        <Card>
          <EmptyState
            icon={<Stethoscope className="w-6 h-6" />}
            title={cases.length ? 'აირჩიეთ შემთხვევა ან ვიზიტი სიიდან' : 'გახსენით პირველი შემთხვევა'}
            text="ყოველი ახალი შემთხვევისთვის ივსება პაციენტის გასინჯვის ფურცელი (ფორმა №IV-220-1/ა). ყველა ვიზიტი ერთიანდება პაციენტის სამედიცინო ბარათში (ფორმა №IV-220/ა) და აისახება რეგისტრაციის ჟურნალში (ფორმა №IV-220-3/ა)."
            action={
              can('clinical') && (
                <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={createCase}>
                  ახალი შემთხვევა
                </Button>
              )
            }
          />
        </Card>
      )}
    </div>
  );
}

function FlagGroup({ options, value, onChange, disabled, cols = 2 }: { options: string[]; value: string[]; onChange: (v: string[]) => void; disabled?: boolean; cols?: number }) {
  return (
    <div className={cls('grid gap-x-4 gap-y-1', cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
      {options.map((o) => (
        <label key={o} className={cls('flex items-start gap-2 text-sm', disabled ? 'opacity-80' : 'cursor-pointer')}>
          <input
            type="checkbox"
            className="mt-0.5 accent-teal-600"
            disabled={disabled}
            checked={value.includes(o)}
            onChange={(e) => onChange(e.target.checked ? [...value, o] : value.filter((x) => x !== o))}
          />
          {o}
        </label>
      ))}
    </div>
  );
}

function VisitEditor({ visit, caseGroup, patient, staff, onAddFollowup }: { visit: Visit; caseGroup: CaseGroup; patient: Patient; staff: User[]; onAddFollowup: () => void }) {
  const [v, setV] = useState<Visit>(visit);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const { user, can } = useSession();
  const ui = useUi();
  const isInitial = v.kind !== 'followup';
  const locked = v.status === 'signed';
  const readOnly = locked || !can('clinical');
  const services = useLive(() => db.services.toArray(), [], [] as ServiceItem[]) as ServiceItem[];
  const caseIds = [caseGroup.initial.id, ...caseGroup.followups.map((f) => f.id)];
  const consents = (useLive(() => db.documents.where('patientId').equals(patient.id).toArray(), [patient.id], [] as MedDocument[]) as MedDocument[]).filter(
    (d) => d.type === 'consent' && (caseIds.includes(d.visitId || '') || d.date >= caseGroup.initial.date),
  );
  const latest = useRef(v);
  latest.current = v;

  useEffect(() => {
    if (!dirty) setV(visit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visit.updatedAt, visit.status, visit.caseClosed]);

  const persist = async () => {
    const cur = latest.current;
    setSaving(true);
    const { id, ...rest } = cur;
    await db.visits.update(id, { ...rest, updatedAt: nowIso() });
    setSaving(false);
    setDirty(false);
  };

  useEffect(() => {
    if (!dirty || locked) return;
    const t = setTimeout(persist, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, dirty]);

  useEffect(
    () => () => {
      if (latest.current.status === 'draft') {
        const { id, ...rest } = latest.current;
        db.visits.get(id).then((dbv) => dbv && dbv.status === 'draft' && db.visits.update(id, { ...rest }));
      }
    },
    [],
  );

  const set = <K extends keyof Visit>(k: K, val: Visit[K]) => {
    setV((s) => ({ ...s, [k]: val }));
    setDirty(true);
  };

  const applyTemplate = (t: Template) => {
    let body: VisitTemplateBody;
    try {
      body = JSON.parse(t.text);
    } catch {
      return ui.toast('შაბლონი დაზიანებულია', 'err');
    }
    const join = (a: string, b?: string) => (b ? (a?.trim() ? `${a.trimEnd()}\n${b}` : b) : a);
    setV((s) => ({
      ...s,
      complaints: join(s.complaints, body.complaints),
      anamnesisMorbi: join(s.anamnesisMorbi, body.anamnesisMorbi),
      intraoralExam: join(s.intraoralExam, body.intraoralExam),
      anesthesia: join(s.anesthesia, body.anesthesia),
      treatment: join(s.treatment, body.treatment),
      recommendations: join(s.recommendations, body.recommendations),
      diagnoses: [...s.diagnoses, ...(body.diagnoses || []).filter((d) => !s.diagnoses.some((x) => x.code === d.code))],
      procedures: [
        ...s.procedures,
        ...(body.procedures || []).map((p) => {
          const svc = services.find((x) => x.name === p.service);
          return { id: uid(), teeth: '', service: p.service, qty: 1, price: p.price || svc?.price || 0 };
        }),
      ],
    }));
    setDirty(true);
    setTplOpen(false);
    ui.toast(`გამოყენებულია შაბლონი „${t.title}“`, 'info');
  };

  const saveAsVisitTemplate = async () => {
    const title = await ui.prompt({ title: 'ვიზიტის შაბლონის სახელი', text: 'შეინახება ჩივილები, ობიექტური სტატუსი, დიაგნოზები, მკურნალობა, დანიშნულება და მანიპულაციები (კბილის ნომრების გარეშე).', okLabel: 'შენახვა' });
    if (!title) return;
    const body: VisitTemplateBody = {
      complaints: v.complaints,
      anamnesisMorbi: v.anamnesisMorbi,
      intraoralExam: v.intraoralExam,
      diagnoses: v.diagnoses.map(({ code, text, kind }) => ({ code, text, kind })),
      anesthesia: v.anesthesia,
      treatment: v.treatment,
      recommendations: v.recommendations,
      procedures: v.procedures.map((p) => ({ service: p.service, price: p.price })),
    };
    await db.templates.add({ id: uid(), category: 'visit', title, text: JSON.stringify(body) });
    ui.toast('ვიზიტის შაბლონი შენახულია');
  };

  const requirement = consentRequirement(patient, [...caseGroup.followups, caseGroup.initial].map((x) => (x.id === v.id ? v : x)));

  const sign = async () => {
    if (!v.diagnoses.some((d) => d.code && d.text)) return ui.toast('მიუთითეთ დიაგნოზი ICD-10 კოდით (ბრძანება №01-55/ნ, მუხ. 3.2)', 'err');
    if (isInitial && !v.complaintFlags.length && !v.complaints.trim() && !v.complaintsOther.trim()) return ui.toast('შეავსეთ ჩივილები (მომართვის მიზეზი)', 'err');
    if (!isInitial && !v.complaints.trim() && !v.treatment.trim()) return ui.toast('შეავსეთ ანამნეზი/სტატუსი ან ჩატარებული მკურნალობა', 'err');
    if (!consents.length && requirement === 'required') {
      const go = await ui.confirm({
        title: 'წერილობითი ინფორმირებული თანხმობა არ არის',
        text: 'ამ შემთხვევისთვის (არასრულწლოვანი პაციენტი ან ქირურგიული ჩარევა) კანონით სავალდებულოა წერილობითი ინფორმირებული თანხმობა — ფორმა №IV-220-2/ა, რომელიც ივსება მომსახურების გაწევამდე („პაციენტის უფლებების შესახებ“ კანონი, მუხ. 22). მაინც გავაგრძელო ხელმოწერა?',
        danger: true,
        okLabel: 'მაინც ხელმოწერა',
      });
      if (!go) return;
    }
    const ok = await ui.confirm({
      title: 'ვიზიტის ხელმოწერა',
      text: 'ხელმოწერის შემდეგ ჩანაწერის რედაქტირება შეუძლებელია — შესაძლებელი იქნება მხოლოდ დანართის დამატება. დაადასტურეთ.',
      okLabel: 'ხელმოწერა',
    });
    if (!ok) return;
    const signed = { ...v, status: 'signed' as const, signedAt: nowIso(), signedBy: user!.id, updatedAt: nowIso() };
    const { id, ...rest } = signed;
    await db.visits.update(id, rest);
    setV(signed);
    setDirty(false);
    await audit('SIGN', 'Visit', v.id, `შემთხვევა №${v.caseNo}, ვიზიტი №${v.visitNo} ხელმოწერილია`, patient.id);
    ui.toast('ვიზიტი ხელმოწერილია');
  };

  const unlock = async () => {
    const reason = await ui.prompt({ title: 'ხელმოწერის გაუქმება', text: 'მიუთითეთ მიზეზი (ჩაიწერება აუდიტის ჟურნალში):', okLabel: 'გაუქმება' });
    if (!reason) return;
    await db.visits.update(v.id, { status: 'draft', signedAt: undefined, signedBy: undefined, updatedAt: nowIso() });
    setV((s) => ({ ...s, status: 'draft', signedAt: undefined, signedBy: undefined }));
    await audit('UNSIGN', 'Visit', v.id, `ვიზიტი №${v.visitNo} — ხელმოწერა გაუქმდა. მიზეზი: ${reason}`, patient.id);
  };

  const addAddendum = async () => {
    const text = await ui.prompt({ title: 'დანართი / შესწორება', text: 'დანართი დაემატება ხელმოწერილ ჩანაწერს თარიღითა და ავტორით.', okLabel: 'დამატება' });
    if (!text) return;
    const addenda = [...(v.addenda || []), { at: nowIso(), userId: user!.id, text }];
    await db.visits.update(v.id, { addenda, updatedAt: nowIso() });
    setV((s) => ({ ...s, addenda }));
    await audit('ADDENDUM', 'Visit', v.id, `ვიზიტი №${v.visitNo} — დანართი: ${text.slice(0, 80)}`, patient.id);
  };

  const remove = async () => {
    if (isInitial && caseGroup.followups.length) return ui.toast('შემთხვევას აქვს განმეორებითი ვიზიტები — ჯერ ისინი წაშალეთ', 'err');
    const ok = await ui.confirm({ title: 'შავი ვერსიის წაშლა', text: `წაიშალოს ვიზიტი №${v.visitNo}?`, danger: true, okLabel: 'წაშლა' });
    if (!ok) return;
    await db.visits.delete(v.id);
    await audit('DELETE', 'Visit', v.id, `წაიშალა ვიზიტის შავი ვერსია №${v.visitNo} (ჟურნალის №${v.journalNo})`, patient.id);
    navigate('patient', patient.id, 'visits');
  };

  const reopenCase = async () => {
    const reason = await ui.prompt({ title: 'შემთხვევის ხელახლა გახსნა', text: 'მიზეზი (ჩაიწერება აუდიტში):', okLabel: 'გახსნა' });
    if (!reason) return;
    await db.visits.update(caseGroup.initial.id, { caseClosed: false, caseClosedAt: undefined, updatedAt: nowIso() });
    await audit('UPDATE', 'Case', caseGroup.initial.id, `შემთხვევა №${v.caseNo} ხელახლა გაიხსნა. მიზეზი: ${reason}`, patient.id);
  };

  const setProc = (i: number, patch: Partial<ProcedureItem>) =>
    set(
      'procedures',
      v.procedures.map((p, j) => (j === i ? { ...p, ...patch } : p)),
    );
  const total = v.procedures.reduce((s, p) => s + p.qty * p.price, 0);
  const doctors = staff.filter((s) => s.role === 'doctor' || s.role === 'admin');
  const caseClosed = !!caseGroup.initial.caseClosed;

  return (
    <div className="space-y-4 min-w-0">
      <Card
        title={
          <span className="flex flex-wrap items-center gap-2">
            {isInitial ? `შემთხვევა №${v.caseNo} — პირველადი ვიზიტი №${v.visitNo}` : `შემთხვევა №${v.caseNo} — განმეორებითი ვიზიტი №${v.visitNo}`}
            <span className="text-xs font-normal text-slate-500">ჟურნალის № {v.journalNo}</span>
            {locked ? (
              <Badge color="green">
                <Lock className="w-3 h-3" /> ხელმოწერილი {fmtDateTime(v.signedAt)}
              </Badge>
            ) : (
              <Badge color="amber">შავი ვერსია {saving ? '· ინახება…' : dirty ? '· შეუნახავი' : '· შენახულია'}</Badge>
            )}
            {caseClosed && <Badge>შემთხვევა დახურულია</Badge>}
          </span>
        }
        actions={
          <>
            {!readOnly && (
              <Button size="sm" icon={<Wand2 className="w-3.5 h-3.5" />} onClick={() => setTplOpen(true)}>
                შაბლონი
              </Button>
            )}
            <Button size="sm" icon={<Printer className="w-3.5 h-3.5" />} onClick={() => (dirty && persist(), setPrintOpen(true))}>
              IV-220-1/ა ბეჭდვა
            </Button>
            <Button size="sm" icon={<FilePlus2 className="w-3.5 h-3.5" />} onClick={() => navigate('patient', patient.id, 'documents', `new:form100:${v.id}`)}>
              IV-100/ა
            </Button>
            {!locked && can('sign') && (
              <Button size="sm" variant="success" icon={<CheckCircle2 className="w-3.5 h-3.5" />} onClick={sign}>
                ხელმოწერა
              </Button>
            )}
            {locked && can('clinical') && (
              <Button size="sm" icon={<MessageSquarePlus className="w-3.5 h-3.5" />} onClick={addAddendum}>
                დანართი
              </Button>
            )}
            {locked && can('admin') && <Button size="sm" variant="ghost" icon={<Unlock className="w-3.5 h-3.5" />} onClick={unlock} title="ხელმოწერის გაუქმება" />}
            {!locked && can('clinical') && <Button size="sm" variant="ghost" className="text-red-600" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={remove} title="წაშლა" />}
          </>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="თარიღი">
            <Input type="date" value={v.date} disabled={readOnly} onChange={(e) => set('date', e.target.value)} />
          </Field>
          <Field label="დრო">
            <Input type="time" value={v.time} disabled={readOnly} onChange={(e) => set('time', e.target.value)} />
          </Field>
          <Field label="მკურნალი ექიმი" className="col-span-2">
            <Select value={v.doctorId} disabled={readOnly} onChange={(e) => set('doctorId', e.target.value)}>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {userName(d)} {d.specialty ? `— ${d.specialty}` : ''}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {!consents.length && (
          <div className={cls('mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm', requirement === 'required' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-amber-50 text-amber-900 border border-amber-200')}>
            <span className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                {requirement === 'required'
                  ? 'სავალდებულოა წერილობითი ინფორმირებული თანხმობა (ფორმა №IV-220-2/ა) მომსახურების გაწევამდე — არასრულწლოვანი პაციენტი ან ქირურგიული ჩარევა (პაციენტის უფლებების კანონი, მუხ. 22.2.ა, 22.3).'
                  : 'ამ შემთხვევაზე წერილობითი ინფორმირებული თანხმობა (ფორმა №IV-220-2/ა) ჯერ არ არის შედგენილი.'}
              </span>
            </span>
            <Button size="sm" icon={<FileText className="w-3.5 h-3.5" />} onClick={() => navigate('patient', patient.id, 'documents', `new:consent:${v.id}`)}>
              თანხმობის შედგენა
            </Button>
          </div>
        )}
      </Card>

      {isInitial ? (
        <>
          <Card title="ჩივილები (მომართვის მიზეზი)">
            <div className="space-y-3">
              <Field label="დაავადებული კბილ(ებ)ი">
                <Input value={v.complaintTeeth} disabled={readOnly} onChange={(e) => set('complaintTeeth', e.target.value)} placeholder="მაგ.: 36, 37" />
              </Field>
              <FlagGroup options={COMPLAINT_FLAGS} value={v.complaintFlags} onChange={(x) => set('complaintFlags', x)} disabled={readOnly} />
              <Field label="სხვა">
                <Input value={v.complaintsOther} disabled={readOnly} onChange={(e) => set('complaintsOther', e.target.value)} />
              </Field>
              <TemplateText label="ჩივილების დეტალური აღწერა" category="complaints" value={v.complaints} onChange={(x) => set('complaints', x)} disabled={readOnly} rows={2} />
            </div>
          </Card>

          <Card title="ანამნეზი">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TemplateText label="ანამნეზი (დაავადების)" category="anamnesisMorbi" value={v.anamnesisMorbi} onChange={(x) => set('anamnesisMorbi', x)} disabled={readOnly} />
              <TemplateText
                label="სიცოცხლის ანამნეზი, ალერგია, თანმხლები დაავადებები"
                category="anamnesisVitae"
                value={v.anamnesisVitae}
                onChange={(x) => set('anamnesisVitae', x)}
                disabled={readOnly}
                placeholder={[patient.allergies && `ალერგია: ${patient.allergies}`, patient.chronicDiseases && `დაავადებები: ${patient.chronicDiseases}`].filter(Boolean).join('. ')}
              />
            </div>
          </Card>

          <Card title="ობიექტური გამოკვლევები">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TemplateText label="სახის დათვალიერება" category="externalExam" value={v.externalExam} onChange={(x) => set('externalExam', x)} disabled={readOnly} rows={2} />
                <TemplateText label="პირის ღრუს დათვალიერება (კბილთა ფორმულა — ოდონტოგრამა)" category="intraoralExam" value={v.intraoralExam} onChange={(x) => set('intraoralExam', x)} disabled={readOnly} rows={3} />
                <Field label="თანკბილვა">
                  <Input value={v.bite} disabled={readOnly} onChange={(e) => set('bite', e.target.value)} placeholder="ორთოგნათიული / ღრმა / ღია / პროგენია…" />
                </Field>
                <Field label="პირის ღრუს ლორწოვანი გარსის მდგომარეობა">
                  <Input value={v.mucosa} disabled={readOnly} onChange={(e) => set('mucosa', e.target.value)} placeholder="ფიზიოლოგიური ფერის, ტენიანი…" />
                </Field>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4 rounded-lg bg-slate-50 p-3">
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">პაროდონტის მდგომარეობა</p>
                  <FlagGroup options={PERIO_FLAGS} value={v.perioFlags} onChange={(x) => set('perioFlags', x)} disabled={readOnly} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">ნადები</p>
                  <FlagGroup options={PLAQUE_FLAGS} value={v.plaqueFlags} onChange={(x) => set('plaqueFlags', x)} disabled={readOnly} cols={1} />
                </div>
                <Field label="პაროდონტული ჯიბის სიღრმე">
                  <Input value={v.pocketDepth} disabled={readOnly} onChange={(e) => set('pocketDepth', e.target.value)} placeholder="მმ / კბილები" />
                </Field>
                <Field label="სხვა">
                  <Input value={v.perioOther} disabled={readOnly} onChange={(e) => set('perioOther', e.target.value)} />
                </Field>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">გამოკვლევის გეგმა</p>
                <FlagGroup options={EXAM_PLAN} value={v.examPlan} onChange={(x) => set('examPlan', x)} disabled={readOnly} cols={3} />
                <Field label="სხვა" className="mt-2">
                  <Input value={v.examPlanOther} disabled={readOnly} onChange={(e) => set('examPlanOther', e.target.value)} />
                </Field>
              </div>
              <TemplateText label="კონსულტაცია / გამოკვლევის შედეგი" category="extraExams" value={v.extraExams} onChange={(x) => set('extraExams', x)} disabled={readOnly} rows={3} />
            </div>
          </Card>
        </>
      ) : (
        <Card title="ანამნეზი, სტატუსი">
          <TemplateText label="ანამნეზი, სტატუსი (განმეორებითი ვიზიტი)" category="intraoralExam" value={v.complaints} onChange={(x) => set('complaints', x)} disabled={readOnly} rows={4} />
        </Card>
      )}

      <Card title={isInitial ? 'საბოლოო დიაგნოზი (ICD-10)' : 'დიაგნოზი (ICD-10)'}>
        <DiagnosisEditor value={v.diagnoses} onChange={(d) => set('diagnoses', d)} disabled={readOnly} />
        <p className="text-[11px] text-slate-400 mt-2">დიაგნოზის ფორმულირება შეესაბამება ICD-10-ის კლინიკურ ვარიანტს (ბრძანება №01-55/ნ, მუხ. 3.2).</p>
      </Card>

      <Card title={isInitial ? 'მკურნალობა' : 'ჩატარებული მკურნალობა'}>
        <div className="space-y-4">
          <TemplateText label="ანესთეზია (პრეპარატი, დოზა, მეთოდი)" category="anesthesia" value={v.anesthesia} onChange={(x) => set('anesthesia', x)} disabled={readOnly} rows={2} />
          <TemplateText label="მკურნალობა" category="treatment" value={v.treatment} onChange={(x) => set('treatment', x)} disabled={readOnly} rows={4} />
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1">სამედიცინო ჩარევები / პროცედურები (კოდები ეთითება ჩანაწერის ბოლოს — მუხ. 3.3)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="text-xs text-slate-500 text-left">
                    <th className="py-1 pr-2 w-24">კბილი</th>
                    <th className="py-1 pr-2">მომსახურება</th>
                    <th className="py-1 pr-2 w-16">რაოდ.</th>
                    <th className="py-1 pr-2 w-24">ფასი ₾</th>
                    <th className="py-1 pr-2 w-24 text-right">ჯამი</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {v.procedures.map((p, i) => (
                    <tr key={p.id}>
                      <td className="py-1 pr-2">
                        <Input value={p.teeth} disabled={readOnly} onChange={(e) => setProc(i, { teeth: e.target.value })} className="py-1.5" />
                      </td>
                      <td className="py-1 pr-2">
                        <Input
                          list="svc-list"
                          value={p.service}
                          disabled={readOnly}
                          className="py-1.5"
                          onChange={(e) => {
                            const svc = services.find((s) => s.name === e.target.value);
                            setProc(i, { service: e.target.value, ...(svc && !p.price ? { price: svc.price } : {}) });
                          }}
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <Input type="number" min={1} value={p.qty} disabled={readOnly} onChange={(e) => setProc(i, { qty: Math.max(1, Number(e.target.value) || 1) })} className="py-1.5" />
                      </td>
                      <td className="py-1 pr-2">
                        <Input type="number" min={0} step="0.01" value={p.price} disabled={readOnly} onChange={(e) => setProc(i, { price: Number(e.target.value) || 0 })} className="py-1.5" />
                      </td>
                      <td className="py-1 pr-2 text-right font-medium whitespace-nowrap">{money(p.qty * p.price)}</td>
                      <td>
                        {!readOnly && (
                          <button onClick={() => set('procedures', v.procedures.filter((_, j) => j !== i))} className="p-1 text-slate-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="pt-2">
                      {!readOnly && (
                        <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => set('procedures', [...v.procedures, { id: uid(), teeth: '', service: '', qty: 1, price: 0 }])}>
                          მანიპულაციის დამატება
                        </Button>
                      )}
                    </td>
                    <td className="pt-2 text-right font-semibold whitespace-nowrap">{money(total)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
              <datalist id="svc-list">
                {services.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.code} · {s.price} ₾
                  </option>
                ))}
              </datalist>
            </div>
          </div>
        </div>
      </Card>

      <Card title={isInitial ? 'რჩევა-დარიგება / დანიშნულება' : 'დანიშნულება'}>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4">
          <TemplateText label={isInitial ? 'რჩევა-დარიგება / დანიშნულება' : 'დანიშნულება'} category="recommendations" value={v.recommendations} onChange={(x) => set('recommendations', x)} disabled={readOnly} rows={3} />
          <div className="space-y-3">
            <Field label="ელექტრონული რეცეპტის №" hint="რეცეპტის გაცემის შემთხვევაში (ბრძანება №01-16/ნ, 2022)">
              <Input value={v.prescriptionNo} disabled={readOnly} onChange={(e) => set('prescriptionNo', e.target.value)} />
            </Field>
            <Field label="მომდევნო ვიზიტი">
              <Input type="date" value={v.nextVisit || ''} disabled={readOnly} onChange={(e) => set('nextVisit', e.target.value)} />
            </Field>
          </div>
        </div>
        {!readOnly && (
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="ghost" icon={<FileText className="w-3.5 h-3.5" />} onClick={saveAsVisitTemplate}>
              ამ ვიზიტის შაბლონად შენახვა
            </Button>
          </div>
        )}
      </Card>

      <Card
        title="მკურნალობის შედეგი (ეპიკრიზი) — შემთხვევის დახურვა"
        actions={
          can('clinical') &&
          (caseClosed ? (
            can('admin') && (
              <Button size="sm" variant="ghost" onClick={reopenCase}>
                ხელახლა გახსნა
              </Button>
            )
          ) : (
            <>
              <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={onAddFollowup}>
                განმეორებითი ვიზიტი
              </Button>
              <Button size="sm" variant="primary" icon={<FolderCheck className="w-3.5 h-3.5" />} onClick={() => setCloseOpen(true)}>
                შემთხვევის დახურვა
              </Button>
            </>
          ))
        }
      >
        {caseClosed ? (
          <div className="text-sm">
            <p className="text-xs text-slate-500 mb-1">დახურულია {fmtDateTime(caseGroup.initial.caseClosedAt)}</p>
            <p className="whitespace-pre-wrap">{caseGroup.initial.outcome}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">შემთხვევა მიმდინარეა. მკურნალობის დასრულებისას დახურეთ შემთხვევა და შეავსეთ ეპიკრიზი.</p>
        )}
      </Card>

      {v.addenda?.length > 0 && (
        <Card title="დანართები">
          <ul className="space-y-2">
            {v.addenda.map((a, i) => (
              <li key={i} className="rounded-lg bg-slate-50 p-3 text-sm">
                <p className="text-xs text-slate-500 mb-1">
                  {fmtDateTime(a.at)} · {userName(staff.find((s) => s.id === a.userId))}
                </p>
                <p className="whitespace-pre-wrap">{a.text}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <VisitTemplatePicker open={tplOpen} onClose={() => setTplOpen(false)} onPick={applyTemplate} />
      {closeOpen && <CloseCaseModal caseGroup={caseGroup} patientId={patient.id} onClose={() => setCloseOpen(false)} />}
      <PrintPreview open={printOpen} onClose={() => setPrintOpen(false)} title={`ფორმა №IV-220-1/ა — შემთხვევა №${v.caseNo} — ${patientName(patient)}`}>
        <CaseSheet caseGroup={{ initial: isInitial ? v : caseGroup.initial, followups: caseGroup.followups.map((f) => (f.id === v.id ? v : f)) }} patient={patient} staff={staff} />
      </PrintPreview>
    </div>
  );
}

function CloseCaseModal({ caseGroup, patientId, onClose }: { caseGroup: CaseGroup; patientId: string; onClose: () => void }) {
  const ui = useUi();
  const all = [caseGroup.initial, ...caseGroup.followups];
  const [outcome, setOutcome] = useState(caseGroup.initial.outcome || '');
  const unsigned = all.filter((x) => x.status !== 'signed');
  const save = async () => {
    if (!outcome.trim()) return ui.toast('შეავსეთ მკურნალობის შედეგი (ეპიკრიზი)', 'err');
    if (unsigned.length) return ui.toast(`ჯერ ხელი მოაწერეთ ვიზიტებს: ${unsigned.map((x) => '№' + x.visitNo).join(', ')}`, 'err');
    await db.visits.update(caseGroup.initial.id, { outcome: outcome.trim(), caseClosed: true, caseClosedAt: nowIso(), updatedAt: nowIso() });
    await audit('UPDATE', 'Case', caseGroup.initial.id, `შემთხვევა №${caseGroup.initial.caseNo} დაიხურა`, patientId);
    ui.toast('შემთხვევა დაიხურა');
    onClose();
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={`შემთხვევა №${caseGroup.initial.caseNo} — დახურვა`}
      footer={
        <>
          <Button onClick={onClose}>გაუქმება</Button>
          <Button variant="primary" onClick={save}>
            დახურვა
          </Button>
        </>
      }
    >
      <Field label="მკურნალობის შედეგი (ეპიკრიზი)" required>
        <Textarea rows={6} value={outcome} onChange={(e) => setOutcome(e.target.value)} autoFocus />
      </Field>
    </Modal>
  );
}

function VisitTemplatePicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (t: Template) => void }) {
  const list = useTemplates('visit');
  return (
    <Modal open={open} onClose={onClose} title="ვიზიტის შაბლონის არჩევა" size="md">
      {list.length === 0 && <p className="text-sm text-slate-500">შაბლონები არ არის.</p>}
      <div className="grid sm:grid-cols-2 gap-2">
        {list.map((t) => {
          let body: VisitTemplateBody = {};
          try {
            body = JSON.parse(t.text);
          } catch {}
          return (
            <button key={t.id} onClick={() => onPick(t)} className="text-left rounded-lg border border-slate-200 p-3 hover:border-teal-400 hover:bg-teal-50">
              <p className="text-sm font-semibold">{t.title}</p>
              <p className="text-xs text-slate-500 mt-1">{(body.diagnoses || []).map((d) => d.code).join(', ')}</p>
              <p className="text-xs text-slate-500 line-clamp-2">{body.treatment}</p>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-400 mt-3">შაბლონის შიგთავსი ემატება არსებულ ტექსტს და არ შლის მას.</p>
    </Modal>
  );
}

const box = (checked: boolean) => (checked ? '☑' : '☐');

const procLine = (v: Visit, codes: Map<string, string>) =>
  v.procedures.length
    ? '\nჩარევები/პროცედურები: ' +
      v.procedures.map((p) => `${p.service}${p.teeth ? ` (კბ. ${p.teeth})` : ''}${p.qty > 1 ? ` ×${p.qty}` : ''}${codes.get(p.service) ? ` [${codes.get(p.service)}]` : ''}`).join('; ')
    : '';

/** ფორმა №IV-220-1/ა „პაციენტის გასინჯვის ფურცელი“ — ბრძანება №01-55/ნ, დანართი №2 */
export function CaseSheet({ caseGroup, patient, staff }: { caseGroup: CaseGroup; patient: Patient; staff: User[] }) {
  const clinic = useClinic();
  const services = useLive(() => db.services.toArray(), [], [] as ServiceItem[]) as ServiceItem[];
  const codes = useMemo(() => new Map(services.filter((s) => s.code).map((s) => [s.name, s.code])), [services]);
  const lastDate = caseGroup.followups[caseGroup.followups.length - 1]?.date || caseGroup.initial.date;
  const snaps = (useLive(() => db.odontograms.where('patientId').equals(patient.id).toArray(), [patient.id], [] as OdontogramSnapshot[]) as OdontogramSnapshot[]).sort(
    (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
  );
  // კბილთა ფორმულა — შემთხვევის ბოლო ვიზიტამდე შენახული უახლესი ოდონტოგრამა
  const odo = snaps.find((o) => o.date <= lastDate) || snaps[snaps.length - 1];
  const v = caseGroup.initial;
  const doc = (id: string) => {
    const u = staff.find((s) => s.id === id);
    return u ? `${userName(u)}${u.license ? `, სერტ. №${u.license}` : ''}` : '';
  };
  const flags = (opts: string[], val: string[]) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16 }} className="small">
      {opts.map((o) => (
        <div key={o}>
          {box(val.includes(o))} {o}
        </div>
      ))}
    </div>
  );
  const finalDx = v.diagnoses.map(diagnosisLine).join('\n');
  return (
    <div className="print-sheet">
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: 4 }} className="small">
        <div>
          <b>{clinic.legalName || clinic.name}</b>
          <div>სტომატოლოგიური მომსახურების მიმწოდებელი პირის/დაწესებულების დასახელება</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <b>ფორმა №IV-220-1/ა</b>
          <div>
            ბარათი №{patient.cardNumber} · შემთხვევა №{v.caseNo}
          </div>
        </div>
      </div>
      <h1>პაციენტის გასინჯვის ფურცელი</h1>
      <p className="small" style={{ textAlign: 'center' }}>
        {patientName(patient)} · დაბ. {fmtDate(patient.birthDate)}
      </p>
      <div className="row">
        <span className="lbl">თარიღი</span>
        <span className="val">{fmtDate(v.date)}</span>
      </div>
      <h2>ჩივილები (მომართვის მიზეზი):</h2>
      <div className="row">
        <span className="lbl">დაავადებული კბილ(ებ)ი</span>
        <span className="val">{v.complaintTeeth}</span>
      </div>
      {flags(COMPLAINT_FLAGS, v.complaintFlags || [])}
      <div className="row">
        <span className="lbl">სხვა</span>
        <span className="val">{[v.complaintsOther, v.complaints].filter(Boolean).join('. ')}</span>
      </div>
      <h2>ანამნეზი</h2>
      <div className="box">{[v.anamnesisMorbi, v.anamnesisVitae].filter(Boolean).join('\n') || ' '}</div>
      <h2>ობიექტური გამოკვლევები</h2>
      <p className="lbl">პირის ღრუს დათვალიერება:</p>
      {odo && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
          <OdontogramChart teeth={odo.teeth} dentition={odo.dentition} small />
        </div>
      )}
      <div className="box">{[v.externalExam && `სახე: ${v.externalExam}`, v.intraoralExam].filter(Boolean).join('\n') || ' '}</div>
      <div className="row">
        <span className="lbl">თანკბილვა</span>
        <span className="val">{v.bite}</span>
      </div>
      <div className="row">
        <span className="lbl">პირის ღრუს ლორწოვანი გარსის მდგომარეობა:</span>
        <span className="val">{v.mucosa}</span>
      </div>
      <p className="lbl" style={{ marginTop: 6 }}>
        პაროდონტის მდგომარეობა
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', columnGap: 16 }} className="small">
        <div>
          {PERIO_FLAGS.map((o) => (
            <div key={o}>
              {box((v.perioFlags || []).includes(o))} {o}
            </div>
          ))}
        </div>
        <div>
          <b>ნადები:</b>
          {PLAQUE_FLAGS.map((o) => (
            <div key={o}>
              {box((v.plaqueFlags || []).includes(o))} {o}
            </div>
          ))}
        </div>
      </div>
      <div className="row">
        <span className="lbl">პაროდონტული ჯიბის სიღრმე</span>
        <span className="val">{v.pocketDepth}</span>
      </div>
      <div className="row">
        <span className="lbl">სხვა</span>
        <span className="val">{[v.perioOther, v.hygieneIndex && `ჰიგიენის ინდექსი: ${v.hygieneIndex}`].filter(Boolean).join('; ')}</span>
      </div>
      <p className="lbl" style={{ marginTop: 6 }}>
        გამოკვლევის გეგმა:
      </p>
      {flags(EXAM_PLAN, v.examPlan || [])}
      <div className="row">
        <span className="lbl">სხვა</span>
        <span className="val">{v.examPlanOther}</span>
      </div>
      <p className="lbl" style={{ marginTop: 6 }}>
        კონსულტაცია/გამოკვლევის შედეგი:
      </p>
      <div className="box">{v.extraExams || ' '}</div>
      <p className="lbl">საბოლოო დიაგნოზი (ICD-10)</p>
      <div className="box">{finalDx || ' '}</div>
      <p className="lbl">მკურნალობა</p>
      <div className="box">{[v.anesthesia && `ანესთეზია: ${v.anesthesia}`, v.treatment].filter(Boolean).join('\n') + procLine(v, codes) || ' '}</div>
      <p className="small">
        ექიმი: {doc(v.doctorId)} {v.status === 'signed' ? `· ხელმოწერილია ელექტრონულად ${fmtDateTime(v.signedAt)}` : '· ხელმოწერა ____________'}
      </p>

      <h2>მომდევნო ვიზიტი:</h2>
      <table>
        <thead>
          <tr>
            <th style={{ width: '14%' }}>თარიღი</th>
            <th>ანამნეზი, სტატუსი, დიაგნოზი, ჩატარებული მკურნალობა, დანიშნულება</th>
            <th style={{ width: '22%' }}>მკურნალი ექიმი</th>
          </tr>
        </thead>
        <tbody>
          {caseGroup.followups.map((f) => (
            <tr key={f.id}>
              <td>{fmtDate(f.date)}</td>
              <td style={{ whiteSpace: 'pre-wrap' }}>
                {[
                  f.complaints,
                  f.diagnoses.length ? `დიაგნოზი: ${f.diagnoses.map(diagnosisLine).join('; ')}` : '',
                  [f.anesthesia && `ანესთეზია: ${f.anesthesia}`, f.treatment].filter(Boolean).join('. ') + procLine(f, codes),
                  f.recommendations && `დანიშნულება: ${f.recommendations}`,
                  f.prescriptionNo && `ელ. რეცეპტი №${f.prescriptionNo}`,
                ]
                  .filter(Boolean)
                  .join('\n')}
              </td>
              <td>
                {doc(f.doctorId)}
                {f.status === 'signed' && <div className="small">✓ {fmtDateTime(f.signedAt)}</div>}
              </td>
            </tr>
          ))}
          {caseGroup.followups.length === 0 && (
            <tr>
              <td style={{ height: 40 }}>&nbsp;</td>
              <td></td>
              <td></td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="lbl" style={{ marginTop: 8 }}>
        მკურნალობის შედეგი (ეპიკრიზი)
      </p>
      <div className="box">{v.outcome || ' '}</div>
      <p className="lbl">რჩევა-დარიგება/დანიშნულება</p>
      <div className="box">
        {[v.recommendations, v.prescriptionNo && `გაცემულია ელექტრონული რეცეპტი №${v.prescriptionNo}`, v.nextVisit && `მომდევნო ვიზიტი: ${fmtDate(v.nextVisit)}`].filter(Boolean).join('\n') ||
          ' '}
      </div>
      {[v, ...caseGroup.followups].flatMap((x) => x.addenda || []).map((a, i) => (
        <p key={i} className="small">
          <b>დანართი ({fmtDateTime(a.at)}, {userName(staff.find((s) => s.id === a.userId))}):</b> {a.text}
        </p>
      ))}
      <p className="small" style={{ marginTop: 10, color: '#444' }}>
        {LEGAL.order0155}. ჩანაწერი წარმოებულია ელექტრონული საშუალებით (მუხ. 1.2).
      </p>
    </div>
  );
}

export { SheetHeader };
