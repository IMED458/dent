import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Contrast,
  Download,
  FileImage,
  FileText,
  FlipHorizontal,
  ImagePlus,
  Maximize2,
  Pencil,
  Plus,
  RotateCw,
  Scan,
  Sun,
  Trash2,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { db, useLive, uid, nowIso, audit } from '../../lib/db';
import { RADIOLOGY_LABELS, type Charge, type Patient, type RadiologyKind, type RadiologyStudy, type ServiceItem, type StoredFile, type Visit } from '../../lib/types';
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Select, useUi } from '../../components/ui';
import { TemplateText } from '../../components/clinical';
import { useSession } from '../../lib/session';
import { navigate } from '../../lib/router';
import { cls, downloadBlob, fmtDate, makeThumb, patientName, todayStr, userName } from '../../lib/utils';
import { useStaff } from './Visits';

const MAX_FILE_MB = 60;

export function RadiologyTab({ patient, openId }: { patient: Patient; openId?: string }) {
  const studies = (useLive(() => db.radiology.where('patientId').equals(patient.id).toArray(), [patient.id], [] as RadiologyStudy[]) as RadiologyStudy[]).sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
  const files = useLive(
    () => db.files.where('patientId').equals(patient.id).toArray(),
    [patient.id],
    [] as StoredFile[],
  ) as StoredFile[];
  const staff = useStaff();
  const { can } = useSession();
  const [editing, setEditing] = useState<RadiologyStudy | 'new' | null>(null);
  const [viewer, setViewer] = useState<{ list: StoredFile[]; index: number } | null>(null);
  const fileMap = useMemo(() => new Map(files.map((f) => [f.id, f])), [files]);

  useEffect(() => {
    if (openId === 'new') setEditing('new');
  }, [openId]);

  const imagesTotal = files.length;

  return (
    <div className="space-y-4">
      <Card
        title={
          <span className="flex items-center gap-2">
            რადიოლოგიური კვლევები და კლინიკური ფოტოები <Badge>{imagesTotal} ფაილი</Badge>
          </span>
        }
        actions={
          can('clinical') && (
            <Button variant="primary" size="sm" icon={<ImagePlus className="w-3.5 h-3.5" />} onClick={() => setEditing('new')}>
              კვლევის / ფოტოს ატვირთვა
            </Button>
          )
        }
      >
        {studies.length === 0 ? (
          <EmptyState
            icon={<Scan className="w-6 h-6" />}
            title="კვლევები ჯერ არ არის ატვირთული"
            text="ატვირთეთ რენტგენი, OPG, CBCT-ის ჭრილები ან კლინიკური ფოტო (JPG, PNG, WEBP, PDF). შესაძლებელია ფაილის გადმოტანა, ჩასმა (Ctrl+V) ან კამერით გადაღება."
            action={
              can('clinical') && (
                <Button variant="primary" icon={<Upload className="w-4 h-4" />} onClick={() => setEditing('new')}>
                  ატვირთვა
                </Button>
              )
            }
          />
        ) : (
          <div className="space-y-4">
            {studies.map((s) => {
              const fl = s.fileIds.map((id) => fileMap.get(id)).filter(Boolean) as StoredFile[];
              return (
                <div key={s.id} className="rounded-xl border border-slate-200 p-3 sm:p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{RADIOLOGY_LABELS[s.kind]}</p>
                      <p className="text-xs text-slate-500">
                        {fmtDate(s.date)}
                        {s.teeth && ` · კბ. ${s.teeth}`}
                        {s.dose && ` · დოზა ${s.dose} მკზვ`} · {userName(staff.find((u) => u.id === s.doctorId))}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" icon={<FileText className="w-3.5 h-3.5" />} onClick={() => navigate('patient', patient.id, 'documents', 'new:xrayReport')}>
                        ოქმი
                      </Button>
                      {can('clinical') && (
                        <Button size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => setEditing(s)}>
                          რედაქტირება
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {fl.map((f, i) => (
                      <button key={f.id} onClick={() => setViewer({ list: fl, index: i })} className="group relative w-32 h-24 rounded-lg overflow-hidden bg-slate-900 border border-slate-200" title={f.name}>
                        {f.thumb ? (
                          <img src={f.thumb} alt={f.name} className="w-full h-full object-cover group-hover:opacity-80" />
                        ) : (
                          <span className="flex flex-col items-center justify-center h-full text-slate-300 text-[10px] px-1">
                            <FileImage className="w-6 h-6 mb-1" />
                            {f.name}
                          </span>
                        )}
                        <Maximize2 className="absolute top-1 right-1 w-4 h-4 text-white opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                  {(s.description || s.conclusion) && (
                    <div className="mt-3 grid md:grid-cols-2 gap-3 text-sm">
                      {s.description && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500">აღწერა</p>
                          <p className="whitespace-pre-wrap">{s.description}</p>
                        </div>
                      )}
                      {s.conclusion && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500">დასკვნა</p>
                          <p className="whitespace-pre-wrap font-medium">{s.conclusion}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
      {editing && (
        <StudyEditor
          patient={patient}
          study={editing === 'new' ? undefined : editing}
          files={editing === 'new' ? [] : (editing.fileIds.map((id) => fileMap.get(id)).filter(Boolean) as StoredFile[])}
          onClose={() => {
            setEditing(null);
            if (openId === 'new') navigate('patient', patient.id, 'radiology');
          }}
        />
      )}
      {viewer && <ImageViewer list={viewer.list} index={viewer.index} onClose={() => setViewer(null)} title={patientName(patient)} />}
    </div>
  );
}

type Pending = { key: string; file: File; preview?: string };

function StudyEditor({ patient, study, files, onClose }: { patient: Patient; study?: RadiologyStudy; files: StoredFile[]; onClose: () => void }) {
  const { user } = useSession();
  const ui = useUi();
  const staff = useStaff();
  const visits = useLive(() => db.visits.where('patientId').equals(patient.id).toArray(), [patient.id], [] as Visit[]) as Visit[];
  const [f, setF] = useState({
    kind: study?.kind || ('periapical' as RadiologyKind),
    date: study?.date || todayStr(),
    teeth: study?.teeth || '',
    dose: study?.dose || '',
    description: study?.description || '',
    conclusion: study?.conclusion || '',
    doctorId: study?.doctorId || user!.id,
    visitId: study?.visitId || '',
  });
  const services = useLive(() => db.services.toArray(), [], [] as ServiceItem[]) as ServiceItem[];
  const [chargeId, setChargeId] = useState<string>('auto');
  const [pending, setPending] = useState<Pending[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | File[]) => {
    const arr = Array.from(list);
    const ok: Pending[] = [];
    for (const file of arr) {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        ui.toast(`${file.name}: ფაილი აღემატება ${MAX_FILE_MB} მბ-ს`, 'err');
        continue;
      }
      ok.push({ key: uid(), file, preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined });
    }
    setPending((p) => [...p, ...ok]);
  };

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.files || []);
      if (items.length) addFiles(items);
    };
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('paste', onPaste);
      pending.forEach((p) => p.preview && URL.revokeObjectURL(p.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    const keep = files.filter((x) => !removed.includes(x.id));
    if (!keep.length && !pending.length) return ui.toast('დაამატეთ მინიმუმ ერთი ფაილი', 'err');
    setBusy(true);
    try {
      const sid = study?.id || uid();
      const newFiles: StoredFile[] = [];
      for (const p of pending) {
        newFiles.push({
          id: uid(),
          patientId: patient.id,
          ownerId: sid,
          name: p.file.name || `image-${Date.now()}.jpg`,
          mime: p.file.type || 'application/octet-stream',
          size: p.file.size,
          blob: p.file,
          thumb: await makeThumb(p.file),
          createdAt: nowIso(),
        });
      }
      const record: RadiologyStudy = {
        id: sid,
        patientId: patient.id,
        visitId: f.visitId || undefined,
        date: f.date,
        kind: f.kind,
        teeth: f.teeth,
        dose: f.dose,
        description: f.description,
        conclusion: f.conclusion,
        doctorId: f.doctorId,
        fileIds: [...keep.map((x) => x.id), ...newFiles.map((x) => x.id)],
        createdAt: study?.createdAt || nowIso(),
        createdBy: study?.createdBy || user!.id,
      };
      await db.transaction('rw', db.files, db.radiology, async () => {
        if (newFiles.length) await db.files.bulkAdd(newFiles);
        if (removed.length) await db.files.bulkDelete(removed);
        await db.radiology.put(record);
      });
      const svc = chargeId === 'auto' ? suggestService(services, f.kind) : services.find((x) => x.id === chargeId);
      if (!study && svc) {
        const ch: Charge = {
          id: uid(),
          patientId: patient.id,
          date: f.date,
          serviceId: svc.id,
          code: svc.code,
          name: svc.name,
          group: svc.group,
          teeth: f.teeth,
          qty: 1,
          price: svc.price,
          discount: 0,
          status: 'done',
          visitId: f.visitId || undefined,
          note: RADIOLOGY_LABELS[f.kind],
          createdAt: nowIso(),
          createdBy: user!.id,
        };
        await db.charges.add(ch);
      }
      await audit(study ? 'UPDATE' : 'CREATE', 'Radiology', sid, `${RADIOLOGY_LABELS[f.kind]} ${fmtDate(f.date)} — ${record.fileIds.length} ფაილი`, patient.id);
      ui.toast('კვლევა შენახულია');
      onClose();
    } catch (e: any) {
      ui.toast(e?.name === 'QuotaExceededError' ? 'ბრაუზერის მეხსიერება ამოიწურა — შექმენით სარეზერვო ასლი და გაათავისუფლეთ ადგილი' : e.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  const removeStudy = async () => {
    if (!study) return;
    const ok = await ui.confirm({ title: 'კვლევის წაშლა', text: 'წაიშლება კვლევა და მისი ყველა გამოსახულება.', danger: true, okLabel: 'წაშლა' });
    if (!ok) return;
    await db.transaction('rw', db.files, db.radiology, async () => {
      await db.files.bulkDelete(study.fileIds);
      await db.radiology.delete(study.id);
    });
    await audit('DELETE', 'Radiology', study.id, `წაიშალა ${RADIOLOGY_LABELS[study.kind]} ${fmtDate(study.date)}`, patient.id);
    onClose();
  };

  const doctors = staff.filter((s) => s.role !== 'registrar');

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={study ? 'კვლევის რედაქტირება' : `ახალი კვლევა — ${patientName(patient)}`}
      footer={
        <>
          {study && (
            <Button variant="danger" icon={<Trash2 className="w-4 h-4" />} onClick={removeStudy}>
              წაშლა
            </Button>
          )}
          <Button onClick={onClose}>გაუქმება</Button>
          <Button variant="primary" loading={busy} onClick={save}>
            შენახვა
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div
          onDragOver={(e) => (e.preventDefault(), setDrag(true))}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            addFiles(e.dataTransfer.files);
          }}
          className={cls('rounded-xl border-2 border-dashed p-5 text-center transition', drag ? 'border-teal-500 bg-teal-50' : 'border-slate-300 bg-slate-50')}
        >
          <Upload className="w-7 h-7 mx-auto text-slate-400" />
          <p className="text-sm mt-2">ჩააგდეთ ფაილები აქ, ჩასვით (Ctrl+V) ან</p>
          <div className="flex justify-center gap-2 mt-3 flex-wrap">
            <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => inputRef.current?.click()}>
              ფაილის არჩევა
            </Button>
            <Button size="sm" icon={<Camera className="w-3.5 h-3.5" />} onClick={() => camRef.current?.click()}>
              კამერით გადაღება
            </Button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">JPG, PNG, WEBP, BMP, TIFF, PDF, DICOM (.dcm — შეინახება ჩამოსატვირთად) · მაქს. {MAX_FILE_MB} მბ</p>
          <input ref={inputRef} type="file" multiple accept="image/*,application/pdf,.dcm,application/dicom" className="hidden" onChange={(e) => (e.target.files && addFiles(e.target.files), (e.target.value = ''))} />
          <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => (e.target.files && addFiles(e.target.files), (e.target.value = ''))} />
        </div>

        {(files.length > 0 || pending.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {files
              .filter((x) => !removed.includes(x.id))
              .map((x) => (
                <Thumb key={x.id} src={x.thumb} name={x.name} onRemove={() => setRemoved((r) => [...r, x.id])} />
              ))}
            {pending.map((p) => (
              <Thumb key={p.key} src={p.preview} name={p.file.name} isNew onRemove={() => setPending((s) => s.filter((x) => x.key !== p.key))} />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="კვლევის სახე" className="sm:col-span-2">
            <Select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as RadiologyKind })}>
              {Object.entries(RADIOLOGY_LABELS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="თარიღი">
            <Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          </Field>
          <Field label="კბილები / მიდამო">
            <Input value={f.teeth} onChange={(e) => setF({ ...f, teeth: e.target.value })} placeholder="მაგ.: 36, 37" />
          </Field>
          <Field label="ეფექტური დოზა (მკზვ)" hint="რადიაციული დატვირთვის აღრიცხვა">
            <Input value={f.dose} onChange={(e) => setF({ ...f, dose: e.target.value })} disabled={f.kind === 'photo' || f.kind === 'scan'} />
          </Field>
          <Field label="ექიმი">
            <Select value={f.doctorId} onChange={(e) => setF({ ...f, doctorId: e.target.value })}>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {userName(d)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="მიბმა ვიზიტზე" className="sm:col-span-3">
            <Select value={f.visitId} onChange={(e) => setF({ ...f, visitId: e.target.value })}>
              <option value="">— არ არის მიბმული —</option>
              {[...visits]
                .sort((a, b) => b.visitNo - a.visitNo)
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    ვიზიტი №{v.visitNo} · {fmtDate(v.date)}
                  </option>
                ))}
            </Select>
          </Field>
        </div>
        {!study && (
          <Field label="მომსახურების დარიცხვა (ფინანსები)" hint="შეგიძლიათ შეცვალოთ ან გამორთოთ; ფასი აიღება პრეისკურანტიდან">
            <Select value={chargeId} onChange={(e) => setChargeId(e.target.value)}>
              <option value="auto">ავტომატურად: {suggestService(services, f.kind) ? `${suggestService(services, f.kind)!.name} — ${suggestService(services, f.kind)!.price} ₾` : 'შესაბამისი მომსახურება ვერ მოიძებნა'}</option>
              <option value="">არ დაირიცხოს</option>
              {services.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name} — {x.price} ₾
                </option>
              ))}
            </Select>
          </Field>
        )}
        <TemplateText label="აღწერა" category="xrayDescription" value={f.description} onChange={(x) => setF({ ...f, description: x })} rows={3} />
        <TemplateText label="დასკვნა" category="xrayConclusion" value={f.conclusion} onChange={(x) => setF({ ...f, conclusion: x })} rows={2} />
      </div>
    </Modal>
  );
}

function Thumb({ src, name, onRemove, isNew }: { src?: string; name: string; onRemove: () => void; isNew?: boolean }) {
  return (
    <div className="relative w-28 h-24 rounded-lg overflow-hidden bg-slate-900 border border-slate-200">
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-[10px] text-slate-300 p-1 text-center">{name}</span>}
      {isNew && <span className="absolute bottom-1 left-1 rounded bg-teal-600 px-1 text-[10px] text-white">ახალი</span>}
      <button onClick={onRemove} className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-red-600" title="მოშორება">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ImageViewer({ list, index, onClose, title }: { list: StoredFile[]; index: number; onClose: () => void; title: string }) {
  const [i, setI] = useState(index);
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [flip, setFlip] = useState(false);
  const [bright, setBright] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [invert, setInvert] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const f = list[i];
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!f) return;
    const u = URL.createObjectURL(f.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [f]);
  const reset = () => (setZoom(1), setRot(0), setFlip(false), setBright(100), setContrast(100), setInvert(false), setPan({ x: 0, y: 0 }));
  useEffect(reset, [i]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setI((x) => Math.min(x + 1, list.length - 1));
      if (e.key === 'ArrowLeft') setI((x) => Math.max(x - 1, 0));
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [list.length, onClose]);
  if (!f) return null;
  const isImg = f.mime.startsWith('image/') && !/tiff?$/.test(f.mime);
  const isPdf = f.mime === 'application/pdf';

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col no-print">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-slate-900 text-slate-200 text-sm">
        <span className="font-medium truncate max-w-[40vw]">
          {title} · {f.name}
        </span>
        <span className="text-slate-400">
          {i + 1}/{list.length}
        </span>
        <div className="flex items-center gap-1 ml-auto flex-wrap">
          {isImg && (
            <>
              <IconBtn onClick={() => setZoom((z) => Math.max(0.2, z / 1.25))} title="დაპატარავება">
                <ZoomOut className="w-4 h-4" />
              </IconBtn>
              <span className="w-12 text-center text-xs">{Math.round(zoom * 100)}%</span>
              <IconBtn onClick={() => setZoom((z) => Math.min(10, z * 1.25))} title="გადიდება">
                <ZoomIn className="w-4 h-4" />
              </IconBtn>
              <IconBtn onClick={() => setRot((r) => (r + 90) % 360)} title="მობრუნება">
                <RotateCw className="w-4 h-4" />
              </IconBtn>
              <IconBtn onClick={() => setFlip((x) => !x)} title="სარკისებრი">
                <FlipHorizontal className="w-4 h-4" />
              </IconBtn>
              <IconBtn onClick={() => setInvert((x) => !x)} title="ინვერსია (ნეგატივი)" active={invert}>
                <Contrast className="w-4 h-4" />
              </IconBtn>
              <label className="flex items-center gap-1 text-xs ml-2" title="სიკაშკაშე">
                <Sun className="w-4 h-4" />
                <input type="range" min={30} max={250} value={bright} onChange={(e) => setBright(Number(e.target.value))} className="w-20 accent-teal-500" />
              </label>
              <label className="flex items-center gap-1 text-xs" title="კონტრასტი">
                <Contrast className="w-4 h-4" />
                <input type="range" min={30} max={300} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-20 accent-teal-500" />
              </label>
              <button onClick={reset} className="text-xs px-2 py-1 rounded hover:bg-slate-700">
                საწყისი
              </button>
            </>
          )}
          <IconBtn onClick={() => downloadBlob(f.blob, f.name)} title="ჩამოტვირთვა">
            <Download className="w-4 h-4" />
          </IconBtn>
          <IconBtn onClick={onClose} title="დახურვა">
            <X className="w-5 h-5" />
          </IconBtn>
        </div>
      </div>
      <div
        className="flex-1 relative overflow-hidden flex items-center justify-center select-none"
        onWheel={(e) => isImg && setZoom((z) => Math.min(10, Math.max(0.2, z * (e.deltaY < 0 ? 1.1 : 0.9))))}
        onMouseDown={(e) => (dragRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y })}
        onMouseMove={(e) => dragRef.current && setPan({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y })}
        onMouseUp={() => (dragRef.current = null)}
        onMouseLeave={() => (dragRef.current = null)}
        style={{ cursor: isImg ? 'grab' : 'default' }}
      >
        {isImg ? (
          <img
            src={url}
            alt={f.name}
            draggable={false}
            className="max-w-full max-h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rot}deg) scaleX(${flip ? -1 : 1})`,
              filter: `brightness(${bright}%) contrast(${contrast}%) ${invert ? 'invert(1)' : ''}`,
              transition: dragRef.current ? 'none' : 'transform 0.1s',
            }}
          />
        ) : isPdf ? (
          <iframe src={url} title={f.name} className="w-full h-full bg-white" />
        ) : (
          <div className="text-center text-slate-300">
            <FileImage className="w-12 h-12 mx-auto mb-3" />
            <p>ამ ფორმატის ({f.mime || f.name.split('.').pop()}) ბრაუზერში ჩვენება შეუძლებელია.</p>
            <Button className="mt-4" icon={<Download className="w-4 h-4" />} onClick={() => downloadBlob(f.blob, f.name)}>
              ჩამოტვირთვა და გახსნა DICOM-ვიუერში
            </Button>
          </div>
        )}
        {i > 0 && (
          <button onClick={() => setI(i - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/25">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {i < list.length - 1 && (
          <button onClick={() => setI(i + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/25">
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, title, active }: { children: React.ReactNode; onClick: () => void; title: string; active?: boolean }) {
  return (
    <button onClick={onClick} title={title} className={cls('p-1.5 rounded hover:bg-slate-700', active && 'bg-teal-700')}>
      {children}
    </button>
  );
}

/** რადიოლოგიური კვლევის სახის მიხედვით შესაბამისი მომსახურება პრეისკურანტიდან */
function suggestService(services: ServiceItem[], kind: RadiologyKind): ServiceItem | undefined {
  if (kind === 'photo' || kind === 'scan' || kind === 'other') return undefined;
  const words: Record<string, string[]> = {
    periapical: ['პერიაპიკ', 'კბილის რენტგ', 'რვგ', 'ვიზიო'],
    bitewing: ['bitewing', 'ინტერპროქს', 'პერიაპიკ'],
    occlusal: ['ოკლუზ', 'პერიაპიკ'],
    opg: ['opg', 'ორთოპანტ', 'პანორამ'],
    cbct: ['cbct', 'კტ', 'ტომოგრ'],
    trg: ['trg', 'ტელერენტგ'],
  };
  const w = words[kind] || [];
  return services.find((s) => w.some((x) => s.name.toLowerCase().includes(x)));
}
