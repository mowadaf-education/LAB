import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { db, getUserCollection } from '../firebase';
import { getDocs, query } from 'firebase/firestore';
import { analyzeChemicalStorage, StorageAnalysisResult } from '../services/geminiService';
import { ShieldCheck, ShieldAlert, Sparkles, Printer, AlertTriangle, Info, MapPin } from 'lucide-react';

import StorageMap from '../components/StorageMap';

export default function ChemicalStorageMatrix() {
  const { schoolId } = useSchool();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [chemicals, setChemicals] = useState<any[]>([]);
  const [analysisResult, setAnalysisResult] = useState<StorageAnalysisResult | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const chemSnap = await getDocs(query(getUserCollection(schoolId, 'chemicals')));
      const chemData = chemSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setChemicals(chemData);
    } catch (error) {
      console.error("Error fetching chemicals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (chemicals.length === 0) return;
    setAnalyzing(true);
    try {
      // In a real application, you might cache this in Firestore. 
      // For this implementation, we run it live to show Gemini capabilities.
      const result = await analyzeChemicalStorage(chemicals);
      if (result) {
        setAnalysisResult(result);
      } else {
        alert("فشل التحليل الذكي. يرجى التحقق من مفتاح Gemini API والمحاولة مرة أخرى.");
      }
    } catch (error) {
       console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const gradeColors: Record<string, string> = {
    'A': 'bg-success/20 text-success border-success/50',
    'B': 'bg-success/10 text-success border-success/30',
    'C': 'bg-tertiary/20 text-tertiary border-tertiary/50',
    'D': 'bg-error/20 text-error border-error/50',
    'F': 'bg-error/30 text-error border-error font-black'
  };

  const zoneColors: Record<string, string> = {
    'red': 'bg-red-500 text-white',
    'blue': 'bg-blue-500 text-white',
    'yellow': 'bg-yellow-500 text-on-surface',
    'white': 'bg-surface text-gray-800 border border-gray-300',
    'green': 'bg-green-600 text-white',
    'orange': 'bg-orange-500 text-white',
  };

  const bgZoneColors: Record<string, string> = {
    'red': 'bg-red-50 border-red-200',
    'blue': 'bg-blue-50 border-blue-200',
    'yellow': 'bg-yellow-50 border-yellow-200',
    'white': 'bg-gray-50 border-gray-200',
    'green': 'bg-green-50 border-green-200',
    'orange': 'bg-orange-50 border-orange-200',
  };

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto">
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #print-placards, #print-placards * { visibility: visible; }
            #print-placards {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .placard {
              page-break-after: always;
              height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              padding: 2cm;
            }
            .placard-title { font-size: 4rem; font-weight: 900; margin-bottom: 1rem; }
            .placard-desc { font-size: 2rem; margin-bottom: 2rem; }
            .placard-chems { font-size: 1.5rem; text-align: left; }
            .no-print { display: none !important; }
          }
        `}
      </style>

      <div className="no-print">
        
        
        <header className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-primary mb-3 flex items-center gap-4">
              <ShieldCheck size={40} className="text-tertiary" />
              مصفوفة التوافق والتخزين الآمن
            </h1>
            <p className="text-lg text-secondary max-w-3xl">
              نظام ذكي يعتمد على الذكاء الاصطناعي (Gemini) لتحليل جرد المواد الكيميائية، اكتشاف مخاطر التخزين، وتوليد مجموعات التخزين المتوافقة والآمنة.
            </p>
          </div>
          <button 
            onClick={handleRunAnalysis}
            disabled={analyzing || loading || chemicals.length === 0}
            className="px-8 py-4 bg-tertiary text-on-tertiary rounded-2xl font-bold hover:shadow-lg hover:shadow-tertiary/30 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Sparkles size={24} className={analyzing ? "animate-spin" : ""} />
            <span>{analyzing ? 'جاري التحليل...' : 'تشغيل خوارزمية التوافق'}</span>
          </button>
        </header>

        {!loading && chemicals.length > 0 && (
          <div className="mb-12">
            <StorageMap chemicals={chemicals} />
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-secondary">جاري تحميل الجرد...</div>
        ) : chemicals.length === 0 ? (
          <div className="bg-surface-container-low rounded-3xl p-12 text-center border border-dashed border-outline-variant">
            <ShieldCheck size={64} className="mx-auto text-outline mb-4" />
            <h3 className="text-xl font-bold text-secondary mb-2">لا توجد مواد كيميائية في الجرد</h3>
            <p className="text-sm text-secondary">قم بإضافة المواد الكيميائية أولاً في قسم إدارة المخزون لتتمكن من تحليل التوافق.</p>
          </div>
        ) : !analysisResult ? (
          <div className="bg-surface-container-low rounded-3xl p-12 text-center border border-dashed border-outline-variant">
            <Sparkles size={64} className="mx-auto text-tertiary/30 mb-4" />
            <h3 className="text-3xl font-bold text-primary mb-4">جاهز لتحليل {chemicals.length} مادة كيميائية</h3>
            <p className="text-lg text-secondary max-w-xl mx-auto">
              سيقوم الذكاء الاصطناعي بدراسة أماكن التخزين الحالية (الرفوف) ومطابقتها مع خصائص كل مادة واكتشاف المخاطر مثل تخصيص الحموض بجانب القواعد، أو المواد المؤكسدة مع المشتعلة.
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Safety Score Card */}
            <div className="bg-surface rounded-[32px] p-8 border border-outline-variant shadow-lg flex flex-col md:flex-row gap-8 items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-2">نتيجة تدقيق التخزين</h2>
                <p className="text-secondary">تم تحليل {chemicals.length} مادة وتدقيق أماكن تواجدها.</p>
              </div>
              <div className={`flex items-center justify-center w-32 h-32 rounded-full border-8 ${gradeColors[analysisResult.overallSafetyGrade] || gradeColors['C']}`}>
                <span className="text-6xl font-black">{analysisResult.overallSafetyGrade || 'C'}</span>
              </div>
            </div>

            {/* Hazards Section */}
            {analysisResult.hazards && analysisResult.hazards.length > 0 && (
              <div className="bg-error/10 border-2 border-error/20 rounded-3xl p-8">
                <h3 className="text-error font-black text-2xl flex items-center gap-3 mb-6">
                  <ShieldAlert size={28} /> تحذيرات التخزين غير المتوافق ({analysisResult.hazards.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisResult.hazards.map((hazard, i) => (
                    <div key={i} className="bg-surface rounded-2xl p-5 border border-error/20 shadow-sm relative overflow-hidden">
                       <div className={`absolute top-0 right-0 w-2 h-full ${hazard.severity === 'high' ? 'bg-error' : hazard.severity === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'}`}></div>
                       <div className="flex items-center gap-2 mb-3">
                         <MapPin size={18} className="text-error" />
                         <span className="font-bold text-primary">{hazard.location}</span>
                       </div>
                       <p className="font-bold text-error mb-2">{hazard.reason}</p>
                       <div className="flex gap-2 flex-wrap text-sm">
                         {hazard.chemicalsInvolved.map((chem, j) => (
                           <span key={j} className="bg-error/10 text-error px-2 py-1 rounded-md">{chem}</span>
                         ))}
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Storage Zones Section */}
            <div>
               <div className="flex justify-between items-end mb-6">
                 <div>
                   <h3 className="text-2xl font-bold text-primary">مناطق التخزين الموصى بها</h3>
                   <p className="text-secondary text-sm mt-1">المصفوفة المثالية لترتيب المواد حسب العائلات المتوافقة.</p>
                 </div>
                 <button onClick={() => window.print()} className="bg-surface-container-high hover:bg-surface-container-highest px-4 py-2 rounded-xl text-primary font-bold flex items-center gap-2 transition-colors">
                   <Printer size={18} /> طباعة ملصقات الرفوف
                 </button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {analysisResult.storageZones.map((zone, i) => {
                    const cColor = zone.colorCode.toLowerCase();
                    const badgeClass = zoneColors[cColor] || zoneColors['white'];
                    const bgClass = bgZoneColors[cColor] || bgZoneColors['white'];
                    
                    return (
                      <div key={i} className={`rounded-3xl p-6 border ${bgClass} shadow-sm h-full flex flex-col`}>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xl font-bold text-gray-900">{zone.zoneName}</h4>
                          <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${badgeClass}`}>
                            {zone.colorCode}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm mb-6 flex-1 leading-relaxed"><Info size={16} className="inline mr-2 opacity-50"/>{zone.description}</p>
                        
                        {zone.recommendedChemicals && zone.recommendedChemicals.length > 0 && (
                          <div className="bg-surface/60 p-4 rounded-2xl">
                             <p className="text-xs font-bold text-gray-500 mb-2 uppercase">المواد التابعة:</p>
                             <div className="flex flex-wrap gap-2">
                               {zone.recommendedChemicals.map((chem, j) => (
                                 <span key={j} className="bg-surface text-gray-800 text-[11px] font-bold px-2 py-1 rounded border border-gray-200">
                                   {chem}
                                 </span>
                               ))}
                             </div>
                          </div>
                        )}
                      </div>
                    );
                 })}
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Print Placards Container */}
      <div id="print-placards" className="hidden">
         {analysisResult?.storageZones.map((zone, idx) => (
           <div key={idx} className="placard" style={{ backgroundColor: zone.colorCode === 'yellow' ? '#facc15' : zone.colorCode === 'red' ? '#ef4444' : zone.colorCode === 'blue' ? '#3b82f6' : zone.colorCode === 'green' ? '#22c55e' : zone.colorCode === 'orange' ? '#f97316' : '#ffffff', color: zone.colorCode === 'yellow' || zone.colorCode === 'white' ? '#000' : '#fff' }}>
             <h1 className="placard-title">{zone.zoneName}</h1>
             <p className="placard-desc">{zone.description}</p>
             {zone.recommendedChemicals && zone.recommendedChemicals.length > 0 && (
                <div style={{ backgroundColor: 'rgba(255,255,255,0.8)', color: '#000', padding: '2rem', borderRadius: '1rem', width: '80%', margin: '0 auto' }}>
                  <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>المواد المخصصة لهذا الرف/الخزانة:</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'right' }}>
                    {zone.recommendedChemicals.map((chem, j) => (
                      <div key={j} style={{ borderBottom: '1px solid #ccc', padding: '0.5rem' }}>{chem}</div>
                    ))}
                  </div>
                </div>
             )}
           </div>
         ))}
      </div>
    </div>
  );
}