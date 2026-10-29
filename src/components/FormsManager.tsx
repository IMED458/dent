import React, { useState } from 'react';
import { Patient } from '../types';
import { FileText, Printer, CheckCircle, ShieldCheck, Download, Save, Stethoscope, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';

interface FormsManagerProps {
  patient: Patient;
  onSaveFormSuccess?: () => void;
}

export const FormsManager: React.FC<FormsManagerProps> = ({ patient, onSaveFormSuccess }) => {
  const [activeFormTab, setActiveFormTab] = useState<'IV-220' | 'IV-220-1' | 'IV-220-2' | 'IV-220-3' | 'IV-100'>('IV-220');

  // Form State Fields (Editable with default initial values from patient record)
  const [complaints, setComplaints] = useState('ტკივილი 36 კბილის მიდამოში ტკბილისა და ცივის მიღებისას.');
  const [anamnesisMorbi, setAnamnesisMorbi] = useState('ტკივილი დაიწყო 3 დღის წინ, პერიოდულად იმატებს საღამოობით.');
  const [anamnesisVitae, setAnamnesisVitae] = useState('გადატანილი დაავადებები: ქრონიკული ტონზილიტი. ალერგოლოგიური ანამნეზი იხილეთ გაფრთხილებებში.');
  const [objectiveExamination, setObjectiveExamination] = useState('36 კბილის ოკლუზიურ ზედაპირზე ღრმა კარიესული ღრუ, ზონდირება მტკივნეულია დენტინ-პულპის საზღვარზე, პერკუსია უარყოფითია.');
  const [icd10Diagnosis, setIcd10Diagnosis] = useState('K02.1 — დენტინის კარიესი');
  const [ncspTreatment, setNcspTreatment] = useState('SCXE00 — კარიესის მკურნალობა/ბჟენის დადება (Filtek Z250)');
  const [doctorName, setDoctorName] = useState('დოქტ. ნინო ყიფიანი (მთავარი ექიმი-სტომატოლოგი)');
  const [formDate, setFormDate] = useState(new Date().toISOString().substring(0, 10));
  const [prescriptionNotes, setPrescriptionNotes] = useState('საჭიროებისამებრ: ნიმესილი 100მგ №3 პაკეტი.');

  const [isSaved, setIsSaved] = useState(false);

  const formsList = [
    { id: 'IV-220', title: 'ფორმა №IV-220/ა', desc: 'სტომატოლოგიური პაციენტის სამედიცინო ბარათი' },
    { id: 'IV-220-1', title: 'ფორმა №IV-220-1/ა', desc: 'პაციენტის გასინჯვის ფურცელი' },
    { id: 'IV-220-2', title: 'ფორმა №IV-220-2/ა', desc: 'წერილობითი ინფორმირებული თანხმობა' },
    { id: 'IV-220-3', title: 'ფორმა №IV-220-3/ა', desc: 'პაციენტების რეგისტრაციის ჟურნალი' },
    { id: 'IV-100', title: 'ფორმა №IV-100/ა', desc: 'ცნობა ჯანმრთელობის მდგომარეობის შესახებ' }
  ];

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    if (onSaveFormSuccess) onSaveFormSuccess();
  };

  const handleDownloadFormPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`OFFICIAL GEORGIAN MEDICAL FORM: ${activeFormTab}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Legal Basis: Ministry of Health Order No 01-55/N`, 14, 28);
    doc.text(`Clinic: Dental Care Georgia (Vake Branch)`, 14, 36);
    doc.text(`Patient Name: ${patient.firstName} ${patient.lastName}`, 14, 44);
    doc.text(`Personal Number: ${patient.personalNumber}`, 14, 52);
    doc.text(`Medical Card #: ${patient.medicalCardNumber}`, 14, 60);

    doc.line(14, 66, 196, 66);
    doc.text(`Diagnosis: ${icd10Diagnosis}`, 14, 76);
    doc.text(`Procedure: ${ncspTreatment}`, 14, 84);
    doc.text(`Doctor: ${doctorName}`, 14, 92);
    doc.text(`Date: ${formDate}`, 14, 100);

    doc.save(`Form_${activeFormTab}_${patient.personalNumber}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">საქართველოს ოფიციალური სამედიცინო ფორმები (შეყვანა & რედაქტირება)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            საკანონმდებლო საფუძველი: საქართველოს შრომის, ჯანმრთელობისა და სოციალური დაცვის მინისტრის №01-55/ნ ბრძანება
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {isSaved && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>ფორმის მონაცემები შენახულია!</span>
            </span>
          )}

          <button
            type="button"
            onClick={handleDownloadFormPDF}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>PDF ჩამოტვირთვა</span>
          </button>
        </div>
      </div>

      {/* Form Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm overflow-x-auto">
        {formsList.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFormTab(f.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
              activeFormTab === f.id
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {f.title}
          </button>
        ))}
      </div>

      {/* Form Editor Body */}
      <form onSubmit={handleSaveForm} className="bg-white p-8 rounded-2xl border border-slate-300 shadow-md space-y-6 max-w-4xl mx-auto text-slate-800">
        {/* Form IV-220/ა */}
        {activeFormTab === 'IV-220' && (
          <div className="space-y-6">
            <div className="border-b border-slate-300 pb-4 text-center">
              <h1 className="text-lg font-extrabold text-slate-900 uppercase">ფორმა №IV-220/ა</h1>
              <h2 className="text-sm font-bold text-slate-700 mt-1">სტომატოლოგიური პაციენტის სამედიცინო ბარათი</h2>
              <p className="text-xs font-mono text-teal-700 mt-0.5">სამედიცინო ბარათის № {patient.medicalCardNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div><strong>1. პაციენტის სახელი, გვარი:</strong> {patient.firstName} {patient.lastName}</div>
              <div><strong>2. პირადი ნომერი:</strong> {patient.personalNumber}</div>
              <div><strong>3. დაბადების თარიღი:</strong> {patient.dob}</div>
              <div><strong>4. სქესი:</strong> {patient.sex === 'MALE' ? 'მამრობითი' : 'მდედრობითი'}</div>
              <div><strong>5. ტელეფონი:</strong> {patient.phone}</div>
              <div><strong>6. მისამართი:</strong> {patient.address}</div>
            </div>

            {/* Editable Complaints & Anamnesis */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">7. პაციენტის ჩივილები (Anamnesis Morbi) *</label>
                <textarea
                  rows={2}
                  value={complaints}
                  onChange={(e) => setComplaints(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 font-sans"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">8. ავადმყოფობის განვითარების ისტორია</label>
                <textarea
                  rows={2}
                  value={anamnesisMorbi}
                  onChange={(e) => setAnamnesisMorbi(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 font-sans"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">9. ცხოვრების ისტორია & გადატანილი დაავადებები (Anamnesis Vitae)</label>
                <textarea
                  rows={2}
                  value={anamnesisVitae}
                  onChange={(e) => setAnamnesisVitae(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 font-sans"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">10. ობიექტური მონაცემები & ლოკალური სტატუსი (Status Localis)</label>
                <textarea
                  rows={3}
                  value={objectiveExamination}
                  onChange={(e) => setObjectiveExamination(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">11. კლინიკური დიაგნოზი (ICD-10)</label>
                  <select
                    value={icd10Diagnosis}
                    onChange={(e) => setIcd10Diagnosis(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-xs"
                  >
                    <option value="K02.0 — მინანქრის კარიესი">K02.0 — მინანქრის კარიესი</option>
                    <option value="K02.1 — დენტინის კარიესი">K02.1 — დენტინის კარიესი</option>
                    <option value="K04.0 — პულპიტი">K04.0 — პულპიტი</option>
                    <option value="K04.1 — პულპის ნეკროზი">K04.1 — პულპის ნეკროზი</option>
                    <option value="K04.5 — ქრონიკული აპიკალური პერიოდონტიტი">K04.5 — ქრონიკული აპიკალური პერიოდონტიტი</option>
                    <option value="K05.3 — ქრონიკული პერიოდონტიტი">K05.3 — ქრონიკული პერიოდონტიტი</option>
                    <option value="K08.1 — კბილების დაკარგვა (ნაწილობრივი ადენტია)">K08.1 — კბილების დაკარგვა</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">12. ჩატარებული მკურნალობა (NCSP)</label>
                  <select
                    value={ncspTreatment}
                    onChange={(e) => setNcspTreatment(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-bold text-xs"
                  >
                    <option value="SCXE00 — კარიესის მკურნალობა/ბჟენის დადება (Filtek Z250)">SCXE00 — კარიესის მკურნალობა/ბჟენი</option>
                    <option value="SCXA02 — არხის დაბჟენა (ენდოდონტია)">SCXA02 — არხის დაბჟენა (ენდოდონტია)</option>
                    <option value="SGXC10 — კბილის ექსტრაქცია მარტივი">SGXC10 — კბილის ექსტრაქცია მარტივი</option>
                    <option value="SFXA10 — დენტალური იმპლანტანტის ჩასმა">SFXA10 — დენტალური იმპლანტის ჩასმა</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form IV-220-1/ა */}
        {activeFormTab === 'IV-220-1' && (
          <div className="space-y-6 text-xs">
            <div className="border-b border-slate-300 pb-4 text-center">
              <h1 className="text-lg font-extrabold text-slate-900 uppercase">ფორმა №IV-220-1/ა</h1>
              <h2 className="text-sm font-bold text-slate-700 mt-1">პაციენტის გასინჯვის ფურცელი (ექიმის ჩანაწერები)</h2>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">ჩივილები და ობიექტური გასინჯვა</label>
              <textarea
                rows={3}
                value={complaints}
                onChange={(e) => setComplaints(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">დანიშნულება & რეცეპტი</label>
              <textarea
                rows={2}
                value={prescriptionNotes}
                onChange={(e) => setPrescriptionNotes(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Form IV-220-2/ა */}
        {activeFormTab === 'IV-220-2' && (
          <div className="space-y-6 text-xs leading-relaxed text-slate-700">
            <div className="border-b border-slate-300 pb-4 text-center">
              <h1 className="text-lg font-extrabold text-slate-900 uppercase">ფორმა №IV-220-2/ა</h1>
              <h2 className="text-sm font-bold text-slate-700 mt-1">წერილობითი ინფორმირებული თანხმობა სამედიცინო ჩარევაზე</h2>
            </div>

            <p>
              მე, <strong>{patient.firstName} {patient.lastName}</strong> (პირადი № {patient.personalNumber}), ვადასტურებ, რომ მკურნალმა ექიმმა სრულად და გასაგებად გამაცნო ჩემი ჯანმრთელობის მდგომარეობა, დაგეგმილი სამედიცინო/სტომატოლოგიური მანიპულაციების არსი, მოსალოდნელი შედეგები და შესაძლო გართულებები.
            </p>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl font-medium text-amber-900">
              მე ვაცხადებ თანხმობას ჩამიტარდეს თერაპიული, ქირურგიული ან ორთოპედიული მკურნალობა და ადგილობრივი გაუტკივარება.
            </div>
          </div>
        )}

        {/* Form IV-220-3/ა */}
        {activeFormTab === 'IV-220-3' && (
          <div className="space-y-4 text-xs">
            <div className="border-b border-slate-300 pb-4 text-center">
              <h1 className="text-lg font-extrabold text-slate-900 uppercase">ფორმა №IV-220-3/ა</h1>
              <h2 className="text-sm font-bold text-slate-700 mt-1">სტომატოლოგიური პაციენტების რეგისტრაციის ჟურნალი</h2>
            </div>

            <table className="w-full border border-slate-300 text-left">
              <thead className="bg-slate-100 border-b font-bold">
                <tr>
                  <th className="p-2 border-r">№</th>
                  <th className="p-2 border-r">თარიღი</th>
                  <th className="p-2 border-r">პაციენტი</th>
                  <th className="p-2 border-r">პირადი №</th>
                  <th className="p-2">ექიმი</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border-r">1</td>
                  <td className="p-2 border-r">{formDate}</td>
                  <td className="p-2 border-r font-bold">{patient.firstName} {patient.lastName}</td>
                  <td className="p-2 border-r">{patient.personalNumber}</td>
                  <td className="p-2">{doctorName}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Form IV-100/ა */}
        {activeFormTab === 'IV-100' && (
          <div className="space-y-6 text-xs">
            <div className="border-b border-slate-300 pb-4 text-center">
              <h1 className="text-lg font-extrabold text-slate-900 uppercase">ფორმა №IV-100/ა</h1>
              <h2 className="text-sm font-bold text-slate-700 mt-1">ცნობა ჯანმრთელობის მდგომარეობის შესახებ</h2>
            </div>

            <p className="leading-relaxed">
              ეძლევა <strong>{patient.firstName} {patient.lastName}</strong>-ს (პირადი № {patient.personalNumber}) მასზედ, რომ მან გაიარა სტომატოლოგიური მკურნალობის კურსი სამედიცინო ცენტრ "დენტალ ქეარში".
            </p>

            <div>
              <label className="block font-bold text-slate-800 mb-1">დიაგნოზი და რეკომენდაციები</label>
              <textarea
                rows={3}
                value={`${icd10Diagnosis}. ჩატარებული მკურნალობა: ${ncspTreatment}.`}
                readOnly
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Doctor Signature & Date Block */}
        <div className="pt-6 border-t border-slate-300 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
          <div>
            <label className="block text-slate-600 mb-1">მკურნალი ექიმი / ხელმომწერი</label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1">შედგენის თარიღი</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        {/* Submit Save Button */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold flex items-center space-x-2 shadow-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>ფორმის შენახვა & ელექტრონული ხელმოწერა</span>
          </button>
        </div>
      </form>
    </div>
  );
};
