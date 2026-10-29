import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { db, useLive, uid } from '../lib/db';
import type { Diagnosis, Template } from '../lib/types';
import { TEMPLATE_CATEGORIES, type VisitTemplateBody } from '../data/defaults';
import { Button, Card, Field, Input, Modal, Select, Textarea, useUi } from '../components/ui';
import { DiagnosisEditor } from '../components/clinical';
import { cls, normalize } from '../lib/utils';

export function TemplatesPage() {
  const all = useLive(() => db.templates.toArray(), [], [] as Template[]) as Template[];
  const [cat, setCat] = useState('complaints');
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<Template | null>(null);
  const ui = useUi();
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    all.forEach((t) => (m[t.category] = (m[t.category] || 0) + 1));
    return m;
  }, [all]);
  const list = all.filter((t) => t.category === cat && (!q || normalize(t.title + t.text).includes(normalize(q)))).sort((a, b) => a.title.localeCompare(b.title, 'ka'));

  const remove = async (t: Template) => {
    if (!(await ui.confirm({ title: 'შაბლონის წაშლა', text: t.title, danger: true, okLabel: 'წაშლა' }))) return;
    await db.templates.delete(t.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">შაბლონები</h1>
          <p className="text-sm text-slate-500">სწრაფი ტექსტები ვიზიტებისა და დოკუმენტების ველებისთვის. ნებისმიერ ველთან „შაბლონი“ ღილაკით ჩასვამთ, ხოლო „შენახვის“ ხატულით ახალს დაამატებთ.</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setEdit({ id: '', category: cat, title: '', text: cat === 'visit' ? '{}' : '' })}>
          ახალი შაბლონი
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        <Card bodyClass="p-2">
          {Object.entries(TEMPLATE_CATEGORIES).map(([k, l]) => (
            <button key={k} onClick={() => setCat(k)} className={cls('w-full flex justify-between rounded-lg px-3 py-2 text-sm text-left', cat === k ? 'bg-teal-50 text-teal-800 font-medium' : 'hover:bg-slate-50')}>
              <span>{l}</span>
              <span className="text-xs text-slate-400">{counts[k] || 0}</span>
            </button>
          ))}
        </Card>
        <Card title={TEMPLATE_CATEGORIES[cat]} actions={<Input placeholder="ძებნა…" value={q} onChange={(e) => setQ(e.target.value)} className="py-1.5 w-48" />}>
          {list.length === 0 && <p className="text-sm text-slate-500">ამ კატეგორიაში შაბლონები არ არის.</p>}
          <div className="space-y-2">
            {list.map((t) => (
              <div key={t.id} className="rounded-lg border border-slate-200 p-3 flex gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{t.title}</p>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap line-clamp-3">{cat === 'visit' ? visitSummary(t.text) : t.text}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEdit(t)} className="p-1.5 text-slate-500 hover:text-teal-700">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(t)} className="p-1.5 text-slate-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {edit && <TemplateModal t={edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

function visitSummary(text: string) {
  try {
    const b: VisitTemplateBody = JSON.parse(text);
    return [(b.diagnoses || []).map((d) => `${d.code} ${d.text}`).join('; '), b.treatment].filter(Boolean).join('\n');
  } catch {
    return text;
  }
}

function TemplateModal({ t, onClose }: { t: Template; onClose: () => void }) {
  const ui = useUi();
  const [title, setTitle] = useState(t.title);
  const [category, setCategory] = useState(t.category);
  const [text, setText] = useState(t.text);
  const [body, setBody] = useState<VisitTemplateBody>(() => {
    try {
      return t.category === 'visit' ? JSON.parse(t.text || '{}') : {};
    } catch {
      return {};
    }
  });
  const isVisit = category === 'visit';

  const save = async () => {
    if (!title.trim()) return ui.toast('მიუთითეთ სახელი', 'err');
    const finalText = isVisit ? JSON.stringify(body) : text.trim();
    if (!isVisit && !finalText) return ui.toast('ტექსტი ცარიელია', 'err');
    await db.templates.put({ id: t.id || uid(), category, title: title.trim(), text: finalText, builtIn: t.builtIn });
    ui.toast('შაბლონი შენახულია');
    onClose();
  };

  const bf = (k: keyof VisitTemplateBody, label: string) => (
    <Field label={label}>
      <Textarea rows={2} value={(body[k] as string) || ''} onChange={(e) => setBody({ ...body, [k]: e.target.value })} />
    </Field>
  );

  return (
    <Modal
      open
      onClose={onClose}
      size={isVisit ? 'lg' : 'md'}
      title={t.id ? 'შაბლონის რედაქტირება' : 'ახალი შაბლონი'}
      footer={
        <>
          <Button onClick={onClose}>გაუქმება</Button>
          <Button variant="primary" onClick={save}>
            შენახვა
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="სახელი" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </Field>
          <Field label="კატეგორია (ველი)">
            <Select value={category} onChange={(e) => setCategory(e.target.value)} disabled={!!t.id && t.category === 'visit'}>
              {Object.entries(TEMPLATE_CATEGORIES).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {isVisit ? (
          <>
            {bf('complaints', 'ჩივილები')}
            {bf('anamnesisMorbi', 'დაავადების ანამნეზი')}
            {bf('intraoralExam', 'ობიექტური სტატუსი')}
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1">დიაგნოზები</p>
              <DiagnosisEditor value={(body.diagnoses as Diagnosis[]) || []} onChange={(d) => setBody({ ...body, diagnoses: d.map(({ code, text, kind }) => ({ code, text, kind })) })} />
            </div>
            {bf('anesthesia', 'ანესთეზია')}
            {bf('treatment', 'მკურნალობა')}
            {bf('recommendations', 'რეკომენდაციები')}
          </>
        ) : (
          <Field label="ტექსტი" hint="„___“ — ადგილი, რომელიც ექიმმა უნდა შეავსოს (მაგ. კბილის ნომერი)">
            <Textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
        )}
      </div>
    </Modal>
  );
}
