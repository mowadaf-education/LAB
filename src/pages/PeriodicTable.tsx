import React, { useState } from 'react';
import { elements, ElementData } from '../constants/elements';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Maximize2, X, FlaskConical, Atom, Binary, Scale } from 'lucide-react';


const categoryColors: Record<string, string> = {
  "diatomic nonmetal": "bg-blue-200 text-blue-900 border-blue-300",
  "noble gas": "bg-purple-200 text-purple-900 border-purple-300",
  "alkali metal": "bg-red-200 text-red-900 border-red-300",
  "alkaline earth metal": "bg-orange-200 text-orange-900 border-orange-300",
  "metalloid": "bg-emerald-200 text-emerald-900 border-emerald-300",
  "polyatomic nonmetal": "bg-blue-300 text-blue-950 border-blue-400",
  "post-transition metal": "bg-cyan-200 text-cyan-900 border-cyan-300",
  "transition metal": "bg-pink-200 text-pink-900 border-pink-300",
  "lanthanide": "bg-indigo-200 text-indigo-900 border-indigo-300",
  "actinide": "bg-rose-200 text-rose-900 border-rose-300",
};

export default function PeriodicTable() {
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);
  const [hoveredElement, setHoveredElement] = useState<ElementData | null>(null);

  const renderElement = (el: ElementData) => (
    <motion.button
      key={el.number}
      layoutId={`element-${el.number}`}
      onClick={() => setSelectedElement(el)}
      onMouseEnter={() => setHoveredElement(el)}
      onMouseLeave={() => setHoveredElement(null)}
      style={{
        gridColumn: el.xpos,
        gridRow: el.ypos,
      }}
      className={`relative w-full aspect-square p-1 flex flex-col items-center justify-center border-2 rounded-xl transition-all hover:scale-110 hover:z-10 shadow-sm ${categoryColors[el.category] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
    >
      <span className="absolute top-1 right-1 text-[8px] font-black opacity-50">{el.number}</span>
      <span className="text-sm font-black tracking-tighter">{el.symbol}</span>
      <span className="text-[6px] font-bold truncate w-full text-center">{el.name}</span>
    </motion.button>
  );

  return (
    <div className="p-8 pb-32 max-w-[1400px] mx-auto font-sans" dir="rtl">
      
      
      <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-primary mb-4 flex items-center gap-3">
            <Atom size={40} className="text-tertiary animate-spin-slow" />
            الجدول الدوري التفاعلي
          </h1>
          <p className="text-lg text-secondary max-w-2xl bg-surface-container-low p-4 rounded-2xl border border-outline/5 font-medium leading-relaxed">
            استكشف العناصر الكيميائية البالغ عددها 118 عن كثب. اطلع على خصائصها الفيزيائية، توزيعها الإلكتروني، وحالات المادة المتعلقة بها.
          </p>
        </div>
        
        {/* Info Legend */}
        <div className="flex flex-wrap gap-2 justify-end max-w-md">
          {Object.entries(categoryColors).map(([cat, color]) => (
            <div key={cat} className={`px-3 py-1 rounded-full text-[10px] font-black border ${color}`}>
              {cat}
            </div>
          ))}
        </div>
      </header>

      <div className="relative overflow-x-auto pb-8 scrollbar-hide">
        <div 
          className="grid gap-2 min-w-[1000px]" 
          style={{ 
            gridTemplateColumns: 'repeat(18, minmax(0, 1fr))',
            gridTemplateRows: 'repeat(10, minmax(50px, 1fr))'
          }}
        >
          {elements.map(renderElement)}
          
          {/* Key Info Overlay (when hovering) */}
          {hoveredElement && !selectedElement && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-[10%] left-[25%] w-[400px] h-[250px] bg-white rounded-[48px] shadow-2xl border-2 border-primary/10 p-8 flex flex-col justify-between pointer-events-none z-50"
              style={{ gridColumn: '4 / 13', gridRow: '1 / 4' }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                   <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black shadow-inner border-2 ${categoryColors[hoveredElement.category]}`}>
                     {hoveredElement.symbol}
                   </div>
                   <div>
                     <h2 className="text-3xl font-black text-primary">{hoveredElement.name}</h2>
                     <p className="text-sm font-bold text-secondary uppercase tracking-widest">{hoveredElement.category}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-4xl font-black text-primary/20">#{hoveredElement.number}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 bg-surface-container-low p-3 rounded-2xl">
                  <Scale size={16} className="text-primary" />
                  <span className="text-xs font-bold">{hoveredElement.atomic_mass} g/mol</span>
                </div>
                <div className="flex items-center gap-2 bg-surface-container-low p-3 rounded-2xl">
                  <Binary size={16} className="text-primary" />
                  <span className="text-[10px] font-black font-mono">{hoveredElement.electron_configuration}</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedElement && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedElement(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              layoutId={`element-${selectedElement.number}`}
              className="relative w-full max-w-4xl bg-white rounded-[40px] overflow-hidden shadow-2xl flex flex-col md:flex-row h-[600px]"
            >
              <div className={`w-full md:w-2/5 p-12 flex flex-col items-center justify-center text-center relative ${categoryColors[selectedElement.category]}`}>
                <div className="absolute top-8 right-8 text-6xl font-black opacity-10">#{selectedElement.number}</div>
                <h2 className="text-9xl font-black tracking-tighter mb-4">{selectedElement.symbol}</h2>
                <h3 className="text-4xl font-extrabold mb-2">{selectedElement.name}</h3>
                <p className="text-sm font-black uppercase tracking-[0.2em] opacity-60">{selectedElement.category}</p>
                
                <div className="mt-12 w-full grid grid-cols-2 gap-4">
                   <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-sm border border-white/30">
                      <p className="text-[10px] font-black uppercase opacity-60 mb-1 text-right">Atomic Mass</p>
                      <p className="text-lg font-black">{selectedElement.atomic_mass}</p>
                   </div>
                   <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-sm border border-white/30">
                      <p className="text-[10px] font-black uppercase opacity-60 mb-1 text-right">Group/Period</p>
                      <p className="text-lg font-black">{selectedElement.group} / {selectedElement.period}</p>
                   </div>
                </div>
              </div>
              
              <div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-surface text-right">
                <button 
                  onClick={() => setSelectedElement(null)}
                  className="absolute top-8 left-8 p-3 bg-surface-container-high rounded-full hover:bg-error/10 hover:text-error transition-all"
                >
                  <X size={24} />
                </button>
                
                <div className="space-y-8">
                  <section>
                    <h4 className="text-xl font-black text-primary mb-4 flex items-center gap-2">
                       <Info size={24} />
                       عن العنصر
                    </h4>
                    <p className="text-on-surface/70 leading-relaxed font-medium">
                      {selectedElement.summary}
                    </p>
                  </section>
                  
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-surface-container-low p-6 rounded-3xl">
                       <h5 className="text-xs font-black text-primary/60 uppercase mb-3 text-right">التوزيع الإلكتروني</h5>
                       <p className="font-mono font-black text-primary">{selectedElement.electron_configuration}</p>
                    </div>
                    <div className="bg-surface-container-low p-6 rounded-3xl">
                       <h5 className="text-xs font-black text-primary/60 uppercase mb-3 text-right">المظهر الفيزيائي</h5>
                       <p className="font-bold text-primary">{selectedElement.appearance}</p>
                    </div>
                  </section>

                  <section className="bg-primary/5 p-8 rounded-[32px] border border-primary/10">
                    <h4 className="text-lg font-black text-primary mb-4 flex items-center gap-2">
                       <FlaskConical size={20} />
                       ملاحظات مخبرية
                    </h4>
                    <ul className="space-y-3 text-sm font-medium text-secondary">
                      <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></div>
                        يتواجد هذا العنصر غالباً في {selectedElement.appearance}.
                      </li>
                      <li className="flex gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></div>
                        يستخدم بكثرة في تجارب {selectedElement.category === 'alkali metal' ? 'التفاعل مع الماء' : 'التحليل الكهربائي'}.
                      </li>
                    </ul>
                  </section>

                  <div className="pt-8">
                     <button className="w-full py-4 bg-primary text-on-primary rounded-2xl font-black flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-xl shadow-primary/20">
                        <Maximize2 size={20} />
                        عرض نموذج ثلاثي الأبعاد (Atom 3D)
                     </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
