import React, { useState } from 'react';
import { Patient } from '../types';
import { Scan, ZoomIn, ZoomOut, AlertCircle, ShieldCheck } from 'lucide-react';

interface RadiologyViewerProps {
  patient: Patient;
}

export const RadiologyViewer: React.FC<RadiologyViewerProps> = ({ patient }) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [pregnancyCheck, setPregnancyCheck] = useState(true);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Scan className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">რადიოლოგიური მოდული (X-Ray / OPG / CBCT Viewer)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            პაციენტი: <strong className="text-slate-800">{patient.firstName} {patient.lastName}</strong> | DICOM სურათების ანალიზი
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 25, 200))}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs font-bold"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 25, 50))}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-xs font-bold"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pregnancy Safety Check Bar */}
      <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>ორსულობის უსაფრთხოების გადამოწმების პროტოკოლი:</span>
        </div>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={pregnancyCheck}
            onChange={(e) => setPregnancyCheck(e.target.checked)}
            className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
          />
          <span className="font-bold">დადასტურებულია (ორსულობის რისკი გამორიცხულია)</span>
        </label>
      </div>

      {/* Main Radiology Canvas Viewer */}
      <div className="bg-slate-950 p-8 rounded-xl border border-slate-800 shadow-xl flex flex-col items-center justify-center min-h-[400px]">
        <div
          style={{ transform: `scale(${zoomLevel / 100})` }}
          className="transition-transform duration-200 border-2 border-slate-700 rounded-lg p-4 bg-black shadow-2xl flex flex-col items-center max-w-xl text-center space-y-4"
        >
          {/* Simulated OPG Radiograph */}
          <div className="w-96 h-56 bg-slate-900 border border-slate-700 rounded flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-800 to-slate-900 opacity-90"></div>
            <p className="relative z-10 text-teal-400 font-mono text-xs font-bold">
              [PANORAMIC OPG RADIOGRAPH SIMULATION]
              <br />
              PATIENT: {patient.firstName} {patient.lastName}
              <br />
              DATE: 2026-08-01
            </p>
          </div>

          <p className="text-slate-400 text-xs font-mono">
            გადიდება: {zoomLevel}% | რადიაციული დოზა: 0.015 mSv
          </p>
        </div>
      </div>
    </div>
  );
};
