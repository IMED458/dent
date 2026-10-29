import React, { useEffect, useMemo, useState } from 'react';
import { History, Printer, Save } from 'lucide-react';
import { db, useLive, uid, audit, useClinic } from '../../lib/db';
import type { OdontogramSnapshot, Patient, ToothRecord, ToothStatus } from '../../lib/types';
import { Badge, Button, Card, Field, Input, Select, useUi } from '../../components/ui';
import { useSession } from '../../lib/session';
import { cls, fmtDate, patientName, todayStr, userName } from '../../lib/utils';
import { PrintPreview } from '../../components/Print';
import { SheetHeader, Signatures } from '../../documents/common';
import { useStaff } from './Visits';

export const TOOTH_STATUS: Record<ToothStatus, { label: string; short: string; fill: string; stroke: string; text: string }> = {
  healthy: { label: 'ჯანმრთელი', short: '', fill: '#ffffff', stroke: '#94a3b8', text: '#334155' },
  caries: { label: 'კარიესი (C)', short: 'C', fill: '#fee2e2', stroke: '#dc2626', text: '#b91c1c' },
  pulpitis: { label: 'პულპიტი (P)', short: 'P', fill: '#fecaca', stroke: '#b91c1c', text: '#7f1d1d' },
  periodontitis: { label: 'პერიოდონტიტი (Pt)', short: 'Pt', fill: '#fed7aa', stroke: '#c2410c', text: '#7c2d12' },
  filling: { label: 'ბჟენი (F)', short: 'F', fill: '#dbeafe', stroke: '#2563eb', text: '#1d4ed8' },
  endo: { label: 'ენდოდონტიურად ნამკურნალები', short: 'E', fill: '#ede9fe', stroke: '#7c3aed', text: '#5b21b6' },
  crown: { label: 'გვირგვინი (K)', short: 'K', fill: '#fef3c7', stroke: '#d97706', text: '#92400e' },
  veneer: { label: 'ვინირი (V)', short: 'V', fill: '#fef9c3', stroke: '#ca8a04', text: '#854d0e' },
  bridge: { label: 'ხიდის ელემენტი (B)', short: 'B', fill: '#fde68a', stroke: '#b45309', text: '#78350f' },
  implant: { label: 'იმპლანტი (I)', short: 'I', fill: '#ccfbf1', stroke: '#0d9488', text: '#115e59' },
  root: { label: 'ფესვი (R)', short: 'R', fill: '#e7e5e4', stroke: '#57534e', text: '#292524' },
  impacted: { label: 'რეტინირებული / იმპაქტირებული', short: 'Ret', fill: '#f1f5f9', stroke: '#475569', text: '#334155' },
  extract: { label: 'ექსტრაქციას ექვემდებარება', short: 'Ex', fill: '#fecdd3', stroke: '#e11d48', text: '#9f1239' },
  missing: { label: 'არ არის (0)', short: '0', fill: '#f1f5f9', stroke: '#cbd5e1', text: '#94a3b8' },
};

const PERM_UPPER = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'];
const PERM_LOWER = ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'];
const PRIM_UPPER = ['55', '54', '53', '52', '51', '61', '62', '63', '64', '65'];
const PRIM_LOWER = ['85', '84', '83', '82', '81', '71', '72', '73', '74', '75'];
const SURFACES = [
  { id: 'M', label: 'მეზიალური' },
  { id: 'O', label: 'ოკლუზიური / ინციზალური' },
  { id: 'D', label: 'დისტალური' },
  { id: 'V', label: 'ვესტიბულური' },
  { id: 'L', label: 'ორალური' },
];

function Tooth({ n, rec, selected, onClick, small }: { n: string; rec?: ToothRecord; selected?: boolean; onClick?: () => void; small?: boolean }) {
  const st = TOOTH_STATUS[rec?.status || 'healthy'];
  const w = small ? 30 : 38;
  const missing = rec?.status === 'missing';
  return (
    <button type="button" onClick={onClick} className={cls('flex flex-col items-center gap-0.5 rounded-md p-0.5', selected && 'bg-teal-100 ring-2 ring-teal-500')} title={`${n}: ${st.label}${rec?.surfaces ? ` (${rec.surfaces})` : ''}${rec?.note ? ` — ${rec.note}` : ''}`}>
      <span className="text-[10px] font-mono text-slate-500">{n}</span>
      <svg width={w} height={w} viewBox="0 0 40 40">
        <rect x="3" y="3" width="34" height="34" rx="8" fill={st.fill} stroke={st.stroke} strokeWidth="2" strokeDasharray={missing ? '3 3' : undefined} />
        {!missing &&
          ['M', 'O', 'D', 'V', 'L'].map((s) =>
            rec?.surfaces?.includes(s) ? (
              <circle key={s} cx={s === 'M' ? 9 : s === 'D' ? 31 : 20} cy={s === 'V' ? 9 : s === 'L' ? 31 : 20} r="3.2" fill={st.stroke} opacity={s === 'O' ? 0.35 : 0.9} />
            ) : null,
          )}
        <text x="20" y="25" textAnchor="middle" fontSize="13" fontWeight="700" fill={st.text}>
          {st.short}
        </text>
        {missing && <line x1="8" y1="8" x2="32" y2="32" stroke="#cbd5e1" strokeWidth="2" />}
      </svg>
    </button>
  );
}

export function OdontogramChart({ teeth, dentition, selected, onSelect, small }: { teeth: Record<string, ToothRecord>; dentition: OdontogramSnapshot['dentition']; selected?: string; onSelect?: (n: string) => void; small?: boolean }) {
  const rows: string[][] =
    dentition === 'primary' ? [PRIM_UPPER, PRIM_LOWER] : dentition === 'mixed' ? [PERM_UPPER, PRIM_UPPER, PRIM_LOWER, PERM_LOWER] : [PERM_UPPER, PERM_LOWER];
  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1 min-w-max">
        {rows.map((row, ri) => (
          <div key={ri} className={cls('flex justify-center', ri === rows.length / 2 - 1 && 'pb-2 border-b-2 border-slate-300 mb-1')}>
            {row.map((n, i) => (
              <React.Fragment key={n}>
                {i === row.length / 2 && <span className="w-px bg-slate-300 mx-1.5" />}
                <Tooth n={n} rec={teeth[n]} selected={selected === n} onClick={onSelect ? () => onSelect(n) : undefined} small={small} />
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function OdontogramTab({ patient }: { patient: Patient }) {
  const snaps = (useLive(() => db.odontograms.where('patientId').equals(patient.id).toArray(), [patient.id], [] as OdontogramSnapshot[]) as OdontogramSnapshot[]).sort(
    (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
  );
  const { user, can } = useSession();
  const staff = useStaff();
  const ui = useUi();
  const latest = snaps[0];
  const [viewId, setViewId] = useState<string | null>(null);
  const viewing = viewId ? snaps.find((s) => s.id === viewId) : undefined;
  const age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();
  const [teeth, setTeeth] = useState<Record<string, ToothRecord>>({});
  const [dentition, setDentition] = useState<OdontogramSnapshot['dentition']>(age < 6 ? 'primary' : age < 13 ? 'mixed' : 'permanent');
  const [note, setNote] = useState('');
  const [sel, setSel] = useState<string>('');
  const [dirty, setDirty] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    if (latest && !dirty) {
      setTeeth(latest.teeth);
      setDentition(latest.dentition);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest?.id]);

  const readOnly = !!viewing || !can('clinical');
  const shownTeeth = viewing ? viewing.teeth : teeth;
  const shownDent = viewing ? viewing.dentition : dentition;
  const cur = sel ? shownTeeth[sel] || { status: 'healthy' as ToothStatus } : undefined;

  const update = (patch: Partial<ToothRecord>) => {
    if (!sel || readOnly) return;
    setTeeth((t) => {
      const next = { ...(t[sel] || { status: 'healthy' }), ...patch } as ToothRecord;
      const copy = { ...t };
      if (next.status === 'healthy' && !next.surfaces && !next.note && !next.mobility) delete copy[sel];
      else copy[sel] = next;
      return copy;
    });
    setDirty(true);
  };

  const save = async () => {
    const snap: OdontogramSnapshot = { id: uid(), patientId: patient.id, date: todayStr(), teeth, dentition, note, createdBy: user!.id };
    await db.odontograms.add(snap);
    await audit('CREATE', 'Odontogram', snap.id, `ოდონტოგრამა შენახულია (${Object.keys(teeth).length} კბილი მონიშნული)`, patient.id);
    setDirty(false);
    setNote('');
    ui.toast('ოდონტოგრამა შენახულია ისტორიაში');
  };

  const summary = useMemo(() => {
    const m = new Map<ToothStatus, string[]>();
    Object.entries(shownTeeth).forEach(([n, r]) => r.status !== 'healthy' && m.set(r.status, [...(m.get(r.status) || []), n]));
    return [...m.entries()];
  }, [shownTeeth]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
      <Card
        title={
          <span className="flex items-center gap-2">
            ოდონტოგრამა (FDI)
            {viewing ? <Badge color="violet">ისტორია: {fmtDate(viewing.date)}</Badge> : dirty ? <Badge color="amber">შეუნახავი ცვლილებები</Badge> : latest ? <Badge color="green">{fmtDate(latest.date)}</Badge> : null}
          </span>
        }
        actions={
          <>
            {!viewing && (
              <Select value={dentition} onChange={(e) => (setDentition(e.target.value as any), setDirty(true))} className="w-auto py-1 text-xs" disabled={readOnly}>
                <option value="permanent">მუდმივი თანკბილვა</option>
                <option value="mixed">ცვლადი თანკბილვა</option>
                <option value="primary">სარძევე თანკბილვა</option>
              </Select>
            )}
            <Button size="sm" icon={<Printer className="w-3.5 h-3.5" />} onClick={() => setPrintOpen(true)}>
              ბეჭდვა
            </Button>
            {viewing ? (
              <Button size="sm" onClick={() => setViewId(null)}>
                მიმდინარეზე დაბრუნება
              </Button>
            ) : (
              can('clinical') && (
                <Button size="sm" variant="primary" icon={<Save className="w-3.5 h-3.5" />} onClick={save} disabled={!dirty}>
                  შენახვა
                </Button>
              )
            )}
          </>
        }
      >
        <div className="flex justify-center py-2">
          <OdontogramChart teeth={shownTeeth} dentition={shownDent} selected={sel} onSelect={setSel} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {Object.entries(TOOTH_STATUS).map(([k, s]) => (
            <span key={k} className="flex items-center gap-1 text-[11px] text-slate-600">
              <span className="inline-block w-3 h-3 rounded-sm border" style={{ background: s.fill, borderColor: s.stroke }} /> {s.label}
            </span>
          ))}
        </div>
        {summary.length > 0 && (
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm space-y-0.5">
            {summary.map(([st, list]) => (
              <p key={st}>
                <b>{TOOTH_STATUS[st].label}:</b> {list.sort().join(', ')}
              </p>
            ))}
          </div>
        )}
        {!viewing && dirty && (
          <Field label="შენიშვნა ამ ჩანაწერზე" className="mt-3">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="მაგ.: პირველადი გასინჯვა / მკურნალობის შემდეგ" />
          </Field>
        )}
      </Card>

      <div className="space-y-4">
        <Card title={sel ? `კბილი ${sel}` : 'აირჩიეთ კბილი'}>
          {!sel || !cur ? (
            <p className="text-sm text-slate-500">დააწკაპუნეთ კბილზე სქემაში მისი მდგომარეობის მოსანიშნად.</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(TOOTH_STATUS).map(([k, s]) => (
                  <button
                    key={k}
                    disabled={readOnly}
                    onClick={() => update({ status: k as ToothStatus })}
                    className={cls('flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-left text-xs disabled:opacity-60', cur.status === k ? 'border-teal-500 bg-teal-50 font-semibold' : 'border-slate-200 hover:bg-slate-50')}
                  >
                    <span className="inline-block w-3 h-3 rounded-sm border shrink-0" style={{ background: s.fill, borderColor: s.stroke }} />
                    {s.label}
                  </button>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1">ზედაპირები</p>
                <div className="flex gap-1 flex-wrap">
                  {SURFACES.map((s) => {
                    const on = cur.surfaces?.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        disabled={readOnly}
                        title={s.label}
                        onClick={() => update({ surfaces: on ? (cur.surfaces || '').replace(s.id, '') : `${cur.surfaces || ''}${s.id}`.split('').sort((a, b) => 'MODVL'.indexOf(a) - 'MODVL'.indexOf(b)).join('') })}
                        className={cls('w-9 h-8 rounded-md border text-sm font-mono', on ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-300 hover:bg-slate-50')}
                      >
                        {s.id}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Field label="მორყეობა">
                <Select value={cur.mobility || ''} disabled={readOnly} onChange={(e) => update({ mobility: e.target.value })}>
                  <option value="">არ არის</option>
                  <option value="I">I ხარისხი</option>
                  <option value="II">II ხარისხი</option>
                  <option value="III">III ხარისხი</option>
                </Select>
              </Field>
              <Field label="შენიშვნა">
                <Input value={cur.note || ''} disabled={readOnly} onChange={(e) => update({ note: e.target.value })} />
              </Field>
            </div>
          )}
        </Card>
        <Card title={<span className="flex items-center gap-1.5"><History className="w-4 h-4" /> ისტორია</span>} bodyClass="p-0">
          {snaps.length === 0 && <p className="p-4 text-sm text-slate-500">ჯერ არ არის შენახული.</p>}
          <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {snaps.map((s, i) => (
              <li key={s.id} onClick={() => setViewId(i === 0 ? null : s.id)} className={cls('px-4 py-2 cursor-pointer text-sm', viewId === s.id ? 'bg-violet-50' : 'hover:bg-slate-50')}>
                <p className="font-medium">
                  {fmtDate(s.date)} {i === 0 && <span className="text-xs text-teal-700">(მიმდინარე)</span>}
                </p>
                <p className="text-xs text-slate-500">
                  {userName(staff.find((u) => u.id === s.createdBy))} · {Object.keys(s.teeth).length} მონიშვნა {s.note && `· ${s.note}`}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <PrintPreview open={printOpen} onClose={() => setPrintOpen(false)} title={`ოდონტოგრამა — ${patientName(patient)}`}>
        <OdontogramSheet patient={patient} teeth={shownTeeth} dentition={shownDent} date={viewing?.date || latest?.date || todayStr()} />
      </PrintPreview>
    </div>
  );
}

function OdontogramSheet({ patient, teeth, dentition, date }: { patient: Patient; teeth: Record<string, ToothRecord>; dentition: OdontogramSnapshot['dentition']; date: string }) {
  const clinic = useClinic();
  return (
    <div className="print-sheet">
      <SheetHeader clinic={clinic} />
      <h1>ოდონტოგრამა (კბილთა ფორმულა)</h1>
      <p style={{ textAlign: 'center' }}>
        {patientName(patient)} · პ/ნ {patient.idNumber || '—'} · ბარათი №{patient.cardNumber} · {fmtDate(date)}
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
        <OdontogramChart teeth={teeth} dentition={dentition} small />
      </div>
      <OdontogramTable teeth={teeth} />
      <Signatures left="ექიმი" right="თარიღი" />
    </div>
  );
}

export function OdontogramTable({ teeth }: { teeth: Record<string, ToothRecord> }) {
  const entries = Object.entries(teeth).filter(([, r]) => r.status !== 'healthy' || r.note);
  if (!entries.length) return <p className="small">პათოლოგიური ცვლილებები არ არის მონიშნული.</p>;
  return (
    <table>
      <thead>
        <tr>
          <th>კბილი</th>
          <th>მდგომარეობა</th>
          <th>ზედაპირი</th>
          <th>მორყეობა</th>
          <th>შენიშვნა</th>
        </tr>
      </thead>
      <tbody>
        {entries
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([n, r]) => (
            <tr key={n}>
              <td>{n}</td>
              <td>{TOOTH_STATUS[r.status].label}</td>
              <td>{r.surfaces}</td>
              <td>{r.mobility}</td>
              <td>{r.note}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
