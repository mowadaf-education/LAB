import React, { useState } from 'react';
import { Calendar, Clock, Users, MapPin, Plus, ArrowLeft, Download, Filter, Search, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { ROUTES } from '../config/routes';

interface TimetableEntry {
  id: string;
  day: string;
  time: string;
  subject: string;
  level: string;
  group: string;
  room: string;
  teacher: string;
}

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const TIMES = ['08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00'];

const INITIAL_DATA: TimetableEntry[] = [];

export default function Timetable() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<TimetableEntry[]>(INITIAL_DATA);
  const [filterDay, setFilterDay] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = entries.filter(entry => {
    const matchesDay = !filterDay || entry.day === filterDay;
    const matchesSearch = !searchTerm || 
      entry.subject.includes(searchTerm) || 
      entry.level.includes(searchTerm) || 
      entry.group.includes(searchTerm) || 
      entry.teacher.includes(searchTerm);
    return matchesDay && matchesSearch;
  });

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-6 pb-24 rtl font-sans" dir="rtl">
      {/* Header */}
      <header className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-4">
        <div className="text-right space-y-3 relative z-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full text-primary text-xs font-black uppercase tracking-widest mb-2">
            <Calendar size={14} />
            التنظيم التربوي
          </div>
          <h1 className="text-6xl font-black text-primary tracking-tighter font-serif">جدولة الحصص</h1>
          <p className="text-on-surface/60 text-xl font-bold">تسيير الجدول الزمني للمؤسسة وتوزيع الفترات الدراسية.</p>
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          <button 
            onClick={() => navigate(ROUTES.PEDAGOGICAL_DASHBOARD)}
            className="bg-surface text-primary border border-outline/10 px-8 py-4 rounded-[32px] font-black flex items-center gap-3 shadow-xl hover:bg-primary/5 transition-all active:scale-95"
          >
            <ArrowLeft size={24} />
            العودة للفضاء البيداغوجي
          </button>
          <button className="bg-primary text-on-primary px-10 py-4 rounded-full font-black flex items-center gap-3 shadow-2xl shadow-primary/30 hover:bg-primary-container transition-all active:scale-95">
            <Plus size={24} />
            إضافة حصة
          </button>
        </div>

        <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      </header>

      {/* Toolbar */}
      <section className="bg-surface p-6 rounded-[32px] border border-outline/5 shadow-xl flex flex-wrap items-center gap-6">
        <div className="flex-grow relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface/40" size={20} />
          <input 
            type="text" 
            placeholder="بحث عن مادة، أستاذ، أو قسم..." 
            className="w-full bg-surface-container-low border-none rounded-2xl pr-12 pl-6 py-4 focus:ring-2 focus:ring-primary/20 transition-all font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3">
          <Filter size={20} className="text-on-surface/40" />
          <select 
            className="bg-surface-container-low border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all"
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
          >
            <option value="">كل الأيام</option>
            {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
          </select>
        </div>

        <button className="p-4 bg-surface-container-high text-primary rounded-2xl hover:bg-outline/10 transition-all">
          <Download size={24} />
        </button>
      </section>

      {/* Timetable Grid/List */}
      <section className="bg-surface rounded-[40px] border border-outline/10 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 border-bottom border-outline/5">
                <th className="p-6 font-black text-primary text-sm uppercase tracking-wider">اليوم</th>
                <th className="p-6 font-black text-primary text-sm uppercase tracking-wider">التوقيت</th>
                <th className="p-6 font-black text-primary text-sm uppercase tracking-wider">المادة</th>
                <th className="p-6 font-black text-primary text-sm uppercase tracking-wider">المستوى / الفوج</th>
                <th className="p-6 font-black text-primary text-sm uppercase tracking-wider">القاعة / المخبر</th>
                <th className="p-6 font-black text-primary text-sm uppercase tracking-wider">الأستاذ</th>
                <th className="p-6 font-black text-primary text-sm uppercase tracking-wider text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry, i) => (
                <motion.tr 
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-outline/5 hover:bg-primary/5 transition-colors group"
                >
                  <td className="p-6">
                    <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-black">{entry.day}</span>
                  </td>
                  <td className="p-6 font-bold text-on-surface/60">
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      {entry.time}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="font-black text-primary text-lg">{entry.subject}</div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-on-surface/80">{entry.level}</span>
                      <span className="text-xs font-black text-secondary">{entry.group}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 font-bold text-on-surface/60">
                      <MapPin size={16} className="text-primary" />
                      {entry.room}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                        {entry.teacher.split(' ')[1]?.[0] || 'أ'}
                      </div>
                      <span className="font-bold">{entry.teacher}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-all">
                        <Edit2 size={18} />
                      </button>
                      <button className="p-2 hover:bg-error/10 text-error rounded-lg transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredEntries.length === 0 && (
          <div className="p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto text-on-surface/20">
              <Search size={40} />
            </div>
            <h3 className="text-xl font-black text-on-surface/40">لم يتم العثور على أي حصص مطابقة</h3>
          </div>
        )}
      </section>
    </div>
  );
}
