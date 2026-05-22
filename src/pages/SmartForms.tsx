import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Plus, 
  ArrowLeft, 
  Download, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  ClipboardList,
  PenTool,
  History,
  Info,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

import { findSmartForm, ensureApiKey } from '../services/geminiService';
import { PDFService } from '../services/pdfService';

interface FormTemplate {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
}

const TEMPLATES: FormTemplate[] = [
  { id: 'pv-bris', title: 'محضر ضياع أو كسر', description: 'توثيق الحوادث التي تسببت في إتلاف الوسائل التعليمية.', icon: AlertTriangle, color: 'text-error bg-error/10 border-error/20' },
  { id: 'bon-commande', title: 'طلب اقتناء وسائل', description: 'نموذج رسمي لطلب مواد كيميائية أو أدوات مخبرية جديدة.', icon: ClipboardList, color: 'text-primary bg-primary/10 border-primary/20' },
  { id: 'pv-inventaire', title: 'محضر جرد سنوي', description: 'تقرير ختامي يصنف حالة الجرد في نهاية السنة الدراسية.', icon: FileText, color: 'text-tertiary bg-tertiary/10 border-tertiary/20' },
  { id: 'fiche-suivi', title: 'بطاقة متابعة تقنية', description: 'سجل صيانة ومتابعة دورية لجهاز مخبري معين.', icon: History, color: 'text-secondary bg-secondary/10 border-secondary/20' }
];

export default function SmartForms() {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [aiQuery, setAiQuery] = useState('');
  const [isFinding, setIsFinding] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: `REF-${Math.floor(Math.random() * 10000)}`,
    establishment: 'ثانوية الشهيد...',
    content: '',
    items: [{ name: '', quantity: '', condition: 'سليم' }]
  });

  const handleExportPDF = async () => {
    if (!selectedTemplate) return;
    
    const headers = ['اسم البند', 'الكمية', 'الحالة'];

    const data = formData.items.map(item => ([
      item.name,
      item.quantity,
      item.condition
    ]));

    PDFService.generateTablePDF(
      selectedTemplate.title,
      headers,
      data,
      `${selectedTemplate.id}.pdf`
    );
  };

  const handleFindForm = async () => {
    if (!aiQuery.trim()) return;
    
    setIsFinding(true);
    setAiRecommendation(null);
    try {
      const hasKey = await ensureApiKey();
      if (!hasKey) {
        alert('يرجى اختيار مفتاح API الخاص بك.');
        return;
      }

      const availableTemplates = TEMPLATES.map(t => ({
        title: t.title,
        path: t.id,
        desc: t.description
      }));

      const result = await findSmartForm(aiQuery, availableTemplates);
      if (result) {
        setAiRecommendation(result);
        const template = TEMPLATES.find(t => t.id === result.recommendedPath);
        if (template) {
          // You could auto-select, but let's show the recommendation first
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsFinding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pb-32 rtl" dir="rtl">
      
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-tertiary">
            <Sparkles size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">توليد مستندات ذكي</span>
          </div>
          <h1 className="text-4xl font-black text-primary tracking-tighter">المولد الذكي للنماذج</h1>
          <p className="text-secondary/70 text-lg font-bold">إنشاء وثائق رسمية مطابقة لمعايير وزارة التربية الوطنية.</p>
        </div>
        <div className="flex flex-col gap-4 w-full md:w-96">
          <div className="relative group">
            <input 
              type="text"
              placeholder="اكتب ما تحتاجه (مثلاً: أريد محضر كسر)..."
              className="w-full bg-surface border-2 border-outline-variant/30 rounded-2xl px-6 py-3.5 pr-12 focus:border-primary transition-all font-bold text-sm shadow-lg outline-none"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFindForm()}
            />
            <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={20} />
            <button 
              onClick={handleFindForm}
              disabled={isFinding}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-on-primary rounded-xl"
            >
              <FileText size={18} />
            </button>
          </div>
          <AnimatePresence>
            {aiRecommendation && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-primary/10 border border-primary/20 p-4 rounded-2xl relative"
              >
                <button onClick={() => setAiRecommendation(null)} className="absolute top-2 left-2 p-1 hover:bg-primary/10 rounded-full">
                  <X size={14} />
                </button>
                <p className="text-[10px] font-black text-primary uppercase mb-1">توصية المساعد الذكي:</p>
                <p className="text-xs font-bold text-primary leading-relaxed mb-3">{aiRecommendation.reasoning}</p>
                <button 
                  onClick={() => {
                    const t = TEMPLATES.find(temp => temp.id === aiRecommendation.recommendedPath);
                    if (t) setSelectedTemplate(t);
                    setAiRecommendation(null);
                  }}
                  className="w-full bg-primary text-on-primary py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm"
                >
                  استخدام هذا النموذج
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Templates Picker */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-xs font-black text-secondary/40 uppercase tracking-widest mr-4">اختر النموذج المطلوب</h3>
          <div className="grid grid-cols-1 gap-4">
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => setSelectedTemplate(tmpl)}
                className={cn(
                  "p-6 rounded-[32px] border-2 text-right transition-all group relative overflow-hidden",
                  selectedTemplate?.id === tmpl.id 
                    ? "border-primary bg-primary/5 shadow-xl -translate-y-1" 
                    : "border-outline/5 bg-surface hover:border-primary/20"
                )}
              >
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", tmpl.color)}>
                  <tmpl.icon size={28} />
                </div>
                <h4 className="text-xl font-black text-primary mb-1">{tmpl.title}</h4>
                <p className="text-xs font-bold text-secondary/60 leading-relaxed">{tmpl.description}</p>
                
                {selectedTemplate?.id === tmpl.id && (
                  <div className="absolute top-6 left-6 text-primary">
                    <CheckCircle2 size={24} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Editor Area */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {selectedTemplate ? (
              <motion.div 
                key={selectedTemplate.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-surface rounded-[40px] border border-outline/10 shadow-sm overflow-hidden flex flex-col min-h-[600px]"
              >
                <div className="p-8 border-b border-outline/5 bg-surface-container-low/30 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2.5 rounded-xl", selectedTemplate.color)}>
                      <selectedTemplate.icon size={20} />
                    </div>
                    <h3 className="text-xl font-black text-primary">{selectedTemplate.title}</h3>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleExportPDF} className="bg-primary text-on-primary px-6 py-3 rounded-full font-black text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/10">
                      <Download size={18} />
                      تصدير PDF
                    </button>
                    <button onClick={() => window.print()} className="p-3 bg-surface border border-outline/10 rounded-full hover:bg-surface-container transition-all">
                      <Printer size={20} />
                    </button>
                  </div>
                </div>

                <div className="p-10 space-y-10 flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-secondary/60 uppercase mr-2 tracking-widest">المؤسسة التربوية</label>
                       <input className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-primary/20" value={formData.establishment} onChange={e => setFormData({...formData, establishment: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-secondary/60 uppercase mr-2 tracking-widest">التاريخ</label>
                         <input type="date" className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-6 py-4 font-bold outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-secondary/60 uppercase mr-2 tracking-widest">المرجع</label>
                         <input className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-6 py-4 font-bold outline-none" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-secondary/60 uppercase mr-2 tracking-widest">البنود / الوسائل المعنية</label>
                      <button 
                        onClick={() => setFormData({...formData, items: [...formData.items, { name: '', quantity: '', condition: 'سليم' }]})}
                        className="text-primary text-xs font-black flex items-center gap-2 hover:translate-x-[-4px] transition-all"
                      >
                         <Plus size={16} />
                         إضافة سطر
                      </button>
                    </div>
                    <div className="space-y-3">
                      {formData.items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-container-low p-4 rounded-3xl border border-outline/5">
                           <input placeholder="اسم الوسيلة" className="bg-surface border border-outline/10 rounded-xl px-4 py-2 text-sm font-bold" value={item.name} onChange={e => {
                             const newItems = [...formData.items];
                             newItems[idx].name = e.target.value;
                             setFormData({...formData, items: newItems});
                           }} />
                           <input placeholder="الكمية" className="bg-surface border border-outline/10 rounded-xl px-4 py-2 text-sm font-bold" value={item.quantity} onChange={e => {
                             const newItems = [...formData.items];
                             newItems[idx].quantity = e.target.value;
                             setFormData({...formData, items: newItems});
                           }} />
                           <div className="flex gap-2">
                             <select className="flex-1 bg-surface border border-outline/10 rounded-xl px-4 py-2 text-xs font-bold" value={item.condition} onChange={e => {
                               const newItems = [...formData.items];
                               newItems[idx].condition = e.target.value;
                               setFormData({...formData, items: newItems});
                             }}>
                               <option value="سليم">سليم</option>
                               <option value="تالف">تالف</option>
                               <option value="مفقود">مفقود</option>
                               <option value="يحتاج صيانة">يحتاج صيانة</option>
                             </select>
                             {formData.items.length > 1 && (
                               <button onClick={() => setFormData({...formData, items: formData.items.filter((_, i) => i !== idx)})} className="p-2 text-error hover:bg-error/10 rounded-lg">
                                 <X size={18} />
                               </button>
                             )}
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary/60 uppercase mr-2 tracking-widest">نص التقرير / الطلب</label>
                    <textarea 
                      className="w-full bg-surface-container-low border border-outline/10 rounded-[32px] px-8 py-6 font-bold outline-none focus:ring-2 focus:ring-primary/20 min-h-[200px] resize-none"
                      placeholder="اكتب تفاصيل المحضر هنا..."
                      value={formData.content}
                      onChange={e => setFormData({...formData, content: e.target.value})}
                    />
                  </div>
                </div>

                <div className="p-8 border-t border-outline/5 bg-primary/5 flex justify-between items-center">
                  <div className="flex items-center gap-3 text-primary">
                    <Info size={18} />
                    <p className="text-xs font-bold text-secondary">يمكنك استخدام Gemini للمساعدة في صياغة النص الإداري بشكل احترافي.</p>
                  </div>
                  <button className="flex items-center gap-2 text-sm font-black text-tertiary hover:scale-105 transition-all">
                    <Sparkles size={18} />
                    تحسين النص بالذكاء الاصطناعي
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-20 bg-surface-container-low/20 rounded-[40px] border-2 border-dashed border-outline/10">
                <div className="w-24 h-24 rounded-full bg-surface flex items-center justify-center text-secondary/20 mb-8 border border-outline/5 shadow-inner">
                   <PenTool size={48} />
                </div>
                <h3 className="text-2xl font-black text-primary mb-4">جاهز للبدء؟</h3>
                <p className="text-secondary/60 font-bold max-w-sm">اختر نموذجاً من القائمة الجانبية للبدء في تعبئة البيانات وتصدير الملف الرسمي.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
