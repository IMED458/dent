import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, FilePlus2, Lock, MessageSquarePlus, Plus, Printer, Stethoscope, Trash2, Unlock, Wand2, FileText } from 'lucide-react';
import { db, useLive, nowIso, audit, uid, useClinic } from '../../lib/db';
import type { Patient, ProcedureItem, ServiceItem, Template, User, Visit } from '../../lib/types';
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Select, useUi } from '../../components/ui';
import { DiagnosisEditor, TemplateText, diagnosisLine, useTemplates } from '../../components/clinical';
import { useSession } from '../../lib/session';
import { newVisit } from '../../lib/records';
import { navigate } from '../../lib/router';
import { cls, fmtDate, fmtDateTime, money, patientName, userName } from '../../lib/utils';
import type { VisitTemplateBody } from '../../data/defaults';
import { PrintPreview } from '../../components/Print';
import { SheetHeader, Signatures } from '../../documents/common';

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

export function VisitsTab({ patient, openId }: { patient: Patient; openId?: string }) {
  const visits = (useLive(() => db.visits.where('patientId').equals(patient.id).toArray(), [patient.id], [] as Visit[]) as Visit[]).sort(
    (a, b) => b.visitNo - a.visitNo,
  );
  const staff = useStaff();
  const { user, can } = useSession();
  const ui = useUi();

  const create = async () => {
    const docId = user!.role === 'doctor' || user!.role === 'admin' ? user!.id : staff.find((s) => s.role === 'doctor' && s.active)?.id || user!.id;
    const v = await newVisit(patient.id, docId, user!.id);
    navigate('patient', patient.id, 'visits', v.id);
    ui.toast(`ვიზიტი №${v.visitNo} შეიქმნა`);
  };

  const selected = visits.find((v) => v.id === openId);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-4">
      <Card
        title="ვიზიტები"
        bodyClass="p-0"
        actions={
          can('clinical') && (
            <Button size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />} onClick={create}>
              ახალი
            </Button>
          )
        }
      >
        {visits.length === 0 && <p className="p-4 text-sm text-slate-500">ვიზიტები ჯერ არ არის.</p>}
        <ul className="divide-y divide-slate-100 max-h-64 xl:max-h-[75vh] overflow-y-auto">
          {visits.map((v) => (
            <li
              key={v.id}
              onClick={() => navigate('patient', patient.id, 'visits', v.id)}
              className={cls('px-4 py-3 cursor-pointer', v.id === openId ? 'bg-teal-50 border-l-2 border-teal-600' : 'hover:bg-slate-50')}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">ვიზიტი №{v.visitNo}</span>
                {v.status === 'signed' ? <Badge color="green">ხელმოწერილი</Badge> : <Badge color="amber">შავი ვერსია</Badge>}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {fmtDate(v.date)} {v.time} · {VISIT_TYPES[v.visitType]}
              </p>
              <p className="text-xs text-slate-500">{userName(staff.find((s) => s.id === v.doctorId))}</p>
              {v.diagnoses[0] && <p className="text-xs text-slate-700 mt-1 line-clamp-2">{diagnosisLine(v.diagnoses[0])}</p>}
            </li>
          ))}
        </ul>
      </Card>
      {selected ? (
        <VisitEditor key={selected.id} visit={selected} patient={patient} staff={staff} />
      ) : (
        <Card>
          <EmptyState
            icon={<Stethoscope className="w-6 h-6" />}
            title={visits.length ? 'აირჩიეთ ვიზიტი სიიდან' : 'დაიწყეთ პირველი ვიზიტი'}
            text="ყოველი ვიზიტი ინახება პაციენტის ერთიან სამედიცინო ბარათში და იღებს რიგით ნომერს."
            action={
              can('clinical') && (
                <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={create}>
                  ახალი ვიზიტი
                </Button>
              )
            }
          />
        </Card>
      )}
    </div>
  );
}

function VisitEditor({ visit, patient, staff }: { visit: Visit; patient: Patient; staff: User[] }) {
  const [v, setV] = useState<Visit>(visit);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [tplOpen, setTplOpen] = useState(false);
  const { user, can } = useSession();
  const ui = useUi();
  const locked = v.status === 'signed';
  const readOnly = locked || !can('clinical');
  const services = useLive(() => db.services.toArray(), [], [] as ServiceItem[]) as ServiceItem[];
  const latest = useRef(v);
  latest.current = v;

  // სხვა ფანჯრიდან განახლებისას (მაგ. ხელმოწერა) ვასინქრონებთ
  useEffect(() => {
    if (!dirty) setV(visit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visit.updatedAt, visit.status]);

  const persist = async () => {
    const cur = latest.current;
    setSaving(true);
    const { id, ...rest } = cur;
    await db.visits.update(id, { ...rest, updatedAt: nowIso() });
    setSaving(false);
    setDirty(false);
  };

  // ავტომატური შენახვა
  useEffect(() => {
    if (!dirty || locked) return;
    const t = setTimeout(persist, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, dirty]);

  useEffect(
    () => () => {
      // კომპონენტის დახურვისას შეუნახავს ვინახავთ
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
    const title = await ui.prompt({ title: 'ვიზიტის შაბლონის სახელი', text: 'შეინახება ჩივილები, ობიექტური სტატუსი, დიაგნოზები, მკურნალობა, რეკომენდაციები და მანიპულაციები (კბილის ნომრების გარეშე).', okLabel: 'შენახვა' });
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

  const sign = async () => {
    if (!v.diagnoses.some((d) => d.code && d.text)) return ui.toast('ხელმოწერამდე მიუთითეთ მინიმუმ ერთი დიაგნოზი ICD-10 კოდით', 'err');
    if (!v.complaints.trim() && !v.intraoralExam.trim()) return ui.toast('შეავსეთ ჩივილები ან ობიექტური სტატუსი', 'err');
    const ok = await ui.confirm({
      title: 'ვიზიტის ხელმოწერა',
      text: 'ხელმოწერის შემდეგ ჩანაწერის რედაქტირება შეუძლებელია — შესაძლებელი იქნება მხოლოდ დამატების (დანართის) გაკეთება. დაადასტურეთ.',
      okLabel: 'ხელმოწერა',
    });
    if (!ok) return;
    const signed = { ...v, status: 'signed' as const, signedAt: nowIso(), signedBy: user!.id, updatedAt: nowIso() };
    const { id, ...rest } = signed;
    await db.visits.update(id, rest);
    setV(signed);
    setDirty(false);
    await audit('SIGN', 'Visit', v.id, `ვიზიტი №${v.visitNo} ხელმოწერილია`, patient.id);
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
    const ok = await ui.confirm({ title: 'შავი ვერსიის წაშლა', text: `წაიშალოს ვიზიტი №${v.visitNo}?`, danger: true, okLabel: 'წაშლა' });
    if (!ok) return;
    await db.visits.delete(v.id);
    await audit('DELETE', 'Visit', v.id, `წაიშალა ვიზიტის შავი ვერსია №${v.visitNo}`, patient.id);
    navigate('patient', patient.id, 'visits');
  };

  const setProc = (i: number, patch: Partial<ProcedureItem>) =>
    set(
      'procedures',
      v.procedures.map((p, j) => (j === i ? { ...p, ...patch } : p)),
    );
  const total = v.procedures.reduce((s, p) => s + p.qty * p.price, 0);
  const doctors = staff.filter((s) => s.role === 'doctor' || s.role === 'admin');

  return (
    <div className="space-y-4 min-w-0">
      <Card
        title={
          <span className="flex items-center gap-2">
            ვიზიტი №{v.visitNo}
            {locked ? (
              <Badge color="green">
                <Lock className="w-3 h-3" /> ხელმოწერილი {fmtDateTime(v.signedAt)}
              </Badge>
            ) : (
              <Badge color="amber">შავი ვერსია {saving ? '· ინახება…' : dirty ? '· შეუნახავი' : '· შენახულია'}</Badge>
            )}
          </span>
        }
        actions={
          <>
            {!readOnly && (
              <Button size="sm" icon={<Wand2 className="w-3.5 h-3.5" />} onClick={() => setTplOpen(true)}>
                ვიზიტის შაბლონი
              </Button>
            )}
            <Button size="sm" icon={<Printer className="w-3.5 h-3.5" />} onClick={() => (dirty && persist(), setPrintOpen(true))}>
              ბეჭდვა
            </Button>
            <Button size="sm" icon={<FilePlus2 className="w-3.5 h-3.5" />} onClick={() => navigate('patient', patient.id, 'documents', `new:form100:${v.id}`)}>
              ფორმა 100
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
          <Field label="მკურნალი ექიმი">
            <Select value={v.doctorId} disabled={readOnly} onChange={(e) => set('doctorId', e.target.value)}>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {userName(d)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="ვიზიტის ტიპი">
            <Select value={v.visitType} disabled={readOnly} onChange={(e) => set('visitType', e.target.value as Visit['visitType'])}>
              {Object.entries(VISIT_TYPES).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      <Card title="სუბიექტური მონაცემები">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TemplateText label="ჩივილები" category="complaints" value={v.complaints} onChange={(x) => set('complaints', x)} disabled={readOnly} />
          <TemplateText label="დაავადების ანამნეზი" category="anamnesisMorbi" value={v.anamnesisMorbi} onChange={(x) => set('anamnesisMorbi', x)} disabled={readOnly} />
          <div className="md:col-span-2">
            <TemplateText
              label="სიცოცხლის ანამნეზი (თანმხლები დაავადებები, ალერგია, მედიკამენტები)"
              category="anamnesisVitae"
              value={v.anamnesisVitae}
              onChange={(x) => set('anamnesisVitae', x)}
              disabled={readOnly}
              rows={2}
              placeholder={[patient.allergies && `ალერგია: ${patient.allergies}`, patient.chronicDiseases && `დაავადებები: ${patient.chronicDiseases}`].filter(Boolean).join('. ')}
            />
          </div>
        </div>
      </Card>

      <Card title="ობიექტური მონაცემები">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TemplateText label="გარეგანი დათვალიერება" category="externalExam" value={v.externalExam} onChange={(x) => set('externalExam', x)} disabled={readOnly} />
          <TemplateText label="პირის ღრუს დათვალიერება / Status localis" category="intraoralExam" value={v.intraoralExam} onChange={(x) => set('intraoralExam', x)} disabled={readOnly} rows={4} />
          <Field label="თანკბილვა">
            <Input value={v.bite} disabled={readOnly} onChange={(e) => set('bite', e.target.value)} placeholder="ორთოგნათიული / ღრმა / ღია / პროგენია…" />
          </Field>
          <Field label="ჰიგიენის ინდექსი (OHI-S / PI)">
            <Input value={v.hygieneIndex} disabled={readOnly} onChange={(e) => set('hygieneIndex', e.target.value)} />
          </Field>
          <div className="md:col-span-2">
            <TemplateText label="დამატებითი კვლევები (რენტგენი, EOD, ლაბორატორიული)" category="extraExams" value={v.extraExams} onChange={(x) => set('extraExams', x)} disabled={readOnly} rows={2} />
          </div>
        </div>
      </Card>

      <Card title="დიაგნოზი (ICD-10)">
        <DiagnosisEditor value={v.diagnoses} onChange={(d) => set('diagnoses', d)} disabled={readOnly} />
      </Card>

      <Card title="მკურნალობა">
        <div className="space-y-4">
          <TemplateText label="ანესთეზია (პრეპარატი, დოზა, მეთოდი)" category="anesthesia" value={v.anesthesia} onChange={(x) => set('anesthesia', x)} disabled={readOnly} rows={2} />
          <TemplateText label="ჩატარებული მკურნალობა" category="treatment" value={v.treatment} onChange={(x) => set('treatment', x)} disabled={readOnly} rows={4} />

          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1">შესრულებული მანიპულაციები / მომსახურება</p>
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
                    {s.price} ₾
                  </option>
                ))}
              </datalist>
            </div>
          </div>
        </div>
      </Card>

      <Card title="რეკომენდაციები და შემდეგი ვიზიტი">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
          <TemplateText label="რეკომენდაციები" category="recommendations" value={v.recommendations} onChange={(x) => set('recommendations', x)} disabled={readOnly} rows={3} />
          <Field label="შემდეგი ვიზიტი">
            <Input type="date" value={v.nextVisit || ''} disabled={readOnly} onChange={(e) => set('nextVisit', e.target.value)} />
          </Field>
        </div>
        {!readOnly && (
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="ghost" icon={<FileText className="w-3.5 h-3.5" />} onClick={saveAsVisitTemplate}>
              ამ ვიზიტის შაბლონად შენახვა
            </Button>
          </div>
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
      <PrintPreview open={printOpen} onClose={() => setPrintOpen(false)} title={`ვიზიტი №${v.visitNo} — ${patientName(patient)}`}>
        <VisitSheet visit={v} patient={patient} staff={staff} />
      </PrintPreview>
    </div>
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

export function VisitSheet({ visit: v, patient, staff }: { visit: Visit; patient: Patient; staff: User[] }) {
  const clinic = useClinic();
  const doctor = staff.find((s) => s.id === v.doctorId);
  const total = v.procedures.reduce((s, p) => s + p.qty * p.price, 0);
  const block = (label: string, text?: string) =>
    text?.trim() ? (
      <>
        <p className="lbl" style={{ marginTop: 6 }}>
          {label}:
        </p>
        <div className="box">{text}</div>
      </>
    ) : null;
  return (
    <div className="print-sheet">
      <SheetHeader clinic={clinic} />
      <h1>ამბულატორიული ვიზიტის ჩანაწერი №{v.visitNo}</h1>
      <p style={{ textAlign: 'center' }} className="small">
        სამედიცინო ბარათი №{patient.cardNumber} · {fmtDate(v.date)} {v.time} · {VISIT_TYPES[v.visitType]} ვიზიტი
      </p>
      <table style={{ marginTop: 10 }}>
        <tbody>
          <tr>
            <td>
              <b>პაციენტი:</b> {patientName(patient)} {patient.fatherName && `(${patient.fatherName})`}
            </td>
            <td>
              <b>პ/ნ:</b> {patient.idNumber || '—'}
            </td>
            <td>
              <b>დაბ.:</b> {fmtDate(patient.birthDate)}
            </td>
          </tr>
          <tr>
            <td colSpan={3}>
              <b>ალერგია:</b> {patient.allergies || 'არ აღენიშნება'} {patient.riskFlags.length > 0 && <> · <b>რისკები:</b> {patient.riskFlags.join(', ')}</>}
            </td>
          </tr>
        </tbody>
      </table>
      {block('ჩივილები', v.complaints)}
      {block('დაავადების ანამნეზი', v.anamnesisMorbi)}
      {block('სიცოცხლის ანამნეზი', v.anamnesisVitae)}
      {block('გარეგანი დათვალიერება', v.externalExam)}
      {block('პირის ღრუს დათვალიერება (Status localis)', [v.intraoralExam, v.bite && `თანკბილვა: ${v.bite}`, v.hygieneIndex && `ჰიგიენის ინდექსი: ${v.hygieneIndex}`].filter(Boolean).join('\n'))}
      {block('დამატებითი კვლევები', v.extraExams)}
      <p className="lbl" style={{ marginTop: 6 }}>
        დიაგნოზი (ICD-10):
      </p>
      <div className="box">
        {v.diagnoses.length
          ? v.diagnoses.map((d, i) => (
              <div key={i}>
                {d.kind === 'main' ? 'ძირითადი' : d.kind === 'secondary' ? 'თანმხლები' : 'გართულება'}: {diagnosisLine(d)}
              </div>
            ))
          : '—'}
      </div>
      {block('ანესთეზია', v.anesthesia)}
      {block('ჩატარებული მკურნალობა', v.treatment)}
      {v.procedures.length > 0 && (
        <table style={{ marginTop: 6 }}>
          <thead>
            <tr>
              <th>კბილი</th>
              <th>მანიპულაცია</th>
              <th>რაოდ.</th>
              <th>ფასი</th>
              <th>ჯამი</th>
            </tr>
          </thead>
          <tbody>
            {v.procedures.map((p) => (
              <tr key={p.id}>
                <td>{p.teeth}</td>
                <td>{p.service}</td>
                <td>{p.qty}</td>
                <td>{money(p.price)}</td>
                <td>{money(p.qty * p.price)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} style={{ textAlign: 'right' }}>
                <b>სულ:</b>
              </td>
              <td>
                <b>{money(total)}</b>
              </td>
            </tr>
          </tbody>
        </table>
      )}
      {block('რეკომენდაციები', [v.recommendations, v.nextVisit && `შემდეგი ვიზიტი: ${fmtDate(v.nextVisit)}`].filter(Boolean).join('\n'))}
      {v.addenda?.map((a, i) => (
        <p key={i} className="small">
          <b>დანართი ({fmtDateTime(a.at)}, {userName(staff.find((s) => s.id === a.userId))}):</b> {a.text}
        </p>
      ))}
      <Signatures
        left={`მკურნალი ექიმი: ${userName(doctor)}${doctor?.license ? `, სერტ. №${doctor.license}` : ''}`}
        right={v.status === 'signed' ? `ელექტრონულად ხელმოწერილია ${fmtDateTime(v.signedAt)}` : 'ხელმოწერა'}
      />
    </div>
  );
}
