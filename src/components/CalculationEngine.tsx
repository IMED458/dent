import React, { useState } from 'react';
import { CalculationSheet, Patient } from '../types';
import { Calculator, FileText, CheckCircle, Printer, Download, Stamp, ShieldCheck } from 'lucide-react';
import jsPDF from 'jspdf';

interface CalculationEngineProps {
  patient: Patient;
  calculations: CalculationSheet[];
  onCreateCalculation: (calc: any) => void;
}

export const CalculationEngine: React.FC<CalculationEngineProps> = ({
  patient,
  calculations,
  onCreateCalculation
}) => {
  const currentCalc = calculations[0];

  const [ncspCodeInput, setNcspCodeInput] = useState('SCXE00');
  const [descriptionInput, setDescriptionInput] = useState('36 კბილის დენტინის კარიესის დაბჟენა');
  const [unitPriceInput, setUnitPriceInput] = useState(140);
  const [directMaterialsInput, setDirectMaterialsInput] = useState(18.5);
  const [doctorLaborInput, setDoctorLaborInput] = useState(55.5);
  const [indirectCostInput, setIndirectCostInput] = useState(15.0);
  const [insurerShareInput, setInsurerShareInput] = useState(130.0);
  const [patientShareInput, setPatientShareInput] = useState(55.0);
  const [signedState, setSignedState] = useState(currentCalc?.status === 'SIGNED');

  // Math Calculations
  const revenue = Number(unitPriceInput);
  const directClinicalCost = Number(directMaterialsInput);
  const doctorLaborCost = Number(doctorLaborInput);
  const indirectCost = Number(indirectCostInput);

  const totalCostBeforeProfit = directClinicalCost + doctorLaborCost + indirectCost;
  const profitLoss = revenue - totalCostBeforeProfit;
  const marginPercent = revenue > 0 ? (profitLoss / revenue) * 100 : 0;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('DENTAL CLINIC GEORGIA - CALCULATION SHEET', 14, 20);
    doc.setFontSize(12);
    doc.text(`Calculation #: ${currentCalc?.calculationNumber || 'CALC-2026-00109'}`, 14, 30);
    doc.text(`Patient: ${patient.firstName} ${patient.lastName} (ID: ${patient.personalNumber})`, 14, 38);
    doc.text(`Doctor: ${currentCalc?.doctorName || 'Dr. Nino Kipiani'}`, 14, 46);
    doc.text(`Sponsor/Payer: ${currentCalc?.sponsorPayer || 'TBC Insurance'}`, 14, 54);

    doc.line(14, 60, 196, 60);

    doc.setFontSize(10);
    doc.text(`Direct Clinical Cost: ${directClinicalCost.toFixed(2)} GEL`, 14, 70);
    doc.text(`Doctor Labor Cost: ${doctorLaborCost.toFixed(2)} GEL`, 14, 78);
    doc.text(`Indirect Overhead Cost: ${indirectCost.toFixed(2)} GEL`, 14, 86);
    doc.text(`Total Cost: ${totalCostBeforeProfit.toFixed(2)} GEL`, 14, 94);
    doc.text(`Approved Revenue: ${revenue.toFixed(2)} GEL`, 14, 102);
    doc.text(`Profit/Loss: ${profitLoss.toFixed(2)} GEL (Margin: ${marginPercent.toFixed(1)}%)`, 14, 110);

    doc.line(14, 116, 196, 116);
    doc.text(`Insurer Share: ${insurerShareInput.toFixed(2)} GEL`, 14, 126);
    doc.text(`Patient Share: ${patientShareInput.toFixed(2)} GEL`, 14, 134);

    if (signedState) {
      doc.text(`SIGNED BY CLINIC DIRECTOR (STAMP APPROVED)`, 14, 150);
    }

    doc.save(`Calculation_${patient.personalNumber}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">კალკულაციის მოდული (Georgian Official Cost Calculation)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            სამედიცინო მომსახურების თვითღირებულების, არაპირდაპირი ხარჯების და მოგება/ზარალის ანალიზი
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-teal-400" />
            <span>PDF გენერაცია</span>
          </button>
        </div>
      </div>

      {/* Official Calculation Paper View */}
      <div className="bg-white p-8 rounded-xl border border-slate-300 shadow-md space-y-6 max-w-4xl mx-auto text-slate-800">
        {/* Header Document Titles */}
        <div className="border-b border-slate-300 pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">კალკულაცია № {currentCalc?.calculationNumber || 'CALC-2026-00109'}</h1>
            <p className="text-xs text-slate-500 mt-0.5">სამედიცინო ცენტრი "დენტალ ქეარი" • ი. ჭავჭავაძის გამზ. №37</p>
          </div>
          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
              signedState ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800'
            }`}>
              {signedState ? '✓ ხელმოწერილია / SIGNED' : 'დოკუმენტის პროექტი / DRAFT'}
            </span>
          </div>
        </div>

        {/* Patient & Case Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div>
            <span className="text-slate-400 font-medium block">პაციენტის გვარი, სახელი:</span>
            <strong className="text-slate-900">{patient.firstName} {patient.lastName}</strong>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">პირადი ნომერი:</span>
            <strong className="text-slate-900">{patient.personalNumber}</strong>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">დაბადების თარიღი:</span>
            <strong className="text-slate-900">{patient.dob}</strong>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">სამედიცინო ბარათის №:</span>
            <strong className="text-slate-900">{patient.medicalCardNumber}</strong>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">დამფინანსებელი / Payer:</span>
            <strong className="text-teal-700">{patient.insurerName || 'ინდივიდუალური'}</strong>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">მკურნალი ექიმი:</span>
            <strong className="text-slate-900">დოქტ. ნინო ყიფიანი</strong>
          </div>
        </div>

        {/* NCSP Services Table */}
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            ა. გამოკვლევა და სამედიცინო მანიპულაციები (NCSP)
          </h3>
          <table className="w-full text-xs border border-slate-300 text-left">
            <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
              <tr>
                <th className="p-2 border-r border-slate-300">NCSP კოდი</th>
                <th className="p-2 border-r border-slate-300">დასახელება</th>
                <th className="p-2 border-r border-slate-300 text-center">რაოდ.</th>
                <th className="p-2 text-right">ფასი (GEL)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="p-2 font-mono font-bold text-teal-700 border-r border-slate-200">{ncspCodeInput}</td>
                <td className="p-2 border-r border-slate-200">{descriptionInput}</td>
                <td className="p-2 text-center border-r border-slate-200">1</td>
                <td className="p-2 text-right font-bold">{revenue.toFixed(2)} ₾</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Cost Calculation Summary Breakdown Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            ბ. თვითღირებულება და ფინანსური შედეგი (Cost & Margin Breakdown)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                <span className="text-slate-600">პირდაპირი კლინიკური ხარჯი (მასალები):</span>
                <span className="font-bold text-slate-800">{directClinicalCost.toFixed(2)} ₾</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                <span className="text-slate-600">ექიმის შრომის ანაზღაურება (Payroll Allocation):</span>
                <span className="font-bold text-slate-800">{doctorLaborCost.toFixed(2)} ₾</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                <span className="text-slate-600">არაპირდაპირი ზედნადები ხარჯი (Overhead):</span>
                <span className="font-bold text-slate-800">{indirectCost.toFixed(2)} ₾</span>
              </div>
              <div className="flex justify-between items-center font-bold text-slate-900 pt-1">
                <span>სულ თვითღირებულება (Total Cost):</span>
                <span>{totalCostBeforeProfit.toFixed(2)} ₾</span>
              </div>
            </div>

            <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                <span className="text-slate-600">დამტკიცებული შემოსავალი (Revenue):</span>
                <span className="font-bold text-emerald-700">{revenue.toFixed(2)} ₾</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                <span className="text-slate-600">საოპერაციო მოგება / ზარალი (Profit):</span>
                <span className={`font-extrabold ${profitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {profitLoss.toFixed(2)} ₾
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                <span className="text-slate-600">მარჟა (Margin %):</span>
                <span className="font-bold text-teal-700">{marginPercent.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center font-bold text-slate-900 pt-1">
                <span>მათ შორის პაციენტის თანაგადახდა:</span>
                <span>{patientShareInput.toFixed(2)} ₾</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Approval & Director Stamp Section */}
        <div className="border-t border-slate-300 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs text-slate-500">დოკუმენტი დაგენერირებულია ავტომატურად • QR Hash: a8f9c2d1b4e5f67890123456789abcdef</p>
            <p className="text-xs font-bold text-slate-800">კლინიკის დირექტორი: დოქტ. გიორგი ბერიძე</p>
          </div>

          <div className="flex items-center space-x-3">
            {!signedState ? (
              <button
                onClick={() => setSignedState(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-2"
              >
                <Stamp className="w-4 h-4" />
                <span>ხელმოწერა & ბეჭდით დამოწმება</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs border border-emerald-300 bg-emerald-50 px-3 py-1.5 rounded-lg">
                <ShieldCheck className="w-4 h-4" />
                <span>ხელმოწერილია & დამოწმებულია</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
