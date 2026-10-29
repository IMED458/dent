import React from 'react';
import { InventoryItem } from '../types';
import { Package, AlertTriangle, CheckCircle, Search } from 'lucide-react';

interface InventoryFEFOProps {
  inventory: InventoryItem[];
}

export const InventoryFEFO: React.FC<InventoryFEFOProps> = ({ inventory }) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">საწყობი & FEFO მენეჯმენტი (First Expired, First Out)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            სამედიცინო მასალების, მედიკამენტების და იმპლანტების სერიული/ვალიანობის აღრიცხვა
          </p>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          საწყობის მარაგების სია & პარტიები (FEFO Batches):
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
              <tr>
                <th className="p-3">SKU / კოდი</th>
                <th className="p-3">დასახელება</th>
                <th className="p-3">კატეგორია</th>
                <th className="p-3 text-center">ნაშთი</th>
                <th className="p-3">თვითღირებულება</th>
                <th className="p-3">FEFO პარტიები (Lot / Expiry)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {inventory.map((item) => {
                const isLowStock = item.currentStock <= item.reorderLevel;
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-800">{item.sku}</td>
                    <td className="p-3 font-semibold text-slate-900">{item.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium text-[10px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-xs ${
                          isLowStock ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.currentStock} {item.unit}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-800">{item.unitAcquisitionCostGel.toFixed(2)} ₾</td>
                    <td className="p-3 space-y-1">
                      {item.lots.map((lot, idx) => (
                        <div key={idx} className="p-1.5 bg-slate-100 rounded text-[11px] font-mono flex justify-between">
                          <span>{lot.lotNumber} (ვადა: {lot.expiryDate})</span>
                          <strong className="text-teal-700">{lot.quantity} ცალი</strong>
                        </div>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
