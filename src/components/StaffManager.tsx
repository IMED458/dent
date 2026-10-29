import React, { useState } from 'react';
import { User, RoleName } from '../types';
import {
  UserCheck,
  UserPlus,
  Shield,
  Search,
  CheckCircle,
  X,
  Phone,
  Mail,
  Award,
  Building,
  Key
} from 'lucide-react';

interface StaffManagerProps {
  users: User[];
  onAddUser: (user: User) => void;
}

const ALL_ROLES_LIST: RoleName[] = [
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

export const StaffManager: React.FC<StaffManagerProps> = ({ users, onAddUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State for New Doctor / User
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [personalNumber, setPersonalNumber] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+995 5');
  const [position, setPosition] = useState('ექიმი-სტომატოლოგი');
  const [selectedRole, setSelectedRole] = useState<RoleName>('Therapeutic Dentist');

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(term) ||
      u.lastName.toLowerCase().includes(term) ||
      u.position.toLowerCase().includes(term) ||
      u.personalNumber.includes(term) ||
      u.phone.includes(term)
    );
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !personalNumber) {
      alert('გთხოვთ შეავსოთ სავალდებულო ველები: სახელი, გვარი, პირადი ნომერი!');
      return;
    }

    if (personalNumber.length !== 11) {
      alert('პირადი ნომერი უნდა შედგებოდეს ზუსტად 11 ციფრისგან!');
      return;
    }

    const newUserPayload = {
      firstName,
      lastName,
      personalNumber,
      username: username || `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
      email: email || `${firstName.toLowerCase()}@dentalcare.ge`,
      phone,
      roles: [selectedRole],
      branchIds: ['br-vake'],
      active: true,
      position,
      mfaEnabled: false
    };

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUserPayload)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          onAddUser(data.user);
          setIsModalOpen(false);
          // Reset form
          setFirstName('');
          setLastName('');
          setPersonalNumber('');
          setUsername('');
          setEmail('');
          setPhone('+995 5');
        } else {
          alert('შეცდომა ექიმის დამატებისას: ' + (data.error || 'უცნობი შეცდომა'));
        }
      })
      .catch(() => alert('სერვერთან კავშირის შეცდომა'));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              ექიმების & პერსონალის მართვა (Staff & Doctors)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              კლინიკაში სულ რეგისტრირებულია <strong className="text-teal-700 font-bold">{users.length}</strong> თანამშრომელი
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold flex items-center space-x-2 shadow-md transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ ახალი ექიმის / პერსონალის დამატება</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ძებნა: სახელი, გვარი, პოზიცია, პირადი ნომერი..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((u) => (
          <div
            key={u.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 relative overflow-hidden group hover:border-teal-400 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-teal-400 font-black flex items-center justify-center text-base shadow-md">
                  {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {u.firstName} {u.lastName}
                  </h3>
                  <p className="text-xs text-teal-700 font-bold">{u.position}</p>
                </div>
              </div>

              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold">
                აქტიური
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3 font-sans">
              <div className="flex items-center space-x-2">
                <Award className="w-3.5 h-3.5 text-slate-400" />
                <span>პირადი №: <strong className="font-mono text-slate-800">{u.personalNumber}</strong></span>
              </div>

              <div className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono">{u.phone}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{u.email}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 border-t border-slate-100 pt-3">
              {u.roles.map((r, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-bold"
                >
                  🛡️ {r}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff / Doctor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserPlus className="w-6 h-6 text-teal-400" />
                <div>
                  <h2 className="text-base font-bold">ახალი ექიმის / თანამშრომლის დამატება</h2>
                  <p className="text-xs text-slate-400">სამედიცინო პერსონალის რეგისტრაცია</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">სახელი *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="გიორგი"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">გვარი *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="ბერიძე"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">პირადი ნომერი (11 ნიშნა) *</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={personalNumber}
                    onChange={(e) => setPersonalNumber(e.target.value)}
                    placeholder="01019011223"
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ტელეფონის ნომერი *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">თანამდებობა / პოზიცია *</label>
                  <input
                    type="text"
                    required
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="ექიმი-თერაპევტი / ორთოპედი"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">სისტემური როლი *</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as RoleName)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
                  >
                    {ALL_ROLES_LIST.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ელ-ფოსტა</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@dentalcare.ge"
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">მომხმარებლის სახელი (Username)</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="dr.beridze"
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-100"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold flex items-center space-x-2 shadow-md"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>ექიმის / თანამშრომლის დამატება</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
