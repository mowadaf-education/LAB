import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Check, RotateCcw } from 'lucide-react';
import { Chemical } from '../types/chemicals';

interface CustomBulkConfirmModalProps {
  isOpen: boolean;
  chemicalsLength: number;
  onClose: () => void;
  onConfirm: () => void;
}

export function ChemicalBulkConfirmModal({
  isOpen,
  chemicalsLength,
  onClose,
  onConfirm
}: CustomBulkConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-surface-container-lowest rounded-[32px] p-10 max-w-md w-full shadow-2xl border border-outline/10 text-right"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <Sparkles size={40} className="text-primary" />
          </div>
          <h3 className="text-3xl font-black text-primary mb-4 tracking-tight">تحديث ذكي شامل</h3>
          <p className="text-secondary/80 text-lg leading-relaxed mb-10">
            هل أنت متأكد من رغبتك في تحديث معلومات <span className="font-black text-primary">{chemicalsLength}</span> مادة ذكياً؟ 
            <br /><br />
            قد تستغرق هذه العملية بعض الوقت. سيتم تحديث البيانات تلقائياً بناءً على اقتراحات الذكاء الاصطناعي.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={onConfirm}
              className="flex-1 bg-primary text-on-primary py-5 rounded-full font-black shadow-xl shadow-primary/20 hover:bg-primary-container hover:shadow-2xl transition-all active:scale-95"
            >
              بدء التحديث
            </button>
            <button 
              onClick={onClose}
              className="flex-1 bg-surface border border-outline/20 text-secondary py-5 rounded-full font-black hover:bg-surface-container-high transition-all active:scale-95"
            >
              إلغاء
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
