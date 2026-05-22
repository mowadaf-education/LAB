import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function ImportantLinks() {
  const navigate = useNavigate();

  const webLinks = [
    {
      title: 'فضاء الموظف',
      href: 'https://mowadaf.education.dz/',
      domain: 'mowadaf.education.dz',
      desc: 'الوصول السريع إلى البوابة الرقمية لوزارة التربية الوطنية.',
    },
    {
      title: 'بوابة التوظيف',
      href: 'https://tawdif.education.dz/',
      domain: 'tawdif.education.dz',
      desc: 'tawdif.education.dz',
    },
    {
      title: 'الموقع الرسمي للوزارة',
      href: 'https://education.gov.dz/',
      domain: 'education.gov.dz',
      desc: 'education.gov.dz',
    },
    {
      title: 'الديوان الوطني للامتحانات',
      href: 'https://onec.dz/',
      domain: 'onec.dz',
      desc: 'onec.dz',
    },
    {
      title: 'التعليم عن بعد ONEFD',
      href: 'https://onefd.edu.dz/',
      domain: 'onefd.edu.dz',
      desc: 'onefd.edu.dz',
    },
    {
      title: 'المطبوعات المدرسية ONPS',
      href: 'https://onps.dz/',
      domain: 'onps.dz',
      desc: 'onps.dz',
    }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 pb-24 rtl font-sans" dir="rtl">
      <Helmet>
        <title>موارد وروابط هامة | الأرضية الرقمية للمخابر</title>
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
          <h1 className="text-3xl font-bold bg-gradient-to-l from-primary to-secondary bg-clip-text text-transparent flex items-center gap-3">
            موارد وروابط هامة
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            مجموعة من المنصات والمواقع الرسمية التابعة لوزارة التربية الوطنية.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {webLinks.map((res, i) => {
          return (
            <motion.a
              key={i}
              href={res.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="bg-surface-container-lowest p-8 rounded-[32px] hover:shadow-ambient-hover hover:-translate-y-1 transition-all duration-300 ease-out group cursor-pointer relative overflow-hidden shadow-ambient border border-outline/5 block"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay" />
              
              <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center border border-outline/10 overflow-hidden mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                <img 
                 src={`https://www.google.com/s2/favicons?domain=${res.domain}&sz=64`} 
                 alt={`${res.title} icon`}
                 className="w-10 h-10 object-contain"
                 loading="lazy"
                />
              </div>
              
              <h3 className="text-2xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors flex items-center justify-between">
                {res.title}
                <ExternalLink size={20} className="opacity-50 text-on-surface-variant group-hover:text-primary transition-colors" />
              </h3>
              
              <p className={cn("text-on-surface-variant leading-relaxed opacity-90", res.domain === res.desc ? "dir-ltr text-left w-fit font-mono text-sm" : "")} dir={res.domain === res.desc ? "ltr" : "rtl"}>
                {res.desc}
              </p>
            </motion.a>
          );
        })}
      </div>
    </div>
  );
}
