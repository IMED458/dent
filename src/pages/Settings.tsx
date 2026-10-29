import React, { useEffect, useState } from 'react';
import { Download, HardDrive, KeyRound, Plus, Trash2, Upload, UserPlus, Pencil } from 'lucide-react';
import { db, useLive, uid, nowIso, setKV, useClinic, exportBackup, importBackup, audit } from '../lib/db';
import { ROLE_LABELS, type AuditEntry, type ClinicSettings, type IcdEntry, type Role, type ServiceItem, type User } from '../lib/types';
import { Badge, Button, Card, Field, Input, Modal, Select, Tabs, Textarea, useUi } from '../components/ui';
import { useSession } from '../lib/session';
import { useIcdList } from '../components/clinical';
import { normalizeIcd } from '../data/icd10';
import { downloadBlob, fmtDateTime, hashPin, money, normalize, readAsDataUrl, todayStr, userName } from '../lib/utils';

type Tab = 'clinic' | 'staff' | 'services' | 'icd' | 'data' | 'audit';

export function SettingsPage() {
  const { can } = useSession();
  const [tab, setTab] = useState<Tab>(can('admin') ? 'clinic' : 'data');
  const tabs: { id: Tab; label: string }[] = can('admin')
    ? [
        { id: 'clinic', label: 'კლინიკა' },
        { id: 'staff', label: 'თანამშრომლები' },
        { id: 'services', label: 'მომსახურების ფასები' },
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
  const list = (useLive(() => db.services.toArray(), [], [] as ServiceItem[]) as ServiceItem[]).sort((a, b) => a.group.localeCompare(b.group, 'ka') || a.code.localeCompare(b.code));
  const ui = useUi();
  const [edit, setEdit] = useState<Partial<ServiceItem> | null>(null);
  const save = async () => {
    if (!edit?.name?.trim()) return ui.toast('მიუთითეთ დასახელება', 'err');
    await db.services.put({ id: edit.id || uid(), code: edit.code || '', name: edit.name.trim(), group: edit.group || 'სხვა', price: Number(edit.price) || 0 });
    setEdit(null);
  };
  return (
    <Card title="მომსახურების პრეისკურანტი" actions={<Button size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setEdit({ group: list[0]?.group })}>დამატება</Button>} bodyClass="p-0">
      <table className="w-full text-sm">
        <tbody>
          {list.map((s) => (
            <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onClick={() => setEdit(s)}>
              <td className="px-4 py-2 font-mono text-xs w-20">{s.code}</td>
              <td className="px-2 py-2 text-xs text-slate-500">{s.group}</td>
              <td className="px-2 py-2">{s.name}</td>
              <td className="px-4 py-2 text-right font-medium">{money(s.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {edit && (
        <Modal
          open
          size="sm"
          onClose={() => setEdit(null)}
          title={edit.id ? 'მომსახურების რედაქტირება' : 'ახალი მომსახურება'}
          footer={
            <>
              {edit.id && (
                <Button variant="danger" icon={<Trash2 className="w-4 h-4" />} onClick={async () => (await db.services.delete(edit.id!), setEdit(null))}>
                  წაშლა
                </Button>
              )}
              <Button variant="primary" onClick={save}>
                შენახვა
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Field label="კოდი">
                <Input value={edit.code || ''} onChange={(e) => setEdit({ ...edit, code: e.target.value })} />
              </Field>
              <Field label="ჯგუფი" className="col-span-2">
                <Input list="svc-groups" value={edit.group || ''} onChange={(e) => setEdit({ ...edit, group: e.target.value })} />
                <datalist id="svc-groups">
                  {[...new Set(list.map((s) => s.group))].map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </Field>
            </div>
            <Field label="დასახელება" required>
              <Input value={edit.name || ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </Field>
            <Field label="ფასი (₾)">
              <Input type="number" min={0} value={edit.price ?? ''} onChange={(e) => setEdit({ ...edit, price: Number(e.target.value) })} />
            </Field>
          </div>
        </Modal>
      )}
    </Card>
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
