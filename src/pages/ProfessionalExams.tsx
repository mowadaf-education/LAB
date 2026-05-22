import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Award, Calendar, FileText, Bell, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function ProfessionalExams() {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReferences, setShowReferences] = useState(false);

  const examResources = [
    {
      title: 'رزنامة الامتحانات',
      href: '#',
      icon: Calendar,
      desc: 'جدول مواعيد إجراء الامتحانات المهنية للترقية في الرتب.',
      color: 'bg-emerald-100 text-emerald-700'
    },
    {
      title: 'دلائل ومراجع',
      href: '#',
      icon: FileText,
      desc: 'حوليات ومواضيع سابقة للتحضير الجيد للإمتحانات المهنية.',
      color: 'bg-purple-100 text-purple-700'
    }
  ];

  const notifications = [
    {
      id: 1,
      type: 'إشعار',
      date: '04 ماي 2026',
      title: 'آخر موعد تقديم طلبات المشاركة في الامتحان المهني: 31 ماي 2026',
      desc: 'يُعلَم جميع الموظفين المعنيين بإمكانية تقديم طلبات المشاركة في الامتحان المهني عبر البوابة حتى 31 ماي 2026',
      isNew: true,
    }
  ];

  const referencesList = [
    {
      id: 1,
      title: 'دليل التحضير للامتحان المهني',
      desc: 'مرجع شامل يحتوي على مواضيع متنوعة في علوم التربية والثقافة العامة.',
      size: '2.4 MB',
      type: 'PDF'
    },
    {
      id: 2,
      title: 'حوليات نماذج المسابقات المهنية',
      desc: 'تجميعية للأسئلة السابقة للإمتحانات المهنية مع الحلول النموذجية.',
      size: '1.8 MB',
      type: 'PDF'
    },
    {
      id: 3,
      title: 'منهجية الإجابة في الثقافة العامة',
      desc: 'منهجية تحليل القول وكتابة مقال متكامل في اختبارات الثقافة العامة.',
      size: '3.1 MB',
      type: 'PDF'
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 pb-24 rtl font-sans" dir="rtl">
      <Helmet>
        <title>الإمتحانات المهنية | الأرضية الرقمية للمخابر</title>
      </Helmet>

      {/* Header */}
      <div className="flex items-center gap-4 border-b border-outline/10 pb-6 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-surface-container-high rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-on-surface-variant" />
        </button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-l from-primary to-secondary bg-clip-text text-transparent">
            الإمتحانات المهنية
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            فضاء متابعة الامتحانات المهنية، الترقية، والموارد المساعدة للتحضير.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {examResources.map((res, i) => {
          const Icon = res.icon;
          const isCalendar = res.title === 'رزنامة الامتحانات';
          const isReferences = res.title === 'دلائل ومراجع';
          
          return (
            <motion.a
              key={res.title}
              href={isCalendar || isReferences ? '#' : res.href}
              onClick={(e) => {
                if (isCalendar) {
                  e.preventDefault();
                  setShowNotifications(!showNotifications);
                  if (showReferences) setShowReferences(false);
                } else if (isReferences) {
                  e.preventDefault();
                  setShowReferences(!showReferences);
                  if (showNotifications) setShowNotifications(false);
                }
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className={cn(
                "bg-surface-container-lowest p-8 rounded-[32px] hover:shadow-ambient-hover hover:-translate-y-1 transition-all duration-300 ease-out group cursor-pointer relative overflow-hidden shadow-ambient border",
                (isCalendar && showNotifications) || (isReferences && showReferences) ? "border-primary shadow-ambient-hover -translate-y-1" : "border-outline/5 block"
              )}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay" />
              
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm", res.color)}>
                <Icon size={32} />
              </div>
              
              <h3 className="text-2xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors">
                {res.title}
              </h3>
              
              <p className="text-on-surface-variant leading-relaxed opacity-90">
                {res.desc}
              </p>
              
              <div className="absolute bottom-8 left-8 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-4 group-hover:translate-x-0">
                {isCalendar || isReferences ? (
                  <ChevronDown 
                    size={24} 
                    className={cn(
                      "text-primary transition-transform duration-300",
                      (isCalendar && showNotifications) || (isReferences && showReferences) ? "rotate-180" : ""
                    )} 
                  />
                ) : (
                  <ArrowLeft size={24} className="text-primary" />
                )}
              </div>
            </motion.a>
          );
        })}
      </div>

      <AnimatePresence>
        {showNotifications && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 48 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <Bell size={24} />
              </div>
              <h2 className="text-2xl font-bold text-on-surface">المستجدات والإشعارات</h2>
            </div>

            <div className="space-y-4">
              {notifications.map((notif, i) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-surface-container-low p-6 rounded-3xl border border-outline/10 hover:shadow-ambient transition-all relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="px-3 py-1 bg-error/10 text-error text-xs font-bold rounded-full">
                          {notif.type}
                        </span>
                        <span className="text-sm font-medium text-on-surface-variant flex items-center gap-1">
                          <Calendar size={14} />
                          {notif.date}
                        </span>
                        {notif.isNew && (
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded uppercase tracking-wider">
                            جديد
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-on-surface mb-2">
                        {notif.title}
                      </h3>
                      <p className="text-on-surface-variant leading-relaxed text-sm">
                        {notif.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {showReferences && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 48 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                <FileText size={24} />
              </div>
              <h2 className="text-2xl font-bold text-on-surface">دلائل ومراجع للتحضير</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {referencesList.map((ref, i) => (
                <motion.a
                  key={ref.id}
                  href="#"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-surface-container-low p-6 rounded-3xl border border-outline/10 hover:shadow-ambient hover:bg-surface-container transition-all group flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-lg font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">
                      {ref.title}
                    </h3>
                    <p className="text-on-surface-variant leading-relaxed text-sm mb-4">
                      {ref.desc}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-outline/5 relative">
                    <span className="text-xs font-bold px-2.5 py-1 bg-surface-container-highest rounded-lg text-on-surface-variant">
                      {ref.type} • {ref.size}
                    </span>
                    <span className="text-primary text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                      تحميل
                      <ArrowLeft size={16} />
                    </span>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
