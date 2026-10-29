import React, { useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  FileStack,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Settings as SettingsIcon,
  Stethoscope,
  Users,
  FileText,
  X,
} from 'lucide-react';
import { SessionProvider, useSession } from './lib/session';
import { UiProvider } from './components/ui';
import { useRoute, navigate } from './lib/router';
import { useClinic } from './lib/db';
import { cls, userName } from './lib/utils';
import { ROLE_LABELS } from './lib/types';
import { Setup, Login } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { PatientsPage } from './pages/Patients';
import { PatientPage } from './pages/patient/PatientPage';
import { AppointmentsPage } from './pages/Appointments';
import { TemplatesPage } from './pages/Templates';
import { SettingsPage } from './pages/Settings';
import { JournalPage } from './pages/Journal';

export default function App() {
  return (
    <UiProvider>
      <SessionProvider>
        <Root />
      </SessionProvider>
    </UiProvider>
  );
}

function Root() {
  const { ready, users, user } = useSession();
  if (!ready) return <div className="h-full flex items-center justify-center text-slate-400">იტვირთება…</div>;
  if (users.length === 0) return <Setup />;
  if (!user) return <Login />;
  return <Shell />;
}

const NAV = [
  { id: '', label: 'მთავარი', icon: LayoutDashboard },
  { id: 'patients', label: 'პაციენტები', icon: Users },
  { id: 'appointments', label: 'ჩაწერები', icon: CalendarDays },
  { id: 'journal', label: 'დოკუმენტების ჟურნალი', icon: FileStack },
  { id: 'templates', label: 'შაბლონები', icon: FileText },
  { id: 'settings', label: 'პარამეტრები', icon: SettingsIcon },
];

function Shell() {
  const route = useRoute();
  const { user, logout } = useSession();
  const clinic = useClinic();
  const [menu, setMenu] = useState(false);
  const section = route[0] || '';
  useAutoLock(clinic.autoLockMinutes, logout);

  useEffect(() => setMenu(false), [route.join('/')]);

  let page: React.ReactNode;
  switch (section) {
    case 'patients':
      page = <PatientsPage />;
      break;
    case 'patient':
      page = <PatientPage key={route[1]} patientId={route[1]} tab={route[2]} sub={route[3]} />;
      break;
    case 'appointments':
      page = <AppointmentsPage />;
      break;
    case 'journal':
      page = <JournalPage />;
      break;
    case 'templates':
      page = <TemplatesPage />;
      break;
    case 'settings':
      page = <SettingsPage />;
      break;
    default:
      page = <Dashboard />;
  }

  const active = section === 'patient' ? 'patients' : section;

  return (
    <div className="h-full flex">
      <aside
        className={cls(
          'no-print fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 flex flex-col transition-transform lg:static lg:translate-x-0',
          menu ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
          {clinic.logo ? (
            <img src={clinic.logo} alt="" className="w-9 h-9 rounded-lg object-contain bg-white" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-teal-500 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{clinic.name}</p>
            <p className="text-[11px] text-slate-400">ელექტრონული სამედიცინო ბარათი</p>
          </div>
          <button className="lg:hidden ml-auto" onClick={() => setMenu(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => navigate(n.id)}
              className={cls(
                'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                active === n.id ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800',
              )}
            >
              <n.icon className="w-4 h-4" />
              {n.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800">
          <div className="px-2 mb-2">
            <p className="text-sm text-white font-medium truncate">{userName(user)}</p>
            <p className="text-[11px] text-slate-400">{ROLE_LABELS[user!.role]}</p>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
            <Lock className="w-4 h-4" /> დაბლოკვა / მომხმარებლის შეცვლა
          </button>
        </div>
      </aside>
      {menu && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMenu(false)} />}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="no-print lg:hidden flex items-center gap-3 bg-white border-b border-slate-200 px-4 py-3">
          <button onClick={() => setMenu(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm truncate">{clinic.name}</span>
          <button onClick={logout} className="ml-auto text-slate-500">
            <LogOut className="w-5 h-5" />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1500px] mx-auto p-4 sm:p-6">{page}</div>
        </main>
      </div>
    </div>
  );
}

function useAutoLock(minutes: number, onLock: () => void) {
  const last = useRef(Date.now());
  useEffect(() => {
    if (!minutes || minutes <= 0) return;
    const bump = () => (last.current = Date.now());
    const evs = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    evs.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const t = setInterval(() => {
      if (Date.now() - last.current > minutes * 60_000) onLock();
    }, 15_000);
    return () => {
      evs.forEach((e) => window.removeEventListener(e, bump));
      clearInterval(t);
    };
  }, [minutes, onLock]);
}
