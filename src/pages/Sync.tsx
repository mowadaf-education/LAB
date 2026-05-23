import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, ArrowLeft, Plus, Download, Filter, Search, MoreVertical, Trash2, Edit2, TrendingUp, FileText, Calendar, Zap, Link, Unlink } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { ROUTES } from '../config/routes';

interface SyncItem {
  id: string;
  formName: string;
  subject: string;
  level: string;
  group: string;
  scheduledTime: string;
  status: 'synced' | 'pending' | 'error';
}

const INITIAL_DATA: SyncItem[] = [];

export default function Sync() {
  const navigate = useNavigate();
  const [items, setItems] = useState<SyncItem[]>(INITIAL_DATA);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      alert('تمت مزامنة الحصص بنجاح');
    }, 2000);
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-6 pb-24 rtl font-sans" dir="rtl">
      {/* Header */}
      <header className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-4">
        <div className="text-right space-y-3 relative z-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full text-primary text-xs font-black uppercase tracking-widest mb-2">
            <Zap size={14} />
            المزامنة الذكية
          </div>
          <h1 className="text-6xl font-black text-primary tracking-tighter font-serif">مزامنة الحصص</h1>
          <p className="text-on-surface/60 text-xl font-bold">ربط بطاقات التحضير الذكي بجدول الحصص الأسبوعي.</p>
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          <button 
            onClick={() => navigate(ROUTES.PEDAGOGICAL_DASHBOARD)}
            className="bg-surface text-primary border border-outline/10 px-8 py-4 rounded-[32px] font-black flex items-center gap-3 shadow-xl hover:bg-primary/5 transition-all active:scale-95"
          >
            <ArrowLeft size={24} />
            العودة للفضاء البيداغوجي
          </button>
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="bg-primary text-on-primary px-10 py-4 rounded-full font-black flex items-center gap-3 shadow-2xl shadow-primary/30 hover:bg-primary-container transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={24} className={cn(isSyncing && "animate-spin")} />
            {isSyncing ? 'جاري المزامنة...' : 'مزامنة الآن'}
          </button>
        </div>

        <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      </header>

      {/* Sync Status Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-[40px] bg-surface border border-outline/10 shadow-xl flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Link size={32} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-on-surface/40 uppercase tracking-widest mb-1">حصص متصلة</span>
            <span className="text-3xl font-black text-primary">24 / 32</span>
          </div>
        </div>
        <div className="p-8 rounded-[40px] bg-surface border border-outline/10 shadow-xl flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center text-error">
            <Unlink size={32} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-on-surface/40 uppercase tracking-widest mb-1">حصص غير متصلة</span>
            <span className="text-3xl font-black text-error">08 حصص</span>
          </div>
        </div>
      </section>

      {/* Sync List */}
      <section className="bg-surface rounded-[40px] border border-outline/10 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-outline/5 flex justify-between items-center bg-surface-container-low/30">
          <h2 className="text-2xl font-black text-primary">قائمة المزامنة</h2>
        </div>

        <div className="p-8 space-y-4">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-[24px] bg-surface-container-low border border-outline/5 flex items-center justify-between group hover:bg-surface hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  item.status === 'synced' ? "bg-success/10 text-success" :
                  item.status === 'pending' ? "bg-warning/10 text-warning" :
                  "bg-error/10 text-error"
                )}>
                  {item.status === 'synced' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                </div>
                
                <div className="flex flex-col">
                  <h3 className="font-black text-lg text-on-surface tracking-tight">{item.formName}</h3>
                  <div className="flex items-center gap-4 text-xs font-bold text-on-surface/40">
                    <span className="flex items-center gap-1"><FileText size={12} /> {item.subject}</span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> {item.scheduledTime}</span>
                    <span className="text-secondary font-black">{item.group}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={cn(
                  "px-4 py-2 rounded-full text-xs font-black",
                  item.status === 'synced' ? "bg-success/10 text-success" :
                  item.status === 'pending' ? "bg-warning/10 text-warning" :
                  "bg-error/10 text-error"
                )}>
                  {item.status === 'synced' ? 'متصلة' : item.status === 'pending' ? 'قيد المزامنة' : 'خطأ في الربط'}
                </div>
                <button className="p-3 hover:bg-primary/10 text-primary rounded-xl transition-all">
                  <RefreshCw size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
