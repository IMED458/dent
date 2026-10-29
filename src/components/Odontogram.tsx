import React, { useState } from 'react';
import {
  ToothState,
  ToothCondition,
  ToothSurface,
  Patient,
  OdontogramSnapshot
} from '../types';
import { Activity, Clock, Save, History, PlusCircle, CheckCircle } from 'lucide-react';

interface OdontogramProps {
  patient: Patient;
  history: OdontogramSnapshot[];
  currentOdontogram: OdontogramSnapshot | null;
  onSaveSnapshot: (teeth: Record<number, ToothState>, notes: string) => void;
}

const CONDITION_COLORS: Record<ToothCondition, { bg: string; text: string; label: string; border: string }> = {
  HEALTHY: { bg: 'bg-slate-100', text: 'text-slate-800', label: '🧹 წაშლა / ჯანმრთელი (HEALTHY)', border: 'border-slate-300' },
  CARIES: { bg: 'bg-rose-500', text: 'text-white', label: 'კარიესი', border: 'border-rose-600' },
  FILLING: { bg: 'bg-blue-600', text: 'text-white', label: 'ბჟენი (Filling)', border: 'border-blue-700' },
  CROWN: { bg: 'bg-amber-500', text: 'text-white', label: 'გვირგვინი (Crown)', border: 'border-amber-600' },
  BRIDGE_PONTIC: { bg: 'bg-indigo-500', text: 'text-white', label: 'ხიდის სხეული', border: 'border-indigo-600' },
  MISSING: { bg: 'bg-slate-300', text: 'text-slate-500', label: 'არ არსებობს / ექსტრაგირებული', border: 'border-slate-400' },
  IMPLANT: { bg: 'bg-purple-600', text: 'text-white', label: 'იმპლანტი', border: 'border-purple-700' },
  ENDODONTIC_TREATED: { bg: 'bg-emerald-600', text: 'text-white', label: 'ენდოდონტიურად ნამკურნალები', border: 'border-emerald-700' },
  EXTRACT_PLANNED: { bg: 'bg-orange-500', text: 'text-white', label: 'დაგეგმილია ამოღება', border: 'border-orange-600' },
  RETAINED_ROOT: { bg: 'bg-red-900', text: 'text-white', label: 'დარჩენილი ფესვი', border: 'border-red-950' },
  VENEER: { bg: 'bg-teal-500', text: 'text-white', label: 'ვინირი', border: 'border-teal-600' },
  FRACTURE: { bg: 'bg-pink-600', text: 'text-white', label: 'ტრავმა / ბზარი', border: 'border-pink-700' }
};

export const Odontogram: React.FC<OdontogramProps> = ({
  patient,
  history,
  currentOdontogram,
  onSaveSnapshot
}) => {
  const [teeth, setTeeth] = useState<Record<number, ToothState>>(
    currentOdontogram ? currentOdontogram.teeth : {}
  );
  const [selectedTooth, setSelectedTooth] = useState<ToothState | null>(null);
  const [activeToolCondition, setActiveToolCondition] = useState<ToothCondition>('CARIES');
  const [odontogramNotes, setOdontogramNotes] = useState('');
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);

  // FDI Permanent tooth mapping groups
  const upperRight = [18, 17, 16, 15, 14, 13, 12, 11];
  const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28];
  const lowerRight = [48, 47, 46, 45, 44, 43, 42, 41];
  const lowerLeft = [31, 32, 33, 34, 35, 36, 37, 38];

  const handleToothClick = (tNum: number) => {
    const tooth = teeth[tNum] || {
      toothNumber: tNum,
      isDeciduous: false,
      generalCondition: 'HEALTHY',
      surfaces: { Mesial: 'HEALTHY', Distal: 'HEALTHY', Occlusal: 'HEALTHY', Buccal: 'HEALTHY', Lingual: 'HEALTHY' }
    };
    setSelectedTooth(tooth);
  };

  const applyConditionToSurface = (tNum: number, surface: ToothSurface, condition: ToothCondition) => {
    setTeeth((prev) => {
      const currentTooth = prev[tNum] || {
        toothNumber: tNum,
        isDeciduous: false,
        generalCondition: 'HEALTHY',
        surfaces: { Mesial: 'HEALTHY', Distal: 'HEALTHY', Occlusal: 'HEALTHY', Buccal: 'HEALTHY', Lingual: 'HEALTHY' }
      };
      const updatedSurfaces = { ...currentTooth.surfaces, [surface]: condition };
      const updatedTooth = { ...currentTooth, surfaces: updatedSurfaces, generalCondition: condition };
      return { ...prev, [tNum]: updatedTooth };
    });
    if (selectedTooth && selectedTooth.toothNumber === tNum) {
      setSelectedTooth((prev) =>
        prev ? { ...prev, surfaces: { ...prev.surfaces, [surface]: condition }, generalCondition: condition } : null
      );
    }
  };

  const resetToothToHealthy = (tNum: number) => {
    const cleanTooth: ToothState = {
      toothNumber: tNum,
      isDeciduous: false,
      generalCondition: 'HEALTHY',
      surfaces: { Mesial: 'HEALTHY', Distal: 'HEALTHY', Occlusal: 'HEALTHY', Buccal: 'HEALTHY', Lingual: 'HEALTHY' }
    };
    setTeeth((prev) => ({ ...prev, [tNum]: cleanTooth }));
    if (selectedTooth && selectedTooth.toothNumber === tNum) {
      setSelectedTooth(cleanTooth);
    }
  };

  const handleSave = () => {
    onSaveSnapshot(teeth, odontogramNotes);
    setSnapshotSuccess(true);
    setTimeout(() => setSnapshotSuccess(false), 3000);
  };

  const renderToothSVG = (tNum: number) => {
    const tooth = teeth[tNum] || {
      toothNumber: tNum,
      isDeciduous: false,
      generalCondition: 'HEALTHY',
      surfaces: { Mesial: 'HEALTHY', Distal: 'HEALTHY', Occlusal: 'HEALTHY', Buccal: 'HEALTHY', Lingual: 'HEALTHY' }
    };

    const isMissing = tooth.generalCondition === 'MISSING';
    const isImplant = tooth.generalCondition === 'IMPLANT';

    return (
      <div
        onClick={() => handleToothClick(tNum)}
        className="flex flex-col items-center cursor-pointer group transition-transform hover:scale-105"
      >
        <span className="text-[11px] font-bold text-slate-600 mb-1">{tNum}</span>
        
        {/* SVG Tooth rendering with 5 interactive surface segments */}
        <div className="relative w-10 h-10 border border-slate-300 rounded-lg p-0.5 bg-slate-50 shadow-sm overflow-hidden flex items-center justify-center">
          {isMissing ? (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs bg-slate-200">
              ✕
            </div>
          ) : isImplant ? (
            <div className="w-full h-full flex items-center justify-center bg-purple-600 text-white font-bold text-[10px]">
              IMP
            </div>
          ) : (
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Buccal (Top) */}
              <polygon
                points="0,0 100,0 70,30 30,30"
                className={`stroke-slate-400 stroke-[2] transition-colors ${
                  tooth.surfaces.Buccal === 'CARIES'
                    ? 'fill-rose-500'
                    : tooth.surfaces.Buccal === 'FILLING'
                    ? 'fill-blue-600'
                    : tooth.surfaces.Buccal === 'CROWN'
                    ? 'fill-amber-500'
                    : 'fill-white'
                }`}
              />
              {/* Right (Distal or Mesial) */}
              <polygon
                points="100,0 100,100 70,70 70,30"
                className={`stroke-slate-400 stroke-[2] transition-colors ${
                  tooth.surfaces.Distal === 'CARIES'
                    ? 'fill-rose-500'
                    : tooth.surfaces.Distal === 'FILLING'
                    ? 'fill-blue-600'
                    : tooth.surfaces.Distal === 'CROWN'
                    ? 'fill-amber-500'
                    : 'fill-white'
                }`}
              />
              {/* Lingual (Bottom) */}
              <polygon
                points="100,100 0,100 30,70 70,70"
                className={`stroke-slate-400 stroke-[2] transition-colors ${
                  tooth.surfaces.Lingual === 'CARIES'
                    ? 'fill-rose-500'
                    : tooth.surfaces.Lingual === 'FILLING'
                    ? 'fill-blue-600'
                    : tooth.surfaces.Lingual === 'CROWN'
                    ? 'fill-amber-500'
                    : 'fill-white'
                }`}
              />
              {/* Left (Mesial or Distal) */}
              <polygon
                points="0,100 0,0 30,30 30,70"
                className={`stroke-slate-400 stroke-[2] transition-colors ${
                  tooth.surfaces.Mesial === 'CARIES'
                    ? 'fill-rose-500'
                    : tooth.surfaces.Mesial === 'FILLING'
                    ? 'fill-blue-600'
                    : tooth.surfaces.Mesial === 'CROWN'
                    ? 'fill-amber-500'
                    : 'fill-white'
                }`}
              />
              {/* Occlusal (Center) */}
              <polygon
                points="30,30 70,30 70,70 30,70"
                className={`stroke-slate-400 stroke-[2] transition-colors ${
                  tooth.surfaces.Occlusal === 'CARIES'
                    ? 'fill-rose-500'
                    : tooth.surfaces.Occlusal === 'FILLING'
                    ? 'fill-blue-600'
                    : tooth.surfaces.Occlusal === 'CROWN'
                    ? 'fill-amber-500'
                    : 'fill-white'
                }`}
              />
            </svg>
          )}
        </div>
        <span className="text-[9px] text-slate-500 mt-0.5 truncate max-w-[40px]">
          {CONDITION_COLORS[tooth.generalCondition]?.label.substring(0, 6)}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">ინტერაქტიული ოდონტოგრამა (FDI System)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            პაციენტი: <strong className="text-slate-800">{patient.firstName} {patient.lastName}</strong> (პირადი №: {patient.personalNumber})
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            <span>სნეპშოტის შენახვა</span>
          </button>
        </div>
      </div>

      {snapshotSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>ოდონტოგრამის სნეპშოტი წარმატებით შეინახა მონაცემთა ბაზაში!</span>
        </div>
      )}

      {/* Clinical Condition Palette Legend */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          ინსტრუმენტების პალიტრა & ლეგენდა:
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CONDITION_COLORS).map(([cond, item]) => {
            const isSelected = activeToolCondition === cond;
            return (
              <button
                key={cond}
                onClick={() => setActiveToolCondition(cond as ToothCondition)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center space-x-1.5 transition-all border ${
                  item.bg
                } ${item.text} ${item.border} ${isSelected ? 'ring-2 ring-teal-500 ring-offset-1 scale-105 shadow-md' : 'opacity-90 hover:opacity-100'}`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main FDI Odontogram Graphic Stage */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-8">
        {/* Upper Arch (Maxilla) */}
        <div>
          <h3 className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
            ზედა ყბა (MAXILLA) — FDI 18-11 | 21-28
          </h3>
          <div className="flex justify-center items-center space-x-8">
            {/* Quadrant 1 */}
            <div className="flex space-x-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {upperRight.map((tNum) => (
                <div key={tNum}>{renderToothSVG(tNum)}</div>
              ))}
            </div>
            {/* Divider */}
            <div className="h-16 w-0.5 bg-slate-300"></div>
            {/* Quadrant 2 */}
            <div className="flex space-x-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {upperLeft.map((tNum) => (
                <div key={tNum}>{renderToothSVG(tNum)}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Occlusal Plane Guideline */}
        <div className="relative flex items-center justify-center my-2">
          <div className="w-full border-t border-dashed border-slate-300"></div>
          <span className="absolute bg-white px-3 text-[10px] font-bold text-slate-400 uppercase">ოკლუზიური სიბრტყე</span>
        </div>

        {/* Lower Arch (Mandible) */}
        <div>
          <div className="flex justify-center items-center space-x-8">
            {/* Quadrant 4 */}
            <div className="flex space-x-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {lowerRight.map((tNum) => (
                <div key={tNum}>{renderToothSVG(tNum)}</div>
              ))}
            </div>
            {/* Divider */}
            <div className="h-16 w-0.5 bg-slate-300"></div>
            {/* Quadrant 3 */}
            <div className="flex space-x-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {lowerLeft.map((tNum) => (
                <div key={tNum}>{renderToothSVG(tNum)}</div>
              ))}
            </div>
          </div>
          <h3 className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest mt-4 border-t border-slate-100 pt-2">
            ქვედა ყბა (MANDIBLE) — FDI 48-41 | 31-38
          </h3>
        </div>
      </div>

      {/* Selected Tooth Surface Inspector Modal / Panel */}
      {selectedTooth && (
        <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-700 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
            <div>
              <h3 className="text-sm font-bold text-teal-300">
                კბილის №{selectedTooth.toothNumber} დეტალური რედაქტორი & ზედაპირები
              </h3>
              <p className="text-[11px] text-slate-400">
                საერთო სტატუსი: <strong className="text-white">{CONDITION_COLORS[selectedTooth.generalCondition]?.label}</strong>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => resetToothToHealthy(selectedTooth.toothNumber)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1 transition-all"
              >
                <span>🧹 კბილის გასუფთავება / წაშლა</span>
              </button>

              <button
                onClick={() => setSelectedTooth(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded"
              >
                დახურვა ✕
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {(['Buccal', 'Mesial', 'Occlusal', 'Distal', 'Lingual'] as ToothSurface[]).map((surf) => (
              <div key={surf} className="bg-slate-800 p-3 rounded-lg border border-slate-700 space-y-2">
                <span className="text-xs font-bold text-slate-300 block">{surf} (ზედაპირი)</span>
                <p className="text-[11px] text-teal-400 font-medium">
                  {CONDITION_COLORS[selectedTooth.surfaces[surf]]?.label}
                </p>

                <div className="space-y-1">
                  <button
                    onClick={() => applyConditionToSurface(selectedTooth.toothNumber, surf, activeToolCondition)}
                    className="w-full py-1 px-2 bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold rounded shadow-sm"
                  >
                    დაადე: {CONDITION_COLORS[activeToolCondition]?.label}
                  </button>

                  <button
                    onClick={() => applyConditionToSurface(selectedTooth.toothNumber, surf, 'HEALTHY')}
                    className="w-full py-1 px-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-bold rounded"
                  >
                    ❌ ზედაპირის წაშლა
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Odontogram History Timeline */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-slate-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            ოდონტოგრამის ცვლილებების ისტორია (Audit Timeline)
          </h3>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-xs text-slate-400">ისტორია ცარიელია</p>
          ) : (
            history.map((snap) => (
              <div key={snap.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">{snap.timestamp}</span>
                  <span className="text-slate-500 ml-2">— ავტორი: {snap.authorName}</span>
                  {snap.notes && <p className="text-slate-600 text-[11px] mt-0.5">{snap.notes}</p>}
                </div>
                <button
                  onClick={() => setTeeth(snap.teeth)}
                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-[11px] rounded"
                >
                  ამ ვერსიის ჩატვირთვა
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
