import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Home, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { ROUTES } from '../config/routes';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 rtl" dir="rtl">
      <Helmet>
        <title>الصفحة غير موجودة | الأرضية الرقمية للمخابر</title>
      </Helmet>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-surface p-12 rounded-[48px] shadow-2xl border border-outline/5 text-center flex flex-col items-center gap-6"
      >
        <div className="w-24 h-24 bg-error/10 text-error rounded-full flex items-center justify-center mb-4">
          <AlertTriangle size={48} />
        </div>
        
        <h1 className="text-4xl font-black text-primary">خطأ 404</h1>
        <p className="text-on-surface/60 font-bold text-lg leading-relaxed">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        
        <button
          onClick={() => navigate(ROUTES.HOME)}
          className="mt-8 px-8 py-4 bg-primary text-on-primary rounded-2xl font-black flex items-center gap-3 hover:bg-primary-container hover:shadow-xl transition-all w-full justify-center"
        >
          <Home size={20} />
          العودة للرئيسية
        </button>
      </motion.div>
    </div>
  );
}
