import React, { useState, useEffect, useRef } from 'react';
import { useSchool } from '../context/SchoolContext';
import { Trash2, Plus, Printer, ChevronLeft, Save, History, FileText, Loader2, CheckCircle2, Clock, Boxes, FileDown, FileJson, ChevronUp, ChevronDown, User, Users, BookOpen, PenTool, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, query, where, getDocs, serverTimestamp, orderBy, onSnapshot, addDoc, limit, deleteDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, getUserCollection } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useTimeSlots } from '../hooks/useTimeSlots';
import TimeSlotManager from '../components/TimeSlotManager';
import ClassPicker from '../components/ClassPicker';
import ResourcePicker from '../components/ResourcePicker';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { ReportRow, Teacher, InstitutionSettings, SavedReport } from '../types/reports';
import { useDailyReport } from '../hooks/useDailyReport';

export default function DailyReport() {
  const {
    schoolId,
    navigate,
    timeSlots,
    loadingTimeSlots,
    isTimeManagerOpen, setIsTimeManagerOpen,
    pickerState, setPickerState,
    resourcePickerState, setResourcePickerState,
    teachers,
    activeTab, setActiveTab,
    date, setDate,
    reportNumber, setReportNumber,
    rows,
    labNotes, setLabNotes,
    supervisorNotes, setSupervisorNotes,
    directorNotes, setDirectorNotes,
    institution,
    history,
    isSaving,
    signature, setSignature,
    isSignatureModalOpen, setIsSignatureModalOpen,
    signatureCanvasRef,
    isDrawing,
    startDrawing,
    stopDrawing,
    draw,
    clearSignature,
    saveSignature,
    isDeleting, setIsDeleting,
    showDeleteConfirm, setShowDeleteConfirm,
    isLoading,
    isLoadingHistory,
    saveSuccess,
    generateNextReportNumber,
    fetchReportForDate,
    addRow,
    updateRow,
    deleteRow,
    handleSave,
    handleDelete,
    printHistoryReport,
    printBlankReport,
    downloadBlankWord,
    handleExportPDF,
    handleExportWord,
    handlePrint,
    handleDateChange,
    getDayName,
    moveRow,
    setRows,
    removeRow,
    loadReport
  } = useDailyReport();

  return (
    <div className="min-h-screen bg-surface-container-low/30 p-4 md:p-12 rtl pb-24 font-sans" dir="rtl">
      <TimeSlotManager 
        isOpen={isTimeManagerOpen} 
        onClose={() => setIsTimeManagerOpen(false)} 
      />
      <ClassPicker 
        isOpen={pickerState.isOpen}
        onClose={() => setPickerState({ isOpen: false, rowId: null })}
        onSelect={(className) => {
          if (pickerState.rowId !== null) {
            updateRow(pickerState.rowId, 'class', className);
          }
        }}
        initialValue={pickerState.rowId !== null ? rows.find(r => r.id === pickerState.rowId)?.class : ''}
      />
      <ResourcePicker 
        isOpen={resourcePickerState.isOpen}
        onClose={() => setResourcePickerState({ isOpen: false, rowId: null })}
        onSelect={(resources) => {
          if (resourcePickerState.rowId !== null) {
            updateRow(resourcePickerState.rowId, 'equipment', resources);
          }
        }}
        initialValue={resourcePickerState.rowId !== null ? rows.find(r => r.id === resourcePickerState.rowId)?.equipment : ''}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm no-print">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-surface rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-outline/10 text-center"
            >
              <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} className="text-error" />
              </div>
              <h3 className="text-2xl font-black text-primary mb-2">تأكيد الحذف</h3>
              <p className="text-secondary font-bold mb-8">هل أنت متأكد من رغبتك في حذف هذا التقرير؟ لا يمكن التراجع عن هذا الإجراء.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-4 rounded-2xl bg-surface-container-high text-primary font-black hover:bg-surface-container-highest transition-all"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-4 rounded-2xl bg-error text-on-error font-black shadow-lg shadow-error/20 hover:bg-error/90 transition-all flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                  تأكيد الحذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation & Tabs */}
      <div className="max-w-5xl mx-auto mb-10 no-print flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 text-primary hover:bg-surface rounded-full transition-all active:scale-95 shadow-sm"
          >
            <ChevronLeft size={24} className="rotate-180" />
          </button>
          <div className="bg-surface p-1 rounded-2xl shadow-sm border border-outline/5 flex">
            <button
              onClick={() => setActiveTab('new')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2",
                activeTab === 'new' ? "bg-primary text-on-primary shadow-lg" : "text-primary/60 hover:bg-primary/5"
              )}
            >
              <Plus size={18} />
              تقرير جديد
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2",
                activeTab === 'history' ? "bg-primary text-on-primary shadow-lg" : "text-primary/60 hover:bg-primary/5"
              )}
            >
              <History size={18} />
              أرشيف التقارير اليومية
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsTimeManagerOpen(true)}
            className="bg-surface text-primary border-2 border-primary/10 px-6 py-4 rounded-full flex items-center gap-3 shadow-sm hover:border-primary/30 transition-all active:scale-95 font-black"
          >
            <Clock size={20} />
            تعديل المواقيت
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving || activeTab === 'history'}
            className="bg-surface text-primary border-2 border-primary/10 px-8 py-4 rounded-full flex items-center gap-3 shadow-sm hover:border-primary/30 transition-all active:scale-95 font-black disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={22} className="animate-spin" /> : <Save size={22} />}
            حفظ التقرير
          </button>

          <button 
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting || activeTab === 'history'}
            className="bg-surface text-error border-2 border-error/10 px-6 py-4 rounded-full flex items-center gap-3 shadow-sm hover:border-error/30 transition-all active:scale-95 font-black disabled:opacity-50"
          >
            {isDeleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
            حذف
          </button>
          
          <div className="flex bg-surface rounded-full border-2 border-primary/10 p-1.5 shadow-md gap-1">
            <button 
              onClick={handleExportPDF}
              className="p-3 text-primary hover:bg-primary/5 rounded-full transition-all hover:scale-110 active:scale-95"
              title="تصدير PDF"
            >
              <FileDown size={22} />
            </button>
            <button 
              onClick={handleExportWord}
              className="p-3 text-primary hover:bg-primary/5 rounded-full transition-all hover:scale-110 active:scale-95"
              title="تصدير Word"
            >
              <FileText size={22} />
            </button>
            <button 
              onClick={handlePrint}
              className="bg-primary text-on-primary px-12 py-3 rounded-full flex items-center gap-3 shadow-xl shadow-primary/30 hover:bg-primary-container transition-all active:scale-95 font-black ring-4 ring-primary/10"
            >
              <Printer size={22} />
              طباعة التقرير
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'new' ? (
            <motion.div 
              key="new-report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl mx-auto bg-surface rounded-[40px] shadow-2xl p-8 md:p-16 min-h-[29.7cm] border border-outline/5 font-report print:shadow-none print:border-none print:p-0 relative overflow-hidden print:max-w-none print:w-full print:rounded-none print-container"
            >
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-[200px] -mr-20 -mt-20 print:hidden" />
        
            {/* Header */}
            <div className="relative z-10 flex justify-between items-start border-b-2 border-primary pb-8 mb-12">
              <div className="text-right text-[11px] font-bold space-y-2 text-primary">
                <p className="font-black text-sm">{institution?.directorate}</p>
                <p className="font-black text-sm">{institution?.school}</p>
                <p className="text-sm pt-2">الرقم: <span className="border-b-2 border-primary px-6 inline-block min-w-[80px] text-center font-black">{reportNumber}</span> / {new Date(date).getFullYear()}</p>
              </div>
              <div className="text-center space-y-3 flex-1 px-4">
                <p className="text-2xl font-black text-primary tracking-tight leading-relaxed">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                <p className="text-lg font-black text-primary/80">وزارة التربية الوطنية</p>
                <div className="w-24 h-1 bg-primary/20 mx-auto rounded-full" />
              </div>
              <div className="text-left text-[11px] font-bold space-y-2 text-primary">
                <p className="font-black text-sm">السنة الدراسية: <span className="border-b-2 border-primary px-4 inline-block font-black">2026/2025</span></p>
              </div>
            </div>

            <div className="text-center mb-16">
              <h2 className="relative z-10 text-4xl font-black text-primary uppercase tracking-[0.1em] inline-block">
                التقرير اليومي للمخبر
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-full h-1.5 bg-primary rounded-full opacity-20" />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-1.5 bg-primary rounded-full" />
              </h2>
            </div>

            {/* Date Info */}
            <div className="relative z-10 flex flex-wrap gap-10 mb-12 text-sm font-bold text-primary print:mb-8">
              <div className="flex items-center gap-4 bg-surface-container-low/30 px-6 py-3 rounded-2xl border border-outline/5 print:bg-transparent print:border-none print:px-0">
                <label className="font-black opacity-40 uppercase tracking-widest text-xs">التاريخ:</label>
                <input 
                  className="bg-transparent outline-none text-center w-48 font-black border-b-2 border-primary/20 focus:border-primary transition-all print:border-none print:text-on-surface text-lg" 
                  type="date" 
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4 bg-surface-container-low/30 px-6 py-3 rounded-2xl border border-outline/5 print:bg-transparent print:border-none print:px-0">
                <label className="font-black opacity-40 uppercase tracking-widest text-xs">الموافق ليوم:</label>
                <span className="font-black text-primary min-w-[100px] text-center print:text-on-surface text-lg">{getDayName(date)}</span>
              </div>
            </div>

        {/* Main Table */}
        <div className="relative z-10 overflow-x-auto">
          <table className="w-full border-collapse border-2 border-primary/20">
                <thead className="bg-primary/5 print:bg-transparent">
                  <tr className="text-primary text-sm font-black uppercase tracking-widest print:text-on-surface">
                    <th className="border-2 border-primary/20 p-4 w-16 no-print">ترتيب</th>
                    <th className="border-2 border-primary/20 p-4 w-12">رقم</th>
                    <th className="border-2 border-primary/20 p-4 w-1/5">الأستاذ(ة)</th>
                    <th className="border-2 border-primary/20 p-4 w-32">التوقيت</th>
                    <th className="border-2 border-primary/20 p-4 w-32">القسم</th>
                    <th className="border-2 border-primary/20 p-4">النشاط التطبيقي</th>
                    <th className="border-2 border-primary/20 p-4 w-1/5">الأجهزة المستعملة</th>
                    <th className="border-2 border-primary/20 p-4 w-32">ملاحظات</th>
                    <th className="border-2 border-primary/20 p-4 w-12 no-print"></th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-primary/10">
                  {rows.map((row, index) => (
                    <tr key={row.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="border-2 border-primary/20 p-2 text-center no-print">
                        <div className="flex flex-col items-center -space-y-1">
                          <button 
                            onClick={() => moveRow(row.id, 'up')}
                            disabled={index === 0}
                            className="p-1 text-primary/40 hover:text-primary disabled:opacity-10 transition-all"
                            title="تحريك للأعلى"
                          >
                            <ChevronUp size={18} />
                          </button>
                          <button 
                            onClick={() => moveRow(row.id, 'down')}
                            disabled={index === rows.length - 1}
                            className="p-1 text-primary/40 hover:text-primary disabled:opacity-10 transition-all"
                            title="تحريك للأسفل"
                          >
                            <ChevronDown size={18} />
                          </button>
                        </div>
                      </td>
                      <td className="border-2 border-primary/20 p-4 text-center text-sm font-black text-primary/60">{index + 1}</td>
                      <td className="border-2 border-primary/20 p-2 relative group/teacher">
                        <div className="flex flex-col items-center gap-1">
                          <select 
                            className="w-full border-none bg-transparent text-center text-sm font-bold outline-none focus:bg-surface-container-low/50 rounded-lg py-1 transition-all appearance-none" 
                            value={row.teacher}
                            onChange={(e) => {
                              const selectedTeacher = teachers.find(t => t.name === e.target.value);
                              setRows(rows.map(r => r.id === row.id ? { 
                                ...r, 
                                teacher: e.target.value,
                                teacherSubject: selectedTeacher?.subject || ''
                              } : r));
                            }}
                          >
                            <option value="">اختر الأستاذ...</option>
                            {teachers
                              .filter(t => {
                                // Filter out non-teachers: must have a subject and rank should not be 'مخبري' or similar
                                const isTeacher = t.subject && t.subject !== 'غير محدد' && t.subject.trim() !== '';
                                const isNotStaff = !t.rank || (!t.rank.includes('مخبري') && !t.rank.includes('عامل'));
                                return isTeacher && isNotStaff;
                              })
                              .map(t => (
                                <option key={t.id} value={t.name}>{t.name}</option>
                              ))}
                          </select>
                          {row.teacherSubject && (
                            <span className="text-xs font-black text-primary/40 bg-primary/5 px-2 py-0.5 rounded-full">
                              {row.teacherSubject}
                            </span>
                          )}
                        </div>
                        <button 
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-primary/10 text-primary rounded-lg opacity-0 group-hover/teacher:opacity-100 transition-all hover:bg-primary hover:text-on-primary no-print"
                          title="اختيار الأستاذ"
                        >
                          <User size={14} />
                        </button>
                      </td>
                      <td className="border-2 border-primary/20 p-2 relative group/time">
                        <input 
                          className="w-full border-none bg-transparent text-center text-sm font-bold outline-none focus:bg-surface-container-low/50 rounded-lg py-2 transition-all" 
                          type="text" 
                          list="time-slots"
                          value={row.time}
                          onChange={(e) => updateRow(row.id, 'time', e.target.value)}
                        />
                        <datalist id="time-slots">
                          {timeSlots.map(slot => (
                            <option key={slot} value={slot} />
                          ))}
                        </datalist>
                        <button 
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-primary/10 text-primary rounded-lg opacity-0 group-hover/time:opacity-100 transition-all hover:bg-primary hover:text-on-primary no-print"
                          title="تحديد الوقت"
                        >
                          <Clock size={14} />
                        </button>
                      </td>
                      <td className="border-2 border-primary/20 p-2 relative group/class">
                        <input 
                          className="w-full border-none bg-transparent text-center text-sm font-bold outline-none focus:bg-surface-container-low/50 rounded-lg py-2 transition-all cursor-pointer" 
                          type="text" 
                          readOnly
                          placeholder="اضغط للاختيار..."
                          value={row.class}
                          onClick={() => setPickerState({ isOpen: true, rowId: row.id })}
                        />
                        <button 
                          onClick={() => setPickerState({ isOpen: true, rowId: row.id })}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-primary/10 text-primary rounded-lg opacity-0 group-hover/class:opacity-100 transition-all hover:bg-primary hover:text-on-primary no-print"
                          title="اختيار القسم"
                        >
                          <Users size={14} />
                        </button>
                      </td>
                      <td className="border-2 border-primary/20 p-2 relative group/activity">
                        <div className="flex flex-col gap-2">
                          <select 
                            className="w-full border-none bg-surface-container-low/30 text-right text-sm font-bold outline-none focus:bg-surface-container-low/50 rounded-lg py-2 px-3 transition-all appearance-none"
                            value={row.activityType}
                            onChange={(e) => updateRow(row.id, 'activityType', e.target.value)}
                          >
                            <option value="">— نوع النشاط —</option>
                            <option value="عملي">نشاط عملي</option>
                            <option value="محاكاة">نشاط بالمحاكاة</option>
                            <option value="EXAO">نشاط محوسب EXAO</option>
                            <option value="افتراضي">نشاط افتراضي</option>
                          </select>
                          <input 
                            type="text"
                            className="w-full border-none bg-transparent text-right text-sm font-bold outline-none focus:bg-surface-container-low/50 rounded-lg py-2 px-3 transition-all"
                            placeholder="عنوان النشاط..."
                            value={row.activityTitle}
                            onChange={(e) => updateRow(row.id, 'activityTitle', e.target.value)}
                          />
                        </div>
                        <button 
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-primary/10 text-primary rounded-lg opacity-0 group-hover/activity:opacity-100 transition-all hover:bg-primary hover:text-on-primary no-print"
                          title="وصف النشاط"
                        >
                          <BookOpen size={14} />
                        </button>
                      </td>
                      <td className="border-2 border-primary/20 p-2">
                        <div className="relative group/resources">
                          <div 
                            onClick={() => setResourcePickerState({ isOpen: true, rowId: row.id })}
                            className={cn(
                              "w-full min-h-[60px] bg-surface-container-low/30 rounded-xl p-3 text-right text-sm font-bold cursor-pointer hover:bg-surface-container-low/50 transition-all border-2 border-transparent",
                              !row.equipment && "flex items-center justify-center italic text-on-surface/30"
                            )}
                          >
                            {row.equipment ? (
                              <span className="text-primary">{row.equipment}</span>
                            ) : (
                              "اختر الوسائل والمواد..."
                            )}
                          </div>
                          <button 
                            onClick={() => setResourcePickerState({ isOpen: true, rowId: row.id })}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-primary/10 text-primary rounded-lg opacity-0 group-hover/resources:opacity-100 transition-all hover:bg-primary hover:text-on-primary"
                            title="اختيار الوسائل والمواد"
                          >
                            <Boxes size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="border-2 border-primary/20 p-2">
                        <input 
                          className="w-full border-none bg-transparent text-center text-sm font-bold outline-none focus:bg-surface-container-low/50 rounded-lg py-2 transition-all" 
                          type="text" 
                          value={row.notes}
                          onChange={(e) => updateRow(row.id, 'notes', e.target.value)}
                        />
                      </td>
                      <td className="border-2 border-primary/20 p-2 text-center no-print">
                        <button 
                          onClick={() => removeRow(row.id)}
                          className="p-2 text-error/40 hover:text-error hover:bg-error/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button 
              onClick={addRow}
              className="relative z-10 mt-6 no-print flex items-center gap-2 text-primary font-black text-xs hover:bg-primary/5 px-6 py-3 rounded-xl transition-all border-2 border-dashed border-primary/20 hover:border-primary/40 w-full justify-center font-sans"
            >
              <Plus size={18} />
              إضافة سطر جديد للجدول
            </button>

            {/* Observations Table */}
            <div className="relative z-10 mt-16 print:mt-8">
              <table className="w-full border-collapse border-2 border-primary/20 rounded-[24px] overflow-hidden shadow-sm">
                <thead className="bg-primary/5 print:bg-transparent">
                  <tr className="text-primary text-sm font-black uppercase tracking-widest print:text-on-surface">
                    <th className="border-2 border-primary/20 p-4 w-1/3">ملاحظات {institution?.jobTitle || 'مسؤول المخبر'}</th>
                    <th className="border-2 border-primary/20 p-4 w-1/3">ملاحظات الناظر</th>
                    <th className="border-2 border-primary/20 p-4 w-1/3">ملاحظات المدير</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-2 border-primary/20 p-0">
                      <textarea 
                        id="note-lab"
                        className="w-full bg-transparent p-6 text-lg font-bold outline-none focus:bg-primary/5 transition-all min-h-[200px] resize-none print:p-2 print:min-h-[120px] leading-relaxed border-none"
                        placeholder="اكتب ملاحظاتك هنا..."
                        value={labNotes}
                        onChange={(e) => setLabNotes(e.target.value)}
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-0">
                      <textarea 
                        id="note-nazer"
                        className="w-full bg-transparent p-6 text-lg font-bold outline-none focus:bg-primary/5 transition-all min-h-[200px] resize-none print:p-2 print:min-h-[120px] leading-relaxed border-none"
                        placeholder="ملاحظات الناظر..."
                        value={supervisorNotes}
                        onChange={(e) => setSupervisorNotes(e.target.value)}
                      />
                    </td>
                    <td className="border-2 border-primary/20 p-0">
                      <textarea 
                        id="note-director"
                        className="w-full bg-transparent p-6 text-lg font-bold outline-none focus:bg-primary/5 transition-all min-h-[200px] resize-none print:p-2 print:min-h-[120px] leading-relaxed border-none"
                        placeholder="ملاحظات المدير..."
                        value={directorNotes}
                        onChange={(e) => setDirectorNotes(e.target.value)}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer Signatures */}
            <div className="relative z-10 grid grid-cols-3 gap-8 mt-24 text-center print:mt-16">
              <div className="space-y-16 print:space-y-12">
                <p className="text-sm font-black text-primary underline underline-offset-8 print:text-on-surface">توقيع {institution?.jobTitle || 'ملحق مخبري'}</p>
                <div 
                  onClick={() => setIsSignatureModalOpen(true)}
                  className="h-24 border-2 border-dashed border-primary/10 rounded-3xl print:border-none flex items-center justify-center bg-surface-container-low/10 cursor-pointer hover:bg-primary/5 transition-all group overflow-hidden"
                >
                  {signature ? (
                    <img src={signature} alt="Signature" className="h-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-primary/20 group-hover:text-primary/40 transition-colors">
                      <PenTool size={20} />
                      <span className="text-[8px] font-bold">توقيع رقمي</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-16 print:space-y-12">
                <p className="text-sm font-black text-primary underline underline-offset-8 print:text-on-surface">توقيع الناظر</p>
                <div className="h-24 border-2 border-dashed border-primary/10 rounded-3xl print:border-none flex items-center justify-center">
                  <span className="text-primary/10 font-sans text-4xl opacity-20 print:hidden italic">Signature</span>
                </div>
              </div>
              <div className="space-y-16 print:space-y-12">
                <p className="text-sm font-black text-primary underline underline-offset-8 print:text-on-surface">توقيع المدير</p>
                <div className="h-24 border-2 border-dashed border-primary/10 rounded-3xl print:border-none flex items-center justify-center">
                  <span className="text-primary/10 font-sans text-4xl opacity-20 print:hidden italic">Signature</span>
                </div>
              </div>
            </div>

            <div className="absolute bottom-8 left-0 right-0 text-center no-print font-sans">
              <p className="text-[10px] font-black text-primary/20 uppercase tracking-[0.2em]">الأرضية الرقمية — فضاء موظفوا المخابر</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="history-tab"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-5xl mx-auto"
          >
            {isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 size={48} className="text-primary animate-spin" />
                <p className="text-primary font-black">جاري تحميل الأرشيف...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="bg-surface rounded-[40px] p-20 text-center border border-outline/5 shadow-xl">
                <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText size={40} className="text-primary/20" />
                </div>
                <h3 className="text-xl font-black text-primary mb-2">لا توجد تقارير مؤرشفة</h3>
                <p className="text-primary/40 font-bold">ابدأ بإنشاء تقريرك اليومي الأول وحفظه ليظهر هنا</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {history.map((report) => (
                  <motion.div
                    key={report.id}
                    whileHover={{ y: -5 }}
                    className="bg-surface rounded-[32px] p-6 border border-outline/5 shadow-lg hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden"
                    onClick={() => loadReport(report)}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:scale-150" />
                    
                    <div className="relative z-10 flex justify-between items-start mb-6">
                      <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                        <FileText size={24} />
                      </div>
                      <span className="text-[10px] font-black text-primary/40 bg-surface-container-low px-3 py-1 rounded-full">
                        {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleTimeString('ar-DZ') : ''}
                      </span>
                    </div>

                    <h4 className="text-lg font-black text-primary mb-1">تقرير يوم {getDayName(report.date)}</h4>
                    <p className="text-sm font-bold text-primary/60 mb-6">{report.date}</p>

                    <div className="flex items-center justify-between pt-6 border-t border-outline/5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest">تم الحفظ</span>
                      </div>
                      <button className="text-primary font-black text-xs flex items-center gap-2 group-hover:gap-3 transition-all">
                        عرض وتعديل
                        <ChevronLeft size={14} className="rotate-180" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { 
            background: white !important; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .p-4, .p-8, .p-12, .p-16, .p-20 { padding: 0 !important; }
          .max-w-5xl { max-width: none !important; margin: 0 !important; width: 100% !important; }
          .shadow-2xl, .shadow-xl, .shadow-lg, .shadow-sm { box-shadow: none !important; }
          .rounded-\\[40px\\], .rounded-3xl, .rounded-2xl, .rounded-xl { border-radius: 0 !important; }
          .border { border: none !important; }
          .min-h-screen { min-height: auto !important; padding: 0 !important; }
          textarea { 
            height: auto !important; 
            min-height: 50px; 
            border: none !important; 
            background: transparent !important;
            padding: 0 !important;
            font-size: 12pt !important;
          }
          input { 
            border: none !important; 
            background: transparent !important;
            padding: 0 !important;
            font-size: 11pt !important;
          }
          select {
            border: none !important;
            background: transparent !important;
            appearance: none !important;
            padding: 0 !important;
            font-size: 11pt !important;
          }
          .bg-surface-container-low\\/30, .bg-primary\\/5 { background: transparent !important; }
          table { 
            width: 100% !important; 
            border-collapse: collapse !important;
            table-layout: fixed !important;
          }
          th, td { 
            border: 1px solid #000 !important; 
            padding: 4px !important;
            font-size: 10pt !important;
            word-wrap: break-word !important;
          }
          .border-primary\\/20 { border-color: #000 !important; }
          .text-primary\\/40 { color: #666 !important; }
          .text-primary\\/60 { color: #333 !important; }
          
          /* Ensure headers and footers are positioned correctly */
          .relative.z-10 { position: relative !important; z-index: 1 !important; }
          .border-b-2.border-primary { border-bottom: 2px solid #000 !important; }
          
          /* Force page margins */
          @page {
            margin: 1.5cm !important;
          }
        }
      `}</style>
      {/* Signature Modal */}
      <AnimatePresence>
        {isSignatureModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 no-print">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSignatureModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl border border-outline/10"
            >
              <div className="p-6 flex justify-between items-center border-b border-outline/5">
                <h3 className="text-xl font-black text-primary flex items-center gap-2">
                  <PenTool size={24} />
                  التوقيع الرقمي
                </h3>
                <button onClick={() => setIsSignatureModalOpen(false)} className="p-2 hover:bg-surface-container-high rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="bg-surface rounded-2xl border-2 border-outline/10 overflow-hidden touch-none">
                  <canvas
                    ref={signatureCanvasRef}
                    width={400}
                    height={200}
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseMove={draw}
                    onMouseOut={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchEnd={stopDrawing}
                    onTouchMove={draw}
                    className="w-full cursor-crosshair"
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={clearSignature}
                    className="flex-1 py-3 rounded-xl border border-outline/20 font-bold text-secondary hover:bg-surface-container-high transition-all"
                  >
                    مسح
                  </button>
                  <button 
                    onClick={saveSignature}
                    className="flex-[2] py-3 rounded-xl bg-primary text-on-primary font-bold hover:shadow-lg transition-all"
                  >
                    اعتماد التوقيع
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
