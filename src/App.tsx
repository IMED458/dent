import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PatientsList } from './components/PatientsList';
import { PatientProfile } from './components/PatientProfile';
import { DoctorCalendar } from './components/DoctorCalendar';
import { QueueManager } from './components/QueueManager';
import { StaffManager } from './components/StaffManager';
import { PatientRegistrationModal } from './components/PatientRegistrationModal';
import { CalculationEngine } from './components/CalculationEngine';
import { FormsManager } from './components/FormsManager';
import { CashDeskDayClose } from './components/CashDeskDayClose';
import { SterilizationInfection } from './components/SterilizationInfection';
import { InventoryFEFO } from './components/InventoryFEFO';
import { RadiologyViewer } from './components/RadiologyViewer';
import { AuditLogView } from './components/AuditLogView';
import { MasterManifestModal } from './components/MasterManifestModal';

import {
  User,
  RoleName,
  Patient,
  OdontogramSnapshot,
  ToothState,
  PeriodontalExam,
  CalculationSheet,
  CashShift,
  InventoryItem,
  SterilizationCycle,
  AuditLogEntry
} from './types';
import { Users, UserPlus, LogIn, Lock, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('patients_list');
  const [selectedBranch, setSelectedBranch] = useState('br-vake');
  const [searchQuery, setSearchQuery] = useState('');
  const [isManifestOpen, setIsManifestOpen] = useState(false);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  // App Data State loaded from API
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [odontogramHistory, setOdontogramHistory] = useState<OdontogramSnapshot[]>([]);
  const [currentOdontogram, setCurrentOdontogram] = useState<OdontogramSnapshot | null>(null);
  const [periodontalExams, setPeriodontalExams] = useState<PeriodontalExam[]>([]);
  const [calculations, setCalculations] = useState<CalculationSheet[]>([]);
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sterilizationCycles, setSterilizationCycles] = useState<SterilizationCycle[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Initial Data Fetching
  const fetchAllPatients = () => {
    fetch('/api/patients')
      .then((res) => res.json())
      .then((data) => {
        if (data.patients && data.patients.length > 0) {
          setPatients(data.patients);
          if (!selectedPatientId) {
            setSelectedPatientId(data.patients[0].id);
            fetchOdontogram(data.patients[0].id);
            fetchPeriodontics(data.patients[0].id);
          }
        }
      })
      .catch(() => {});
  };

  const fetchUsers = () => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.users) setAllUsers(data.users);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {});

    fetch('/api/doctors')
      .then((res) => res.json())
      .then((data) => {
        if (data.doctors) setDoctors(data.doctors);
      })
      .catch(() => {});

    fetchUsers();
    fetchAllPatients();

    fetch('/api/calculations')
      .then((res) => res.json())
      .then((data) => {
        if (data.calculations) setCalculations(data.calculations);
      })
      .catch(() => {});

    fetch('/api/day-close/current')
      .then((res) => res.json())
      .then((data) => {
        if (data.shift) setCurrentShift(data.shift);
      })
      .catch(() => {});

    fetch('/api/inventory')
      .then((res) => res.json())
      .then((data) => {
        if (data.inventory) setInventory(data.inventory);
      })
      .catch(() => {});

    fetch('/api/sterilization')
      .then((res) => res.json())
      .then((data) => {
        if (data.cycles) setSterilizationCycles(data.cycles);
      })
      .catch(() => {});

    fetch('/api/audit-logs')
      .then((res) => res.json())
      .then((data) => {
        if (data.auditLogs) setAuditLogs(data.auditLogs);
      })
      .catch(() => {});
  }, []);

  const fetchOdontogram = (patientId: string) => {
    fetch(`/api/odontogram/${patientId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.history) setOdontogramHistory(data.history);
        if (data.current) setCurrentOdontogram(data.current);
      })
      .catch(() => {});
  };

  const fetchPeriodontics = (patientId: string) => {
    fetch(`/api/periodontology/${patientId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.exams) setPeriodontalExams(data.exams);
      })
      .catch(() => {});
  };

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    fetchOdontogram(patientId);
    fetchPeriodontics(patientId);
  };

  const handleOpenPatientProfileFromAnywhere = (patientId: string) => {
    handleSelectPatient(patientId);
    setActiveTab('patient_profile');
  };

  const handleSelectPatientObjectAndOpenProfile = (pt: Patient) => {
    handleSelectPatient(pt.id);
    setActiveTab('patient_profile');
  };

  const handleRoleSwitch = (newRole: RoleName) => {
    if (!currentUser) return;
    fetch('/api/auth/switch-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser.username })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser({ ...data.user, roles: [newRole] });
        }
      })
      .catch(() => {});
  };

  const handleLoginAsUser = (u: User) => {
    setCurrentUser(u);
    setIsLoggedOut(false);
  };

  const handleAddDoctorOrStaff = (newUser: User) => {
    setAllUsers((prev) => [newUser, ...prev]);
    if (
      newUser.roles.some((r) =>
        r.includes('Dentist') || r.includes('Surgeon') || r.includes('Implantologist') || r.includes('Orthodontist')
      )
    ) {
      setDoctors((prev) => [newUser, ...prev]);
    }
  };

  const handleSaveOdontogram = (teeth: Record<number, ToothState>, notes: string) => {
    if (!selectedPatientId) return;
    fetch('/api/odontogram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: selectedPatientId,
        teeth,
        authorName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'დოქტ. ნინო ყიფიანი',
        notes
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.odontogram) {
          setOdontogramHistory((prev) => [data.odontogram, ...prev]);
          setCurrentOdontogram(data.odontogram);
        }
      })
      .catch(() => {});
  };

  const handlePatientRegistered = (newPt: Patient) => {
    setPatients((prev) => [newPt, ...prev]);
    setSelectedPatientId(newPt.id);
    setActiveTab('patient_profile');
  };

  const handleUpdatePatient = (updatedPt: Patient) => {
    setPatients((prev) => prev.map((p) => (p.id === updatedPt.id ? updatedPt : p)));
  };

  const handleCloseShift = (shiftId: string, actualCash: number, notes?: string) => {
    fetch('/api/day-close/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shiftId, actualCountedCashGel: actualCash, notes })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.shift) setCurrentShift(data.shift);
      })
      .catch(() => {});
  };

  const handleAddSterilizationCycle = (cycleData: any) => {
    fetch('/api/sterilization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cycleData)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.cycle) {
          setSterilizationCycles((prev) => [data.cycle, ...prev]);
        }
      })
      .catch(() => {});
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  // Search filter for patients
  const filteredPatients = patients.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      p.personalNumber.includes(q) ||
      p.medicalCardNumber.toLowerCase().includes(q) ||
      p.phone.includes(q)
    );
  });

  if (!currentUser || patients.length === 0) {
    return (
      <div className="h-screen bg-slate-900 text-teal-400 flex items-center justify-center font-bold text-sm">
        იტვირთება სტომატოლოგიური კლინიკის HIS / ERP / CRM სისტემა...
      </div>
    );
  }

  // Logged Out Screen
  if (isLoggedOut) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 mx-auto flex items-center justify-center text-3xl font-extrabold text-white shadow-lg">
            D
          </div>

          <div>
            <h1 className="text-xl font-bold text-white">DENTAL HIS / ERP</h1>
            <p className="text-xs text-teal-400 font-medium mt-1">
              სისტემიდან გამოსული ხართ. აირჩიეთ მომხმარებელი / ექიმი შესასვლელად:
            </p>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto text-left">
            {allUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => handleLoginAsUser(u)}
                className="w-full p-3 bg-slate-800 hover:bg-teal-600/20 hover:border-teal-500 border border-slate-700 rounded-xl transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 text-teal-400 font-bold flex items-center justify-center text-xs border border-slate-700">
                    {u.firstName[0]}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white group-hover:text-teal-300">
                      {u.firstName} {u.lastName}
                    </h3>
                    <p className="text-[10px] text-slate-400">{u.position}</p>
                  </div>
                </div>
                <LogIn className="w-4 h-4 text-slate-400 group-hover:text-teal-400" />
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => setIsLoggedOut(false)}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>სისტემაში ავტორიზაცია</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex text-slate-800 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentUser.roles[0]}
        onOpenManifest={() => setIsManifestOpen(true)}
        onOpenNewPatientRegistration={() => setIsNewPatientModalOpen(true)}
      />

      {/* Main Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentUser={currentUser}
          onRoleSwitch={handleRoleSwitch}
          selectedBranch={selectedBranch}
          onBranchChange={setSelectedBranch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onLogout={() => setIsLoggedOut(true)}
        />

        {/* Quick Patient Switcher Bar */}
        <div className="bg-slate-900 text-white px-6 py-2.5 border-b border-slate-800 flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center space-x-2 shrink-0">
            <Users className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-bold uppercase text-slate-300 tracking-wider">
              სწრაფი გადართვა:
            </span>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto flex-1 py-0.5">
            {filteredPatients.map((p) => {
              const isSelected = p.id === selectedPatient?.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPatient(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-2 shrink-0 ${
                    isSelected
                      ? 'bg-teal-500 text-slate-950 font-black shadow-md ring-2 ring-teal-400/50'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <span>{p.firstName} {p.lastName}</span>
                  <span className="text-[10px] opacity-75 font-mono">({p.personalNumber})</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsNewPatientModalOpen(true)}
            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold shrink-0 flex items-center space-x-1 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ რეგისტრაცია</span>
          </button>
        </div>

        {/* Main Content Area */}
        <main className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'patients_list' && (
            <PatientsList
              patients={patients}
              onSelectPatient={handleSelectPatientObjectAndOpenProfile}
              onOpenNewPatientRegistration={() => setIsNewPatientModalOpen(true)}
            />
          )}

          {activeTab === 'patient_profile' && selectedPatient && (
            <PatientProfile
              patient={selectedPatient}
              doctors={doctors}
              odontogramHistory={odontogramHistory}
              currentOdontogram={currentOdontogram}
              periodontalExams={periodontalExams}
              calculations={calculations}
              onSaveOdontogram={handleSaveOdontogram}
              onUpdatePatient={handleUpdatePatient}
              onBackToPatientsList={() => setActiveTab('patients_list')}
            />
          )}

          {activeTab === 'calendar' && (
            <DoctorCalendar
              patients={patients}
              doctors={doctors}
              onOpenPatientProfile={handleOpenPatientProfileFromAnywhere}
            />
          )}

          {activeTab === 'queue' && (
            <QueueManager
              patients={patients}
              onOpenPatientProfile={handleOpenPatientProfileFromAnywhere}
            />
          )}

          {activeTab === 'forms' && selectedPatient && (
            <FormsManager patient={selectedPatient} />
          )}

          {activeTab === 'calculation' && selectedPatient && (
            <CalculationEngine
              patient={selectedPatient}
              calculations={calculations}
              onCreateCalculation={() => {}}
            />
          )}

          {activeTab === 'dayclose' && (
            <CashDeskDayClose currentShift={currentShift} onCloseShift={handleCloseShift} />
          )}

          {activeTab === 'inventory' && <InventoryFEFO inventory={inventory} />}

          {activeTab === 'sterilization' && (
            <SterilizationInfection
              cycles={sterilizationCycles}
              onAddCycle={handleAddSterilizationCycle}
            />
          )}

          {activeTab === 'radiology' && selectedPatient && (
            <RadiologyViewer patient={selectedPatient} />
          )}

          {activeTab === 'staff' && (
            <StaffManager users={allUsers} onAddUser={handleAddDoctorOrStaff} />
          )}

          {activeTab === 'audit' && <AuditLogView auditLogs={auditLogs} />}
        </main>
      </div>

      {/* New Patient Registration Modal */}
      <PatientRegistrationModal
        isOpen={isNewPatientModalOpen}
        onClose={() => setIsNewPatientModalOpen(false)}
        onPatientRegistered={handlePatientRegistered}
      />

      {/* Master Manifest Modal */}
      <MasterManifestModal
        isOpen={isManifestOpen}
        onClose={() => setIsManifestOpen(false)}
      />
    </div>
  );
}
