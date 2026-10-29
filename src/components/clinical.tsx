import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookmarkPlus, ChevronDown, FileText, Plus, Sparkles, Trash2, Search } from 'lucide-react';
import { db, uid, useLive, audit } from '../lib/db';
import { ICD10, normalizeIcd, searchIcd } from '../data/icd10';
import { TEMPLATE_CATEGORIES } from '../data/defaults';
import type { Diagnosis, IcdEntry, Patient, Template } from '../lib/types';
import { Button, Field, Input, Select, Textarea, inputCls, useUi } from './ui';
import { cls, normalize, patientName, fmtDate } from '../lib/utils';

export function useIcdList(): IcdEntry[] {
  const custom = useLive(() => db.customIcd.toArray(), [], [] as IcdEntry[]) as IcdEntry[];
  return useMemo(() => {
    const map = new Map<string, IcdEntry>();
    ICD10.forEach((e) => map.set(e.code, e));
    custom.forEach((e) => map.set(e.code, { ...e, custom: true }));
    return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
  }, [custom]);
}

export function useTemplates(category: string): Template[] {
  return (useLive(() => db.templates.where('category').equals(category).toArray(), [category], [] as Template[]) as Template[]).sort((a, b) =>
    a.title.localeCompare(b.title, 'ka'),
  );
}

function useOutside(ref: React.RefObject<HTMLElement | null>, onOut: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onOut();
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [active, onOut, ref]);
}

/** ტექსტური ველი შაბლონების ჩასმით, შაბლონად შენახვით და AI-ით დახვეწით */
export function TemplateText({
  label,
  category,
  value,
  onChange,
  rows = 3,
  disabled,
  required,
  placeholder,
}: {
  label: string;
  category: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}) {
  const templates = useTemplates(category);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const ui = useUi();
  useOutside(ref, () => setOpen(false), open);

  const filtered = templates.filter((t) => !q || normalize(t.title + ' ' + t.text).includes(normalize(q)));

  const insert = (text: string) => {
    onChange(value?.trim() ? `${value.trimEnd()}\n${text}` : text);
    setOpen(false);
  };

  const saveAs = async () => {
    if (!value?.trim()) return ui.toast('ჯერ შეავსეთ ტექსტი', 'err');
    const title = await ui.prompt({ title: 'შაბლონის სახელი', text: `კატეგორია: ${TEMPLATE_CATEGORIES[category] || category}`, okLabel: 'შენახვა' });
    if (!title) return;
    await db.templates.add({ id: uid(), category, title, text: value.trim() });
    ui.toast('შაბლონი შენახულია');
  };

  const aiPolish = async () => {
    if (!value?.trim()) return ui.toast('ტექსტი ცარიელია', 'err');
    setAiBusy(true);
    try {
      const r = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value, field: label }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.text) throw new Error(j.error || 'AI სერვისი მიუწვდომელია');
      onChange(j.text);
      ui.toast('ტექსტი დაიხვეწა — გადაამოწმეთ', 'info');
    } catch (e: any) {
      ui.toast(e.message, 'err');
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-semibold text-slate-600">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </span>
        {!disabled && (
          <div className="flex items-center gap-0.5 no-print">
            <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 text-[11px] font-medium text-teal-700 hover:bg-teal-50 rounded px-1.5 py-0.5">
              <FileText className="w-3.5 h-3.5" /> შაბლონი{templates.length ? ` (${templates.length})` : ''} <ChevronDown className="w-3 h-3" />
            </button>
            <button type="button" onClick={saveAs} title="შაბლონად შენახვა" className="text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded p-1">
              <BookmarkPlus className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={aiPolish} disabled={aiBusy} title="AI-ით ტექსტის დახვეწა (იგზავნება მხოლოდ ამ ველის ტექსტი)" className="text-violet-600 hover:bg-violet-50 rounded p-1 disabled:opacity-40">
              <Sparkles className={cls('w-3.5 h-3.5', aiBusy && 'animate-pulse')} />
            </button>
          </div>
        )}
      </div>
      <Textarea rows={rows} value={value || ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={placeholder} />
      {open && (
        <div className="absolute right-0 top-7 z-30 w-[min(28rem,90vw)] rounded-lg border border-slate-200 bg-white shadow-xl">
          <div className="p-2 border-b border-slate-100">
            <Input autoFocus placeholder="შაბლონის ძებნა…" value={q} onChange={(e) => setQ(e.target.value)} className="py-1.5" />
          </div>
          <div className="max-h-72 overflow-y-auto">
            {filtered.length === 0 && <p className="p-3 text-xs text-slate-500">შაბლონი არ მოიძებნა. შეავსეთ ტექსტი და დააჭირეთ „შაბლონად შენახვას“.</p>}
            {filtered.map((t) => (
              <button key={t.id} type="button" onClick={() => insert(t.text)} className="block w-full text-left px-3 py-2 hover:bg-teal-50 border-b border-slate-50">
                <span className="block text-sm font-medium text-slate-800">{t.title}</span>
                <span className="block text-xs text-slate-500 line-clamp-2">{t.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** ICD-10 კოდის ველი: კოდის ან ტექსტის აკრეფისას ავტომატურად ავსებს დასახელებას */
export function IcdInput({ value, onPick, disabled, autoFocus }: { value?: string; onPick: (e: IcdEntry) => void; disabled?: boolean; autoFocus?: boolean }) {
  const list = useIcdList();
  const [q, setQ] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false), open);
  useEffect(() => setQ(value || ''), [value]);

  const results = useMemo(() => searchIcd(list, q, 40), [list, q]);

  const pick = (e: IcdEntry) => {
    onPick(e);
    setQ(e.code);
    setOpen(false);
  };

  const onBlur = () => {
    const exact = list.find((e) => e.code === normalizeIcd(q));
    if (exact && exact.code !== value) onPick(exact);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          className={cls(inputCls, 'pl-8 font-mono uppercase')}
          value={q}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder="K02.1 ან „კარიესი“"
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setHi(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHi((h) => Math.min(h + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHi((h) => Math.max(h - 1, 0));
            } else if (e.key === 'Enter' && results[hi]) {
              e.preventDefault();
              pick(results[hi]);
            } else if (e.key === 'Escape') setOpen(false);
          }}
        />
      </div>
      {open && !disabled && (
        <div className="absolute left-0 top-full mt-1 z-40 w-[min(34rem,92vw)] max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
          {results.length === 0 && <p className="p-3 text-xs text-slate-500">კოდი ვერ მოიძებნა. ახალი კოდის დამატება შესაძლებელია „პარამეტრები → ICD-10“-ში.</p>}
          {results.map((e, i) => (
            <button
              key={e.code}
              type="button"
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => pick(e)}
              className={cls('flex w-full gap-3 px-3 py-1.5 text-left text-sm', i === hi ? 'bg-teal-50' : 'hover:bg-slate-50')}
            >
              <span className={cls('font-mono font-semibold w-14 shrink-0', e.code.includes('.') ? 'text-teal-700' : 'text-slate-500')}>{e.code}</span>
              <span className={cls('text-slate-700', !e.code.includes('.') && 'font-semibold')}>{e.text}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const KIND_LABEL: Record<Diagnosis['kind'], string> = { main: 'ძირითადი', secondary: 'თანმხლები', complication: 'გართულება' };

export function DiagnosisEditor({ value, onChange, disabled }: { value: Diagnosis[]; onChange: (v: Diagnosis[]) => void; disabled?: boolean }) {
  const set = (i: number, patch: Partial<Diagnosis>) => onChange(value.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  return (
    <div className="space-y-2">
      {value.map((d, i) => (
        <div key={i} className="flex flex-wrap gap-2 items-start rounded-lg bg-slate-50 p-2">
          <div className="w-full sm:w-40 shrink-0">
            <IcdInput value={d.code} disabled={disabled} onPick={(e) => set(i, { code: e.code, text: e.text })} />
          </div>
          <div className="flex-1 min-w-[220px]">
            <Input value={d.text} disabled={disabled} onChange={(e) => set(i, { text: e.target.value })} placeholder="დიაგნოზის ტექსტი" />
          </div>
          <div className="w-24">
            <Input value={d.teeth || ''} disabled={disabled} onChange={(e) => set(i, { teeth: e.target.value })} placeholder="კბილი" title="კბილ(ებ)ი FDI: 36 ან 36, 37" />
          </div>
          <div className="w-32">
            <Select value={d.kind} disabled={disabled} onChange={(e) => set(i, { kind: e.target.value as Diagnosis['kind'] })}>
              {Object.entries(KIND_LABEL).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </Select>
          </div>
          {!disabled && (
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="p-2 text-slate-400 hover:text-red-600" title="წაშლა">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      {!disabled && (
        <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => onChange([...value, { code: '', text: '', kind: value.length ? 'secondary' : 'main' }])}>
          დიაგნოზის დამატება
        </Button>
      )}
    </div>
  );
}

export const diagnosisLine = (d: Diagnosis) => `${d.code ? d.code + ' — ' : ''}${d.text}${d.teeth ? ` (კბ. ${d.teeth})` : ''}`;

/** პაციენტის ძებნა (ჩაწერებისთვის) */
export function PatientPicker({ value, onChange }: { value?: string; onChange: (p: Patient | null) => void }) {
  const patients = useLive(() => db.patients.toArray(), [], [] as Patient[]) as Patient[];
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false), open);
  const selected = patients.find((p) => p.id === value);
  const res = patients
    .filter((p) => !p.archived)
    .filter((p) => {
      const s = normalize(q);
      return !s || normalize(`${p.lastName} ${p.firstName} ${p.idNumber} ${p.phone} ${p.cardNumber}`).includes(s);
    })
    .slice(0, 20);
  return (
    <div className="relative" ref={ref}>
      {selected ? (
        <div className="flex items-center justify-between rounded-lg border border-teal-300 bg-teal-50 px-3 py-2 text-sm">
          <span>
            <b>{patientName(selected)}</b> · {selected.idNumber || '—'} · ისტორია №{selected.cardNumber}
          </span>
          <button type="button" className="text-xs text-teal-700 underline" onClick={() => onChange(null)}>
            შეცვლა
          </button>
        </div>
      ) : (
        <Input placeholder="გვარი, სახელი, პირადი ნომერი, ტელეფონი…" value={q} onChange={(e) => (setQ(e.target.value), setOpen(true))} onFocus={() => setOpen(true)} />
      )}
      {open && !selected && (
        <div className="absolute z-40 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
          {res.length === 0 && <p className="p-3 text-xs text-slate-500">ვერ მოიძებნა</p>}
          {res.map((p) => (
            <button key={p.id} type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-teal-50" onClick={() => (onChange(p), setOpen(false), setQ(''))}>
              <b>{patientName(p)}</b> <span className="text-slate-500">· {p.idNumber || '—'} · {fmtDate(p.birthDate)} · {p.phone}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { Field };
export const logChange = audit;
