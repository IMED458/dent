import React, { useState, useEffect } from 'react';
import { QueueTicket, Patient } from '../types';
import { Users, Volume2, Plus, ArrowRight, Play, CheckCircle2, XCircle, Monitor, Building2 } from 'lucide-react';

interface QueueManagerProps {
  patients: Patient[];
  onOpenPatientProfile: (patientId: string) => void;
}

export const QueueManager: React.FC<QueueManagerProps> = ({
  patients,
  onOpenPatientProfile
}) => {
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [doctorName, setDoctorName] = useState<string>('დოქტ. ნინო ყიფიანი');
  const [roomName, setRoomName] = useState<string>('კაბინეტი 101');
  const [lastCalledTicket, setLastCalledTicket] = useState<QueueTicket | null>(null);

  const fetchQueue = () => {
    fetch('/api/queue')
      .then((res) => res.json())
      .then((data) => {
        if (data.queue) setTickets(data.queue);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleIssueTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const pt = patients.find((p) => p.id === selectedPatientId);
    if (!pt) {
      alert('გთხოვთ აირჩიოთ პაციენტი!');
      return;
    }

    fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: pt.id,
        patientName: `${pt.firstName} ${pt.lastName}`,
        doctorName,
        roomName
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetchQueue();
          setIsIssueModalOpen(false);
        } else {
          alert('შეცდომა რიგის ბილეთის გაცემისას');
        }
      })
      .catch((err) => alert('სერვერული შეცდომა: ' + err.message));
  };

  const handleStatusChange = (ticketId: string, status: any) => {
    fetch(`/api/queue/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.ticket) {
          if (status === 'CALLING') {
            setLastCalledTicket(data.ticket);
            // Simulate audio chime call
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
              gain.gain.setValueAtTime(0.1, ctx.currentTime);
              osc.start();
              osc.stop(ctx.currentTime + 0.4);
            } catch (e) {}
          }
          fetchQueue();
        }
      })
      .catch(() => {});
  };

  const waitingTickets = tickets.filter((t) => t.status === 'WAITING');
  const callingTickets = tickets.filter((t) => t.status === 'CALLING');
  const inRoomTickets = tickets.filter((t) => t.status === 'IN_DOCTOR_ROOM');
  const completedTickets = tickets.filter((t) => t.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl border border-teal-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">რიგების ელექტრონული მართვის სისტემა ( Queue Display )</h2>
            <p className="text-xs text-slate-500">პაციენტების ცოცხალი რიგი, ხმოვანი გამოძახება და კაბინეტების მონიტორინგი</p>
          </div>
        </div>

        <button
          onClick={() => setIsIssueModalOpen(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>ახალი ბილეთის გაცემა ( Print Ticket )</span>
        </button>
      </div>

      {/* Live Audio Announcement Call Banner */}
      {lastCalledTicket && (
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-teal-500/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-teal-500 text-slate-950 rounded-xl font-extrabold">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-teal-400 font-mono font-bold uppercase tracking-widest block">
                🔊 ხმოვანი გამოძახება / CURRENT ANNOUNCEMENT
              </span>
              <h3 className="text-xl font-extrabold mt-0.5">
                ბილეთი <span className="text-teal-400">{lastCalledTicket.ticketNumber}</span> — {lastCalledTicket.patientName}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                გთხოვთ მობრძანდეთ: <strong className="text-white">{lastCalledTicket.roomName}</strong> ({lastCalledTicket.doctorName})
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenPatientProfile(lastCalledTicket.patientId)}
            className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-xl text-xs transition-colors shadow-lg"
          >
            პაციენტის ბარათის გახსნა →
          </button>
        </div>
      )}

      {/* Live Queue Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Waiting Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center space-x-1">
              <span>⏳ რიგში მომლოდინეები</span>
            </span>
            <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-xs font-extrabold">
              {waitingTickets.length}
            </span>
          </div>

          <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[500px]">
            {waitingTickets.length > 0 ? (
              waitingTickets.map((t) => (
                <div key={t.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-slate-900 text-teal-400 rounded-lg font-mono font-extrabold text-sm">
                      {t.ticketNumber}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      მოსვლის დრო: {t.arrivalTime}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 block text-sm">{t.patientName}</span>
                    <span className="text-[11px] text-slate-500">{t.doctorName} • {t.roomName}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <button
                      onClick={() => onOpenPatientProfile(t.patientId)}
                      className="text-[11px] font-bold text-teal-700 hover:underline"
                    >
                      პაციენტის ბარათი
                    </button>
                    <button
                      onClick={() => handleStatusChange(t.id, 'CALLING')}
                      className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-sm"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>გამოძახება</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 italic">
                რიგში მომლოდინე პაციენტები არ არიან
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Currently Calling / In Cabinet */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-teal-50 border-b border-teal-200 flex items-center justify-between">
            <span className="text-xs font-bold text-teal-900 uppercase tracking-wider">
              📢 კაბინეტში გამოძახებული / მიღებაზე
            </span>
            <span className="px-2 py-0.5 bg-teal-200 text-teal-900 rounded-full text-xs font-extrabold">
              {callingTickets.length + inRoomTickets.length}
            </span>
          </div>

          <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[500px]">
            {[...callingTickets, ...inRoomTickets].length > 0 ? (
              [...callingTickets, ...inRoomTickets].map((t) => (
                <div
                  key={t.id}
                  className={`p-3 rounded-xl border text-xs space-y-2 ${
                    t.status === 'CALLING'
                      ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400'
                      : 'bg-teal-50/60 border-teal-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-slate-900 text-teal-400 rounded-lg font-mono font-extrabold text-sm">
                      {t.ticketNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        t.status === 'CALLING' ? 'bg-amber-200 text-amber-900' : 'bg-teal-200 text-teal-900'
                      }`}
                    >
                      {t.status === 'CALLING' ? 'გამოძახებულია' : 'მიღებაზეა'}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-900 block text-sm">{t.patientName}</span>
                    <span className="text-[11px] text-slate-600">{t.doctorName} • {t.roomName}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <button
                      onClick={() => onOpenPatientProfile(t.patientId)}
                      className="text-[11px] font-bold text-teal-700 hover:underline"
                    >
                      პაციენტის ბარათი
                    </button>
                    <div className="flex space-x-1">
                      {t.status === 'CALLING' && (
                        <button
                          onClick={() => handleStatusChange(t.id, 'IN_DOCTOR_ROOM')}
                          className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-[11px] font-bold"
                        >
                          შესვლა
                        </button>
                      )}
                      <button
                        onClick={() => handleStatusChange(t.id, 'COMPLETED')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold"
                      >
                        დასრულება ✓
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 italic">
                აქტიურად მიღებაზე არავინ იმყოფება
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Completed Today */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              ✅ დღეს მიღებული / დასრულებული
            </span>
            <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded-full text-xs font-extrabold">
              {completedTickets.length}
            </span>
          </div>

          <div className="p-3 space-y-2 flex-1 overflow-y-auto max-h-[500px]">
            {completedTickets.length > 0 ? (
              completedTickets.map((t) => (
                <div key={t.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between opacity-80">
                  <div>
                    <span className="font-mono font-bold text-slate-800 mr-2">{t.ticketNumber}</span>
                    <span className="font-bold text-slate-900">{t.patientName}</span>
                  </div>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                    დასრულდა
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 italic">
                ჯერ არ არის დასრულებული ვიზიტები
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Issue Ticket Modal */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center space-x-2">
                <Plus className="w-4 h-4 text-teal-400" />
                <span>რიგის ბილეთის გაცემა</span>
              </h3>
              <button onClick={() => setIsIssueModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueTicket} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">პაციენტი *</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
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
                <label className="block font-bold text-slate-700 mb-1">ექიმი-სტომატოლოგი</label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">კაბინეტი</label>
                <select
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="კაბინეტი 101">კაბინეტი 101 (თერაპია)</option>
                  <option value="კაბინეტი 102 (ქირურგია)">კაბინეტი 102 (ქირურგია)</option>
                  <option value="კაბინეტი 103 (ორთოპედია)">კაბინეტი 103 (ორთოპედია)</option>
                </select>
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-sm"
                >
                  ბილეთის დაბეჭდვა & გაცემა
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
