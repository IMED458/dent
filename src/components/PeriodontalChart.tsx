import React, { useState } from 'react';
import { PeriodontalExam, Patient } from '../types';
import { Layers, Activity, AlertCircle, CheckCircle, FileText } from 'lucide-react';

interface PeriodontalChartProps {
  patient: Patient;
  exams: PeriodontalExam[];
}

export const PeriodontalChart: React.FC<PeriodontalChartProps> = ({ patient, exams }) => {
  const latestExam = exams[0];

  const initialProbing = latestExam?.teeth[11]?.sites?.mesiobuccal?.probingDepth || 3;
  const initialBop = latestExam?.teeth[11]?.sites?.mesiobuccal?.bop ?? true;

  const [siteDepths, setSiteDepths] = useState<number[]>([initialProbing, 2, 3, 2, 2, 3]);
  const [siteBops, setSiteBops] = useState<boolean[]>([initialBop, false, true, false, false, false]);

  const handleDepthChange = (index: number, val: number) => {
    const next = [...siteDepths];
    next[index] = val;
    setSiteDepths(next);
  };

  const handleBopChange = (index: number, val: boolean) => {
    const next = [...siteBops];
    next[index] = val;
    setSiteBops(next);
  };

  const handleResetSite = (index: number) => {
    const updatedDepths = [...siteDepths];
    const updatedBops = [...siteBops];
    updatedDepths[index] = 2; // normal depth
    updatedBops[index] = false; // no bleeding
    setSiteDepths(updatedDepths);
    setSiteBops(updatedBops);
  };

  const handleResetAllSites = () => {
    setSiteDepths([2, 2, 2, 2, 2, 2]);
    setSiteBops([false, false, false, false, false, false]);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">პერიოდონტოლოგიური რუკა (6-Point Periodontal Chart)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            პაციენტი: <strong className="text-slate-800">{patient.firstName} {patient.lastName}</strong> | BOP % და CAL ავტომატური კალკულატორით
          </p>
        </div>
        <div className="px-3 py-1.5 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg text-xs font-bold">
          ბოლო გამოკვლევა: {latestExam ? latestExam.examDate : 'დღეს'}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">სისხლდენის ინდექსი (BOP %)</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">{latestExam?.bopPercentage || 18.5}%</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Bleeding on Probing target &lt; 10%</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ნადების ინდექსი (Plaque %)</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{latestExam?.plaquePercentage || 24.0}%</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Plaque Control Record</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">საშუალო ზონდირების სიღრმე</p>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">{latestExam?.meanProbingDepth || 2.4} mm</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Mean Probing Pocket Depth</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ღრმა ჯიბეები (≥ 5mm)</p>
          <p className="text-2xl font-extrabold text-rose-700 mt-1">{latestExam?.deepPocketsCount || 1}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">High Periodontal Risk Sites</p>
        </div>
      </div>

      {/* Interactive 6-Point Site Entry Grid */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            კბილის №11 — 6 წერტილის გაზომვის რედაქტორი:
          </h3>

          <button
            onClick={handleResetAllSites}
            className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all"
          >
            🧹 ყველა წერტილის გასუფთავება / წაშლა
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {[
            'Mesiobuccal (MB)',
            'Midbuccal (B)',
            'Distobuccal (DB)',
            'Mesiolingual (ML)',
            'Midlingual (L)',
            'Distolingual (DL)'
          ].map((siteName, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">{siteName}</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500">PD (mm):</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={siteDepths[idx]}
                  onChange={(e) => handleDepthChange(idx, Number(e.target.value))}
                  className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-800"
                />
              </div>
              <label className="flex items-center space-x-2 text-[11px] text-rose-700 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={siteBops[idx]}
                  onChange={(e) => handleBopChange(idx, e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <span>BOP (სისხლდენა)</span>
              </label>

              <button
                onClick={() => handleResetSite(idx)}
                className="w-full mt-1 text-[10px] text-slate-500 hover:text-rose-600 font-bold underline"
              >
                წაშლა / ნორმაზე დასმა
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
