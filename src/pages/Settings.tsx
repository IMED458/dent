import React, { useEffect, useState } from 'react';
import { Download, HardDrive, KeyRound, Plus, Trash2, Upload, UserPlus, Pencil } from 'lucide-react';
import { db, useLive, uid, nowIso, setKV, useClinic, exportBackup, importBackup, audit } from '../lib/db';
import { ROLE_LABELS, type AuditEntry, type ClinicSettings, type IcdEntry, type Role, type ServiceItem, type User } from '../lib/types';
import { Badge, Button, Card, Field, Input, Modal, Select, Tabs, Textarea, useUi } from '../components/ui';
import { useSession } from '../lib/session';
import { useIcdList } from '../components/clinical';
import { normalizeIcd } from '../data/icd10';
import { cls, downloadBlob, fmtDateTime, hashPin, money, normalize, readAsDataUrl, round2, todayStr, userName } from '../lib/utils';
import { useRoute } from '../lib/router';

type Tab = 'clinic' | 'staff' | 'services' | 'icd' | 'data' | 'audit';

export function SettingsPage() {
  const { can } = useSession();
  const route = useRoute();
  const [tab, setTab] = useState<Tab>(can('admin') ? ((['clinic', 'staff', 'services', 'icd', 'data', 'audit'].includes(route[1]) ? route[1] : 'clinic') as Tab) : 'data');
  useEffect(() => {
    if (can('admin') && route[1] && ['clinic', 'staff', 'services', 'icd', 'data', 'audit'].includes(route[1])) setTab(route[1] as Tab);
  }, [route[1]]);
  const tabs: { id: Tab; label: string }[] = can('admin')
    ? [
        { id: 'clinic', label: 'კლინიკა' },
        { id: 'staff', label: 'თანამშრომლები' },
        { id: 'services', label: 'სერვისები და ფასები' },
        { id: 'icd', label: 'ICD-10' },
        { id: 'data', label: 'მონაცემები / სარეზერვო ასლი' },
        { id: 'audit', label: 'აუდიტის ჟურნალი' },
      ]
    : [{ id: 'data', label: 'მონაცემები / სარეზერვო ასლი' }];
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">პარამეტრები</h1>
      <Tabs<Tab> value={tab} onChange={setTab} tabs={tabs} />
      {tab === 'clinic' && <ClinicTab />}
      {tab === 'staff' && <StaffTab />}
      {tab === 'services' && <ServicesTab />}
      {tab === 'icd' && <IcdTab />}
      {tab === 'data' && <DataTab />}
      {tab === 'audit' && <AuditTab />}
    </div>
  );
}

function ClinicTab() {
  const clinic = useClinic();
  const ui = useUi();
  const [f, setF] = useState<ClinicSettings>(clinic);
  useEffect(() => setF(clinic), [clinic]);
  const set = (k: keyof ClinicSettings, v: any) => setF((s) => ({ ...s, [k]: v }));
  const save = async () => {
    if (!f.name.trim()) return ui.toast('მიუთითეთ დასახელება', 'err');
    await setKV('clinic', f);
    await audit('UPDATE', 'Clinic', 'clinic', 'განახლდა კლინიკის რეკვიზიტები');
    ui.toast('შენახულია');
  };
  const logo = async (file?: File) => {
    if (!file) return;
    if (file.size > 500_000) return ui.toast('ლოგო უნდა იყოს 500 კბ-ზე ნაკლები', 'err');
    set('logo', await readAsDataUrl(file));
  };
  return (
    <Card title="კლინიკის რეკვიზიტები (იბეჭდება ყველა ფორმაზე)" actions={<Button variant="primary" onClick={save}>შენახვა</Button>}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="კლინიკის სახელწოდება" required>
          <Input value={f.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="იურიდიული დასახელება (შპს / ი/მ)">
          <Input value={f.legalName} onChange={(e) => set('legalName', e.target.value)} />
        </Field>
        <Field label="საიდენტიფიკაციო კოდი">
          <Input value={f.taxId} onChange={(e) => set('taxId', e.target.value)} />
        </Field>
        <Field label="სამედიცინო საქმიანობის ლიცენზია / ნებართვა №">
          <Input value={f.license} onChange={(e) => set('license', e.target.value)} />
        </Field>
        <Field label="მისამართი" className="sm:col-span-2">
          <Input value={f.address} onChange={(e) => set('address', e.target.value)} />
        </Field>
        <Field label="ტელეფონი">
          <Input value={f.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="ელ. ფოსტა">
          <Input value={f.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label="დირექტორი">
          <Input value={f.director} onChange={(e) => set('director', e.target.value)} />
        </Field>
        <Field label="სამედიცინო დირექტორი">
          <Input value={f.medicalDirector} onChange={(e) => set('medicalDirector', e.target.value)} />
        </Field>
        <Field label="ფორმების ქვედა ტექსტი" className="sm:col-span-2">
          <Textarea rows={2} value={f.footerNote} onChange={(e) => set('footerNote', e.target.value)} />
        </Field>
        <Field label="ავტომატური დაბლოკვა უმოქმედობისას (წუთი, 0 = გამორთული)">
          <Input type="number" min={0} value={f.autoLockMinutes} onChange={(e) => set('autoLockMinutes', Number(e.target.value) || 0)} />
        </Field>
        <Field label="ლოგო">
          <div className="flex items-center gap-3">
            {f.logo && <img src={f.logo} alt="" className="h-10 rounded border" />}
            <input type="file" accept="image/*" onChange={(e) => logo(e.target.files?.[0])} className="text-xs" />
            {f.logo && (
              <Button size="sm" variant="ghost" onClick={() => set('logo', undefined)}>
                მოშორება
              </Button>
            )}
          </div>
        </Field>
      </div>
    </Card>
  );
}

function StaffTab() {
  const users = useLive(() => db.users.toArray(), [], [] as User[]) as User[];
  const [edit, setEdit] = useState<Partial<User> | null>(null);
  return (
    <Card title="თანამშრომლები და წვდომა" actions={<Button variant="primary" size="sm" icon={<UserPlus className="w-3.5 h-3.5" />} onClick={() => setEdit({ role: 'doctor', active: true })}>დამატება</Button>} bodyClass="p-0">
      <table className="w-full text-sm">
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-slate-50">
              <td className="px-4 py-2.5">
                <p className="font-medium">{userName(u)}</p>
                <p className="text-xs text-slate-500">{u.specialty}</p>
              </td>
              <td className="px-2 py-2.5">
                <Badge color={u.role === 'admin' ? 'violet' : u.role === 'doctor' ? 'teal' : 'slate'}>{ROLE_LABELS[u.role]}</Badge>
              </td>
              <td className="px-2 py-2.5 text-xs">{u.license && `სერტ. №${u.license}`}</td>
              <td className="px-2 py-2.5">{u.active ? <Badge color="green">აქტიური</Badge> : <Badge>გათიშული</Badge>}</td>
              <td className="px-4 py-2.5 text-right">
                <Button size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => setEdit(u)}>
                  რედაქტირება
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-4 py-3 text-xs text-slate-500">
        როლები: <b>ადმინისტრატორი</b> — სრული წვდომა; <b>ექიმი</b> — კლინიკური ჩანაწერები, ხელმოწერა, ფინანსები; <b>ასისტენტი</b> — კლინიკური ჩანაწერების შევსება ხელმოწერის გარეშე; <b>რეგისტრატორი</b> — რეგისტრაცია, ჩაწერები, გადახდები.
      </p>
      {edit && <UserModal u={edit} onClose={() => setEdit(null)} />}
    </Card>
  );
}

function UserModal({ u, onClose }: { u: Partial<User>; onClose: () => void }) {
  const ui = useUi();
  const { user: me } = useSession();
  const [f, setF] = useState<Partial<User>>(u);
  const [pin, setPin] = useState('');
  const set = (k: keyof User, v: any) => setF((s) => ({ ...s, [k]: v }));
  const save = async () => {
    if (!f.firstName?.trim() || !f.lastName?.trim()) return ui.toast('მიუთითეთ სახელი და გვარი', 'err');
    if (!u.id && !/^\d{4,8}$/.test(pin)) return ui.toast('PIN: 4–8 ციფრი', 'err');
    if (pin && !/^\d{4,8}$/.test(pin)) return ui.toast('PIN: 4–8 ციფრი', 'err');
    if (u.id === me?.id && (f.role !== 'admin' || !f.active)) return ui.toast('საკუთარ თავს ადმინისტრატორის უფლებას ვერ ჩამოართმევთ', 'err');
    const id = u.id || uid();
    const rec: User = {
      id,
      firstName: f.firstName!.trim(),
      lastName: f.lastName!.trim(),
      role: (f.role || 'doctor') as Role,
      specialty: f.specialty || '',
      license: f.license || '',
      phone: f.phone || '',
      active: f.active !== false,
      createdAt: u.createdAt || nowIso(),
      pinHash: pin ? await hashPin(pin, id) : u.pinHash!,
    };
    await db.users.put(rec);
    await audit(u.id ? 'UPDATE' : 'CREATE', 'User', id, `${u.id ? 'განახლდა' : 'დაემატა'} თანამშრომელი ${userName(rec)}${pin && u.id ? ' (PIN შეიცვალა)' : ''}`);
    ui.toast('შენახულია');
    onClose();
  };
  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title={u.id ? 'თანამშრომლის რედაქტირება' : 'ახალი თანამშრომელი'}
      footer={
        <>
          <Button onClick={onClose}>გაუქმება</Button>
          <Button variant="primary" onClick={save}>
            შენახვა
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="სახელი" required>
          <Input value={f.firstName || ''} onChange={(e) => set('firstName', e.target.value)} />
        </Field>
        <Field label="გვარი" required>
          <Input value={f.lastName || ''} onChange={(e) => set('lastName', e.target.value)} />
        </Field>
        <Field label="როლი">
          <Select value={f.role} onChange={(e) => set('role', e.target.value)}>
            {Object.entries(ROLE_LABELS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="სპეციალობა">
          <Input value={f.specialty || ''} onChange={(e) => set('specialty', e.target.value)} placeholder="სტომატოლოგი-თერაპევტი, ქირურგი…" />
        </Field>
        <Field label="სახელმწიფო სერტიფიკატის №">
          <Input value={f.license || ''} onChange={(e) => set('license', e.target.value)} />
        </Field>
        <Field label="ტელეფონი">
          <Input value={f.phone || ''} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label={u.id ? 'ახალი PIN (ცარიელი — უცვლელი)' : 'PIN კოდი'} required={!u.id}>
          <Input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
        </Field>
        <label className="flex items-center gap-2 text-sm mt-6">
          <input type="checkbox" className="accent-teal-600" checked={f.active !== false} onChange={(e) => set('active', e.target.checked)} /> აქტიური
        </label>
      </div>
    </Modal>
  );
}

function ServicesTab() {
  const list = (useLive(() => db.services.toArray(), [], [] as ServiceItem[]) as ServiceItem[]).sort((a, b) => a.group.localeCompare(b.group, 'ka') || a.code.localeCompare(b.code, 'ka', { numeric: true }));
  const ui = useUi();
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('');
  const groups = [...new Set(list.map((s) => s.group))];
  const shown = list.filter((s) => (!group || s.group === group) && (!q || normalize(`${s.code} ${s.name} ${s.group}`).includes(normalize(q))));

  const patch = async (s: ServiceItem, p: Partial<ServiceItem>) => {
    await db.services.update(s.id, p);
  };
  const addRow = async () => {
    const id = uid();
    await db.services.add({ id, code: '', name: 'ახალი მომსახურება', group: group || groups[0] || 'სხვა', price: 0 });
    ui.toast('დაემატა ახალი სტრიქონი — შეცვალეთ დასახელება და ფასი');
  };
  const remove = async (s: ServiceItem) => {
    if (!(await ui.confirm({ title: 'მომსახურების წაშლა', text: `${s.name} (${money(s.price)}). უკვე დარიცხულ მომსახურებას ეს არ შეცვლის.`, danger: true, okLabel: 'წაშლა' }))) return;
    await db.services.delete(s.id);
    await audit('DELETE', 'Service', s.id, `პრეისკურანტიდან წაიშალა: ${s.name}`);
  };
  const bulk = async () => {
    const pct = await ui.prompt({ title: 'ფასების ცვლილება %-ით', text: `${group ? `ჯგუფი: ${group}` : 'ყველა მომსახურება'} (${shown.length}). მიუთითეთ % (მაგ. 10 — გაძვირება, -5 — გაიაფება):`, okLabel: 'გამოყენება' });
    const n = Number(String(pct || '').replace(',', '.'));
    if (!pct || !isFinite(n)) return;
    await db.transaction('rw', db.services, async () => {
      for (const s of shown) await db.services.update(s.id, { price: round2(s.price * (1 + n / 100)) });
    });
    await audit('UPDATE', 'Service', 'bulk', `ფასები შეიცვალა ${n}%-ით (${shown.length} მომსახურება)`);
    ui.toast('ფასები განახლდა');
  };

  return (
    <Card
      title={`მომსახურების პრეისკურანტი (${list.length})`}
      actions={
        <>
          <Button size="sm" onClick={bulk} disabled={!shown.length}>
            ფასების ცვლილება %
          </Button>
          <Button size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />} onClick={addRow}>
            მომსახურების დამატება
          </Button>
        </>
      }
      bodyClass="p-0"
    >
      <div className="flex flex-wrap gap-2 p-4 pb-2">
        <Input placeholder="ძებნა: დასახელება, კოდი…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Select value={group} onChange={(e) => setGroup(e.target.value)} className="w-auto">
          <option value="">ყველა ჯგუფი</option>
          {groups.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </Select>
      </div>
      <p className="px-4 pb-2 text-xs text-slate-500">ცვლილება ინახება ავტომატურად. ახალი ფასი ვრცელდება მხოლოდ შემდგომ დარიცხვებზე — უკვე დარიცხული მომსახურების თანხა არ იცვლება.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-y border-slate-100 bg-slate-50">
              <th className="px-4 py-2 w-28 font-medium">კოდი</th>
              <th className="px-2 py-2 w-56 font-medium">ჯგუფი</th>
              <th className="px-2 py-2 font-medium">დასახელება</th>
              <th className="px-2 py-2 w-32 font-medium text-right">ფასი ₾</th>
              <th className="px-4 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((s) => (
              <tr key={s.id} className="border-b border-slate-50">
                <td className="px-4 py-1.5">
                  <EditCell value={s.code} onSave={(v) => patch(s, { code: v })} />
                </td>
                <td className="px-2 py-1.5">
                  <EditCell value={s.group} list="svc-groups" onSave={(v) => patch(s, { group: v || 'სხვა' })} />
                </td>
                <td className="px-2 py-1.5">
                  <EditCell value={s.name} onSave={(v) => v && patch(s, { name: v })} />
                </td>
                <td className="px-2 py-1.5">
                  <EditCell value={String(s.price)} numeric onSave={(v) => patch(s, { price: round2(Number(v.replace(',', '.')) || 0) })} />
                </td>
                <td className="px-4 py-1.5">
                  <button onClick={() => remove(s)} className="p-1 text-slate-400 hover:text-red-600" title="წაშლა">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <datalist id="svc-groups">
          {groups.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
      </div>
    </Card>
  );
}

/** ცხრილის უჯრა, რომელიც ინახება ფოკუსის დაკარგვისას ან Enter-ზე */
function EditCell({ value, onSave, numeric, list }: { value: string; onSave: (v: string) => void; numeric?: boolean; list?: string }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  const commit = () => v.trim() !== value && onSave(v.trim());
  return (
    <Input
      value={v}
      list={list}
      inputMode={numeric ? 'decimal' : undefined}
      className={cls('py-1.5', numeric && 'text-right font-medium')}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  );
}

function IcdTab() {
  const list = useIcdList();
  const ui = useUi();
  const [q, setQ] = useState('');
  const [code, setCode] = useState('');
  const [text, setText] = useState('');
  const add = async () => {
    const c = normalizeIcd(code);
    if (!/^[A-Z]\d{2}(\.\d{1,2})?$/.test(c)) return ui.toast('კოდის ფორმატი: K02.1', 'err');
    if (!text.trim()) return ui.toast('მიუთითეთ დასახელება', 'err');
    await db.customIcd.put({ code: c, text: text.trim() });
    setCode('');
    setText('');
    ui.toast(`${c} დაემატა`);
  };
  const shown = list.filter((e) => !q || normalize(`${e.code} ${e.text}`).includes(normalize(q)));
  return (
    <Card title={`ICD-10 ცნობარი (${list.length} კოდი)`}>
      <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] gap-2 mb-4">
        <Input placeholder="კოდი (K02.8)" value={code} onChange={(e) => setCode(e.target.value)} className="font-mono uppercase" />
        <Input placeholder="დასახელება ქართულად" value={text} onChange={(e) => setText(e.target.value)} />
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={add}>
          დამატება / გადაფარვა
        </Button>
      </div>
      <Input placeholder="ძებნა…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-3" />
      <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-50">
        {shown.map((e: IcdEntry) => (
          <div key={e.code} className="flex items-center gap-3 py-1.5 text-sm">
            <span className="font-mono font-semibold w-16 text-teal-700">{e.code}</span>
            <span className="flex-1">{e.text}</span>
            {e.custom && (
              <>
                <Badge color="violet">დამატებული</Badge>
                <button onClick={() => db.customIcd.delete(e.code)} className="p-1 text-slate-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function DataTab() {
  const ui = useUi();
  const { can } = useSession();
  const [est, setEst] = useState<{ usage?: number; quota?: number; persisted?: boolean }>({});
  const [busy, setBusy] = useState(false);
  const refresh = async () => {
    try {
      const e = await navigator.storage?.estimate?.();
      const persisted = await navigator.storage?.persisted?.();
      setEst({ usage: e?.usage, quota: e?.quota, persisted });
    } catch {}
  };
  useEffect(() => {
    refresh();
  }, []);
  const mb = (n?: number) => (n ? `${(n / 1024 / 1024).toFixed(1)} მბ` : '—');

  const backup = async () => {
    setBusy(true);
    try {
      downloadBlob(await exportBackup(), `dent-backup-${todayStr()}.json`);
      await audit('EXPORT', 'Backup', 'all', 'შეიქმნა სარეზერვო ასლი');
    } finally {
      setBusy(false);
    }
  };
  const restore = async (file?: File) => {
    if (!file) return;
    if (!(await ui.confirm({ title: 'აღდგენა', text: 'არსებული ყველა მონაცემი ჩანაცვლდება სარეზერვო ასლით. გავაგრძელო?', danger: true, okLabel: 'აღდგენა' }))) return;
    try {
      await importBackup(file);
      ui.toast('მონაცემები აღდგენილია');
    } catch (e: any) {
      ui.toast(e.message, 'err');
    }
  };
  const persist = async () => {
    const ok = await navigator.storage?.persist?.();
    ui.toast(ok ? 'ბრაუზერი მონაცემებს აღარ წაშლის ავტომატურად' : 'ბრაუზერმა მოთხოვნა არ დააკმაყოფილა', ok ? 'ok' : 'err');
    refresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card title="სარეზერვო ასლი">
        <p className="text-sm text-slate-600 mb-3">
          ყველა მონაცემი (პაციენტები, ვიზიტები, დოკუმენტები, რენტგენის სურათები, შაბლონები) ინახება ამ ბრაუზერში. რეგულარულად შექმენით სარეზერვო ასლი და შეინახეთ დაცულ ადგილას — ფაილი შეიცავს
          პაციენტთა პერსონალურ მონაცემებს.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" icon={<Download className="w-4 h-4" />} loading={busy} onClick={backup}>
            სარეზერვო ასლის ჩამოტვირთვა
          </Button>
          {can('admin') && (
            <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium cursor-pointer hover:bg-slate-50">
              <Upload className="w-4 h-4" /> აღდგენა ფაილიდან
              <input type="file" accept=".json,application/json" className="hidden" onChange={(e) => restore(e.target.files?.[0])} />
            </label>
          )}
        </div>
      </Card>
      <Card title={<span className="flex items-center gap-1.5"><HardDrive className="w-4 h-4" /> მეხსიერება</span>}>
        <p className="text-sm">
          გამოყენებული: <b>{mb(est.usage)}</b> / ხელმისაწვდომი: {mb(est.quota)}
        </p>
        <p className="text-sm mt-1">მუდმივი შენახვა: {est.persisted ? <Badge color="green">ჩართულია</Badge> : <Badge color="amber">არ არის ჩართული</Badge>}</p>
        {!est.persisted && (
          <Button size="sm" className="mt-3" icon={<KeyRound className="w-3.5 h-3.5" />} onClick={persist}>
            მუდმივი შენახვის მოთხოვნა
          </Button>
        )}
      </Card>
    </div>
  );
}

function AuditTab() {
  const rows = useLive(() => db.audit.orderBy('at').reverse().limit(500).toArray(), [], [] as AuditEntry[]) as AuditEntry[];
  return (
    <Card title="აუდიტის ჟურნალი (ბოლო 500)" bodyClass="p-0">
      <div className="overflow-x-auto max-h-[70vh]">
        <table className="w-full text-xs">
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-50">
                <td className="px-4 py-1.5 whitespace-nowrap text-slate-500">{fmtDateTime(r.at)}</td>
                <td className="px-2 py-1.5 whitespace-nowrap font-medium">{r.userName}</td>
                <td className="px-2 py-1.5">{r.action}</td>
                <td className="px-2 py-1.5 text-slate-500">{r.entity}</td>
                <td className="px-4 py-1.5">{r.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
