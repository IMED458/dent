import React, { useState, useEffect } from 'react';
import { Appointment, Patient, User } from '../types';
import { Calendar as CalendarIcon, Clock, UserCheck, Plus, CheckCircle2, AlertCircle, XCircle, ChevronLeft, ChevronRight, Stethoscope, Phone } from 'lucide-react';

interface DoctorCalendarProps {
  patients: Patient[];
  doctors: User[];
  onOpenPatientProfile: (patientId: string) => void;
}

export const DoctorCalendar: React.FC<DoctorCalendarProps> = ({
  patients,
  doctors,
  onOpenPatientProfile
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('usr-dentist-kipiani');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // New appointment form state
  const [patientId, setPatientId] = useState<string>(patients[0]?.id || '');
  const [doctorId, setDoctorId] = useState<string>('usr-dentist-kipiani');
  const [startTime, setStartTime] = useState<string>('11:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [serviceCategory, setServiceCategory] = useState('თერაპიული სტომატოლოგია');
  const [chairId, setChairId] = useState('chair-1');
  const [urgency, setUrgency] = useState<'ROUTINE' | 'URGENT' | 'EMERGENCY'>('ROUTINE');
  const [notes, setNotes] = useState('');

  const fetchAppointments = () => {
    fetch('/api/appointments')
      .then((res) => res.json())
      .then((data) => {
        if (data.appointments) setAppointments(data.appointments);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const pt = patients.find((p) => p.id === patientId);
    const doc = doctors.find((d) => d.id === doctorId) || doctors[0];

    if (!pt) {
      alert('გთხოვთ აირჩიოთ პაციენტი!');
      return;
    }

    const startIso = `${selectedDate}T${startTime}:00`;
    // calculate end time
    const [h, m] = startTime.split(':').map(Number);
    const endMins = h * 60 + m + Number(durationMinutes);
    const endH = Math.floor(endMins / 60);
    const endM = endMins % 60;
    const endIso = `${selectedDate}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;

    const newAptData = {
      patientId: pt.id,
      patientName: `${pt.firstName} ${pt.lastName}`,
      patientPhone: pt.phone,
      doctorId: doc.id,
      doctorName: `დოქტ. ${doc.firstName} ${doc.lastName}`,
      branchId: 'br-vake',
      chairId,
      startTime: startIso,
      endTime: endIso,
      serviceCategory,
      urgency,
      notes
    };

    fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAptData)
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetchAppointments();
          setIsBookModalOpen(false);
          setNotes('');
        } else {
          alert('შეცდომა ჩაწერისას: ' + data.error);
        }
      })
      .catch((err) => alert('სერვერული შეცდომა: ' + err.message));
  };

  const handleStatusChange = (aptId: string, status: any) => {
    fetch(`/api/appointments/${aptId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
      .then((res) => res.json())
      .then(() => fetchAppointments())
      .catch(() => {});
  };

  const hours = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  const filteredAppointments = appointments.filter((a) => {
    const isDocMatch = selectedDoctorId === 'ALL' || a.doctorId === selectedDoctorId;
    const isDateMatch = a.startTime.startsWith(selectedDate);
    return isDocMatch && isDateMatch;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl border border-teal-100">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">ექიმების კალენდარი & ვიზიტების ჩაწერა</h2>
            <p className="text-xs text-slate-500">პაციენტების მიღების განრიგი, სავარძლები და ვიზიტის სტატუსები</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Doctor Filter Dropdown */}
          <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Stethoscope className="w-4 h-4 text-slate-500" />
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value="ALL">ყველა ექიმი-სტომატოლოგი</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  დოქტ. {d.firstName} {d.lastName} ({d.position})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500"
          />

          {/* New Appointment Modal Trigger */}
          <button
            onClick={() => setIsBookModalOpen(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>ახალი ჩაწერა</span>
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            ვიზიტების განრიგი ({selectedDate})
          </span>
          <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
            სულ ჩაწერილია: {filteredAppointments.length} ვიზიტი
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {hours.map((hour) => {
            const hourApts = filteredAppointments.filter((a) => {
              const aptHour = a.startTime.substring(11, 16);
              return aptHour.startsWith(hour.substring(0, 2));
            });

            return (
              <div key={hour} className="flex min-h-[90px]">
                {/* Hour Label */}
                <div className="w-24 p-3 bg-slate-50/50 border-r border-slate-200 text-slate-500 font-mono text-xs font-bold flex items-start justify-center pt-3 shrink-0">
                  <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {hour}
                </div>

                {/* Slots */}
                <div className="flex-1 p-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 bg-white">
                  {hourApts.length > 0 ? (
                    hourApts.map((apt) => (
                      <div
                        key={apt.id}
                        className={`p-3 rounded-xl border text-xs flex flex-col justify-between space-y-2 transition-all ${
                          apt.status === 'COMPLETED'
                            ? 'bg-slate-50 border-slate-300 opacity-75'
                            : apt.status === 'IN_PROGRESS'
                            ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400'
                            : apt.status === 'CANCELLED'
                            ? 'bg-rose-50/50 border-rose-200 opacity-50 line-through'
                            : 'bg-teal-50/60 border-teal-200 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-extrabold text-slate-900 block text-sm">
                              {apt.patientName}
                            </span>
                            <span className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400 inline" />
                              <span>{apt.patientPhone}</span>
                            </span>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              apt.status === 'CONFIRMED'
                                ? 'bg-teal-100 text-teal-800'
                                : apt.status === 'IN_PROGRESS'
                                ? 'bg-amber-200 text-amber-900'
                                : apt.status === 'COMPLETED'
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {apt.status === 'CONFIRMED'
                              ? 'დადასტურებულია'
                              : apt.status === 'IN_PROGRESS'
                              ? 'მიმდინარეობს'
                              : apt.status === 'COMPLETED'
                              ? 'დასრულდა'
                              : 'გაუქმებულია'}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-100 space-y-1">
                          <div>
                            <strong>ექიმი:</strong> {apt.doctorName}
                          </div>
                          <div>
                            <strong>კატეგორია:</strong> {apt.serviceCategory} ({apt.chairId})
                          </div>
                          {apt.notes && (
                            <div className="text-slate-500 italic">
                              "{apt.notes}"
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                          <button
                            onClick={() => onOpenPatientProfile(apt.patientId)}
                            className="text-[11px] font-bold text-teal-700 hover:text-teal-900 hover:underline"
                          >
                            პაციენტის ბარათი →
                          </button>

                          <div className="flex items-center space-x-1">
                            {apt.status !== 'IN_PROGRESS' && apt.status !== 'COMPLETED' && (
                              <button
                                onClick={() => handleStatusChange(apt.id, 'IN_PROGRESS')}
                                className="p-1 bg-amber-500 text-white rounded hover:bg-amber-600"
                                title="მიღების დაწყება"
                              >
                                ▶
                              </button>
                            )}
                            {apt.status !== 'COMPLETED' && (
                              <button
                                onClick={() => handleStatusChange(apt.id, 'COMPLETED')}
                                className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                title="ვიზიტის დასრულება"
                              >
                                ✓
                              </button>
                            )}
                            {apt.status !== 'CANCELLED' && (
                              <button
                                onClick={() => handleStatusChange(apt.id, 'CANCELLED')}
                                className="p-1 bg-rose-500 text-white rounded hover:bg-rose-600"
                                title="ვიზიტის გაუქმება"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-[11px] text-slate-400 italic py-2">
                      თავისუფალი დროის სლოტი
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Book Appointment Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-teal-400" />
                <span>ახალი ვიზიტის ჩაწერა</span>
              </h3>
              <button
                onClick={() => setIsBookModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">პაციენტის არჩევა *</label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white font-bold"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} (პირადი №: {p.personalNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">მკურნალი ექიმი *</label>
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      დოქტ. {d.firstName} {d.lastName} ({d.position})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">დაწყების დრო *</label>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono bg-white"
                  >
                    {hours.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ხანგრძლივობა (წუთი)</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value={30}>30 წუთი</option>
                    <option value={60}>60 წუთი (1 საათი)</option>
                    <option value={90}>90 წუთი (1.5 საათი)</option>
                    <option value={120}>120 წუთი (2 საათი)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">მომსახურების პროფილი</label>
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="თერაპიული სტომატოლოგია">თერაპია / კარიესი</option>
                    <option value="ენდოდონტია">ენდოდონტია (არხები)</option>
                    <option value="ქირურგია">ქირურგია / ექსტრაქცია</option>
                    <option value="იმპლანტოლოგია">იმპლანტოლოგია</option>
                    <option value="ორთოპედია">ორთოპედია / გვირგვინები</option>
                    <option value="ორთოდონტია">ორთოდონტია / ბრეკეტები</option>
                    <option value="პერიოდონტოლოგია">პერიოდონტოლოგია / წმენდა</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">სავარძელი / კაბინეტი</label>
                  <select
                    value={chairId}
                    onChange={(e) => setChairId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="chair-1">სავარძელი №1 (კაბინეტი 101)</option>
                    <option value="chair-2">სავარძელი №2 (კაბინეტი 102)</option>
                    <option value="chair-3">სავარძელი №3 (ქირურგიული)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">შენიშვნები / ჩივილები</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="მაგ: 36 კბილის ტკივილი, პირველადი კონსულტაცია..."
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-sm"
                >
                  ჩაწერის დადასტურება
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
