import React from 'react';
import {
  Activity,
  Calendar,
  Users,
  FileText,
  Calculator,
  ShieldCheck,
  Package,
  Layers,
  DollarSign,
  Scan,
  UserCheck,
  UserPlus,
  BookOpen,
  User
} from 'lucide-react';
import { RoleName } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: RoleName;
  onOpenManifest: () => void;
  onOpenNewPatientRegistration: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentRole,
  onOpenManifest,
  onOpenNewPatientRegistration
}) => {
  const menuGroups = [
    {
      title: 'პაციენტის მართვა & კლინიკა',
      items: [
        { id: 'patients_list', label: '👥 პაციენტები (Patients)', icon: Users },
        { id: 'patient_profile', label: '👤 პაციენტის ბარათი (Master Profile)', icon: User },
        { id: 'calendar', label: '📅 ექიმების კალენდარი & ჩაწერები', icon: Calendar },
        { id: 'queue', label: '📢 რიგების მართვა (Queue Board)', icon: Activity },
        { id: 'forms', label: '📋 ოფიციალური ფორმები (IV-220/ა)', icon: FileText },
        { id: 'radiology', label: '📷 რენტგენი & DICOM', icon: Scan }
      ]
    },
    {
      title: 'ფინანსები & კალკულაცია (ERP)',
      items: [
        { id: 'calculation', label: '💰 კალკულაცია & PDF (IV-220)', icon: Calculator },
        { id: 'dayclose', label: '🏥 სალარო & დღის დახურვა', icon: DollarSign }
      ]
    },
    {
      title: 'საწყობი & სტერილიზაცია',
      items: [
        { id: 'inventory', label: '📦 საწყობი & FEFO', icon: Package },
        { id: 'sterilization', label: '🧪 სტერილიზაცია & ინფექცია', icon: ShieldCheck }
      ]
    },
    {
      title: 'ადმინისტრირება & აუდიტი',
      items: [
        { id: 'staff', label: '👨‍⚕️ ექიმები & პერსონალი', icon: UserCheck },
        { id: 'audit', label: '📜 აუდიტი & ლოგები', icon: Layers }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col justify-between border-r border-slate-800 h-screen sticky top-0 shadow-xl z-20 shrink-0">
      <div>
        {/* Header Branding */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center font-extrabold text-white shadow-md text-xl">
              D
            </div>
            <div>
              <h1 className="font-bold text-white text-sm tracking-wide leading-tight">DENTAL HIS / ERP</h1>
              <p className="text-[11px] text-teal-400 font-medium">საქართველო • Georgia</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 space-y-2">
          <button
            onClick={onOpenNewPatientRegistration}
            className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ ახალი პაციენტის რეგისტრაცია</span>
          </button>

          <button
            onClick={onOpenManifest}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
          >
            <BookOpen className="w-4 h-4 text-teal-400" />
            <span>MASTER MANIFEST</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-260px)] scrollbar-thin scrollbar-thumb-slate-700">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <h2 className="px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {group.title}
              </h2>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-md font-extrabold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Role Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80">
        <div className="text-[11px] text-slate-400 truncate">
          აქტიური როლი: <strong className="text-teal-400">{currentRole}</strong>
        </div>
      </div>
    </aside>
  );
};
