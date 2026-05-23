import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Check, RotateCcw } from 'lucide-react';
import { Chemical } from '../types/chemicals';
import { ChemicalIntelligence } from '../services/geminiService';
import { cn } from '../lib/utils';

interface ChemicalReviewModalProps {
  isOpen: boolean;
  suggestedUpdate: ChemicalIntelligence | null;
  selectedChemical: Chemical | null;
  onClose: () => void;
  onApprove: () => void;
}

export function ChemicalReviewModal({
  isOpen,
  suggestedUpdate,
  selectedChemical,
  onClose,
  onApprove
}: ChemicalReviewModalProps) {
  if (!isOpen || !suggestedUpdate || !selectedChemical) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-primary/20 backdrop-blur-xl"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-surface w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden border border-outline/10"
        >
          <div className="p-8 flex justify-between items-center bg-surface-container-low border-b border-outline/5">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-2xl text-primary">
                <Sparkles size={24} />
              </div>
              <h3 className="text-2xl font-black text-primary">مراجعة التحديث الذكي</h3>
            </div>
            <button 
              onClick={onClose} 
              className="p-2.5 hover:bg-surface-container-high rounded-full transition-all active:scale-90"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
            <p className="text-secondary/80 font-bold text-center bg-surface-container-low p-4 rounded-2xl border border-outline/5">
              تم العثور على معلومات أكثر دقة لهذه المادة. يرجى مراجعة التغييرات المقترحة أدناه قبل الموافقة.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Current Data */}
              <div className="space-y-6">
                <h4 className="text-sm font-black text-secondary/40 uppercase tracking-widest border-b border-outline/5 pb-2">المعلومات الحالية</h4>
                <div className="space-y-4">
                  <div className="bg-surface-container-low/50 p-4 rounded-2xl">
                    <label className="text-[10px] font-black text-secondary/40 uppercase block mb-1">الاسم</label>
                    <p className="font-bold text-secondary">{selectedChemical.nameEn} / {selectedChemical.nameAr}</p>
                  </div>
                  <div className="bg-surface-container-low/50 p-4 rounded-2xl">
                    <label className="text-[10px] font-black text-secondary/40 uppercase block mb-1">الصيغة</label>
                    <p className="font-mono font-bold text-secondary">{selectedChemical.formula}</p>
                  </div>
                  <div className="bg-surface-container-low/50 p-4 rounded-2xl">
                    <label className="text-[10px] font-black text-secondary/40 uppercase block mb-1">رقم CAS</label>
                    <p className="font-bold text-secondary">{selectedChemical.casNumber || 'غير متوفر'}</p>
                  </div>
                  <div className="bg-surface-container-low/50 p-4 rounded-2xl">
                    <label className="text-[10px] font-black text-secondary/40 uppercase block mb-1">درجة التخزين</label>
                    <p className="font-bold text-secondary">{selectedChemical.storageTemp || 'غير متوفر'}</p>
                  </div>
                  <div className="bg-surface-container-low/50 p-4 rounded-2xl">
                    <label className="text-[10px] font-black text-secondary/40 uppercase block mb-1">الخطورة</label>
                    <p className="font-bold text-secondary">{selectedChemical.hazardClass === 'danger' ? 'خطر' : 'آمن'}</p>
                  </div>
                  <div className="bg-surface-container-low/50 p-4 rounded-2xl">
                    <label className="text-[10px] font-black text-secondary/40 uppercase block mb-1">ملاحظات</label>
                    <p className="text-xs text-secondary/60">{selectedChemical.notes || 'لا توجد'}</p>
                  </div>
                </div>
              </div>

              {/* Suggested Data */}
              <div className="space-y-6">
                <h4 className="text-sm font-black text-primary uppercase tracking-widest border-b border-primary/10 pb-2">المعلومات المقترحة ✨</h4>
                <div className="space-y-4">
                  <div className={cn(
                    "p-4 rounded-2xl border transition-all",
                    (suggestedUpdate.nameEn !== selectedChemical.nameEn || suggestedUpdate.nameAr !== selectedChemical.nameAr) 
                      ? "bg-primary/5 border-primary/20 shadow-sm" 
                      : "bg-surface-container-low/50 border-transparent"
                  )}>
                    <label className="text-[10px] font-black text-primary/40 uppercase block mb-1">الاسم</label>
                    <p className="font-bold text-primary">{suggestedUpdate.nameEn} / {suggestedUpdate.nameAr}</p>
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl border transition-all",
                    suggestedUpdate.formula !== selectedChemical.formula 
                      ? "bg-primary/5 border-primary/20 shadow-sm" 
                      : "bg-surface-container-low/50 border-transparent"
                  )}>
                    <label className="text-[10px] font-black text-primary/40 uppercase block mb-1">الصيغة</label>
                    <p className="font-mono font-bold text-primary">{suggestedUpdate.formula}</p>
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl border transition-all",
                    suggestedUpdate.casNumber !== selectedChemical.casNumber 
                      ? "bg-primary/5 border-primary/20 shadow-sm" 
                      : "bg-surface-container-low/50 border-transparent"
                  )}>
                    <label className="text-[10px] font-black text-primary/40 uppercase block mb-1">رقم CAS</label>
                    <p className="font-bold text-primary">{suggestedUpdate.casNumber}</p>
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl border transition-all",
                    suggestedUpdate.storageTemp !== selectedChemical.storageTemp 
                      ? "bg-primary/5 border-primary/20 shadow-sm" 
                      : "bg-surface-container-low/50 border-transparent"
                  )}>
                    <label className="text-[10px] font-black text-primary/40 uppercase block mb-1">درجة التخزين</label>
                    <p className="font-bold text-primary">{suggestedUpdate.storageTemp}</p>
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl border transition-all",
                    suggestedUpdate.hazardClass !== selectedChemical.hazardClass 
                      ? "bg-primary/5 border-primary/20 shadow-sm" 
                      : "bg-surface-container-low/50 border-transparent"
                  )}>
                    <label className="text-[10px] font-black text-primary/40 uppercase block mb-1">الخطورة</label>
                    <p className="font-bold text-primary">{suggestedUpdate.hazardClass === 'danger' ? 'خطر' : 'آمن'}</p>
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl border transition-all",
                    suggestedUpdate.notes !== selectedChemical.notes 
                      ? "bg-primary/5 border-primary/20 shadow-sm" 
                      : "bg-surface-container-low/50 border-transparent"
                  )}>
                    <label className="text-[10px] font-black text-primary/40 uppercase block mb-1">ملاحظات</label>
                    <p className="text-xs text-primary/80">{suggestedUpdate.notes}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-10 bg-surface-container-low border-t border-outline/5 flex gap-4">
            <button 
              onClick={onApprove}
              className="flex-1 bg-primary text-on-primary py-5 rounded-full font-black shadow-xl shadow-primary/20 hover:bg-primary-container hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <Check size={24} />
              موافقة وتحديث البيانات
            </button>
            <button 
              onClick={onClose}
              className="flex-1 bg-surface border border-outline/20 text-secondary py-5 rounded-full font-black hover:bg-surface-container-high transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <RotateCcw size={24} />
              إلغاء التغييرات
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
