import React, { useState } from 'react';
import { Stethoscope, Upload, KeyRound } from 'lucide-react';
import { db, uid, nowIso, setKV, importBackup, DEFAULT_CLINIC, useClinic } from '../lib/db';
import { seedDefaults } from '../lib/records';
import { loadDemoData } from '../data/demo';
import { hashPin, cls, userName } from '../lib/utils';
import { useSession } from '../lib/session';
import { ROLE_LABELS, type User } from '../lib/types';
import { Button, Field, Input, useUi } from '../components/ui';

export function Setup() {
  const ui = useUi();
  const [f, setF] = useState({ clinic: '', first: '', last: '', license: '', pin: '', pin2: '', demo: true });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: any) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.clinic.trim() || !f.first.trim() || !f.last.trim()) return ui.toast('შეავსეთ სავალდებულო ველები', 'err');
    if (!/^\d{4,8}$/.test(f.pin)) return ui.toast('PIN უნდა იყოს 4–8 ციფრი', 'err');
    if (f.pin !== f.pin2) return ui.toast('PIN კოდები არ ემთხვევა', 'err');
    setBusy(true);
    try {
      await setKV('clinic', { ...DEFAULT_CLINIC, name: f.clinic.trim(), medicalDirector: `${f.first} ${f.last}` });
      await seedDefaults();
      const id = uid();
      const admin: User = {
        id,
        firstName: f.first.trim(),
        lastName: f.last.trim(),
        role: 'admin',
        specialty: 'ექიმი-სტომატოლოგი',
        license: f.license.trim(),
        pinHash: await hashPin(f.pin, id),
        active: true,
        createdAt: nowIso(),
      };
      await db.users.add(admin);
      if (f.demo) await loadDemoData(admin.id);
      ui.toast('სისტემა მზადაა. შედით თქვენი PIN-ით.');
    } catch (err: any) {
      ui.toast(err.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  const restore = async (file?: File) => {
    if (!file) return;
    try {
      await importBackup(file);
      ui.toast('სარეზერვო ასლი აღდგენილია');
    } catch (e: any) {
      ui.toast(e.message, 'err');
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center p-4 bg-gradient-to-br from-teal-50 to-slate-100">
      <form onSubmit={submit} className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-600 flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">პირველადი გამართვა</h1>
            <p className="text-sm text-slate-500">კლინიკისა და ადმინისტრატორის რეგისტრაცია</p>
          </div>
        </div>
        <Field label="კლინიკის დასახელება" required>
          <Input value={f.clinic} onChange={(e) => set('clinic', e.target.value)} placeholder="შპს „...“ სტომატოლოგიური კლინიკა" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="სახელი" required>
            <Input value={f.first} onChange={(e) => set('first', e.target.value)} />
          </Field>
          <Field label="გვარი" required>
            <Input value={f.last} onChange={(e) => set('last', e.target.value)} />
          </Field>
        </div>
        <Field label="სახელმწიფო სერტიფიკატის / რეგისტრაციის №" hint="დაიბეჭდება ექიმის ხელმოწერასთან">
          <Input value={f.license} onChange={(e) => set('license', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="PIN კოდი (4–8 ციფრი)" required>
            <Input type="password" inputMode="numeric" value={f.pin} onChange={(e) => set('pin', e.target.value.replace(/\D/g, ''))} />
          </Field>
          <Field label="გაიმეორეთ PIN" required>
            <Input type="password" inputMode="numeric" value={f.pin2} onChange={(e) => set('pin2', e.target.value.replace(/\D/g, ''))} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.demo} onChange={(e) => set('demo', e.target.checked)} className="accent-teal-600" />
          სადემონსტრაციო პაციენტების ჩატვირთვა (შემდეგ შეგიძლიათ წაშალოთ)
        </label>
        <Button type="submit" variant="primary" className="w-full" loading={busy}>
          დაწყება
        </Button>
        <label className="flex items-center justify-center gap-2 text-xs text-slate-500 cursor-pointer hover:text-teal-700">
          <Upload className="w-3.5 h-3.5" /> ან აღადგინეთ სარეზერვო ასლიდან (.json)
          <input type="file" accept="application/json,.json" className="hidden" onChange={(e) => restore(e.target.files?.[0])} />
        </label>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          მონაცემები ინახება ამ ბრაუზერის დაცულ ლოკალურ ბაზაში (IndexedDB). რეგულარულად შექმენით სარეზერვო ასლი: „პარამეტრები → მონაცემები“.
        </p>
      </form>
    </div>
  );
}

export function Login() {
  const { users, login } = useSession();
  const clinic = useClinic();
  const ui = useUi();
  const active = users.filter((u) => u.active);
  const [sel, setSel] = useState<string>(active.length === 1 ? active[0].id : '');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = active.find((x) => x.id === sel);
    if (!u) return ui.toast('აირჩიეთ მომხმარებელი', 'err');
    setBusy(true);
    const ok = (await hashPin(pin, u.id)) === u.pinHash;
    setBusy(false);
    if (!ok) {
      setPin('');
      return ui.toast('PIN არასწორია', 'err');
    }
    login(u);
  };

  return (
    <div className="min-h-full flex items-center justify-center p-4 bg-gradient-to-br from-teal-50 to-slate-100">
      <form onSubmit={submit} className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-4">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg font-semibold">{clinic.name}</h1>
          <p className="text-sm text-slate-500">სისტემაში შესვლა</p>
        </div>
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {active.map((u) => (
            <button
              type="button"
              key={u.id}
              onClick={() => setSel(u.id)}
              className={cls('w-full text-left rounded-lg border px-3 py-2', sel === u.id ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:bg-slate-50')}
            >
              <span className="block text-sm font-medium">{userName(u)}</span>
              <span className="block text-xs text-slate-500">{ROLE_LABELS[u.role]}</span>
            </button>
          ))}
        </div>
        <Field label="PIN კოდი">
          <Input autoFocus type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
        </Field>
        <Button type="submit" variant="primary" className="w-full" loading={busy} disabled={!sel || pin.length < 4}>
          შესვლა
        </Button>
        <p className="text-[11px] text-slate-400 text-center">PIN-ის დავიწყების შემთხვევაში ადმინისტრატორი ცვლის მას „პარამეტრები → თანამშრომლები“-ში.</p>
      </form>
    </div>
  );
}
