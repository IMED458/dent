import React from 'react';
import { Search, Building, Shield, User, LogOut } from 'lucide-react';
import { RoleName, User as UserType } from '../types';

interface HeaderProps {
  currentUser: UserType;
  onRoleSwitch: (role: RoleName) => void;
  selectedBranch: string;
  onBranchChange: (branchId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onLogout?: () => void;
}

const ALL_ROLES: RoleName[] = [
  'System Super Administrator',
  'Clinic Director',
  'Medical Director',
  'Chief Dentist',
  'Dentist',
  'Therapeutic Dentist',
  'Dental Surgeon',
  'Implantologist',
  'Periodontist',
  'Orthodontist',
  'Endodontist',
  'Receptionist / Registrar',
  'Cashier',
  'Accountant',
  'Sterilization Responsible Person',
  'Infection Control Officer',
  'Warehouse / Inventory Manager'
];

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onRoleSwitch,
  selectedBranch,
  onBranchChange,
  searchQuery,
  setSearchQuery,
  onLogout
}) => {
  return (
    <header className="bg-white border-b border-slate-200 py-2.5 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      {/* Left Search */}
      <div className="flex items-center space-x-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ძებნა: პაციენტის სახელი, პირადი №, ბარათის №, ინვოისი, კოდი..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Branch Selector */}
        <div className="flex items-center space-x-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
          <Building className="w-3.5 h-3.5 text-teal-600" />
          <select
            value={selectedBranch}
            onChange={(e) => onBranchChange(e.target.value)}
            className="bg-transparent text-xs text-slate-700 font-medium border-none focus:outline-none cursor-pointer"
          >
            <option value="br-vake">ვაკის ფილიალი</option>
            <option value="br-saburtalo">საბურთალოს ფილიალი</option>
          </select>
        </div>

        {/* Role Switcher Demo */}
        <div className="flex items-center space-x-1.5 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg">
          <Shield className="w-3.5 h-3.5 text-teal-700" />
          <span className="text-[11px] text-teal-800 font-medium hidden sm:inline">როლის ტესტირება:</span>
          <select
            value={currentUser.roles[0]}
            onChange={(e) => onRoleSwitch(e.target.value as RoleName)}
            className="bg-transparent text-xs font-semibold text-teal-900 border-none focus:outline-none cursor-pointer"
          >
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* User Badge & Logout */}
        <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-teal-400 font-bold flex items-center justify-center text-xs shadow-sm">
              {currentUser.firstName[0]}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight">
                {currentUser.firstName} {currentUser.lastName}
              </p>
              <p className="text-[10px] text-slate-500">{currentUser.position}</p>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title="სისტემიდან გამოსვლა"
              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">გამოსვლა</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
