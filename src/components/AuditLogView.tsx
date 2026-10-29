import React, { useState } from 'react';
import { AuditLogEntry } from '../types';
import { UserCheck, Shield, Search, Lock } from 'lucide-react';

interface AuditLogViewProps {
  auditLogs: AuditLogEntry[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ auditLogs }) => {
  const [filterText, setFilterText] = useState('');

  const filteredLogs = auditLogs.filter(
    (a) =>
      a.username.toLowerCase().includes(filterText.toLowerCase()) ||
      a.action.toLowerCase().includes(filterText.toLowerCase()) ||
      a.details.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">სისტემური აუდიტის ჟურნალი (Immutable Hash-Chain Audit)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ყველა კლინიკური, ფინანსური და უსაფრთხოების მოვლენის შეუცვლელი ჩანაწერი
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-lg border">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="ფილტრი..."
            className="bg-transparent text-xs text-slate-800 focus:outline-none w-36"
          />
        </div>
      </div>

      {/* Main Audit List Table */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
            <tr>
              <th className="p-3">თარიღი/დრო</th>
              <th className="p-3">მომხმარებელი (როლი)</th>
              <th className="p-3">მოქმედება (Action)</th>
              <th className="p-3">დეტალები</th>
              <th className="p-3 font-mono">Current Hash</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="p-3 font-mono font-bold text-slate-800 whitespace-nowrap">{log.timestamp}</td>
                <td className="p-3">
                  <strong className="text-slate-900 block">{log.username}</strong>
                  <span className="text-[10px] text-slate-500">{log.role}</span>
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold text-[10px]">
                    {log.action}
                  </span>
                </td>
                <td className="p-3 text-slate-700 max-w-md">{log.details}</td>
                <td className="p-3 font-mono text-[10px] text-slate-400 truncate max-w-[120px]">{log.currentHash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
