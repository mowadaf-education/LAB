import React, { useState, useEffect, useRef } from 'react';
import { useSchool } from '../context/SchoolContext';
import { onSnapshot, query, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, getUserCollection } from '../firebase';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';
import { 
  Users, 
  Search, 
  UserPlus, 
  Mail, 
  Edit, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  GraduationCap,
  X,
  FileUp,
  Upload,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Teacher } from '../types/teachers';
import { useTeachers } from '../hooks/useTeachers';

export default function Teachers() {
  const {
    teachers,
    loading,
    searchTerm, setSearchTerm,
    selectedRank, setSelectedRank,
    isAddModalOpen, setIsAddModalOpen,
    editingTeacher, setEditingTeacher,
    isImporting,
    newTeacher, setNewTeacher,
    importMessage,
    columnFilters, setColumnFilters,
    activeFilterColumn, setActiveFilterColumn,
    showFilterRow, setShowFilterRow,
    sortConfig,
    fileInputRef,
    filterRef,
    formatDisplayDate,
    handleAddTeacher,
    handleDeleteTeacher,
    handleXLSImport,
    handleCSVImport,
    handleSort,
    filteredTeachers,
    uniqueRanks,
    activeFiltersCount,
    stats,
    parentRef,
    rowVirtualizer
  } = useTeachers();

  const SortIcon = ({ columnKey }: { columnKey: keyof Teacher }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={12} className="opacity-30 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-primary" /> : <ArrowDown size={12} className="text-primary" />;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative">
      <AnimatePresence>
        {importMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-24 left-1/2 -translate-x-1/2 p-4 rounded-2xl text-center font-bold shadow-2xl z-[100] min-w-[300px]",
              importMessage.type === 'success' ? "bg-primary text-on-primary" : "bg-error text-on-error"
            )}
          >
            {importMessage.text}
          </motion.div>
        )}
      </AnimatePresence>
      <header className="flex justify-between items-center w-full mb-6 px-4">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-black text-primary">تسيير المستخدمين</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <input 
              className="w-full bg-surface-container-high border-none rounded-full py-2 px-10 focus:ring-2 focus:ring-primary text-sm"
              placeholder="بحث عن أستاذ..." 
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-3 top-2.5 text-outline" size={20} />
          </div>
          <select
            value={selectedRank}
            onChange={(e) => setSelectedRank(e.target.value)}
            className="bg-surface-container-high border-none rounded-full py-2 px-6 focus:ring-2 focus:ring-primary text-sm font-bold cursor-pointer"
          >
            <option value="all">كل الرتب</option>
            {uniqueRanks.map(rank => (
              <option key={rank} value={rank}>{rank}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary-container text-on-primary-container p-6 rounded-[24px] flex items-center gap-4 shadow-sm"
        >
          <div className="w-12 h-12 bg-primary text-on-primary rounded-2xl flex items-center justify-center shadow-lg">
            <Users size={24} />
          </div>
          <div>
            <div className="text-xs font-bold opacity-70 uppercase tracking-widest">إجمالي الموظفين</div>
            <div className="text-3xl font-black">{stats.total}</div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface-container-lowest p-6 rounded-[24px] flex items-center gap-4 border border-outline/10 shadow-sm"
        >
          <div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-2xl flex items-center justify-center">
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-secondary uppercase tracking-widest">أساتذة التعليم الثانوي</div>
            <div className="text-2xl font-black text-primary">{stats.secondaryTeachers}</div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-container-lowest p-6 rounded-[24px] flex items-center gap-4 border border-outline/10 shadow-sm"
        >
          <div className="w-12 h-12 bg-tertiary-container text-on-tertiary-container rounded-2xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-secondary uppercase tracking-widest">موظفو المخابر</div>
            <div className="text-2xl font-black text-primary">{stats.labStaff}</div>
          </div>
        </motion.div>
      </div>

      <section className="flex justify-between items-center mb-6 px-4">
        <div className="flex gap-3">
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            id="csvInput"
            onChange={handleCSVImport}
          />
          <input 
            type="file" 
            accept=".xls,.xlsx" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleXLSImport}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="bg-surface-container-low border border-outline/30 text-secondary px-5 py-2 rounded-full flex items-center gap-2 hover:bg-surface-container-high transition-all text-sm font-medium disabled:opacity-50"
          >
            {isImporting ? (
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <FileUp size={18} />
            )}
            استيراد XLS
          </button>
          <button 
            onClick={() => document.getElementById('csvInput')?.click()}
            className="bg-surface-container-low border border-outline/30 text-secondary px-5 py-2 rounded-full flex items-center gap-2 hover:bg-surface-container-high transition-all text-sm font-medium"
          >
            <Upload size={18} />
            استيراد CSV
          </button>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowFilterRow(!showFilterRow)}
            className={cn(
              "px-5 py-2 rounded-full flex items-center gap-2 transition-all text-sm font-medium border relative",
              showFilterRow 
                ? "bg-primary text-on-primary border-primary shadow-lg" 
                : "bg-surface-container-low border-outline/30 text-secondary hover:bg-surface-container-high"
            )}
          >
            <Filter size={18} />
            {showFilterRow ? 'إخفاء التصفية' : 'تصفية الجدول'}
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-error text-on-error text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black shadow-sm">
                {activeFiltersCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary text-on-primary px-6 py-2.5 rounded-full flex items-center gap-2 hover:shadow-xl transition-all font-bold"
          >
            <UserPlus size={20} />
            تسجيل أستاذ جديد
          </button>
        </div>
      </section>

      <div className="bg-surface-container-lowest rounded-[28px] overflow-hidden shadow-sm max-h-[600px] overflow-y-auto custom-scrollbar" ref={parentRef}>
        <table className="w-full text-right border-collapse">
          <thead className="sticky top-0 z-20">
            <tr className="bg-surface-container-low text-secondary text-[10px] font-black uppercase tracking-widest border-b border-outline/10">
              <th className="px-6 py-5 cursor-pointer group" onClick={() => handleSort('functionalCode')}>
                <div className="flex items-center gap-2">
                  الرمز الوظيفي
                  <SortIcon columnKey="functionalCode" />
                </div>
              </th>
              <th className="px-6 py-5 cursor-pointer group" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-2">
                  الأستاذ
                  <SortIcon columnKey="name" />
                </div>
              </th>
              <th className="px-6 py-5 cursor-pointer group" onClick={() => handleSort('rank')}>
                <div className="flex items-center gap-2">
                  الرتبة / الدرجة
                  <SortIcon columnKey="rank" />
                </div>
              </th>
              <th className="px-6 py-5 cursor-pointer group" onClick={() => handleSort('subject')}>
                <div className="flex items-center gap-2">
                  المادة
                  <SortIcon columnKey="subject" />
                </div>
              </th>
              <th className="px-6 py-5 cursor-pointer group" onClick={() => handleSort('birthDate')}>
                <div className="flex items-center gap-2">
                  تاريخ الازدياد
                  <SortIcon columnKey="birthDate" />
                </div>
              </th>
              <th className="px-6 py-5 text-center">الإجراءات</th>
            </tr>
            {showFilterRow && (
              <tr className="bg-surface-container-low border-b border-outline/10">
                <td className="px-4 py-2">
                  <input 
                    className="w-full bg-surface-container-high border-none rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary"
                    placeholder="تصفية..."
                    value={columnFilters.functionalCode}
                    onChange={e => setColumnFilters({...columnFilters, functionalCode: e.target.value})}
                  />
                </td>
                <td className="px-4 py-2">
                  <input 
                    className="w-full bg-surface-container-high border-none rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary"
                    placeholder="تصفية..."
                    value={columnFilters.name}
                    onChange={e => setColumnFilters({...columnFilters, name: e.target.value})}
                  />
                </td>
                <td className="px-4 py-2">
                  <input 
                    className="w-full bg-surface-container-high border-none rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary"
                    placeholder="تصفية..."
                    value={columnFilters.rank}
                    onChange={e => setColumnFilters({...columnFilters, rank: e.target.value})}
                  />
                </td>
                <td className="px-4 py-2">
                  <input 
                    className="w-full bg-surface-container-high border-none rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary"
                    placeholder="تصفية..."
                    value={columnFilters.subject}
                    onChange={e => setColumnFilters({...columnFilters, subject: e.target.value})}
                  />
                </td>
                <td className="px-4 py-2">
                  <input 
                    className="w-full bg-surface-container-high border-none rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-primary"
                    placeholder="تصفية..."
                    value={columnFilters.birthDate}
                    onChange={e => setColumnFilters({...columnFilters, birthDate: e.target.value})}
                  />
                </td>
                <td className="px-4 py-2 text-center">
                  <button 
                    onClick={() => setColumnFilters({
                      functionalCode: '',
                      name: '',
                      rank: '',
                      subject: '',
                      birthDate: ''
                    })}
                    className="text-[10px] font-bold text-error hover:underline"
                  >
                    إعادة تعيين
                  </button>
                </td>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-surface-container relative">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-outline">جاري التحميل...</td>
              </tr>
            ) : filteredTeachers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-outline">لا يوجد أساتذة مطابقة للبحث</td>
              </tr>
            ) : (
              <>
                {rowVirtualizer.getVirtualItems().length > 0 && rowVirtualizer.getVirtualItems()[0].start > 0 && (
                  <tr><td style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px` }} colSpan={6} /></tr>
                )}
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const t = filteredTeachers[virtualRow.index];
                  return (
                    <tr 
                      key={t.id}
                      ref={rowVirtualizer.measureElement}
                      data-index={virtualRow.index}
                      className="hover:bg-surface-container-low/30 transition-colors group"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-secondary">{t.functionalCode}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs shadow-sm">
                            {t.firstName?.[0]}.{t.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-bold text-primary">{t.name}</div>
                            <div className="text-[10px] text-secondary">سريان: {formatDisplayDate(t.effectiveDate)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-primary">{t.rank}</span>
                          <span className="text-[10px] text-secondary">الدرجة: {t.grade}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-black">{t.subject}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-secondary">{formatDisplayDate(t.birthDate)}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingTeacher(t);
                              setNewTeacher({
                                functionalCode: t.functionalCode,
                                firstName: t.firstName,
                                lastName: t.lastName,
                                birthDate: t.birthDate,
                                rank: t.rank,
                                subject: t.subject,
                                grade: t.grade,
                                effectiveDate: t.effectiveDate,
                                email: t.email,
                                levels: t.levels
                              });
                              setIsAddModalOpen(true);
                            }}
                            className="p-2 hover:bg-primary/10 rounded-full text-primary transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteTeacher(t.id)}
                            className="p-2 hover:bg-error/10 rounded-full text-error transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {rowVirtualizer.getVirtualItems().length > 0 && rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems()?.at(-1)?.end || 0) > 0 && (
                  <tr><td style={{ height: `${rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems()?.at(-1)?.end || 0)}px` }} colSpan={6} /></tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 bg-surface-container-low flex justify-between items-center">
          <div className="text-xs text-secondary font-medium">عرض {filteredTeachers.length} أستاذ</div>
          <div className="flex gap-2">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container-high hover:bg-secondary-container text-secondary transition-colors">
              <ChevronRight size={18} />
            </button>
            <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-on-primary font-bold text-xs shadow-sm">1</span>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container-high hover:bg-secondary-container text-secondary transition-colors">
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-primary/20 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface w-full max-w-lg rounded-[28px] shadow-2xl overflow-hidden"
            >
              <div className="p-6 flex justify-between items-center bg-surface-container-low">
                <h3 className="text-xl font-black text-primary">
                  {editingTeacher ? 'تعديل بيانات الأستاذ' : 'تسجيل أستاذ جديد'}
                </h3>
                <button 
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingTeacher(null);
                    setNewTeacher({ name: '', subject: '', levels: [], email: '' });
                  }} 
                  className="p-2 hover:bg-surface-container-high rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddTeacher} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary mr-2 uppercase tracking-widest">الرمز الوظيفي</label>
                  <input 
                    required
                    className="w-full bg-surface-container-high border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                    value={newTeacher.functionalCode}
                    onChange={e => setNewTeacher({...newTeacher, functionalCode: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary mr-2 uppercase tracking-widest">اللقب</label>
                  <input 
                    required
                    className="w-full bg-surface-container-high border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                    value={newTeacher.lastName}
                    onChange={e => setNewTeacher({...newTeacher, lastName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary mr-2 uppercase tracking-widest">الاسم</label>
                  <input 
                    required
                    className="w-full bg-surface-container-high border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                    value={newTeacher.firstName}
                    onChange={e => setNewTeacher({...newTeacher, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary mr-2 uppercase tracking-widest">تاريخ الازدياد</label>
                  <input 
                    type="date"
                    required
                    className="w-full bg-surface-container-high border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                    value={newTeacher.birthDate}
                    onChange={e => setNewTeacher({...newTeacher, birthDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary mr-2 uppercase tracking-widest">الرتبة</label>
                  <input 
                    required
                    className="w-full bg-surface-container-high border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                    value={newTeacher.rank}
                    onChange={e => setNewTeacher({...newTeacher, rank: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary mr-2 uppercase tracking-widest">المادة</label>
                  <input 
                    required
                    className="w-full bg-surface-container-high border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                    value={newTeacher.subject}
                    onChange={e => setNewTeacher({...newTeacher, subject: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary mr-2 uppercase tracking-widest">الدرجة</label>
                  <input 
                    required
                    className="w-full bg-surface-container-high border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                    value={newTeacher.grade}
                    onChange={e => setNewTeacher({...newTeacher, grade: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary mr-2 uppercase tracking-widest">تاريخ السريان</label>
                  <input 
                    type="date"
                    required
                    className="w-full bg-surface-container-high border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                    value={newTeacher.effectiveDate}
                    onChange={e => setNewTeacher({...newTeacher, effectiveDate: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-secondary mr-2 uppercase tracking-widest">البريد الإلكتروني</label>
                  <input 
                    type="email"
                    className="w-full bg-surface-container-high border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                    value={newTeacher.email}
                    onChange={e => setNewTeacher({...newTeacher, email: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <button type="submit" className="w-full bg-primary text-on-primary py-4 rounded-full font-black shadow-lg hover:bg-primary-container transition-all">
                    حفظ البيانات
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
