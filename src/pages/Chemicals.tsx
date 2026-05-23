import React, { useState, useEffect, useRef } from 'react';
import { onSnapshot, query, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useVirtualizer } from '@tanstack/react-virtual';
import { db, handleFirestoreError, OperationType, getUserCollection } from '../firebase';
import { useSchool } from '../context/SchoolContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import * as XLSX from 'xlsx';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { 
  FlaskConical, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  FileUp,
  History, 
  AlertTriangle,
  ShieldAlert,
  QrCode,
  Trash2,
  Edit,
  X,
  Printer,
  Bell,
  Sparkles,
  Wand2,
  Check,
  RotateCcw,
  FileText,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { getChemicalIntelligence, ChemicalIntelligence, ensureApiKey } from '../services/geminiService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logActivity, LogAction, LogModule } from '../services/loggingService';
import { PDFService } from '../services/pdfService';
import QRScanner from '../components/QRScanner';
import { ChemicalAddModal } from '../components/ChemicalAddModal';
import { ChemicalBulkConfirmModal } from '../components/ChemicalBulkConfirmModal';
import { ChemicalReviewModal } from '../components/ChemicalReviewModal';

import { Chemical, GHS_ICONS, GHS_LABELS } from '../types/chemicals';
import { useChemicalsLogic } from '../hooks/useChemicalsLogic';

export default function Chemicals({ isNested = false }: { isNested?: boolean }) {
  const {
    searchParams,
    chemicals,
    setChemicals,
    loading,
    setLoading,
    searchTerm,
    setSearchTerm,
    filterLowStock,
    setFilterLowStock,
    selectedChemical,
    setSelectedChemical,
    isAddModalOpen,
    setIsAddModalOpen,
    editingChemical,
    setEditingChemical,
    fileInputRef,
    isImporting,
    setIsImporting,
    isGenerating,
    setIsGenerating,
    isBulkUpdating,
    setIsBulkUpdating,
    isBulkConfirmOpen,
    setIsBulkConfirmOpen,
    bulkProgress,
    setBulkProgress,
    selectedIds,
    setSelectedIds,
    suggestedUpdate,
    setSuggestedUpdate,
    isReviewModalOpen,
    setIsReviewModalOpen,
    sortConfig,
    setSortConfig,
    isQRScannerOpen,
    setIsQRScannerOpen,
    formatDisplayDate,
    newChemical,
    setNewChemical,
    handleAddChemical,
    handleSmartFill,
    handleRequestSmartUpdate,
    handleApproveUpdate,
    handleBulkSmartUpdate,
    handleDeleteChemical,
    handlePrintList,
    handleExportPDF,
    handleExportXLS,
    handleImportXLS,
    handlePrintInventoryCards,
    handlePrint,
    handleSort,
    handleToggleSelect,
    handleSelectAll,
    handleBulkDelete,
    filteredChemicals,
    sortedChemicals,
    getSortIcon,
    lowStockCount,
    parentRef,
    rowVirtualizer,
    chemicalsList,
    chemicalsLoading,
    error,
    schoolId,
    schoolName,
    stateName
  } = useChemicalsLogic(isNested);

  return (
    <div className={cn("space-y-10 max-w-7xl mx-auto pb-20", !isNested && "px-4")}>
      {/* Header */}
      {!isNested && (
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
          <div className="text-right space-y-1">
            <h1 className="text-4xl font-black text-primary tracking-tighter">المخزن الكيميائي</h1>
            <p className="text-secondary/80 text-base font-medium">إدارة وتتبع المحاليل والكواشف الكيميائية</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportXLS} 
              className="hidden" 
              accept=".xls,.xlsx"
            />
            <button 
              onClick={() => setIsQRScannerOpen(true)}
              className="bg-surface text-secondary border border-outline/10 px-6 py-3.5 rounded-full flex items-center gap-2 font-bold hover:bg-surface-container-high transition-all active:scale-95 shadow-sm"
            >
              <QrCode size={20} />
              مسح QR
            </button>
            <button 
              onClick={handlePrintList}
              className="bg-surface text-secondary border border-outline/10 px-6 py-3.5 rounded-full flex items-center gap-2 font-bold hover:bg-surface-container-high transition-all active:scale-95 shadow-sm"
            >
              <Printer size={20} />
              طباعة القائمة
            </button>
            <button 
              onClick={() => handlePrintInventoryCards(sortedChemicals)}
              className="bg-surface text-secondary border border-outline/10 px-6 py-3.5 rounded-full flex items-center gap-2 font-bold hover:bg-surface-container-high transition-all active:scale-95 shadow-sm"
            >
              <Printer size={20} className="text-primary" />
              طباعة بطاقات المخزون
            </button>
            <button 
              onClick={handleExportPDF}
              className="bg-surface text-secondary border border-outline/10 px-6 py-3.5 rounded-full flex items-center gap-2 font-bold hover:bg-surface-container-high transition-all active:scale-95 shadow-sm"
            >
              <FileText size={20} />
              تصدير PDF
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="bg-surface text-secondary border border-outline/10 px-6 py-3.5 rounded-full flex items-center gap-2 font-bold hover:bg-surface-container-high transition-all active:scale-95 shadow-sm disabled:opacity-50"
            >
              {isImporting ? (
                <div className="w-5 h-5 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
              ) : (
                <FileUp size={20} />
              )}
              استيراد XLS
            </button>
            <button 
              onClick={handleExportXLS}
              className="bg-surface text-secondary border border-outline/10 px-6 py-3.5 rounded-full flex items-center gap-2 font-bold hover:bg-surface-container-high transition-all active:scale-95 shadow-sm"
            >
              <Download size={20} />
              تصدير الجرد
            </button>
            <button 
              onClick={() => setIsBulkConfirmOpen(true)}
              disabled={isBulkUpdating || chemicals.length === 0}
              className="bg-primary text-on-primary px-6 py-3.5 rounded-full flex items-center gap-2 font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50"
              title="تحديث ذكي لجميع المواد في القائمة"
            >
              {isBulkUpdating ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-xs">{bulkProgress.current}/{bulkProgress.total}</span>
                </div>
              ) : (
                <Sparkles size={20} />
              )}
              تحديث ذكي للكل
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary text-on-primary px-8 py-3.5 rounded-full flex items-center gap-2 font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
            >
              <Plus size={20} />
              إضافة مادة
            </button>
          </div>
        </header>
      )}

      {/* Stats */}
      {!isNested && (
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-surface-container-low p-7 rounded-[32px] border border-outline/5 hover:border-outline/20 transition-all group">
            <p className="text-xs text-secondary/60 font-black uppercase tracking-widest mb-3">إجمالي المواد</p>
            <h3 className="text-4xl font-black text-primary group-hover:scale-110 transition-transform origin-right">{chemicals.length}</h3>
          </div>
          <div className="bg-error-container/40 p-7 rounded-[32px] border border-error/10 hover:border-error/20 transition-all group">
            <p className="text-xs text-on-error-container/60 font-black uppercase tracking-widest mb-3">مواد خطرة</p>
            <h3 className="text-4xl font-black text-error group-hover:scale-110 transition-transform origin-right">
              {chemicals.filter(c => (c.ghs && c.ghs.length > 0) || c.hazardClass === 'danger').length}
            </h3>
          </div>
          <div className="bg-tertiary-fixed/40 p-7 rounded-[32px] border border-tertiary/10 hover:border-tertiary/20 transition-all group">
            <p className="text-xs text-on-tertiary-fixed/60 font-black uppercase tracking-widest mb-3">تنتهي قريباً</p>
            <h3 className="text-4xl font-black text-tertiary group-hover:scale-110 transition-transform origin-right">
              {chemicals.filter(c => {
                if (!c.expiryDate) return false;
                const expiry = new Date(c.expiryDate);
                const threeMonthsFromNow = new Date();
                threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
                return expiry < threeMonthsFromNow && expiry > new Date();
              }).length.toString().padStart(2, '0')}
            </h3>
          </div>
          <div className="bg-primary p-7 rounded-[32px] text-on-primary shadow-xl shadow-primary/20 hover:shadow-2xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-surface/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10">
              <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-3">سعة التخزين</p>
              <h3 className="text-4xl font-black">68%</h3>
            </div>
          </div>
        </section>
      )}

      {lowStockCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-error-container/30 backdrop-blur-sm text-on-error-container p-5 rounded-[32px] flex items-center justify-between border border-error/10 shadow-lg shadow-error/5"
        >
          <div className="flex items-center gap-4 text-error">
            <div className="bg-error p-3 rounded-2xl text-white shadow-lg shadow-error/20">
              <Bell size={20} />
            </div>
            <span className="font-black text-base">تنبيه: يوجد {lowStockCount} مواد منخفضة المخزون!</span>
          </div>
          <button 
            onClick={() => setFilterLowStock(!filterLowStock)}
            className="text-sm font-black underline underline-offset-4 text-error px-6 py-2.5 hover:bg-error/10 rounded-full transition-all active:scale-95"
          >
            {filterLowStock ? 'عرض الكل' : 'عرض المواد المنخفضة'}
          </button>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* List */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-surface-container-lowest rounded-[32px] overflow-hidden border border-outline/10 shadow-sm">
            <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-6 bg-surface-container-low/30 border-b border-outline/5">
              <div className="relative w-full md:w-80">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-outline/60" size={20} />
                <input 
                  className="w-full bg-surface-container-low border border-outline/10 rounded-full pr-12 pl-6 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                  placeholder="بحث عن مادة (اسم أو صيغة)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setFilterLowStock(!filterLowStock)}
                  className={cn(
                    "p-3 border rounded-full transition-all active:scale-90",
                    filterLowStock 
                      ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20" 
                      : "bg-surface-container-low hover:bg-surface-container-high border-outline/10 text-secondary"
                  )}
                  title={filterLowStock ? "عرض الكل" : "تصفية المواد المنخفضة"}
                >
                  <Filter size={22} />
                </button>
              </div>
            </div>

            <div 
              ref={parentRef}
              className="overflow-auto scrollbar-hide relative max-h-[700px] w-full"
            >
              <table className="w-full text-right border-collapse table-auto relative">
                <thead className="sticky top-0 z-20 bg-surface-container-lowest">
                  <tr className="bg-surface-container-low/50 text-secondary/60 text-[11px] font-black uppercase tracking-widest">
                    <th className="px-3 py-5 text-right w-12">
                      <div 
                        onClick={handleSelectAll}
                        className={cn(
                          "w-5 h-5 rounded border-2 cursor-pointer flex items-center justify-center transition-all",
                          selectedIds.length === filteredChemicals.length && filteredChemicals.length > 0
                            ? "bg-primary border-primary text-white" 
                            : "border-outline/30 hover:border-primary/50"
                        )}
                      >
                        {selectedIds.length === filteredChemicals.length && filteredChemicals.length > 0 && <Check size={12} />}
                      </div>
                    </th>
                    <th className="px-3 py-5 text-right w-10">#</th>
                    <th 
                      className="px-3 py-5 text-right min-w-[140px] cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleSort('nameEn')}
                    >
                      <div className="flex items-center">
                        {getSortIcon('nameEn')}
                        المادة (EN/AR)
                      </div>
                    </th>
                    <th 
                      className="px-3 py-5 text-right w-16 hidden sm:table-cell cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleSort('formula')}
                    >
                      <div className="flex items-center">
                        {getSortIcon('formula')}
                        الصيغة
                      </div>
                    </th>
                    <th 
                      className="px-3 py-5 text-right w-20 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleSort('quantity')}
                    >
                      <div className="flex items-center">
                        {getSortIcon('quantity')}
                        الكمية
                      </div>
                    </th>
                    <th 
                      className="px-3 py-5 text-right w-14 hidden lg:table-cell cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleSort('state')}
                    >
                      <div className="flex items-center">
                        {getSortIcon('state')}
                        الحالة
                      </div>
                    </th>
                    <th 
                      className="px-3 py-5 text-right w-18 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleSort('hazardClass')}
                    >
                      <div className="flex items-center">
                        {getSortIcon('hazardClass')}
                        الخطورة
                      </div>
                    </th>
                    <th className="px-3 py-5 text-right w-20 hidden xl:table-cell">GHS</th>
                    <th 
                      className="px-3 py-5 text-right w-14 hidden md:table-cell cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleSort('shelf')}
                    >
                      <div className="flex items-center">
                        {getSortIcon('shelf')}
                        الرف
                      </div>
                    </th>
                    <th 
                      className="px-3 py-5 text-right w-24 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleSort('expiryDate')}
                    >
                      <div className="flex items-center">
                        {getSortIcon('expiryDate')}
                        الصلاحية
                      </div>
                    </th>
                    <th className="px-3 py-5 text-right hidden 2xl:table-cell">ملاحظات</th>
                    <th className="px-3 py-5 text-center w-24">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/5 relative w-full">
                  {loading ? (
                    <tr>
                      <td colSpan={12} className="px-8 py-20 text-center text-outline/60 font-bold">جاري التحميل...</td>
                    </tr>
                  ) : sortedChemicals.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-8 py-20 text-center text-outline/60 font-bold">لا توجد مواد مطابقة للبحث</td>
                    </tr>
                  ) : (
                    <>
                      {rowVirtualizer.getVirtualItems().length > 0 && rowVirtualizer.getVirtualItems()[0].start > 0 && (
                        <tr><td style={{ padding: 0, height: `${rowVirtualizer.getVirtualItems()[0].start}px` }} colSpan={12} /></tr>
                      )}
                      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const index = virtualRow.index;
                        const c = sortedChemicals[index];
                        return (
                          <tr 
                            key={c.id} 
                            onClick={() => setSelectedChemical(c)}
                            ref={rowVirtualizer.measureElement}
                            data-index={index}
                            className={cn(
                          "hover:bg-surface-container-low/40 transition-all group cursor-pointer text-base",
                          selectedChemical?.id === c.id && "bg-surface-container-low/60 border-r-4 border-primary"
                        )}
                      >
                        <td className="px-3 py-4">
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSelect(c.id);
                            }}
                            className={cn(
                              "w-5 h-5 rounded border-2 cursor-pointer flex items-center justify-center transition-all",
                              selectedIds.includes(c.id) 
                                ? "bg-primary border-primary text-white scale-110" 
                                : "border-outline/30 group-hover:border-primary/50"
                            )}
                          >
                            {selectedIds.includes(c.id) && <Check size={12} />}
                          </div>
                        </td>
                        <td className="px-3 py-4 font-bold text-secondary/60">{index + 1}</td>
                        <td className="px-3 py-4">
                          <div className="flex flex-col">
                            <span className="font-black text-primary break-words leading-tight">{c.nameEn}</span>
                            <span className="text-xs text-secondary/60 break-words mt-0.5">{c.nameAr}</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 font-mono font-bold text-secondary/80 hidden sm:table-cell text-xs">{c.formula}</td>
                        <td className="px-3 py-4 font-black text-primary whitespace-nowrap">{c.quantity} <span className="text-[10px] text-secondary/60">{c.unit}</span></td>
                        <td className="px-3 py-4 font-bold text-secondary/80 hidden lg:table-cell text-xs">{c.state === 'solid' ? 'صلب' : c.state === 'liquid' ? 'سائل' : 'غاز'}</td>
                        <td className="px-3 py-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm",
                            c.hazardClass === 'danger' ? "bg-error-container text-on-error-container" : "bg-primary-fixed/40 text-primary"
                          )}>
                            {c.hazardClass === 'danger' ? 'خطر' : 'آمن'}
                          </span>
                        </td>
                        <td className="px-3 py-4 hidden xl:table-cell">
                          <div className="flex gap-1.5">
                            {c.ghs?.slice(0, 3).map((g, i) => (
                              <div 
                                key={i} 
                                className="w-9 h-9 bg-surface rounded-lg flex items-center justify-center border border-outline/20 p-1 shadow-sm hover:scale-125 transition-transform z-10 relative group/ghs" 
                                title={GHS_LABELS[g] || g}
                              >
                                {GHS_ICONS[g] ? (
                                  <img src={GHS_ICONS[g]} alt={g} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                ) : (
                                  <span className="text-[8px] font-black">{g}</span>
                                )}
                                <div className="absolute bottom-full mb-2 hidden group-hover/ghs:block bg-secondary text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none shadow-xl">
                                  {GHS_LABELS[g] || g}
                                </div>
                              </div>
                            ))}
                            {c.ghs && c.ghs.length > 3 && <span className="text-[10px] text-secondary/40 self-center font-bold">+{c.ghs.length - 3}</span>}
                          </div>
                        </td>
                        <td className="px-3 py-4 font-bold text-primary hidden md:table-cell text-xs">{c.shelf}</td>
                        <td className="px-3 py-4">
                          <span className={cn(
                            "font-bold whitespace-nowrap text-xs",
                            c.expiryDate && new Date(c.expiryDate) < new Date() ? "text-error flex items-center gap-1" : "text-secondary/80"
                          )}>
                            {formatDisplayDate(c.expiryDate)}
                            {c.expiryDate && new Date(c.expiryDate) < new Date() && <AlertTriangle size={14} />}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-xs text-secondary/60 hidden 2xl:table-cell min-w-[200px] leading-relaxed break-words">{c.notes}</td>
                        <td className="px-3 py-4 text-center">
                          <div className="flex gap-1 justify-center">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRequestSmartUpdate(c);
                              }}
                              disabled={isGenerating}
                              className="p-1.5 text-outline/40 hover:text-primary hover:bg-primary/10 transition-all rounded-full active:scale-90"
                              title="تحديث ذكي"
                            >
                              <Sparkles size={16} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingChemical(c);
                                setNewChemical({
                                  nameEn: c.nameEn,
                                  nameAr: c.nameAr,
                                  formula: c.formula,
                                  casNumber: c.casNumber || '',
                                  storageTemp: c.storageTemp || '',
                                  unit: c.unit,
                                  quantity: c.quantity,
                                  state: c.state,
                                  hazardClass: c.hazardClass,
                                  ghs: c.ghs,
                                  shelf: c.shelf,
                                  expiryDate: c.expiryDate,
                                  notes: c.notes
                                });
                                setIsAddModalOpen(true);
                              }}
                              className="p-1.5 text-outline/40 hover:text-primary hover:bg-primary/10 transition-all rounded-full active:scale-90"
                              title="تعديل"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChemical(c.id, c.nameAr);
                              }}
                              className="p-1.5 text-outline/40 hover:text-error hover:bg-error/10 transition-all rounded-full active:scale-90"
                              title="حذف"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                    {rowVirtualizer.getVirtualItems().length > 0 && rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems()?.at(-1)?.end || 0) > 0 && (
                      <tr><td style={{ padding: 0, height: `${rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems()?.at(-1)?.end || 0)}px` }} colSpan={12} /></tr>
                    )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Details Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {selectedChemical ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              key={selectedChemical.id}
              className="bg-surface-container-lowest rounded-[32px] p-10 relative overflow-hidden border border-outline/10 shadow-sm"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-bl-[120px] -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10 space-y-8">
                <div className="flex items-start justify-between">
                  <span className={cn(
                    "text-[11px] px-4 py-1.5 rounded-[28px_28px_4px_28px] font-black uppercase tracking-widest shadow-sm",
                    selectedChemical.hazardClass === 'danger' ? "bg-error-container text-on-error-container" : "bg-tertiary-fixed/60 text-tertiary"
                  )}>
                    {selectedChemical.hazardClass === 'danger' ? 'مادة خطرة' : 'مادة آمنة'}
                  </span>
                  {selectedChemical.hazardClass === 'danger' && (
                    <div className="flex gap-2 text-error animate-pulse">
                      <AlertTriangle size={28} />
                    </div>
                  )}
                </div>
                
                <div>
                  <h2 className="text-3xl font-black text-primary mb-1 tracking-tight">{selectedChemical.nameEn}</h2>
                  <h3 className="text-xl font-bold text-secondary mb-2 tracking-tight">{selectedChemical.nameAr}</h3>
                  <p className="text-lg font-mono font-bold text-secondary/60">{selectedChemical.formula}</p>
                </div>

                <div className="space-y-5 pt-8 border-t border-outline/5">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-secondary/60 uppercase tracking-widest">رقم CAS</span>
                    <span className="font-black text-primary text-lg">{selectedChemical.casNumber || 'غير متوفر'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-secondary/60 uppercase tracking-widest">درجة التخزين</span>
                    <span className="font-black text-primary text-lg">{selectedChemical.storageTemp || 'غير متوفر'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-secondary/60 uppercase tracking-widest">الحالة</span>
                    <span className="font-black text-primary text-lg">{selectedChemical.state === 'solid' ? 'صلب' : selectedChemical.state === 'liquid' ? 'سائل' : 'غاز'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-secondary/60 uppercase tracking-widest">الرف</span>
                    <span className="font-black text-primary text-lg">{selectedChemical.shelf}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-secondary/60 uppercase tracking-widest">الصلاحية</span>
                    <span className={cn(
                      "font-black text-lg",
                      selectedChemical.expiryDate && new Date(selectedChemical.expiryDate) < new Date() ? "text-error" : "text-primary"
                    )}>
                      {formatDisplayDate(selectedChemical.expiryDate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-base font-bold text-secondary/60 uppercase tracking-widest">ملاحظات</span>
                    <span className="font-black text-primary text-sm text-left flex-1 mr-4 leading-relaxed break-words">{selectedChemical.notes || 'لا توجد'}</span>
                  </div>

                  {selectedChemical.ghs && selectedChemical.ghs.length > 0 && (
                    <div className="pt-6 border-t border-outline/5">
                      <span className="text-[11px] font-black text-secondary/40 uppercase tracking-[0.2em] block mb-4">رموز السلامة GHS</span>
                      <div className="grid grid-cols-3 gap-4">
                        {selectedChemical.ghs.map((g, i) => (
                          <div 
                            key={i} 
                            className="bg-surface p-3 rounded-2xl border border-outline/10 shadow-md hover:shadow-lg hover:border-primary/30 transition-all flex flex-col items-center gap-2 group/card"
                          >
                            <div className="w-16 h-16 flex items-center justify-center group-hover/card:scale-110 transition-transform">
                              {GHS_ICONS[g] ? (
                                <img src={GHS_ICONS[g]} alt={g} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-black bg-surface-container-high rounded-xl">{g}</div>
                              )}
                            </div>
                            <span className="text-[10px] font-black text-secondary text-center leading-tight">
                              {GHS_LABELS[g] || g}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-black text-primary uppercase tracking-widest">مستوى المخزون</span>
                      <span className="text-2xl font-black text-primary">{selectedChemical.quantity} <span className="text-sm text-secondary/60">{selectedChemical.unit}</span></span>
                    </div>
                    <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden border border-outline/5 shadow-inner">
                      <div className="h-full bg-primary rounded-full shadow-sm" style={{ width: '70%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => handlePrint(selectedChemical)}
                    className="p-3 bg-surface-container-low hover:bg-surface-container-high border border-outline/10 rounded-full text-primary transition-all active:scale-90"
                    title="طباعة تعريفية"
                  >
                    <Printer size={22} />
                  </button>
                  <button 
                    onClick={() => handlePrintInventoryCards([selectedChemical])}
                    className="p-3 bg-surface-container-low hover:bg-surface-container-high border border-outline/10 rounded-full text-primary transition-all active:scale-90"
                    title="طباعة بطاقة المخزون"
                  >
                    <FileText size={22} />
                  </button>
                  <button 
                    onClick={() => handleRequestSmartUpdate()}
                    disabled={isGenerating}
                    className="p-3 bg-primary-container hover:bg-primary/20 border border-primary/10 rounded-full text-primary transition-all active:scale-90 disabled:opacity-50" 
                    title="تحديث ذكي للمعلومات"
                  >
                    {isGenerating ? (
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    ) : (
                      <Sparkles size={22} />
                    )}
                  </button>
                  <button className="p-3 bg-surface-container-low hover:bg-surface-container-high border border-outline/10 rounded-full text-primary transition-all active:scale-90" title="توليد رمز QR">
                    <QrCode size={22} />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-surface-container-lowest rounded-[32px] p-12 text-center text-outline/60 font-bold border border-outline/10 border-dashed">
              اختر مادة من القائمة لعرض تفاصيلها المخبرية
            </div>
          )}

          <div className="bg-primary-container/30 backdrop-blur-sm p-8 rounded-[32px] text-on-primary-container border border-primary/10 relative overflow-hidden group shadow-sm">
            <div className="relative z-10">
              <h4 className="font-black text-lg mb-3 flex items-center gap-2 text-primary">
                <ShieldAlert size={20} />
                تعليمات السلامة
              </h4>
              <p className="text-sm font-medium text-primary/80 leading-relaxed">
                {selectedChemical?.hazardClass === 'danger' 
                  ? 'يجب ارتداء القفازات والنظارات الواقية عند التعامل مع هذه المادة. يحفظ في مكان بارد وجيد التهوية بعيداً عن مصادر الحرارة.'
                  : 'يرجى اتباع بروتوكولات المختبر القياسية عند التعامل مع هذه المادة لضمان سلامتك وسلامة الزملاء.'}
              </p>
            </div>
            <AlertTriangle className="absolute -bottom-6 -left-6 text-primary/5 w-32 h-32 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-secondary text-white px-8 py-5 rounded-[32px] shadow-2xl flex items-center gap-10 min-w-[500px]"
          >
            <div className="flex flex-col">
              <span className="text-sm font-black">{selectedIds.length} مادة مختارة</span>
              <span className="text-[10px] text-white/60 font-bold">يمكنك إجراء عمليات جماعية على هذه المواد</span>
            </div>

            <div className="h-10 w-px bg-surface/10" />

            <div className="flex gap-4">
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-error/20 text-error-container hover:bg-error hover:text-white transition-all font-black text-sm"
              >
                <Trash2 size={18} />
                حذف المختار
              </button>
              
              <button 
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-surface/10 hover:bg-surface/20 transition-all font-black text-sm"
                onClick={() => {
                  const items = chemicals.filter(c => selectedIds.includes(c.id));
                  const worksheet = XLSX.utils.json_to_sheet(items.map(c => ({
                    'Chemical': c.nameEn,
                    'Arabic': c.nameAr,
                    'Formula': c.formula,
                    'Qty': c.quantity,
                    'Unit': c.unit
                  })));
                  const workbook = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(workbook, worksheet, "SelectedItems");
                  XLSX.writeFile(workbook, `selected_chemicals_${new Date().getTime()}.xlsx`);
                }}
              >
                <Download size={18} />
                تصدير المختار
              </button>

              <button 
                onClick={() => {
                  const items = chemicals.filter(c => selectedIds.includes(c.id));
                  handlePrintInventoryCards(items);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary/20 text-primary-container hover:bg-primary hover:text-white transition-all font-black text-sm"
              >
                <Printer size={18} />
                بطاقات المختار
              </button>

              <button 
                onClick={() => setSelectedIds([])}
                className="p-2.5 hover:bg-surface/10 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      {/* Add / Edit Modal */}
      <ChemicalAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddChemical}
        onSmartFill={handleSmartFill}
        isGenerating={isGenerating}
        newChemical={newChemical}
        editingChemical={editingChemical}
        onChange={(field, value) => setNewChemical(prev => ({ ...prev, [field]: value }))}
      />

      {/* Bulk Update Confirmation Modal */}
      {/* Bulk Update Confirmation Modal */}
      <ChemicalBulkConfirmModal
        isOpen={isBulkConfirmOpen}
        chemicalsLength={chemicals.length}
        onClose={() => setIsBulkConfirmOpen(false)}
        onConfirm={handleBulkSmartUpdate}
      />

      {/* Review Update Modal */}
      {/* Review Update Modal */}
      <ChemicalReviewModal
        isOpen={isReviewModalOpen}
        suggestedUpdate={suggestedUpdate}
        selectedChemical={selectedChemical}
        onClose={() => setIsReviewModalOpen(false)}
        onApprove={handleApproveUpdate}
      />

      <AnimatePresence>
        {isQRScannerOpen && (
          <QRScanner
            onClose={() => setIsQRScannerOpen(false)}
            onScan={(data) => {
              setIsQRScannerOpen(false);
              let actualId = data;
              if (data.startsWith('APP_ID_')) {
                const parts = data.split('_');
                actualId = parts.slice(2, -1).join('_');
              }
              setSearchTerm(actualId);
              // Find item
              const item = chemicals.find(e => e.id === actualId || e.id === data);
              if (item) {
                setSelectedChemical(item);
                setEditingChemical(item);
                setIsAddModalOpen(true);
                // Also scroll top or let modal show
              } else {
                alert('عذراً، لم يتم العثور على المادة بهذه الشيفرة.');
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
