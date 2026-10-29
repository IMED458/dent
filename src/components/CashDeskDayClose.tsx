import React, { useState } from 'react';
import { CashShift } from '../types';
import { DollarSign, Lock, AlertTriangle, CheckCircle, Printer, RefreshCw } from 'lucide-react';

interface CashDeskDayCloseProps {
  currentShift: CashShift | null;
  onCloseShift: (shiftId: string, actualCash: number, notes?: string) => void;
}

export const CashDeskDayClose: React.FC<CashDeskDayCloseProps> = ({
  currentShift,
  onCloseShift
}) => {
  const [actualCashInput, setActualCashInput] = useState<number>(
    currentShift ? currentShift.expectedCashGel : 0
  );
  const [closingNotes, setClosingNotes] = useState('');
  const [isClosedSuccess, setIsClosedSuccess] = useState(false);

  if (!currentShift) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center space-y-4">
        <Lock className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">აქტიური სალაროს ცვლა არ არის გახსნილი</h2>
        <p className="text-xs text-slate-500">
          ახალი ცვლის გასახსნელად მიმართეთ უფროს მოლარეს ან ადმინისტრატორს.
        </p>
      </div>
    );
  }

  const isShiftClosed = currentShift.status === 'CLOSED';
  const cashVariance = (actualCashInput || 0) - currentShift.expectedCashGel;

  const handleCloseClick = () => {
    onCloseShift(currentShift.id, actualCashInput, closingNotes);
    setIsClosedSuccess(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">სალარო & დღის დახურვის ანგარიში (Day Closing Shift)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            მოლარე: <strong className="text-slate-800">{currentShift.cashierName}</strong> | გახსნის დრო: {currentShift.openedAt}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isShiftClosed ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {isShiftClosed ? '🔒 ცვლა დახურულია' : '● ცვლა აქტიურია'}
          </span>
        </div>
      </div>

      {isClosedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>დღის დახურვა წარმატებით დასრულდა! სალაროს ცვლა დაბლოკილია და აუდიტი დაფიქსირებულია.</span>
        </div>
      )}

      {/* Main Shift Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">საწყისი ნაშთი</span>
          <p className="text-xl font-extrabold text-slate-800 mt-1">{currentShift.openingBalanceGel.toFixed(2)} ₾</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ნაღდი ფული (Cash)</span>
          <p className="text-xl font-extrabold text-teal-600 mt-1">{currentShift.totalCashCollectedGel.toFixed(2)} ₾</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ბარათით (POS Terminal)</span>
          <p className="text-xl font-extrabold text-blue-600 mt-1">{currentShift.totalCardCollectedGel.toFixed(2)} ₾</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">მოსალოდნელი ნაღდი სალაროში</span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{currentShift.expectedCashGel.toFixed(2)} ₾</p>
        </div>
      </div>

      {/* Actual Cash Reconciliation Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-md space-y-6 max-w-2xl mx-auto">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
          ფაქტობრივი ნაღდი ფულის დათვლა & შედარება:
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              ფაქტობრივად დათვლილი ნაღდი ფული სალაროში (GEL):
            </label>
            <input
              type="number"
              step="0.01"
              disabled={isShiftClosed}
              value={actualCashInput}
              onChange={(e) => setActualCashInput(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 font-extrabold text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div
            className={`p-4 rounded-lg border text-xs font-bold flex items-center justify-between ${
              cashVariance === 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : cashVariance > 0
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <span>სალაროს სხვაობა (Cash Variance):</span>
            <span className="text-sm font-extrabold">{cashVariance.toFixed(2)} GEL</span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">შენიშვნები ცვლის დახურვისას:</label>
            <textarea
              rows={2}
              disabled={isShiftClosed}
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              placeholder="მაგ: სალაროს სხვაობა გამოწვეულია ხურდის არარსებობით..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {!isShiftClosed && (
            <button
              onClick={handleCloseClick}
              className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4 text-teal-400" />
              <span>ცვლის დახურვა & სალაროს დაბლოკვა</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
