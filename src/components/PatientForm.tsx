import React, { useEffect, useState } from 'react';
import { AlertTriangle, UserCheck } from 'lucide-react';
import type { Patient } from '../lib/types';
import { Button, Field, Input, Modal, Select, Textarea, useUi } from './ui';
import { createPatient, findByIdNumber, updatePatient, validatePatient, DuplicatePatientError } from '../lib/records';
import { useSession } from '../lib/session';
import { RISK_FLAGS } from '../data/defaults';
import { ageOf, cls, fmtDate, isValidGeId, patientName } from '../lib/utils';
import { navigate } from '../lib/router';

type Draft = Omit<Patient, 'id' | 'cardNumber' | 'cardSource' | 'reservedJournalNo' | 'createdAt' | 'updatedAt' | 'createdBy'>;

const empty: Draft = {
  idType: 'GE',
  idNumber: '',
  firstName: '',
  lastName: '',
  fatherName: '',
  birthDate: '',
  sex: 'M',
  citizenship: 'საქართველო',
  phone: '',
  phone2: '',
  email: '',
  address: '',
  workplace: '',
  insurance: '',
  insurancePolicy: '',
  guardianName: '',
  guardianIdNumber: '',
  guardianRelation: '',
  guardianPhone: '',
  bloodGroup: '',
  allergies: '',
  chronicDiseases: '',
  medications: '',
  riskFlags: [],
  notes: '',
  pdConsent: false,
};

export function PatientForm({ open, onClose, patient, initialIdNumber }: { open: boolean; onClose: () => void; patient?: Patient; initialIdNumber?: string }) {
  const { user } = useSession();
  const ui = useUi();
  const [f, setF] = useState<Draft>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dup, setDup] = useState<Patient | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setDup(null);
    setF(patient ? { ...empty, ...patient } : { ...empty, idNumber: initialIdNumber || '' });
  }, [open, patient, initialIdNumber]);

  // პირადი ნომრის შეყვანისთანავე ვამოწმებთ, ხომ არ არის პაციენტი უკვე რეგისტრირებული
  useEffect(() => {
    if (f.idType === 'NONE' || f.idNumber.trim().length < 5) return setDup(null);
    let live = true;
    findByIdNumber(f.idNumber, patient?.id).then((p) => live && setDup(p || null));
    return () => {
      live = false;
    };
  }, [f.idNumber, f.idType, patient?.id]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setF((s) => ({ ...s, [k]: v }));
  const age = ageOf(f.birthDate) ?? 99;
  const minor = age < 18;
  const repRequired = age < 16;

  const save = async () => {
    const e = validatePatient(f);
    if (repRequired && !f.guardianName?.trim()) e.guardianName = '16 წლამდე პაციენტისთვის სავალდებულოა მშობელი/კანონიერი წარმომადგენელი';
    setErrors(e);
    if (Object.keys(e).length) return ui.toast('შეასწორეთ მონიშნული ველები', 'err');
    if (dup) return ui.toast('ამ ნომრით პაციენტი უკვე არსებობს', 'err');
    setBusy(true);
    try {
      const clean = { ...f, idNumber: f.idNumber.trim(), firstName: f.firstName.trim(), lastName: f.lastName.trim() };
      if (patient) {
        await updatePatient(patient.id, clean);
        ui.toast('მონაცემები განახლდა');
        onClose();
      } else {
        const p = await createPatient(clean, user!.id);
        ui.toast(`პაციენტი დარეგისტრირდა — ისტორია №${p.cardNumber}`);
        onClose();
        navigate('patient', p.id);
      }
    } catch (err: any) {
      if (err instanceof DuplicatePatientError) setDup(err.existing);
      ui.toast(err.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={patient ? `ისტორია №${patient.cardNumber} — ფორმა №IV-220/ა` : 'ახალი პაციენტის რეგისტრაცია — ფორმა №IV-220/ა'}
      footer={
        <>
          <Button onClick={onClose}>გაუქმება</Button>
          <Button variant="primary" onClick={save} loading={busy} disabled={!!dup}>
            {patient ? 'შენახვა' : 'რეგისტრაცია და ბარათის გახსნა'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <section>
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">იდენტიფიკაცია</h4>
          <p className="text-[11px] text-slate-500 mb-2">
            ისტორიის ნომერი ენიჭება ავტომატურად წლის მიხედვით (1/26, 2/26 …) და აღარ იცვლება. პაციენტის ყველა მონაცემი ერთიანდება პირადი ნომრისა და ისტორიის ნომრის ქვეშ.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="დოკუმენტის ტიპი">
              <Select value={f.idType} onChange={(e) => set('idType', e.target.value as Draft['idType'])}>
                <option value="GE">საქართველოს მოქალაქის პირადი ნომერი</option>
                <option value="PASSPORT">უცხოეთის მოქალაქე — პასპორტი</option>
                <option value="NONE">დოკუმენტის გარეშე (ახალშობილი და სხვ.)</option>
              </Select>
            </Field>
            {f.idType !== 'NONE' && (
              <Field
                label={f.idType === 'GE' ? 'პირადი ნომერი (11 ციფრი)' : 'პასპორტის ნომერი'}
                required
                error={errors.idNumber}
                hint={f.idType === 'GE' && f.idNumber && !isValidGeId(f.idNumber) ? `${f.idNumber.length}/11` : undefined}
              >
                <Input
                  value={f.idNumber}
                  inputMode={f.idType === 'GE' ? 'numeric' : 'text'}
                  maxLength={f.idType === 'GE' ? 11 : 20}
                  onChange={(e) => set('idNumber', f.idType === 'GE' ? e.target.value.replace(/\D/g, '') : e.target.value.toUpperCase())}
                  className="font-mono tracking-wider"
                  autoFocus={!patient}
                />
              </Field>
            )}
            <Field label="მოქალაქეობა">
              <Input value={f.citizenship} onChange={(e) => set('citizenship', e.target.value)} />
            </Field>
          </div>
          {dup && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <span className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  ამ ნომრით უკვე რეგისტრირებულია: <b>{patientName(dup)}</b>, {fmtDate(dup.birthDate)}, ისტორია №{dup.cardNumber}. ერთ პირზე მეორე ბარათი არ იხსნება.
                </span>
              </span>
              <Button size="sm" icon={<UserCheck className="w-3.5 h-3.5" />} onClick={() => (onClose(), navigate('patient', dup.id))}>
                ბარათის გახსნა
              </Button>
            </div>
          )}
        </section>

        <section>
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">პირადი მონაცემები</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="გვარი" required error={errors.lastName}>
              <Input value={f.lastName} onChange={(e) => set('lastName', e.target.value)} />
            </Field>
            <Field label="სახელი" required error={errors.firstName}>
              <Input value={f.firstName} onChange={(e) => set('firstName', e.target.value)} />
            </Field>
            <Field label="მამის სახელი">
              <Input value={f.fatherName} onChange={(e) => set('fatherName', e.target.value)} />
            </Field>
            <Field label="დაბადების თარიღი" required error={errors.birthDate} hint={f.birthDate ? `${ageOf(f.birthDate)} წლის` : undefined}>
              <Input type="date" value={f.birthDate} onChange={(e) => set('birthDate', e.target.value)} />
            </Field>
            <Field label="სქესი">
              <Select value={f.sex} onChange={(e) => set('sex', e.target.value as 'M' | 'F')}>
                <option value="M">მამრობითი</option>
                <option value="F">მდედრობითი</option>
              </Select>
            </Field>
            <Field label="სისხლის ჯგუფი / Rh">
              <Select value={f.bloodGroup} onChange={(e) => set('bloodGroup', e.target.value)}>
                <option value="">უცნობია</option>
                {['O(I) Rh+', 'O(I) Rh−', 'A(II) Rh+', 'A(II) Rh−', 'B(III) Rh+', 'B(III) Rh−', 'AB(IV) Rh+', 'AB(IV) Rh−'].map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </Select>
            </Field>
            <Field label="ტელეფონი" required error={errors.phone}>
              <Input value={f.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" />
            </Field>
            <Field label="დამატებითი ტელეფონი">
              <Input value={f.phone2} onChange={(e) => set('phone2', e.target.value)} inputMode="tel" />
            </Field>
            <Field label="ელ. ფოსტა">
              <Input value={f.email} onChange={(e) => set('email', e.target.value)} type="email" />
            </Field>
            <Field label="მისამართი (ფაქტობრივი)" className="sm:col-span-2">
              <Input value={f.address} onChange={(e) => set('address', e.target.value)} />
            </Field>
            <Field label="სამუშაო ადგილი, თანამდებობა (მოსწავლე/სტუდენტი — სასწავლებელი, კლასი/კურსი)">
              <Input value={f.workplace} onChange={(e) => set('workplace', e.target.value)} />
            </Field>
            <Field label="სადაზღვევო კომპანია / პროგრამა">
              <Input value={f.insurance} onChange={(e) => set('insurance', e.target.value)} placeholder="მაგ.: საყოველთაო ჯანდაცვა, კერძო დაზღვევა" />
            </Field>
            <Field label="პოლისის №">
              <Input value={f.insurancePolicy} onChange={(e) => set('insurancePolicy', e.target.value)} />
            </Field>
          </div>
        </section>

        {(minor || f.guardianName) && (
          <section className={cls('rounded-lg p-3', minor ? 'bg-sky-50 border border-sky-200' : '')}>
            <h4 className="text-xs font-bold uppercase tracking-wide text-sky-700 mb-1">
              მშობელი / კანონიერი წარმომადგენელი {repRequired ? '(16 წლამდე — სავალდებულო)' : minor ? '(16–18 წელი)' : ''}
            </h4>
            <p className="text-[11px] text-sky-800 mb-2">
              {repRequired
                ? '„პაციენტის უფლებების შესახებ“ კანონი, მუხ. 41.2: 16 წლამდე პაციენტს მომსახურება ეწევა მხოლოდ მშობლის ან კანონიერი წარმომადგენლის თანხმობით.'
                : minor
                  ? 'მუხ. 41.3: 16 წელს მიღწეული პაციენტი თავად აცხადებს თანხმობას; გადაწყვეტილების შესახებ ეცნობება ნათესავს ან კანონიერ წარმომადგენელს.'
                  : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Field label="სახელი, გვარი" required={repRequired} error={errors.guardianName}>
                <Input value={f.guardianName} onChange={(e) => set('guardianName', e.target.value)} />
              </Field>
              <Field label="პირადი ნომერი">
                <Input value={f.guardianIdNumber} maxLength={11} onChange={(e) => set('guardianIdNumber', e.target.value.replace(/\D/g, ''))} className="font-mono" />
              </Field>
              <Field label="კავშირი">
                <Input value={f.guardianRelation} onChange={(e) => set('guardianRelation', e.target.value)} placeholder="დედა / მამა / მეურვე" />
              </Field>
              <Field label="ტელეფონი">
                <Input value={f.guardianPhone} onChange={(e) => set('guardianPhone', e.target.value)} />
              </Field>
            </div>
          </section>
        )}

        <section>
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">სამედიცინო ანამნეზი და რისკები</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="ალერგია (მათ შორის – საანესთეზიო საშუალებებზე)">
              <Textarea rows={2} value={f.allergies} onChange={(e) => set('allergies', e.target.value)} placeholder="არ აღენიშნება / ..." />
            </Field>
            <Field label="გადატანილი ან/და თანმხლები დაავადებები, მდგომარეობები">
              <Textarea rows={2} value={f.chronicDiseases} onChange={(e) => set('chronicDiseases', e.target.value)} />
            </Field>
            <Field label="მუდმივად მიღებული მედიკამენტები">
              <Textarea rows={2} value={f.medications} onChange={(e) => set('medications', e.target.value)} />
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {RISK_FLAGS.filter((r) => f.sex === 'F' || !['ორსულობა', 'ძუძუთი კვება'].includes(r)).map((r) => {
              const on = f.riskFlags.includes(r);
              return (
                <button
                  type="button"
                  key={r}
                  onClick={() => set('riskFlags', on ? f.riskFlags.filter((x) => x !== r) : [...f.riskFlags, r])}
                  className={cls('rounded-full border px-2.5 py-1 text-xs', on ? 'border-red-300 bg-red-50 text-red-700 font-medium' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}
                >
                  {on ? '✓ ' : ''}
                  {r}
                </button>
              );
            })}
          </div>
          <Field label="შენიშვნა" className="mt-3">
            <Textarea rows={2} value={f.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </section>

        <label className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm">
          <input type="checkbox" className="mt-0.5 accent-teal-600" checked={f.pdConsent} onChange={(e) => set('pdConsent', e.target.checked)} />
          <span>
            პაციენტმა (კანონიერმა წარმომადგენელმა) გასცა წერილობითი თანხმობა ჯანმრთელობასთან დაკავშირებული (განსაკუთრებული კატეგორიის) პერსონალური მონაცემების დამუშავებაზე
            <span className="block text-xs text-slate-500">საქართველოს კანონი „პერსონალურ მონაცემთა დაცვის შესახებ“. ხელმოსაწერი ფორმა იბეჭდება ბარათის „დოკუმენტები“ განყოფილებიდან.</span>
          </span>
        </label>
      </div>
    </Modal>
  );
}
