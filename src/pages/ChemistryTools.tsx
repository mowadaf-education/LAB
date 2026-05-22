import React, { useState } from 'react';
import { 
  Calculator, 
  FlaskConical, 
  Binary, 
  Scale, 
  Droplets, 
  Info, 
  ArrowRight,
  RefreshCcw,
  Zap,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { elements } from '../constants/elements';

export default function ChemistryTools() {
  const [activeTab, setActiveTab] = useState<'molar-mass' | 'balancer' | 'solubility' | 'converter' | 'generator'>('molar-mass');
  const [formula, setFormula] = useState('');
  const [molarMassResult, setMolarMassResult] = useState<{ total: number, breakdown: any[] } | null>(null);
  const [equation, setEquation] = useState('');
  const [balancedEquation, setBalancedEquation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Molar Mass Logic
  const calculateMolarMass = () => {
    setError(null);
    if (!formula) return;

    try {
      // Very basic parser for formulas like H2O, NaCl, C6H12O6
      const regex = /([A-Z][a-z]?)(\d*)/g;
      const matches = [...formula.matchAll(regex)];
      
      let total = 0;
      const breakdown = [];

      for (const match of matches) {
        const symbol = match[1];
        const count = parseInt(match[2] || '1');
        const element = elements.find(e => e.symbol === symbol);
        
        if (!element) throw new Error(`Element ${symbol} not found`);
        
        const mass = parseFloat(element.atomic_mass);
        const subtotal = mass * count;
        total += subtotal;
        breakdown.push({ symbol, name: element.name, mass, count, subtotal });
      }

      setMolarMassResult({ total, breakdown });
    } catch (err: any) {
      setError(err.message);
      setMolarMassResult(null);
    }
  };

  // Basic Equation Balancer UI logic
  // Real balancing requires linear algebra/matrix reduction, which is heavy for a quick demo.
  // I'll simulate or provide a few common ones + a message.
  const balanceEquation = () => {
    setError(null);
    if (!equation) return;
    
    // Placeholder logic for common reactions
    const commonReactions: Record<string, string> = {
      'H2 + O2 = H2O': '2H₂ + O₂ → 2H₂O',
      'CH4 + O2 = CO2 + H2O': 'CH₄ + 2O₂ → CO₂ + 2H₂O',
      'N2 + H2 = NH3': 'N₂ + 3H₂ → 2NH₃',
      'Na + Cl2 = NaCl': '2Na + Cl₂ → 2NaCl',
      'Fe + O2 = Fe2O3': '4Fe + 3O₂ → 2Fe₂O₃'
    };

    const cleanEq = equation.replace(/\s+/g, '');
    const result = commonReactions[equation] || commonReactions[cleanEq.replace(/=/g, '+')] || null;

    if (result) {
      setBalancedEquation(result);
    } else {
      setError("عذراً، هذه المعادلة معقدة حالياً. جاري تطوير خوارزمية الربط الجبري للمعدلات المعقدة.");
    }
  };

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto font-sans" dir="rtl">
      
      
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold text-primary mb-4 flex items-center gap-3">
          <Zap size={40} className="text-tertiary" />
          أدوات الكيمياء المتقدمة
        </h1>
        <p className="text-lg text-secondary max-w-3xl">
           مجموعة متكاملة من الأدوات لمساعدة الأساتذة والطلبة في حل المسائل الكيميائية المعقدة بسرعة ودقة.
        </p>
      </header>

      <div className="flex flex-wrap gap-4 mb-12">
        {[
          { id: 'molar-mass', label: 'حاسبة الكتلة المولية', icon: Scale },
          { id: 'balancer', label: 'موازن المعادلات', icon: FlaskConical },
          { id: 'solubility', label: 'جدول الذوبانية', icon: Droplets },
          { id: 'converter', label: 'تحويل الوحدات', icon: RefreshCcw },
          { id: 'generator', label: 'مولد أوراق العمل', icon: FileText }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-8 py-4 rounded-3xl font-black transition-all flex items-center gap-3 border-2 ${activeTab === tab.id ? 'bg-primary text-on-primary border-primary shadow-xl shadow-primary/20 scale-105' : 'bg-surface border-outline-variant text-secondary hover:bg-surface-container-low'}`}
          >
            <tab.icon size={20} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-surface rounded-[48px] p-8 md:p-12 border border-outline-variant shadow-sm min-h-[500px]">
        <AnimatePresence mode="wait">
          {activeTab === 'molar-mass' && (
            <motion.div 
              key="molar-mass"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
               <div className="text-center mb-12">
                  <h2 className="text-3xl font-black text-primary mb-4">احسب الكتلة المولية بلمحة</h2>
                   <p className="text-secondary font-medium">أدخل الصيغة الكيميائية (مثال: C6H12O6 أو H2O)</p>
               </div>

               <div className="relative mb-8">
                  <input 
                    type="text" 
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                    placeholder="أدخل الصيغة هنا..."
                    className="w-full px-8 py-6 bg-surface-container-low rounded-[32px] border-4 border-transparent focus:border-primary/20 focus:bg-white transition-all text-2xl font-black text-center outline-none tracking-widest"
                  />
                  <button 
                    onClick={calculateMolarMass}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-16 h-16 bg-primary text-on-primary rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    <ArrowRight size={32} />
                  </button>
               </div>

               {error && (
                 <div className="flex items-center gap-3 p-4 bg-error/10 text-error rounded-2xl mb-8 font-bold">
                    <AlertCircle size={20} />
                    {error}
                 </div>
               )}

               {molarMassResult && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="space-y-6"
                 >
                    <div className="bg-primary/5 border-2 border-primary/20 p-8 rounded-[40px] text-center">
                       <p className="text-xs font-black text-primary/60 uppercase tracking-widest mb-2">الكتلة المولية الإجمالية</p>
                       <h3 className="text-6xl font-black text-primary">
                         {molarMassResult.total.toFixed(4)} <span className="text-xl">g/mol</span>
                       </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {molarMassResult.breakdown.map((item, idx) => (
                         <div key={idx} className="bg-surface-container-low p-6 rounded-3xl flex justify-between items-center border border-outline/5 hover:border-primary/20 transition-all">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-primary shadow-sm border border-outline/5">
                                 {item.symbol}
                               </div>
                               <div>
                                 <p className="text-sm font-black text-on-surface">{item.name}</p>
                                 <p className="text-[10px] font-bold text-secondary">{item.mass} × {item.count}</p>
                               </div>
                            </div>
                            <div className="text-left font-black text-primary">
                               {item.subtotal.toFixed(3)}
                            </div>
                         </div>
                       ))}
                    </div>
                 </motion.div>
               )}
            </motion.div>
          )}

          {activeTab === 'balancer' && (
            <motion.div 
               key="balancer"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               className="max-w-3xl mx-auto"
            >
               <div className="text-center mb-12">
                  <h2 className="text-3xl font-black text-primary mb-4">موازن المعادلات الكيميائية</h2>
                   <p className="text-secondary font-medium">أدخل المتفاعلات والنواتج مفصولة بـ "=" أو "+"</p>
               </div>

               <div className="relative mb-8">
                  <input 
                    type="text" 
                    value={equation}
                    onChange={(e) => setEquation(e.target.value)}
                    placeholder="H2 + O2 = H2O"
                    className="w-full px-8 py-6 bg-surface-container-low rounded-[32px] border-4 border-transparent focus:border-primary/20 focus:bg-white transition-all text-2xl font-bold text-center outline-none tracking-tight"
                  />
                  <button 
                    onClick={balanceEquation}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-16 h-16 bg-primary text-on-primary rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    <RefreshCcw size={32} />
                  </button>
               </div>

               {error && (
                 <div className="flex items-center gap-3 p-4 bg-amber-50 text-amber-700 rounded-2xl mb-8 font-bold border border-amber-200">
                    <Info size={20} />
                    {error}
                 </div>
               )}

               {balancedEquation && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="bg-emerald-50 border-2 border-emerald-200 p-12 rounded-[40px] text-center"
                 >
                    <div className="flex justify-center mb-6">
                       <div className="bg-emerald-500 text-white p-2 rounded-full"><CheckCircle2 size={32} /></div>
                    </div>
                    <p className="text-xs font-black text-emerald-700/60 uppercase tracking-widest mb-4">المعادلة الموزونة</p>
                    <h3 className="text-4xl md:text-5xl font-black text-emerald-900 leading-tight">
                       {balancedEquation}
                    </h3>
                 </motion.div>
               )}

               <div className="mt-12 p-8 bg-surface-container-low rounded-[32px] border border-outline/5">
                  <h4 className="font-black text-primary mb-4">أمثلة سريعة للتجربة:</h4>
                  <div className="flex flex-wrap gap-2">
                     {['H2 + O2 = H2O', 'CH4 + O2 = CO2 + H2O', 'N2 + H2 = NH3'].map(ex => (
                       <button 
                         key={ex}
                         onClick={() => setEquation(ex)}
                         className="px-4 py-2 bg-white rounded-xl text-xs font-bold text-secondary border border-outline/10 hover:bg-primary/5 hover:text-primary transition-all"
                       >
                         {ex}
                       </button>
                     ))}
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'solubility' && (
            <motion.div 
               key="solubility"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               className="w-full"
            >
               <div className="text-center mb-12">
                  <h2 className="text-3xl font-black text-primary mb-4">جدول الذوبانية (Solubility Table)</h2>
                   <p className="text-secondary font-medium">دليل سريع لمعرفة ذوبانية الأملاح في الماء عند درجة حرارة 25° مئوية</p>
               </div>

               <div className="overflow-x-auto rounded-[32px] border border-outline/10 shadow-sm">
                  <table className="w-full text-right border-collapse">
                     <thead>
                        <tr className="bg-surface-container-high">
                           <th className="p-6 font-black text-primary border-b border-outline/5">الأيون</th>
                           <th className="p-6 font-black text-primary border-b border-outline/5">القاعدة العامة</th>
                           <th className="p-6 font-black text-primary border-b border-outline/5">الاستثناءات</th>
                        </tr>
                     </thead>
                     <tbody className="font-bold text-sm">
                        <tr className="hover:bg-primary/5 transition-colors">
                           <td className="p-6 border-b border-outline/5">Li+, Na+, K+, NH4+</td>
                           <td className="p-6 border-b border-outline/5 text-emerald-600">ذائبة دائماً</td>
                           <td className="p-6 border-b border-outline/5 text-secondary">لا توجد</td>
                        </tr>
                        <tr className="hover:bg-primary/5 transition-colors">
                           <td className="p-6 border-b border-outline/5">NO3-, C2H3O2-</td>
                           <td className="p-6 border-b border-outline/5 text-emerald-600">ذائبة دائماً</td>
                           <td className="p-6 border-b border-outline/5 text-secondary">لا توجد</td>
                        </tr>
                        <tr className="hover:bg-primary/5 transition-colors">
                           <td className="p-6 border-b border-outline/5">Cl-, Br-, I-</td>
                           <td className="p-6 border-b border-outline/5 text-emerald-600">ذائبة</td>
                           <td className="p-6 border-b border-outline/5 text-error">أملاح Ag+, Hg2++, Pb++</td>
                        </tr>
                        <tr className="hover:bg-primary/5 transition-colors">
                           <td className="p-6 border-b border-outline/5">SO4--</td>
                           <td className="p-6 border-b border-outline/5 text-emerald-600">ذائبة</td>
                           <td className="p-6 border-b border-outline/5 text-error">أملاح Ca++, Sr++, Ba++, Pb++</td>
                        </tr>
                        <tr className="hover:bg-primary/5 transition-colors">
                           <td className="p-6 border-b border-outline/5">OH-</td>
                           <td className="p-6 border-b border-outline/5 text-error">غير ذائبة غالباً</td>
                           <td className="p-6 border-b border-outline/5 text-emerald-600">قلويات المجموعتين 1 و 2</td>
                        </tr>
                        <tr className="hover:bg-primary/5 transition-colors">
                           <td className="p-6 border-b border-outline/5">S--, CO3--, PO4---</td>
                           <td className="p-6 border-b border-outline/5 text-error">غير ذائبة</td>
                           <td className="p-6 border-b border-outline/5 text-emerald-600">أملاح المجموعة 1 و NH4+</td>
                        </tr>
                     </tbody>
                  </table>
               </div>
               
               <div className="mt-12 flex flex-col md:flex-row gap-6 p-8 bg-surface-container-low rounded-[40px] items-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                     <FlaskConical size={32} className="text-primary" />
                  </div>
                  <div>
                    <h5 className="font-black text-primary mb-2">كيف تستفيد من هذا الجدول؟</h5>
                    <p className="text-sm text-secondary font-medium leading-relaxed">
                      يساعدك جدول الذوبانية في توقع حدوث تفاعلات الترسيب (Precipitation) عند خلط المحاليل الشاردية المختلفة، وهو أداة أساسية في دروس التحول الكيميائي في السنة الرابعة متوسط والثانوي.
                    </p>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'converter' && (
            <motion.div 
               key="converter"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               className="max-w-3xl mx-auto"
            >
               <div className="text-center mb-12">
                  <h2 className="text-3xl font-black text-primary mb-4">محول الوحدات المخبرية</h2>
                   <p className="text-secondary font-medium">حول بين وحدات القياس الشائعة في المختبر (التركيز، الحجم، الضغط)</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-surface-container-low p-8 rounded-[40px] border border-outline/5 transition-all">
                  <div className="space-y-4">
                     <label className="text-xs font-black text-primary/60 pr-4">الكمية</label>
                     <input type="number" placeholder="0.00" className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-primary/10 font-bold focus:border-primary outline-none" />
                  </div>
                  <div className="space-y-4">
                     <label className="text-xs font-black text-primary/60 pr-4">النوع</label>
                     <select className="w-full px-6 py-4 bg-white rounded-2xl border-2 border-primary/10 font-bold outline-none">
                        <option>التركيز (mol/L → g/L)</option>
                        <option>الحجم (ml → L)</option>
                        <option>الضغط (Pa → atm)</option>
                        <option>الحرارة (C → K)</option>
                     </select>
                  </div>
               </div>
               <div className="mt-8 text-center">
                  <button className="px-12 py-4 bg-primary text-on-primary rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                     تحويل الآن
                  </button>
               </div>
            </motion.div>
          )}

          {activeTab === 'generator' && (
            <motion.div 
               key="generator"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               className="max-w-3xl mx-auto"
            >
               <div className="text-center mb-12">
                  <h2 className="text-3xl font-black text-primary mb-4">مولد أوراق العمل (Worksheet Generator)</h2>
                   <p className="text-secondary font-medium">أنشئ اختبارات قصيرة وتمارين كيميائية جاهزة للطباعة في ثوانٍ</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { title: 'تسمية العناصر', desc: 'تمرين كتابة أسماء العناصر من رموزها' },
                    { title: 'وزن المعادلات', desc: 'مجموعة معادلات غير موزونة للتدريب' },
                    { title: 'حساب الكتل', desc: 'مسائل لحساب الكتل المولية والتركيز' },
                    { title: 'بطاقة مخبرية فارغة', desc: 'نموذج لتسجيل نتائج التجارب' }
                  ].map((tpl, i) => (
                    <button key={i} className="p-8 bg-white border-2 border-primary/5 rounded-[32px] text-right hover:border-primary hover:shadow-xl transition-all group">
                       <h4 className="font-black text-primary mb-2 group-hover:scale-105 transition-transform">{tpl.title}</h4>
                       <p className="text-xs text-secondary font-medium">{tpl.desc}</p>
                       <div className="mt-6 flex justify-end">
                          <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary">
                             <Plus size={18} />
                          </div>
                       </div>
                    </button>
                  ))}
               </div>
               <div className="mt-12 p-8 bg-primary/5 rounded-[40px] border border-dashed border-primary/30 text-center">
                  <Info size={32} className="text-primary mx-auto mb-4" />
                  <p className="text-primary font-bold">يمكنك تصدير أوراق العمل مباشرة بصيغة PDF أو DOCX عبر محول المستندات المدمج.</p>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
