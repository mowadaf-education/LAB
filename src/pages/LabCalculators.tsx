import React, { useState } from 'react';
import { 
  Calculator, 
  FlaskConical, 
  Beaker, 
  Droplets, 
  RotateCcw, 
  Save, 
  FileText,
  Info,
  Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';


export default function LabCalculators() {
  const [molarity, setMolarity] = useState({ mass: '', volume: '', molarMass: '', concentration: '' });
  const [dilution, setDilution] = useState({ c1: '', v1: '', c2: '', v2: '' });
  const [activeTab, setActiveTab] = useState<'molarity' | 'dilution'>('molarity');

  const calculateMolarity = () => {
    const { mass, volume, molarMass, concentration } = molarity;
    
    // Calculate Mass: m = C * V * M
    if (concentration && volume && molarMass && !mass) {
      const result = (parseFloat(concentration) * parseFloat(volume) * parseFloat(molarMass)) / 1000;
      setMolarity({ ...molarity, mass: result.toFixed(3) });
    }
    // Calculate Concentration: C = m / (V * M)
    else if (mass && volume && molarMass && !concentration) {
      const result = (parseFloat(mass) * 1000) / (parseFloat(volume) * parseFloat(molarMass));
      setMolarity({ ...molarity, concentration: result.toFixed(3) });
    }
  };

  const calculateDilution = () => {
    const { c1, v1, c2, v2 } = dilution;
    
    // C1 * V1 = C2 * V2
    if (c1 && v1 && c2 && !v2) {
      const result = (parseFloat(c1) * parseFloat(v1)) / parseFloat(c2);
      setDilution({ ...dilution, v2: result.toFixed(2) });
    }
    else if (c1 && c2 && v2 && !v1) {
      const result = (parseFloat(c2) * parseFloat(v2)) / parseFloat(c1);
      setDilution({ ...dilution, v1: result.toFixed(2) });
    }
  };

  const clearInputs = () => {
    if (activeTab === 'molarity') setMolarity({ mass: '', volume: '', molarMass: '', concentration: '' });
    else setDilution({ c1: '', v1: '', c2: '', v2: '' });
  };

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto font-sans" dir="rtl">
      
      
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold text-primary mb-4 flex items-center gap-3">
          <Calculator size={40} className="text-tertiary" />
          الحاسبة المخبرية الذكية
        </h1>
        <p className="text-lg text-secondary max-w-3xl">
          أدوات حسابية دقيقة لمساعدة مساعدي المخابر والأساتذة في تحضير المحاليل والكواشف بدقة متناهية.
        </p>
      </header>

      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setActiveTab('molarity')}
          className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 ${activeTab === 'molarity' ? 'bg-primary text-on-primary shadow-lg' : 'bg-surface-container-low text-secondary hover:bg-surface-container-high'}`}
        >
          <Scale size={20} />
          تحضير من مادة صلبة (التركيز المولي)
        </button>
        <button 
          onClick={() => setActiveTab('dilution')}
          className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 ${activeTab === 'dilution' ? 'bg-primary text-on-primary shadow-lg' : 'bg-surface-container-low text-secondary hover:bg-surface-container-high'}`}
        >
          <Droplets size={20} />
          التمديد (التخفيف)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface rounded-[40px] p-8 border border-outline-variant shadow-sm">
          <AnimatePresence mode="wait">
            {activeTab === 'molarity' ? (
              <motion.div 
                key="molarity"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-6 p-4 bg-tertiary/10 rounded-2xl">
                  <Info className="text-tertiary" size={20} />
                  <p className="text-sm text-tertiary font-bold">اترك الحقل المراد حسابه فارغاً</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-secondary pr-2">التركيز المطلوب (C) بالـ mol/L</label>
                    <input 
                      type="number" 
                      value={molarity.concentration}
                      onChange={(e) => setMolarity({...molarity, concentration: e.target.value})}
                      className="w-full px-6 py-4 bg-surface-container-low rounded-2xl border-none focus:ring-2 focus:ring-primary/20 font-bold"
                      placeholder="0.1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-secondary pr-2">الحجم النهائي (V) بالـ mL</label>
                    <input 
                      type="number" 
                      value={molarity.volume}
                      onChange={(e) => setMolarity({...molarity, volume: e.target.value})}
                      className="w-full px-6 py-4 bg-surface-container-low rounded-2xl border-none focus:ring-2 focus:ring-primary/20 font-bold"
                      placeholder="250"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-secondary pr-2">الكتلة المولية (M) بالـ g/mol</label>
                    <input 
                      type="number" 
                      value={molarity.molarMass}
                      onChange={(e) => setMolarity({...molarity, molarMass: e.target.value})}
                      className="w-full px-6 py-4 bg-surface-container-low rounded-2xl border-none focus:ring-2 focus:ring-primary/20 font-bold"
                      placeholder="58.44"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary pr-2">الكتلة الواجب وزنها (m) بالـ g</label>
                    <input 
                      type="number" 
                      value={molarity.mass}
                      onChange={(e) => setMolarity({...molarity, mass: e.target.value})}
                      className="w-full px-6 py-4 bg-primary/5 rounded-2xl border-2 border-primary/20 focus:ring-2 focus:ring-primary/20 font-black text-primary text-lg"
                      placeholder="النتيجة..."
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    onClick={calculateMolarity}
                    className="flex-1 bg-primary text-on-primary py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                  >
                    احسب الآن
                  </button>
                  <button 
                    onClick={clearInputs}
                    className="p-4 bg-surface-container-low text-secondary rounded-2xl hover:bg-error/10 hover:text-error transition-all"
                  >
                    <RotateCcw size={24} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="dilution"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-6 p-4 bg-tertiary/10 rounded-2xl">
                  <Info className="text-tertiary" size={20} />
                  <p className="text-sm text-tertiary font-bold">قانون التمديد: C₁V₁ = C₂V₂</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-secondary pr-2">التركيز الأصلي (C₁)</label>
                    <input 
                      type="number" 
                      value={dilution.c1}
                      onChange={(e) => setDilution({...dilution, c1: e.target.value})}
                      className="w-full px-6 py-4 bg-surface-container-low rounded-2xl border-none focus:ring-2 focus:ring-primary/20 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-secondary pr-2">الحجم المأخوذ (V₁)</label>
                    <input 
                      type="number" 
                      value={dilution.v1}
                      onChange={(e) => setDilution({...dilution, v1: e.target.value})}
                      className="w-full px-6 py-4 bg-surface-container-low rounded-2xl border-none focus:ring-2 focus:ring-primary/20 font-bold"
                    />
                  </div>
                  <div className="space-y-2 text-center flex items-center justify-center pt-8">
                    <span className="text-4xl text-outline-variant font-black">=</span>
                  </div>
                  <div className="space-y-2 text-center flex items-center justify-center pt-8">
                    {/* Spacer */}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-secondary pr-2">التركيز الهدف (C₂)</label>
                    <input 
                      type="number" 
                      value={dilution.c2}
                      onChange={(e) => setDilution({...dilution, c2: e.target.value})}
                      className="w-full px-6 py-4 bg-surface-container-low rounded-2xl border-none focus:ring-2 focus:ring-primary/20 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-primary pr-2">الحجم النهائي (V₂)</label>
                    <input 
                      type="number" 
                      value={dilution.v2}
                      onChange={(e) => setDilution({...dilution, v2: e.target.value})}
                      className="w-full px-6 py-4 bg-primary/5 rounded-2xl border-2 border-primary/20 focus:ring-2 focus:ring-primary/20 font-black text-primary text-lg"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    onClick={calculateDilution}
                    className="flex-1 bg-primary text-on-primary py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                  >
                    احسب الآن
                  </button>
                  <button 
                    onClick={clearInputs}
                    className="p-4 bg-surface-container-low text-secondary rounded-2xl hover:bg-error/10 hover:text-error transition-all"
                  >
                    <RotateCcw size={24} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-container-low rounded-[40px] p-8">
            <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
              <FileText className="text-primary" size={24} />
              طريقة العمل (Protocol)
            </h3>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-black shrink-0">1</div>
                <p className="text-sm text-secondary leading-relaxed pt-2">وزن الكتلة المحسوبة بدقة باستخدام ميزان حساس.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-black shrink-0">2</div>
                <p className="text-sm text-secondary leading-relaxed pt-2">إفراغ المادة في حوجلة (Fiole jaugée) ذات سعة مساوية للحجم المطلوب.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-black shrink-0">3</div>
                <p className="text-sm text-secondary leading-relaxed pt-2">إضافة القليل من الماء المقطر والرج الجيد حتى الذوبان التام.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-black shrink-0">4</div>
                <p className="text-sm text-secondary leading-relaxed pt-2">إكمال الحجم بالماء المقطر حتى خط العيار.</p>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-outline-variant rounded-[40px] p-8 flex flex-col items-center justify-center text-center">
             <div className="w-24 h-24 bg-tertiary/10 rounded-full flex items-center justify-center mb-6">
               <Beaker size={48} className="text-tertiary" />
             </div>
             <h4 className="text-lg font-bold text-primary mb-2 tracking-tight">هل تحتاج للمساعدة في ملصقات الزجاجيات؟</h4>
             <p className="text-sm text-secondary mb-6">يمكنك توليد ملصقات احترافية فوراً للمحاليل التي قمت بتحضيرها.</p>
             <button className="px-8 py-3 bg-tertiary text-on-tertiary rounded-2xl font-bold hover:scale-105 transition-all">
               توليد ملصق QR
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
