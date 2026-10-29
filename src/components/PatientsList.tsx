import React, { useState } from 'react';
import { Patient } from '../types';
import {
  Users,
  Search,
  UserPlus,
  ShieldAlert,
  Calendar,
  Phone,
  Filter,
  CreditCard,
  ArrowRight,
  Globe,
  Baby,
  Star,
  FileText
} from 'lucide-react';

interface PatientsListProps {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onOpenNewPatientRegistration: () => void;
}

export const PatientsList: React.FC<PatientsListProps> = ({
  patients,
  onSelectPatient,
  onOpenNewPatientRegistration
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DEBTORS' | 'FOREIGN' | 'MINORS' | 'VIP'>('ALL');

  // Filter logic
  const filteredPatients = patients.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.firstName.toLowerCase().includes(term) ||
      p.lastName.toLowerCase().includes(term) ||
      p.personalNumber.includes(term) ||
      p.medicalCardNumber.toLowerCase().includes(term) ||
      p.phone.includes(term) ||
      (p.passportNumber && p.passportNumber.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (filterType === 'FOREIGN') return p.isForeignCitizen;
    if (filterType === 'MINORS') return p.isMinor;
    if (filterType === 'VIP') return p.vip;
    if (filterType === 'DEBTORS') return p.alerts.some((a) => a.type === 'DEBT_UNPAID');

    return true;
  });

  const totalPatients = patients.length;
  const foreignCount = patients.filter((p) => p.isForeignCitizen).length;
  const minorsCount = patients.filter((p) => p.isMinor).length;
  const vipCount = patients.filter((p) => p.vip).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Stats */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                პაციენტების რეესტრი (Patients Directory)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                სისტემაში რეგისტრირებულია სულ <strong className="text-teal-700 font-bold">{totalPatients}</strong> პაციენტი
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenNewPatientRegistration}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold flex items-center space-x-2 shadow-md transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ ახალი პაციენტის რეგისტრაცია</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setFilterType('ALL')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterType === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-teal-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">სულ პაციენტები</span>
            <Users className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-black mt-2">{totalPatients}</p>
        </div>

        <div
          onClick={() => setFilterType('FOREIGN')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterType === 'FOREIGN'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-teal-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">უცხოელი პაციენტები</span>
            <Globe className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black mt-2">{foreignCount}</p>
        </div>

        <div
          onClick={() => setFilterType('MINORS')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterType === 'MINORS'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-teal-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">არასრულწლოვნები</span>
            <Baby className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black mt-2">{minorsCount}</p>
        </div>

        <div
          onClick={() => setFilterType('VIP')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterType === 'VIP'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white text-slate-800 border-slate-200 hover:border-teal-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">VIP პაციენტები</span>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black mt-2">{vipCount}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ძებნა: სახელი, გვარი, პირადი №, პასპორტი, ტელეფონი, ბარათის №..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5" />
            <span>ფილტრი:</span>
          </span>

          {[
            { id: 'ALL', label: 'ყველა' },
            { id: 'FOREIGN', label: '🌐 უცხოელები' },
            { id: 'MINORS', label: '👶 პედიატრია' },
            { id: 'VIP', label: '⭐ VIP' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === item.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Patients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-slate-200 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <th className="py-3.5 px-4">პაციენტის სახელი & გვარი</th>
                <th className="py-3.5 px-4">პირადი № / პასპორტი</th>
                <th className="py-3.5 px-4">დაბადების თარიღი</th>
                <th className="py-3.5 px-4">ტელეფონი</th>
                <th className="py-3.5 px-4">დაზღვევა</th>
                <th className="py-3.5 px-4">სამედიცინო გაფრთხილებები</th>
                <th className="py-3.5 px-4 text-right">მოქმედება</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    პაციენტი ვერ მოიძებნა მითითებული კრიტერიუმებით.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-teal-50/50 transition-colors cursor-pointer group"
                    onClick={() => onSelectPatient(p)}
                  >
                    {/* Name & Medical Card */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 font-black flex items-center justify-center text-xs shrink-0 border border-teal-200">
                          {p.firstName.charAt(0)}{p.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-slate-900 text-sm group-hover:text-teal-700">
                              {p.firstName} {p.lastName}
                            </span>
                            {p.vip && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded text-[9px] font-bold">
                                ⭐ VIP
                              </span>
                            )}
                            {p.isForeignCitizen && (
                              <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-300 rounded text-[9px] font-bold">
                                🌐 უცხოელი
                              </span>
                            )}
                            {p.isMinor && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 border border-blue-300 rounded text-[9px] font-bold">
                                👶 არასრულწლოვანი
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono block">
                            ბარათი №: <strong className="text-slate-700">{p.medicalCardNumber}</strong>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Personal ID or Passport */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {p.isForeignCitizen ? (
                        <div>
                          <span className="text-indigo-700 block">პასპორტი: {p.passportNumber || p.personalNumber}</span>
                          <span className="text-[10px] text-slate-500 font-sans font-normal">{p.citizenshipCountry}</span>
                        </div>
                      ) : (
                        <span className="text-teal-900">{p.personalNumber}</span>
                      )}
                    </td>

                    {/* DOB */}
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.dob}</span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.phone}</span>
                      </div>
                    </td>

                    {/* Insurance */}
                    <td className="py-3.5 px-4">
                      {p.insurerName ? (
                        <span className="px-2 py-0.5 bg-teal-50 border border-teal-200 text-teal-800 rounded font-bold text-[11px]">
                          {p.insurerName}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">დაუზღვეველი</span>
                      )}
                    </td>

                    {/* Medical Risk Alerts */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {p.alerts.length > 0 ? (
                          p.alerts.map((al) => (
                            <span
                              key={al.id}
                              className="px-2 py-0.5 bg-rose-100 text-rose-900 border border-rose-300 rounded text-[10px] font-extrabold"
                            >
                              ⚠️ {al.title}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[11px]">რისკები არ არის</span>
                        )}
                      </div>
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPatient(p);
                        }}
                        className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs shadow-sm flex items-center space-x-1.5 ml-auto transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>სრული ბარათი →</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
