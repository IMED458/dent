import React, { useState } from 'react';
import { Patient, PatientAlert } from '../types';
import { UserPlus, X, ShieldAlert, CheckCircle, Search, AlertTriangle, UserCheck, Calendar } from 'lucide-react';

interface PatientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientRegistered: (patient: Patient) => void;
}

export const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({
  isOpen,
  onClose,
  onPatientRegistered
}) => {
  const [personalNumber, setPersonalNumber] = useState('');
  const [isForeignCitizen, setIsForeignCitizen] = useState(false);
  const [passportNumber, setPassportNumber] = useState('');
  const [citizenshipCountry, setCitizenshipCountry] = useState('აშშ / USA');

  const [isMinor, setIsMinor] = useState(false);
  const [guardianName, setGuardianName] = useState('');
  const [guardianPersonalNumber, setGuardianPersonalNumber] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('+995 5');
  const [guardianRelation, setGuardianRelation] = useState('მშობელი (დედა/მამა)');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('1990-01-01');
  const [sex, setSex] = useState<'MALE' | 'FEMALE'>('MALE');
  const [phone, setPhone] = useState('+995 5');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('თბილისი, ');
  const [workplace, setWorkplace] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [insurerName, setInsurerName] = useState('სს "თიბისი დაზღვევა"');
  const [policyNumber, setPolicyNumber] = useState('');
  const [vip, setVip] = useState(false);

  // Duplicate patient state modal
  const [duplicatePatient, setDuplicatePatient] = useState<Patient | null>(null);

  // Initial risk alerts
  const [penicillinAllergy, setPenicillinAllergy] = useState(false);
  const [epinephrineRisk, setEpinephrineRisk] = useState(false);
  const [anticoagulantUser, setAnticoagulantUser] = useState(false);
  const [cardiacRisk, setCardiacRisk] = useState(false);
  const [diabetesRisk, setDiabetesRisk] = useState(false);
  const [isSearchingStateRegistry, setIsSearchingStateRegistry] = useState(false);

  if (!isOpen) return null;

  const handleFetchFromStateRegistry = () => {
    if (!isForeignCitizen && personalNumber.length !== 11) {
      alert('გთხოვთ შეიყვანოთ სწორი 11-ნიშნა პირადი ნომერი!');
      return;
    }
    setIsSearchingStateRegistry(true);
    setTimeout(() => {
      setIsSearchingStateRegistry(false);
      if (personalNumber === '01019055443') {
        setFirstName('გიორგი');
        setLastName('კაპანაძე');
        setDob('1988-04-14');
        setSex('MALE');
        setPhone('+995 599 12 34 56');
        setAddress('თბილისი, პეკინის გამზ. №14');
        setWorkplace('შპს "ტექნოლოგიები"');
      } else {
        setFirstName('გიორგი');
        setLastName('ბერიძე');
        setDob('1992-07-18');
        setSex('MALE');
        setPhone('+995 599 00 11 22');
        setAddress('თბილისი, რუსთაველის გამზ. №24');
      }
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const activeID = isForeignCitizen ? passportNumber : personalNumber;
    if (!activeID || !firstName || !lastName) {
      alert('გთხოვთ შეავსოთ სავალდებულო ველები: პირადი ნომერი / პასპორტი, სახელი, გვარი!');
      return;
    }

    if (!isForeignCitizen && activeID.length !== 11) {
      alert('საქართველოს მოქალაქის პირადი ნომერი უნდა შედგებოდეს ზუსტად 11 ციფრისგან!');
      return;
    }

    const alerts: PatientAlert[] = [];
    if (penicillinAllergy) {
      alerts.push({
        id: `al-${Date.now()}-1`,
        type: 'ALLERGY',
        title: 'ალერგია პენიცილინზე',
        description: 'მწვავე ალერგიული რეაქცია პენიცილინის ჯგუფის ანტიბიოტიკებზე',
        severity: 'CRITICAL',
        active: true,
        createdAt: new Date().toISOString().substring(0, 10)
      });
    }
    if (epinephrineRisk) {
      alerts.push({
        id: `al-${Date.now()}-2`,
        type: 'ANESTHESIA_RISK',
        title: 'მგრძნობელობა ეპინეფრინზე',
        description: 'გამოიყენეთ სკანდონესტი (მეპივაკაინი) ეპინეფრინის გარეშე',
        severity: 'HIGH',
        active: true,
        createdAt: new Date().toISOString().substring(0, 10)
      });
    }
    if (anticoagulantUser) {
      alerts.push({
        id: `al-${Date.now()}-3`,
        type: 'ANTICOAGULANT',
        title: 'ანტიკოაგულანტური თერაპია',
        description: 'პაციენტი იღებს სისხლის გამათხელებლებს (ვარფარინი/ქსარელტო)',
        severity: 'HIGH',
        active: true,
        createdAt: new Date().toISOString().substring(0, 10)
      });
    }
    if (cardiacRisk) {
      alerts.push({
        id: `al-${Date.now()}-4`,
        type: 'CARDIOVASCULAR',
        title: 'გულ-სისხლძარღვთა რისკი',
        description: 'ჰიპერტენზია / გულის იშემიური დაავადება',
        severity: 'MEDIUM',
        active: true,
        createdAt: new Date().toISOString().substring(0, 10)
      });
    }
    if (diabetesRisk) {
      alerts.push({
        id: `al-${Date.now()}-5`,
        type: 'DIABETES',
        title: 'შაქრიანი დიაბეტი',
        description: 'შაქრიანი დიაბეტი ტიპი 2, ჭრილობის შუშების მონიტორინგი',
        severity: 'MEDIUM',
        active: true,
        createdAt: new Date().toISOString().substring(0, 10)
      });
    }

    const newPatientData = {
      medicalCardNumber: `CARD-${Math.floor(1000 + Math.random() * 9000)}`,
      personalNumber: activeID,
      isForeignCitizen,
      passportNumber: isForeignCitizen ? passportNumber : undefined,
      citizenshipCountry: isForeignCitizen ? citizenshipCountry : undefined,
      isMinor,
      guardianName: isMinor ? guardianName : undefined,
      guardianPersonalNumber: isMinor ? guardianPersonalNumber : undefined,
      guardianPhone: isMinor ? guardianPhone : undefined,
      guardianRelation: isMinor ? guardianRelation : undefined,
      firstName,
      lastName,
      dob,
      sex,
      phone,
      email,
      address,
      workplace,
      emergencyContact,
      preferredLanguage: 'ka' as const,
      insurerName,
      policyNumber,
      vip,
      alerts
    };

    fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPatientData)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.patient) {
          onPatientRegistered(data.patient);
          onClose();
        } else if (data.duplicate && data.existingPatient) {
          setDuplicatePatient(data.existingPatient);
        } else {
          alert('შეცდომა პაციენტის რეგისტრაციისას: ' + (data.error || 'უცნობი შეცდომა'));
        }
      })
      .catch((err) => {
        alert('სერვერული შეცდომა: ' + err.message);
      });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      {/* Duplicate Patient Alert Modal */}
      {duplicatePatient && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 border border-rose-300 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="text-base font-extrabold text-slate-900">ყურადღება! დუბლირებული პაციენტი</h3>
                <p className="text-xs text-slate-500">პაციენტი ამ პირადი ნომრით უკვე რეგისტრირებულია ბაზაში</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 font-sans">
              <div><strong>სახელი გვარი:</strong> {duplicatePatient.firstName} {duplicatePatient.lastName}</div>
              <div><strong>პირადი №:</strong> {duplicatePatient.personalNumber}</div>
              <div><strong>სამედიცინო ბარათი №:</strong> {duplicatePatient.medicalCardNumber}</div>
              <div><strong>ტელეფონი:</strong> {duplicatePatient.phone}</div>
              <div><strong>რეგისტრაციის თარიღი:</strong> {duplicatePatient.createdAt}</div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  onPatientRegistered(duplicatePatient);
                  setDuplicatePatient(null);
                  onClose();
                }}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md"
              >
                <UserCheck className="w-4 h-4" />
                <span>არსებული პაციენტის ბარათის გახსნა →</span>
              </button>

              <button
                onClick={() => setDuplicatePatient(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                ფორმის შესწორება / დაბრუნება
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold">ახალი პაციენტის რეგისტრაცია (Patient Registration)</h2>
              <p className="text-xs text-slate-400">საქართველოს ჯანდაცვის სამინისტროს სტანდარტი №01-55/ნ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Citizenship & Minor Toggles */}
          <div className="flex flex-wrap items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <label className="flex items-center space-x-2 font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isForeignCitizen}
                onChange={(e) => setIsForeignCitizen(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <span>🌐 უცხო ქვეყნის მოქალაქე (Foreign Citizen / Passport)</span>
            </label>

            <label className="flex items-center space-x-2 font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isMinor}
                onChange={(e) => setIsMinor(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <span>👶 არასრულწლოვანი / პედიატრიული პაციენტი (Minor / Pediatric)</span>
            </label>
          </div>

          {/* State Registry Lookup */}
          {!isForeignCitizen && (
            <div className="bg-teal-50 border border-teal-200 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-3 w-full md:w-auto">
                <Search className="w-5 h-5 text-teal-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-teal-900 block">სახელმწიფო სერვისების განვითარების სააგენტო</span>
                  <span className="text-[11px] text-teal-700">ავტომატური ძებნა 11-ნიშნა პირადი ნომრით</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="01019055443"
                  value={personalNumber}
                  onChange={(e) => setPersonalNumber(e.target.value)}
                  maxLength={11}
                  className="px-3 py-1.5 border border-teal-300 rounded-lg text-xs font-mono font-bold w-full md:w-36 focus:ring-2 focus:ring-teal-500 bg-white"
                />
                <button
                  type="button"
                  onClick={handleFetchFromStateRegistry}
                  disabled={isSearchingStateRegistry}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
                >
                  {isSearchingStateRegistry ? 'მოძიება...' : 'მონაცემების ამოღება'}
                </button>
              </div>
            </div>
          )}

          {/* Foreign Citizen Passport Fields */}
          {isForeignCitizen && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3 text-xs">
              <span className="font-bold text-amber-900 block">🌐 უცხო ქვეყნის მოქალაქის პასპორტის მონაცემები</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">პასპორტის № *</label>
                  <input
                    type="text"
                    required
                    value={passportNumber}
                    onChange={(e) => setPassportNumber(e.target.value)}
                    placeholder="N12345678"
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">მოქალაქეობის ქვეყანა</label>
                  <input
                    type="text"
                    value={citizenshipCountry}
                    onChange={(e) => setCitizenshipCountry(e.target.value)}
                    placeholder="აშშ / USA"
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Minor Guardian Details */}
          {isMinor && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3 text-xs">
              <span className="font-bold text-blue-900 block">👶 მშობლის / კანონიერი წარმომადგენლის მონაცემები</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">მშობლის სახელი გვარი *</label>
                  <input
                    type="text"
                    required
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="მარიამ ბერიძე"
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">მშობლის პირადი № *</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={guardianPersonalNumber}
                    onChange={(e) => setGuardianPersonalNumber(e.target.value)}
                    placeholder="01019011223"
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">მშობლის ტელეფონი *</label>
                  <input
                    type="text"
                    required
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ნათესაური კავშირი</label>
                  <input
                    type="text"
                    value={guardianRelation}
                    onChange={(e) => setGuardianRelation(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Personal Info Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-1">
              პასპორტული / პერსონალური მონაცემები
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">სახელი *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="გიორგი"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">გვარი *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="კაპანაძე"
                />
              </div>

              {!isForeignCitizen && (
                <div>
                  <label className="block text-slate-600 font-bold mb-1">პირადი ნომერი (11 ნიშნა) *</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={personalNumber}
                    onChange={(e) => setPersonalNumber(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-teal-500"
                    placeholder="01019055443"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-bold mb-1">დაბადების თარიღი</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">სქესი</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="MALE">მამრობითი</option>
                  <option value="FEMALE">მდედრობითი</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">ტელეფონის ნომერი *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-teal-500"
                  placeholder="+995 599 12 34 56"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-600 font-bold mb-1">მისამართი</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="თბილისი, ი. ჭავჭავაძის გამზ. №37"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">ელ-ფოსტა</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="patient@gmail.com"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">სამუშაო ადგილი</label>
                <input
                  type="text"
                  value={workplace}
                  onChange={(e) => setWorkplace(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder='შპს "კომპანია"'
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-slate-600 font-bold mb-1">საკონტაქტო პირი (საგანგებო)</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="მარიამ კაპანაძე (მეუღლე) +995 599 65 43 21"
                />
              </div>
            </div>
          </div>

          {/* Insurance Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-1">
              სადაზღვევო კომპანია & პოლისი
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">სადაზღვევო კომპანია</label>
                <select
                  value={insurerName}
                  onChange={(e) => setInsurerName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="">დაუზღვეველი (კერძო გადახდა)</option>
                  <option value='სს "თიბისი დაზღვევა"'>სს "თიბისი დაზღვევა"</option>
                  <option value='სს "GPI ჰოლდინგი"'>სს "GPI ჰოლდინგი"</option>
                  <option value='სს "ალდაგი"'>სს "ალდაგი"</option>
                  <option value='სს "არდი დაზღვევა"'>სს "არდი დაზღვევა"</option>
                  <option value='სს "ირაო"'>სს "ირაო"</option>
                  <option value='სს "PSP დაზღვევა"'>სს "PSP დაზღვევა"</option>
                  <option value="სახელმწიფო საყოველთაო ჯანდაცვის პროგრამა">სახელმწიფო საყოველთაო ჯანდაცვა</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">პოლისის №</label>
                <input
                  type="text"
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-teal-500"
                  placeholder="TBC-INS-98214"
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="vip-checkbox"
                  checked={vip}
                  onChange={(e) => setVip(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <label htmlFor="vip-checkbox" className="text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  ⭐ VIP პაციენტი (პრიორიტეტული მომსახურება)
                </label>
              </div>
            </div>
          </div>

          {/* Medical Risk Alerts Checklist */}
          <div className="space-y-3 bg-rose-50/50 p-4 rounded-xl border border-rose-200">
            <div className="flex items-center space-x-2 text-rose-800">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                სამედიცინო გაფრთხილებები & ალერგიები (მწვავე რისკები)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-slate-200 hover:border-rose-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={penicillinAllergy}
                  onChange={(e) => setPenicillinAllergy(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">⚠️ ალერგია პენიცილინზე</span>
                  <span className="text-[11px] text-slate-500">მწვავე ალერგია ანტიბიოტიკებზე</span>
                </div>
              </label>

              <label className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-slate-200 hover:border-rose-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={epinephrineRisk}
                  onChange={(e) => setEpinephrineRisk(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">⚠️ მგრძნობელობა ეპინეფრინზე</span>
                  <span className="text-[11px] text-slate-500">საანესთეზიო ეპინეფრინის გარეშე</span>
                </div>
              </label>

              <label className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-slate-200 hover:border-rose-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={anticoagulantUser}
                  onChange={(e) => setAnticoagulantUser(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">🩸 ანტიკოაგულანტები (ვარფარინი)</span>
                  <span className="text-[11px] text-slate-500">სისხლდენის მაღალი რისკი</span>
                </div>
              </label>

              <label className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-slate-200 hover:border-rose-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cardiacRisk}
                  onChange={(e) => setCardiacRisk(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">🫀 გულ-სისხლძარღვთა დაავადება</span>
                  <span className="text-[11px] text-slate-500">ჰიპერტენზია / კარდიოსტიმულატორი</span>
                </div>
              </label>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center space-x-2 shadow-md transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>პაციენტის დარეგისტრირება</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
