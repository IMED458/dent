import React, { useState } from 'react';
import { Patient, PatientAlert, User, OdontogramSnapshot, PeriodontalExam, CalculationSheet, ToothState } from '../types';
import { User as UserIcon, AlertTriangle, Calendar, Users, Activity, FileText, Camera, DollarSign, ShieldAlert, Edit2, Save, Plus, CheckCircle2, Phone, Mail, MapPin, Briefcase, CreditCard } from 'lucide-react';
import { Odontogram } from './Odontogram';
import { PeriodontalChart } from './PeriodontalChart';
import { CalculationEngine } from './CalculationEngine';
import { FormsManager } from './FormsManager';
import { RadiologyViewer } from './RadiologyViewer';

interface PatientProfileProps {
  patient: Patient;
  doctors: User[];
  odontogramHistory: OdontogramSnapshot[];
  currentOdontogram: OdontogramSnapshot | null;
  periodontalExams: PeriodontalExam[];
  calculations: CalculationSheet[];
  onSaveOdontogram: (teeth: Record<number, ToothState>, notes: string) => void;
  onUpdatePatient: (updatedPatient: Patient) => void;
  onBackToPatientsList?: () => void;
}

export const PatientProfile: React.FC<PatientProfileProps> = ({
  patient,
  doctors,
  odontogramHistory,
  currentOdontogram,
  periodontalExams,
  calculations,
  onSaveOdontogram,
  onUpdatePatient,
  onBackToPatientsList
}) => {
  const [activeProfileTab, setActiveProfileTab] = useState<
    'info' | 'odontogram' | 'periodontics' | 'calculation' | 'forms' | 'radiology' | 'appointments'
  >('info');

  const [isEditingInfo, setIsEditingInfo] = useState(false);

  // Editable Form State for Patient Info
  const [phone, setPhone] = useState(patient.phone);
  const [email, setEmail] = useState(patient.email);
  const [address, setAddress] = useState(patient.address);
  const [workplace, setWorkplace] = useState(patient.workplace || '');
  const [emergencyContact, setEmergencyContact] = useState(patient.emergencyContact || '');
  const [insurerName, setInsurerName] = useState(patient.insurerName || '');
  const [policyNumber, setPolicyNumber] = useState(patient.policyNumber || '');

  // Add Alert State
  const [isAddAlertOpen, setIsAddAlertOpen] = useState(false);
  const [alertType, setAlertType] = useState<PatientAlert['type']>('ALLERGY');
  const [alertTitle, setAlertTitle] = useState('ალერგია პენიცილინზე');
  const [alertDesc, setAlertDesc] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('CRITICAL');

  const handleSavePatientDetails = () => {
    const updated = {
      ...patient,
      phone,
      email,
      address,
      workplace,
      emergencyContact,
      insurerName,
      policyNumber
    };

    fetch(`/api/patients/${patient.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.patient) {
          onUpdatePatient(data.patient);
          setIsEditingInfo(false);
        }
      })
      .catch(() => {});
  };

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlert: PatientAlert = {
      id: `al-${Date.now()}`,
      type: alertType,
      title: alertTitle,
      description: alertDesc || alertTitle,
      severity: alertSeverity,
      active: true,
      createdAt: new Date().toISOString().substring(0, 10)
    };

    const updated = {
      ...patient,
      alerts: [newAlert, ...patient.alerts]
    };

    fetch(`/api/patients/${patient.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.patient) {
          onUpdatePatient(data.patient);
          setIsAddAlertOpen(false);
          setAlertDesc('');
        }
      })
      .catch(() => {});
  };

  return (
    <div className="space-y-6">
      {/* Back to Patients List Bar */}
      {onBackToPatientsList && (
        <div className="flex items-center justify-between bg-white p-3 px-5 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={onBackToPatientsList}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all"
          >
            <span>← პაციენტების სიაში დაბრუნება (Patients Directory)</span>
          </button>

          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            არჩეული პაციენტი: <strong className="text-slate-800 font-bold">{patient.firstName} {patient.lastName}</strong>
          </span>
        </div>
      )}

      {/* Patient Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center font-extrabold text-teal-300 text-xl shadow-inner shrink-0">
              {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-extrabold tracking-tight">
                  {patient.firstName} {patient.lastName}
                </h1>
                {patient.vip && (
                  <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black uppercase shadow-sm">
                    ⭐ VIP
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1">
                <span className="font-mono bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                  პირადი №: <strong className="text-teal-400">{patient.personalNumber}</strong>
                </span>
                <span className="font-mono bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                  ბარათის №: <strong className="text-white">{patient.medicalCardNumber}</strong>
                </span>
                <span>დაბადება: {patient.dob}</span>
                <span>სქესი: {patient.sex === 'MALE' ? 'მამრობითი' : 'მდედრობითი'}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveProfileTab('odontogram')}
              className="px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-md transition-all"
            >
              🦷 ოდონტოგრამა
            </button>
            <button
              onClick={() => setActiveProfileTab('forms')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-extrabold transition-all"
            >
              📋 ფორმები
            </button>
            <button
              onClick={() => setActiveProfileTab('calculation')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-extrabold transition-all"
            >
              💰 კალკულაცია
            </button>
          </div>
        </div>

        {/* Medical Alerts Bar */}
        {patient.alerts.length > 0 && (
          <div className="bg-rose-50 border-t border-b border-rose-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-rose-900 text-xs font-bold">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <span>სამედიცინო გაფრთხილებები:</span>
              <div className="flex flex-wrap gap-2 ml-2">
                {patient.alerts.map((al) => (
                  <span
                    key={al.id}
                    className="px-2.5 py-1 bg-rose-200/80 text-rose-950 rounded-lg text-[11px] font-black border border-rose-300 flex items-center space-x-1"
                  >
                    <span>⚠️ {al.title}</span>
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsAddAlertOpen(true)}
              className="text-xs font-extrabold text-rose-800 hover:underline shrink-0"
            >
              + რისკის დამატება
            </button>
          </div>
        )}

        {/* Profile Navigation Tabs */}
        <div className="flex space-x-1 bg-slate-50 p-2 border-t border-slate-200 overflow-x-auto">
          {[
            { id: 'info', label: '👤 პასპორტული მონაცემები & რისკები' },
            { id: 'odontogram', label: '🦷 ოდონტოგრამა (FDI)' },
            { id: 'periodontics', label: '📊 პერიოდონტოგრამა' },
            { id: 'calculation', label: '💰 კალკულაციები (IV-220)' },
            { id: 'forms', label: '📋 ოფიციალური ფორმები' },
            { id: 'radiology', label: '📷 რენტგენი & OPG' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveProfileTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                activeProfileTab === tab.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Renderer */}
      <div>
        {activeProfileTab === 'info' && (
          <div className="space-y-6">
            {/* Main Details Grid */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <UserIcon className="w-4 h-4 text-teal-600" />
                  <span>პაციენტის დეტალური პასპორტული მონაცემები</span>
                </h3>

                {!isEditingInfo ? (
                  <button
                    onClick={() => setIsEditingInfo(true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center space-x-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>რედაქტირება</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSavePatientDetails}
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>შენახვა</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                <div>
                  <span className="text-slate-500 font-bold block mb-1">ტელეფონის ნომერი:</span>
                  {isEditingInfo ? (
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  ) : (
                    <span className="font-mono font-bold text-slate-900 text-sm">{patient.phone}</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 font-bold block mb-1">ელექტრონული ფოსტა:</span>
                  {isEditingInfo ? (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  ) : (
                    <span className="font-bold text-slate-900 text-sm">{patient.email || '—'}</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 font-bold block mb-1">საცხოვრებელი მისამართი:</span>
                  {isEditingInfo ? (
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  ) : (
                    <span className="font-bold text-slate-900 text-sm">{patient.address}</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 font-bold block mb-1">სამუშაო ადგილი / პოზიცია:</span>
                  {isEditingInfo ? (
                    <input
                      type="text"
                      value={workplace}
                      onChange={(e) => setWorkplace(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  ) : (
                    <span className="font-bold text-slate-900 text-sm">{patient.workplace || 'მითითებული არ არის'}</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 font-bold block mb-1">საგანგებო საკონტაქტო პირი:</span>
                  {isEditingInfo ? (
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  ) : (
                    <span className="font-bold text-slate-900 text-sm">{patient.emergencyContact || '—'}</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 font-bold block mb-1">სადაზღვევო კომპანია & პოლისი:</span>
                  {isEditingInfo ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={insurerName}
                        onChange={(e) => setInsurerName(e.target.value)}
                        placeholder="მზღვეველი"
                        className="w-full p-2 border border-slate-300 rounded-lg"
                      />
                      <input
                        type="text"
                        value={policyNumber}
                        onChange={(e) => setPolicyNumber(e.target.value)}
                        placeholder="პოლისის №"
                        className="w-full p-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  ) : (
                    <span className="font-bold text-slate-900 text-sm">
                      {patient.insurerName || 'დაუზღვეველი'} {patient.policyNumber ? `(${patient.policyNumber})` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Medical Risk Alerts Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>სამედიცინო რისკების & ალერგიების რეესტრი</span>
                </h3>

                <button
                  onClick={() => setIsAddAlertOpen(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ახალი რისკის დამატება</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {patient.alerts.length > 0 ? (
                  patient.alerts.map((al) => (
                    <div key={al.id} className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="font-extrabold text-rose-950 text-sm">⚠️ {al.title}</strong>
                        <span className="px-2 py-0.5 bg-rose-200 text-rose-900 rounded font-bold text-[10px] uppercase">
                          {al.severity}
                        </span>
                      </div>
                      <p className="text-rose-900 font-medium">{al.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-4 text-center text-slate-400 italic">
                    სპეციფიკური სამედიცინო რისკები ან ალერგიები არ არის დაფიქსირებული.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeProfileTab === 'odontogram' && (
          <Odontogram
            patient={patient}
            history={odontogramHistory}
            currentOdontogram={currentOdontogram}
            onSaveSnapshot={onSaveOdontogram}
          />
        )}

        {activeProfileTab === 'periodontics' && (
          <PeriodontalChart patient={patient} exams={periodontalExams} />
        )}

        {activeProfileTab === 'calculation' && (
          <CalculationEngine
            patient={patient}
            calculations={calculations}
            onCreateCalculation={() => {}}
          />
        )}

        {activeProfileTab === 'forms' && <FormsManager patient={patient} />}

        {activeProfileTab === 'radiology' && <RadiologyViewer patient={patient} />}
      </div>

      {/* Add Alert Modal */}
      {isAddAlertOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>სამედიცინო გაფრთხილების დამატება</span>
              </h3>
              <button onClick={() => setIsAddAlertOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAlert} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">რისკის ტიპი</label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
                >
                  <option value="ALLERGY">ალერგია (ანტიბიოტიკი/მედიკამენტი)</option>
                  <option value="ANESTHESIA_RISK">საანესთეზიო რისკი / ეპინეფრინი</option>
                  <option value="ANTICOAGULANT">ანტიკოაგულანტი (სისხლის გამათხელებელი)</option>
                  <option value="CARDIOVASCULAR">გულ-სისხლძარღვთა რისკი</option>
                  <option value="DIABETES">შაქრიანი დიაბეტი</option>
                  <option value="PREGNANCY">ორსულობა</option>
                  <option value="HEPATITIS">ჰეპატიტი / B,C</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">სათაური *</label>
                <input
                  type="text"
                  required
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">დეტალური აღწერა</label>
                <textarea
                  rows={2}
                  value={alertDesc}
                  onChange={(e) => setAlertDesc(e.target.value)}
                  placeholder="მაგ: პაციენტს აღენიშნება კვინკეს შეშუპება პენიცილინზე..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">სიმწვავის დონე</label>
                <select
                  value={alertSeverity}
                  onChange={(e) => setAlertSeverity(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="CRITICAL">🚨 კრიტიკული (CRITICAL)</option>
                  <option value="HIGH">⚠️ მაღალი (HIGH)</option>
                  <option value="MEDIUM">⚡ საშუალო (MEDIUM)</option>
                  <option value="LOW">ℹ️ დაბალი (LOW)</option>
                </select>
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddAlertOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-sm"
                >
                  რისკის შენახვა
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
