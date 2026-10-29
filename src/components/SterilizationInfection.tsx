import React, { useState } from 'react';
import { SterilizationCycle } from '../types';
import { ShieldCheck, AlertTriangle, PlusCircle, CheckCircle, Lock, RefreshCw } from 'lucide-react';

interface SterilizationInfectionProps {
  cycles: SterilizationCycle[];
  onAddCycle: (cycle: Omit<SterilizationCycle, 'id'>) => void;
}

export const SterilizationInfection: React.FC<SterilizationInfectionProps> = ({
  cycles,
  onAddCycle
}) => {
  const [autoclaveModel, setAutoclaveModel] = useState('Melag Vacuklav 41B+');
  const [operatorName, setOperatorName] = useState('თამარ ჯაფარიძე');
  const [tempInput, setTempInput] = useState(134.5);
  const [pressureInput, setPressureInput] = useState(2.15);
  const [exposureInput, setExposureInput] = useState(18);
  const [chemResult, setChemResult] = useState<'PASS' | 'FAIL'>('PASS');
  const [bioResult, setBioResult] = useState<'PASS' | 'FAIL' | 'PENDING'>('PASS');
  const [packageBarcodes, setPackageBarcodes] = useState('PKG-20260805-05, PKG-20260805-06');

  const handleCreateCycle = () => {
    const cycleCount = cycles.length + 1;
    const isFailed = chemResult === 'FAIL' || bioResult === 'FAIL';

    onAddCycle({
      cycleNumber: `CYC-2026-${String(cycleCount).padStart(5, '0')}`,
      autoclaveModel,
      autoclaveSerial: 'SN-MEL-99201',
      operatorName,
      startTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
      endTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
      temperatureCelsius: tempInput,
      pressureBar: pressureInput,
      exposureMinutes: exposureInput,
      chemicalIndicatorResult: chemResult,
      biologicalTestResult: bioResult,
      status: isFailed ? 'FAILED_QUARANTINED' : 'STERILE',
      packageBarcodes: packageBarcodes.split(',').map((s) => s.trim())
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">სტერილიზაცია & ინფექციური კონტროლი (Autoclave Cycles)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ავტოკლავის ციკლების, ქიმიური/ბიოლოგიური ინდიკატორებისა და ინსტრუმენტების შეფუთვების აღრიცხვა
          </p>
        </div>
      </div>

      {/* New Cycle Registration Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
          ახალი სტერილიზაციის ციკლის რეგისტრაცია:
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">ავტოკლავის მოდელი:</label>
            <input
              type="text"
              value={autoclaveModel}
              onChange={(e) => setAutoclaveModel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-2"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">ოპერატორი (პასუხისმგებელი):</label>
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-2"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">ტემპერატურა (°C):</label>
            <input
              type="number"
              step="0.1"
              value={tempInput}
              onChange={(e) => setTempInput(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded p-2"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">წნევა (Bar):</label>
            <input
              type="number"
              step="0.01"
              value={pressureInput}
              onChange={(e) => setPressureInput(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded p-2"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">ექსპოზიციის დრო (წთ):</label>
            <input
              type="number"
              value={exposureInput}
              onChange={(e) => setExposureInput(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded p-2"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">ქიმიური ინდიკატორი:</label>
            <select
              value={chemResult}
              onChange={(e) => setChemResult(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-semibold"
            >
              <option value="PASS">PASS (დაკმაყოფილებულია)</option>
              <option value="FAIL">FAIL (ჩაიშალა - კარანტინი)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">ბიოლოგიური ტესტი:</label>
            <select
              value={bioResult}
              onChange={(e) => setBioResult(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-2 font-semibold"
            >
              <option value="PASS">PASS (ნეგატიური)</option>
              <option value="FAIL">FAIL (პოზიტიური - კარანტინი)</option>
              <option value="PENDING">PENDING (ინკუბაციაშია)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">შეფუთვების ბარკოდები:</label>
            <input
              type="text"
              value={packageBarcodes}
              onChange={(e) => setPackageBarcodes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-2"
            />
          </div>
        </div>

        <button
          onClick={handleCreateCycle}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>ციკლის ჩაწერა & ბარკოდების გენერაცია</span>
        </button>
      </div>

      {/* Cycle Logs List */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          სტერილიზაციის ჟურნალი (Sterilization Audit Journal):
        </h3>

        <div className="space-y-3">
          {cycles.map((cyc) => {
            const isFailed = cyc.status === 'FAILED_QUARANTINED';
            return (
              <div
                key={cyc.id}
                className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs ${
                  isFailed ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <strong className="text-sm font-bold text-slate-900">{cyc.cycleNumber}</strong>
                    <span className="text-slate-500">— {cyc.autoclaveModel}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isFailed ? 'bg-rose-200 text-rose-900' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isFailed ? '⚠️ FAILED / QUARANTINED' : '✓ STERILE'}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    ოპერატორი: {cyc.operatorName} | პარამეტრები: {cyc.temperatureCelsius}°C, {cyc.pressureBar} Bar, {cyc.exposureMinutes} წთ
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    შეფუთვები: {cyc.packageBarcodes.join(', ')}
                  </p>
                </div>

                {isFailed && (
                  <div className="p-2 bg-rose-200 border border-rose-300 text-rose-900 rounded font-bold text-[11px] flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-700" />
                    <span>ყველა დაკავშირებული შეფუთვა ავტომატურად გადავიდა კარანტინში!</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
