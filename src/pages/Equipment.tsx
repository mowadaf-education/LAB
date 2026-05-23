import React, { useState, useEffect, useRef } from 'react';
import { useSchool } from '../context/SchoolContext';
import { onSnapshot, query, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, orderBy, limit, getDocs, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, getUserCollection } from '../firebase';
import * as XLSX from 'xlsx';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { 
  Beaker, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  FileUp,
  History, 
  AlertTriangle,
  CheckCircle,
  Wrench,
  Monitor,
  Trash2,
  Edit,
  X,
  Printer,
  Package,
  Database,
  ArrowLeft,
  Sparkles,
  MoreHorizontal,
  Map,
  FileText,
  RefreshCw,
  FileDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  QrCode,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { getEquipmentIntelligence, ensureApiKey } from '../services/geminiService';
import { PDFService } from '../services/pdfService';
import { logActivity, LogAction, LogModule } from '../services/loggingService';
import QRScanner from '../components/QRScanner';

import type { Equipment, MaintenanceLog } from '../types/equipment';
import { useEquipmentLogic } from '../hooks/useEquipmentLogic';

export default function Equipment({ isNested = false }: { isNested?: boolean }) {
  const {
    schoolId,
    schoolName,
    directorate,
    searchParams,
    navigate,
    equipment,
    loading,
    searchTerm, setSearchTerm,
    filterType, setFilterType,
    filterStatus, setFilterStatus,
    isAddModalOpen, setIsAddModalOpen,
    editingEquipment, setEditingEquipment,
    isSmartUpdating,
    isSmartUpdateConfirmOpen, setIsSmartUpdateConfirmOpen,
    bulkProgress,
    sortField,
    sortDirection,
    qrCodeItem, setQrCodeItem,
    isQRModalOpen, setIsQRModalOpen,
    isQRScannerOpen, setIsQRScannerOpen,
    selectedIds, setSelectedIds,
    fileInputRef,
    isImporting,
    isHistoryModalOpen, setIsHistoryModalOpen,
    selectedEquipHistory,
    currentEquipName,
    isAnalyzing,
    isBulkUpdating,
    suggestedUpdate, setSuggestedUpdate,
    isReviewModalOpen, setIsReviewModalOpen,
    isBulkConfirmOpen, setIsBulkConfirmOpen,
    selectedEquipment,
    newEquipment, setNewEquipment,
    handleAddEquipment,
    handleDeleteEquipment,
    handleImportXLS,
    handleUpdateStatus,
    fetchHistory,
    handleExportXLS,
    handlePrintList,
    handlePrintInventoryCards,
    handleExportPDF,
    handleSmartUpdate,
    handlePrint,
    handleSort,
    handleToggleSelect,
    handleSelectAll,
    handleBulkDelete,
    handleBulkStatusUpdate,
    handleRequestSmartUpdate,
    handleApproveUpdate,
    handleBulkSmartUpdate,
    filteredEquipment,
    rowVirtualizer,
    parentRef,
    totalPieces,
    totalAvailable,
    totalBroken,
    totalTypes
  } = useEquipmentLogic(isNested);

  return (
    <div className={cn("space-y-12 max-w-7xl mx-auto pb-24 rtl font-sans", !isNested && "px-6")} dir="rtl">
      {/* Official Algerian Header (Print Only or Toggle) */}
      <div className="hidden print:block mb-8 border-b-2 border-black pb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="text-right text-sm font-bold">
            <p>مديرية التربية لولاية: أم البواقي</p>
            <p>ثانوية بوحازم عبد المجيد - عين كرشة</p>
          </div>
          <div className="text-center">
            <p className="font-black text-base">الجمهورية الجزائرية الديمقراطية الشعبية</p>
            <p className="font-bold text-sm">وزارة التربية الوطنية</p>
          </div>
          <div className="text-left text-sm font-bold">
            <p>السنة الدراسية: 2025 - 2026</p>
          </div>
        </div>
        <h2 className="text-center text-2xl font-black underline mt-6">جرد مخزون الزجاجيات والعتاد — مخبر الوسائل التعليمية</h2>
      </div>

      {/* Header */}
      {!isNested && (
        <header className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-4">
          <div className="text-right space-y-3 relative z-10">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full text-primary text-xs font-black uppercase tracking-widest mb-2">
              <Package size={14} />
              إدارة المخزون والعتاد
            </div>
            <h1 className="text-4xl font-black text-primary tracking-tighter">جرد الزجاجيات والعتاد</h1>
            <p className="text-on-surface/60 text-lg font-bold">إدارة وتتبع <span className="text-primary italic">الأدوات الزجاجية</span> والأجهزة التكنولوجية</p>
          </div>
          
          <div className="flex flex-wrap gap-4 relative z-10">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportXLS} 
              className="hidden" 
              accept=".xls,.xlsx"
            />
            <button 
              onClick={() => navigate(ROUTES.INVENTORY_CARDS)}
              className="bg-primary text-white px-6 py-3.5 rounded-full font-black flex items-center gap-2 hover:bg-primary/90 transition-all shadow-xl active:scale-95"
            >
              <Database size={20} />
              سجل بطاقات الجرد
            </button>
            <button 
              onClick={handlePrintInventoryCards}
              className="bg-surface text-primary border-2 border-primary/10 px-6 py-3.5 rounded-full font-black flex items-center gap-2 hover:bg-primary/5 hover:border-primary transition-all shadow-xl active:scale-95"
            >
              <QrCode size={20} />
              طباعة بطاقات الجرد
            </button>
            <button 
              onClick={handlePrintList}
              className="bg-surface text-primary border-2 border-primary/10 px-6 py-3.5 rounded-full font-black flex items-center gap-2 hover:bg-primary/5 hover:border-primary transition-all shadow-xl active:scale-95"
            >
              <Printer size={20} />
              طباعة القائمة
            </button>
            <button 
              onClick={handleExportPDF}
              className="bg-surface text-primary border-2 border-primary/10 px-6 py-3.5 rounded-full font-black flex items-center gap-2 hover:bg-primary/5 hover:border-primary transition-all shadow-xl active:scale-95"
            >
              <FileDown size={20} />
              تصدير PDF
            </button>
            <button 
              onClick={() => setIsBulkConfirmOpen(true)}
              disabled={isBulkUpdating}
              className="bg-surface text-primary border-2 border-primary/10 px-6 py-3.5 rounded-full font-black flex items-center gap-2 hover:bg-primary/5 hover:border-primary transition-all shadow-xl active:scale-95 disabled:opacity-50"
            >
              {isBulkUpdating ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <Sparkles size={20} />
              )}
              تحديث ذكي للكل
            </button>
            <button 
              onClick={() => setIsQRScannerOpen(true)}
              className="bg-surface text-primary border-2 border-primary/10 px-6 py-3.5 rounded-full font-black flex items-center gap-2 hover:bg-primary/5 hover:border-primary transition-all shadow-xl active:scale-95"
            >
              <QrCode size={20} />
              مسح QR
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="bg-surface text-primary border-2 border-primary/10 px-6 py-3.5 rounded-full font-black flex items-center gap-2 hover:bg-primary/5 hover:border-primary transition-all shadow-xl active:scale-95 disabled:opacity-50"
            >
              {isImporting ? (
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <FileUp size={20} />
              )}
              استيراد XLS
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary text-on-primary px-8 py-3.5 rounded-full font-black flex items-center gap-2 shadow-2xl shadow-primary/30 hover:bg-primary-container hover:shadow-primary/40 transition-all active:scale-95"
            >
              <Plus size={22} />
              إضافة صنف
            </button>
          </div>

          {/* Decorative elements */}
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        </header>
      )}

      {/* Quick Access to Specialized Units */}
      {!isNested && (
        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { label: 'الأجهزة التقنية', path: ROUTES.TECH_INVENTORY, icon: Monitor, color: 'bg-primary/5 text-primary' },
            { label: 'جرد الزجاجيات', path: ROUTES.GLASSWARE_BREAKAGE, icon: Beaker, color: 'bg-primary/5 text-primary' },
            { label: 'النماذج الذكية', path: ROUTES.SMART_FORMS, icon: FileText, color: 'bg-primary/5 text-primary' },
            { label: 'النفايات الكيميائية', path: ROUTES.CHEMICAL_WASTE, icon: Trash2, color: 'bg-error/5 text-error' },
            { label: 'الخريطة التربوية', path: ROUTES.EDUCATIONAL_MAP, icon: Map, color: 'bg-primary/5 text-primary' },
            { label: 'المستهلكات & SDS', path: ROUTES.CONSUMABLES_SDS, icon: Package, color: 'bg-primary/5 text-primary' },
          ].map((unit, i) => (
            <motion.a
              key={unit.label}
              href={`#${unit.path}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "flex flex-col items-center justify-center p-6 rounded-[32px] border border-outline/5 shadow-sm hover:shadow-md transition-all group text-center gap-3",
                unit.color
              )}
            >
              <div className="p-3 rounded-2xl bg-surface shadow-sm group-hover:scale-110 transition-transform">
                <unit.icon size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tight leading-tight">{unit.label}</span>
            </motion.a>
          ))}
        </section>
      )}

      {/* Stats */}
      {!isNested && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: 'أصناف العتاد', value: totalTypes, icon: Layers, color: 'bg-primary/10', textColor: 'text-primary', status: 'all' },
            { label: 'إجمالي الكميات', value: totalPieces, icon: Package, color: 'bg-primary/5', textColor: 'text-primary', status: 'all' },
            { label: 'الحالة: جيدة', value: totalAvailable, icon: CheckCircle, color: 'bg-green-50', textColor: 'text-green-600', status: 'functional' },
            { label: 'الحالة: مكسورة', value: totalBroken, icon: AlertTriangle, color: 'bg-error/10', textColor: 'text-error', status: 'broken' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setFilterStatus(stat.status)}
              className={cn(
                "p-8 rounded-[40px] border border-outline/5 transition-all group relative overflow-hidden shadow-xl cursor-pointer",
                stat.color,
                filterStatus === stat.status && "ring-4 ring-primary/20 border-primary"
              )}
            >
              <div className="absolute top-0 left-0 w-24 h-24 bg-surface/40 rounded-br-[80px] -ml-6 -mt-6 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10 flex justify-between items-start mb-6">
                <div className="p-4 bg-surface rounded-2xl shadow-sm text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <stat.icon size={24} />
                </div>
              </div>
              <div className="relative z-10">
                <p className="text-xs text-on-surface/40 font-black uppercase tracking-widest mb-1">{stat.label}</p>
                <span className={cn("text-5xl font-black tracking-tighter group-hover:scale-110 transition-transform inline-block", stat.textColor)}>{stat.value}</span>
              </div>
            </motion.div>
          ))}
        </section>
      )}

      {/* Main Content */}
      <div className="bg-surface rounded-[50px] overflow-hidden shadow-2xl border border-outline/5 relative">
        <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-6 bg-surface-container-low/30 border-b border-outline/5">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              className="w-full bg-surface border-2 border-outline/5 rounded-full pr-14 pl-6 py-4 text-base font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-inner"
              placeholder="بحث في قائمة العتاد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-surface px-6 py-2 rounded-full border border-outline/10 shadow-sm">
              <Filter size={18} className="text-primary/40" />
              <select 
                className="bg-transparent border-none text-sm font-black text-primary focus:ring-0 cursor-pointer"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">كل الأنواع</option>
                <option value="glassware">زجاجيات</option>
                <option value="tech">أجهزة تقنية</option>
                <option value="smart">تحديث ذكي ✨</option>
                <option value="other">أخرى</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-primary/40 px-4">
              <Sparkles size={20} />
              <span className="text-xs font-black uppercase tracking-[0.3em]">قاعدة البيانات</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[700px] overflow-y-auto custom-scrollbar" ref={parentRef}>
          <table className="w-full text-right border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className="bg-surface-container-low text-on-surface/40 text-xs font-black uppercase tracking-[0.2em] border-b border-outline/5">
                <th className="px-6 py-6 text-right w-12">
                  <div 
                    onClick={handleSelectAll}
                    className={cn(
                      "w-5 h-5 rounded border-2 cursor-pointer flex items-center justify-center transition-all mx-auto",
                      selectedIds.length === filteredEquipment.length && filteredEquipment.length > 0
                        ? "bg-primary border-primary text-white" 
                        : "border-outline/30 hover:border-primary/50"
                    )}
                  >
                    {selectedIds.length === filteredEquipment.length && filteredEquipment.length > 0 && <CheckCircle size={12} />}
                  </div>
                </th>
                <th className="px-10 py-6 cursor-pointer hover:text-primary transition-colors whitespace-nowrap" onClick={() => handleSort('serialNumber')}>
                  <div className="flex items-center gap-2">
                    رقم الجرد
                    {sortField === 'serialNumber' ? (
                      sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : <ArrowUpDown size={14} className="opacity-20" />}
                  </div>
                </th>
                <th className="px-10 py-6 cursor-pointer hover:text-primary transition-colors whitespace-nowrap" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-2">
                    تعيين الجهاز
                    {sortField === 'name' ? (
                      sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : <ArrowUpDown size={14} className="opacity-20" />}
                  </div>
                </th>
                <th className="px-10 py-6 text-center cursor-pointer hover:text-primary transition-colors whitespace-nowrap" onClick={() => handleSort('totalQuantity')}>
                  <div className="flex items-center justify-center gap-2">
                    الكمية
                    {sortField === 'totalQuantity' ? (
                      sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : <ArrowUpDown size={14} className="opacity-20" />}
                  </div>
                </th>
                <th className="px-10 py-6 text-center cursor-pointer hover:text-primary transition-colors whitespace-nowrap" onClick={() => handleSort('supplier')}>
                  <div className="flex items-center justify-center gap-2">
                    الممون
                    {sortField === 'supplier' ? (
                      sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : <ArrowUpDown size={14} className="opacity-20" />}
                  </div>
                </th>
                <th className="px-10 py-6 text-center cursor-pointer hover:text-primary transition-colors whitespace-nowrap" onClick={() => handleSort('location')}>
                  <div className="flex items-center justify-center gap-2">
                    الموقع
                    {sortField === 'location' ? (
                      sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : <ArrowUpDown size={14} className="opacity-20" />}
                  </div>
                </th>
                <th className="px-10 py-6 text-center cursor-pointer hover:text-primary transition-colors whitespace-nowrap" onClick={() => handleSort('status')}>
                  <div className="flex items-center justify-center gap-2">
                    الحالة
                    {sortField === 'status' ? (
                      sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                    ) : <ArrowUpDown size={14} className="opacity-20" />}
                  </div>
                </th>
                <th className="px-10 py-6 text-center whitespace-nowrap">ملاحظات</th>
                <th className="px-10 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/5 relative w-full">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                      <p className="text-on-surface/40 font-black uppercase tracking-widest text-xs">جاري تحميل البيانات...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredEquipment.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <Package size={64} />
                      <p className="text-xl font-black">لا توجد أصناف مطابقة للبحث</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {rowVirtualizer.getVirtualItems().length > 0 && rowVirtualizer.getVirtualItems()[0].start > 0 && (
                    <tr><td style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px` }} colSpan={9} /></tr>
                  )}
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const e = filteredEquipment[virtualRow.index];
                    return (
                      <tr 
                        key={e.id}
                        ref={rowVirtualizer.measureElement}
                        data-index={virtualRow.index}
                        className={cn(
                          "hover:bg-primary/[0.02] transition-colors group",
                          selectedIds.includes(e.id) && "bg-primary/[0.04]"
                        )}
                      >
                        <td className="px-6 py-8">
                          <div 
                            onClick={(evt) => {
                              evt.stopPropagation();
                              handleToggleSelect(e.id);
                            }}
                            className={cn(
                              "w-5 h-5 rounded border-2 cursor-pointer flex items-center justify-center transition-all mx-auto",
                              selectedIds.includes(e.id) 
                                ? "bg-primary border-primary text-white scale-110" 
                                : "border-outline/30 group-hover:border-primary/50"
                            )}
                          >
                            {selectedIds.includes(e.id) && <CheckCircle size={12} />}
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <span className="text-sm font-black text-primary/60 bg-surface-container-low px-3 py-1 rounded-full whitespace-nowrap">
                            {e.serialNumber || '---'}
                          </span>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-4 min-w-[300px]">
                            <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary shadow-inner relative flex-shrink-0">
                              {e.type === 'tech' ? <Monitor size={24} /> : <Beaker size={24} />}
                              {e.smartNameAr && (
                                <div className="absolute -top-1 -right-1 bg-primary text-on-primary p-1 rounded-full shadow-lg">
                                  <Sparkles size={10} />
                                </div>
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="text-lg font-black text-primary font-serif">{e.smartNameAr || e.name}</p>
                              {e.smartNameAr && e.name !== e.smartNameAr && (
                                <p className="text-[10px] font-bold text-on-surface/30 italic">الأصل: {e.name}</p>
                              )}
                              {e.smartDescriptionAr && (
                                <p className="text-xs font-bold text-on-surface/40 max-w-xs line-clamp-1">{e.smartDescriptionAr}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8 text-center font-black text-primary text-xl">
                          {e.totalQuantity}
                        </td>
                        <td className="px-10 py-8 text-center text-sm font-bold text-on-surface/60 whitespace-nowrap">
                          {e.supplier || '---'}
                        </td>
                        <td className="px-10 py-8 text-center text-sm font-bold text-on-surface/60 whitespace-nowrap">
                          {e.location || '---'}
                        </td>
                        <td className="px-10 py-8 text-center">
                          <select 
                            className={cn(
                              "px-6 py-2.5 rounded-full text-xs font-black border-2 transition-all cursor-pointer focus:ring-4 focus:ring-primary/10 appearance-none",
                              e.status === 'maintenance' ? "bg-tertiary/10 border-tertiary/20 text-tertiary" : 
                              e.status === 'broken' ? "bg-error/10 border-error/20 text-error" : "bg-primary/5 border-primary/10 text-primary"
                            )}
                            value={e.status}
                            onChange={(ev) => handleUpdateStatus(e.id, e.status, ev.target.value)}
                          >
                            <option value="functional">سليم</option>
                            <option value="maintenance">صيانة</option>
                            <option value="broken">تالف</option>
                          </select>
                        </td>
                        <td className="px-10 py-8 text-center min-w-[150px]">
                          <p className="text-xs text-on-surface/40 max-w-[150px] truncate" title={e.notes}>{e.notes || '---'}</p>
                        </td>
                        <td className="px-10 py-8 text-left">
                          <div className="flex gap-3 justify-end opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                            <button 
                              onClick={() => {
                                setQrCodeItem(e);
                                setIsQRModalOpen(true);
                              }}
                              className="p-3 text-primary/40 hover:text-primary transition-colors rounded-2xl hover:bg-primary/10 shadow-sm border border-outline/5 bg-surface"
                            >
                              <QrCode size={20} />
                            </button>
                            <button 
                              onClick={() => handleRequestSmartUpdate(e)}
                              disabled={isAnalyzing}
                              className="p-3 text-primary/40 hover:text-primary transition-colors rounded-2xl hover:bg-primary/10 shadow-sm border border-outline/5 bg-surface"
                            >
                              {isAnalyzing && selectedEquipment?.id === e.id ? <RefreshCw size={20} className="animate-spin" /> : <Sparkles size={20} />}
                            </button>
                            <button 
                              onClick={() => {
                                setEditingEquipment(e);
                                setNewEquipment({
                                  name: e.name, type: e.type, serialNumber: e.serialNumber, status: e.status,
                                  totalQuantity: e.totalQuantity, availableQuantity: e.availableQuantity, brokenQuantity: e.brokenQuantity,
                                  supplier: e.supplier || '', location: e.location || '', notes: e.notes || '',
                                  foundationalInventory: e.foundationalInventory || '', decennialReview: e.decennialReview || ''
                                });
                                setIsAddModalOpen(true);
                              }}
                              className="p-3 text-primary/40 hover:text-primary transition-colors rounded-2xl hover:bg-primary/10 shadow-sm border border-outline/5 bg-surface"
                            >
                              <Edit size={20} />
                            </button>
                            <button 
                              onClick={() => handlePrint(e)}
                              className="p-3 text-primary/40 hover:text-primary transition-colors rounded-2xl hover:bg-primary/10 shadow-sm border border-outline/5 bg-surface"
                            >
                              <Printer size={20} />
                            </button>
                            <button 
                              onClick={() => fetchHistory(e.id, e.name)}
                              className="p-3 text-primary/40 hover:text-primary transition-colors rounded-2xl hover:bg-primary/10 shadow-sm border border-outline/5 bg-surface"
                            >
                              <History size={20} />
                            </button>
                            <button 
                              onClick={() => handleDeleteEquipment(e.id, e.name)}
                              className="p-3 text-primary/40 hover:text-error transition-colors rounded-2xl hover:bg-error/10 shadow-sm border border-outline/5 bg-surface"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {rowVirtualizer.getVirtualItems().length > 0 && rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems()?.at(-1)?.end || 0) > 0 && (
                    <tr><td style={{ height: `${rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems()?.at(-1)?.end || 0)}px` }} colSpan={9} /></tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Smart Update Confirmation Modal */}
      <AnimatePresence>
        {isSmartUpdateConfirmOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSmartUpdateConfirmOpen(false)}
              className="absolute inset-0 bg-primary/20 backdrop-blur-2xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative bg-surface w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-white/20 p-10 text-center"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-8">
                <Sparkles size={40} />
              </div>
              <h3 className="text-3xl font-black text-primary mb-4 font-serif">تحديث ذكي شامل</h3>
              <p className="text-on-surface/60 text-lg font-bold leading-relaxed mb-10">
                هل أنت متأكد من رغبتك في تحديث معلومات التجهيزات ذكياً؟
                <br />
                <span className="text-sm opacity-70">قد تستغرق هذه العملية بعض الوقت. سيتم تحديث البيانات تلقائياً بناءً على اقتراحات الذكاء الاصطناعي.</span>
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setIsSmartUpdateConfirmOpen(false);
                    handleSmartUpdate();
                  }}
                  className="flex-1 bg-primary text-on-primary py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:bg-primary-container transition-all active:scale-95"
                >
                  بدء التحديث
                </button>
                <button 
                  onClick={() => setIsSmartUpdateConfirmOpen(false)}
                  className="flex-1 bg-surface-container-low text-on-surface/40 py-4 rounded-2xl font-black hover:bg-surface-container transition-all active:scale-95"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Smart Update Progress Overlay */}
      <AnimatePresence>
        {isSmartUpdating && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-primary/40 backdrop-blur-3xl" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-surface w-full max-w-md rounded-[40px] shadow-2xl p-12 text-center"
            >
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 border-8 border-primary/10 rounded-full" />
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle 
                    cx="64" cy="64" r="56" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    strokeDasharray={2 * Math.PI * 56}
                    strokeDashoffset={2 * Math.PI * 56 * (1 - (bulkProgress.current / bulkProgress.total))}
                    className="text-primary transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <RefreshCw size={32} className="text-primary animate-spin" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-primary mb-2 font-serif">جاري التحديث الذكي...</h3>
              <p className="text-on-surface/40 font-bold mb-8">
                معالجة العنصر {bulkProgress.current} من أصل {bulkProgress.total}
              </p>
              <div className="w-full bg-surface-container-low h-3 rounded-full overflow-hidden mb-2">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest">يرجى عدم إغلاق الصفحة</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-secondary text-white px-8 py-5 rounded-[32px] shadow-2xl flex items-center gap-8 min-w-[600px]"
          >
            <div className="flex flex-col">
              <span className="text-sm font-black">{selectedIds.length} صنف مختار</span>
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">عمليات جماعية</span>
            </div>

            <div className="h-8 w-px bg-surface/10" />

            <div className="flex gap-2">
              <button 
                onClick={() => handleBulkStatusUpdate('functional')}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/20 text-success hover:bg-success hover:text-white transition-all font-black text-xs"
              >
                <CheckCircle size={14} />
                سليم
              </button>
              <button 
                onClick={() => handleBulkStatusUpdate('broken')}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-error/20 text-error-container hover:bg-error hover:text-white transition-all font-black text-xs"
              >
                <AlertTriangle size={14} />
                تالف
              </button>
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-error/20 text-error-container hover:bg-error hover:text-white transition-all font-black text-xs border border-error/30"
              >
                <Trash2 size={14} />
                حذف المختار
              </button>
              
              <button 
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface/10 hover:bg-surface/20 transition-all font-black text-xs"
                onClick={() => {
                  const items = equipment.filter(e => selectedIds.includes(e.id));
                  const worksheet = XLSX.utils.json_to_sheet(items.map(e => ({
                    'Item Name': e.name,
                    'Type': e.type,
                    'Serial': e.serialNumber,
                    'Status': e.status,
                    'Total Qty': e.totalQuantity
                  })));
                  const workbook = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(workbook, worksheet, "SelectedItems");
                  XLSX.writeFile(workbook, `selected_equipment_${new Date().getTime()}.xlsx`);
                }}
              >
                <Download size={14} />
                تصدير المختار
              </button>

              <button 
                onClick={() => setSelectedIds([])}
                className="p-2 hover:bg-surface/10 rounded-full transition-all ml-2"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-primary/20 backdrop-blur-2xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative bg-surface w-full max-w-3xl rounded-[50px] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="p-10 flex justify-between items-center bg-surface-container-low/50 border-b border-outline/5">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-primary rounded-2xl text-on-primary shadow-xl shadow-primary/20">
                    {editingEquipment ? <Edit size={28} /> : <Plus size={28} />}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-primary font-serif">
                      {editingEquipment ? 'تعديل بيانات الصنف' : 'إضافة صنف جديد'}
                    </h3>
                    <p className="text-on-surface/40 text-sm font-bold">
                      {editingEquipment ? 'تحديث بيانات العتاد أو الزجاجيات' : 'أدخل بيانات العتاد أو الزجاجيات الجديدة'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingEquipment(null);
                    setNewEquipment({
                      name: '',
                      type: 'glassware',
                      serialNumber: '',
                      status: 'functional',
                      totalQuantity: 0,
                      availableQuantity: 0,
                      brokenQuantity: 0,
                      supplier: '',
                      location: '',
                      notes: '',
                      foundationalInventory: '',
                      decennialReview: ''
                    });
                  }} 
                  className="p-4 hover:bg-error/10 hover:text-error rounded-full transition-all active:scale-90"
                >
                  <X size={28} />
                </button>
              </div>
              
              <div className="max-h-[65vh] overflow-y-auto custom-scrollbar">
                <form onSubmit={handleAddEquipment} className="p-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-on-surface/40 uppercase tracking-widest mr-4">اسم الصنف</label>
                    <input 
                      required
                      className="w-full bg-surface-container-low border-2 border-transparent rounded-[24px] px-6 py-4 text-base font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-inner"
                      placeholder="مثال: مجهر ضوئي، بيشر 250مل..."
                      value={newEquipment.name}
                      onChange={e => setNewEquipment({...newEquipment, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-on-surface/40 uppercase tracking-widest mr-4">النوع</label>
                    <select 
                      className="w-full bg-surface-container-low border-2 border-transparent rounded-[24px] px-6 py-4 text-base font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-inner appearance-none"
                      value={newEquipment.type}
                      onChange={e => setNewEquipment({...newEquipment, type: e.target.value as any})}
                    >
                      <option value="glassware">زجاجيات مخبرية</option>
                      <option value="tech">أجهزة تقنية / إلكترونية</option>
                      <option value="other">أدوات ووسائل أخرى</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-on-surface/40 uppercase tracking-widest mr-4">الرقم التسلسلي</label>
                    <input 
                      className="w-full bg-surface-container-low border-2 border-transparent rounded-[24px] px-6 py-4 text-base font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-inner"
                      placeholder="SN-000000"
                      value={newEquipment.serialNumber}
                      onChange={e => setNewEquipment({...newEquipment, serialNumber: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-on-surface/40 uppercase tracking-widest mr-4">الحالة التشغيلية</label>
                    <select 
                      className="w-full bg-surface-container-low border-2 border-transparent rounded-[24px] px-6 py-4 text-base font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-inner appearance-none"
                      value={newEquipment.status}
                      onChange={e => setNewEquipment({...newEquipment, status: e.target.value as any})}
                    >
                      <option value="functional">سليم / نشط</option>
                      <option value="maintenance">قيد الصيانة</option>
                      <option value="broken">تالف / خارج الخدمة</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-on-surface/40 uppercase tracking-widest mr-4">إجمالي الكمية</label>
                    <input 
                      type="number"
                      required
                      className="w-full bg-surface-container-low border-2 border-transparent rounded-[24px] px-6 py-4 text-base font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-inner"
                      value={newEquipment.totalQuantity}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setNewEquipment({...newEquipment, totalQuantity: val, availableQuantity: val - (newEquipment.brokenQuantity || 0)});
                      }}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-on-surface/40 uppercase tracking-widest mr-4">الكمية التالفة</label>
                    <input 
                      type="number"
                      className="w-full bg-surface-container-low border-2 border-transparent rounded-[24px] px-6 py-4 text-base font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-inner"
                      value={newEquipment.brokenQuantity}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setNewEquipment({...newEquipment, brokenQuantity: val, availableQuantity: (newEquipment.totalQuantity || 0) - val});
                      }}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-on-surface/40 uppercase tracking-widest mr-4">الممون</label>
                    <input 
                      className="w-full bg-surface-container-low border-2 border-transparent rounded-[24px] px-6 py-4 text-base font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-inner"
                      placeholder="اسم الممون"
                      value={newEquipment.supplier}
                      onChange={e => setNewEquipment({...newEquipment, supplier: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-on-surface/40 uppercase tracking-widest mr-4">الموقع</label>
                    <input 
                      className="w-full bg-surface-container-low border-2 border-transparent rounded-[24px] px-6 py-4 text-base font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-inner"
                      placeholder="مكان التخزين"
                      value={newEquipment.location}
                      onChange={e => setNewEquipment({...newEquipment, location: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-on-surface/40 uppercase tracking-widest mr-4">الجرد التأسيسي</label>
                    <input 
                      className="w-full bg-surface-container-low border-2 border-transparent rounded-[24px] px-6 py-4 text-base font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-inner"
                      placeholder="بيانات الجرد التأسيسي"
                      value={newEquipment.foundationalInventory}
                      onChange={e => setNewEquipment({...newEquipment, foundationalInventory: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-on-surface/40 uppercase tracking-widest mr-4">المراجعة العشرية</label>
                    <input 
                      className="w-full bg-surface-container-low border-2 border-transparent rounded-[24px] px-6 py-4 text-base font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-inner"
                      placeholder="بيانات المراجعة العشرية"
                      value={newEquipment.decennialReview}
                      onChange={e => setNewEquipment({...newEquipment, decennialReview: e.target.value})}
                    />
                  </div>
                  <div className="col-span-full space-y-3">
                    <label className="text-xs font-black text-on-surface/40 uppercase tracking-widest mr-4">ملاحظات</label>
                    <textarea 
                      className="w-full bg-surface-container-low border-2 border-transparent rounded-[24px] px-6 py-4 text-base font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-inner min-h-[100px]"
                      placeholder="أي ملاحظات إضافية..."
                      value={newEquipment.notes}
                      onChange={e => setNewEquipment({...newEquipment, notes: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2 pt-8">
                    <button type="submit" className="w-full bg-primary text-on-primary py-6 rounded-full font-black text-xl shadow-2xl shadow-primary/30 hover:bg-primary-container hover:shadow-primary/40 transition-all active:scale-[0.98]">
                      {editingEquipment ? 'حفظ التعديلات' : 'تأكيد إضافة الصنف للجرد'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-8 py-5 rounded-[32px] shadow-2xl flex items-center gap-10 min-w-[600px]"
          >
            <div className="flex flex-col">
              <span className="text-sm font-black">{selectedIds.length} صنف مختار</span>
              <span className="text-[10px] text-white/60 font-bold">يمكنك إجراء عمليات جماعية على هذه التجهيزات</span>
            </div>

            <div className="h-10 w-px bg-surface/10" />

            <div className="flex gap-4">
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-red-500/20 text-red-100 hover:bg-red-500 hover:text-white transition-all font-black text-sm"
              >
                <Trash2 size={18} />
                حذف المختار
              </button>
              
              <div className="flex gap-1">
                <button 
                  onClick={() => handleBulkStatusUpdate('functional')}
                  className="px-4 py-2.5 rounded-full bg-surface/10 hover:bg-surface/20 transition-all font-black text-[10px] uppercase"
                  title="تحديد كسليم"
                >
                  سليم
                </button>
                <button 
                  onClick={() => handleBulkStatusUpdate('maintenance')}
                  className="px-4 py-2.5 rounded-full bg-surface/10 hover:bg-surface/20 transition-all font-black text-[10px] uppercase"
                  title="تحديد قيد الصيانة"
                >
                  صيانة
                </button>
              </div>

              <button 
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-surface/10 hover:bg-surface/20 transition-all font-black text-sm"
                onClick={() => {
                  const items = equipment.filter(e => selectedIds.includes(e.id));
                  const worksheet = XLSX.utils.json_to_sheet(items.map(e => ({
                    'Equipment': e.name,
                    'Type': e.type,
                    'Serial': e.serialNumber,
                    'Status': e.status,
                    'Qty': e.totalQuantity
                  })));
                  const workbook = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(workbook, worksheet, "SelectedEquipment");
                  XLSX.writeFile(workbook, `selected_equipment_${new Date().getTime()}.xlsx`);
                }}
              >
                <Download size={18} />
                تصدير المختار
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

      {/* History Modal */}
      <AnimatePresence>
        {isHistoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsHistoryModalOpen(false)} className="absolute inset-0 bg-primary/20 backdrop-blur-2xl" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 40 }} 
              className="relative bg-surface w-full max-w-2xl rounded-[50px] shadow-2xl p-12 max-h-[85vh] overflow-hidden flex flex-col border border-white/20"
            >
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                    <History size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-primary font-serif">سجل الحركات</h3>
                    <p className="text-on-surface/40 text-xs font-bold">{currentEquipName}</p>
                  </div>
                </div>
                <button onClick={() => setIsHistoryModalOpen(false)} className="p-4 hover:bg-error/10 hover:text-error rounded-full transition-all active:scale-90">
                  <X size={28} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar">
                {selectedEquipHistory.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 py-20 opacity-20">
                    <History size={64} />
                    <p className="text-xl font-black">لا يوجد سجل حركات لهذا الصنف</p>
                  </div>
                ) : (
                  selectedEquipHistory.map((log, i) => (
                    <motion.div 
                      key={log.id} 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative border-r-4 border-primary/20 pr-8 py-6 bg-surface-container-low/30 rounded-l-[32px] group hover:border-primary transition-all"
                    >
                      <div className="absolute top-1/2 -right-[10px] w-4 h-4 rounded-full bg-primary shadow-lg border-4 border-white group-hover:scale-125 transition-transform" />
                      <div className="flex justify-between items-center mb-3">
                        <span className={cn(
                          "text-xs font-black px-4 py-1.5 rounded-full shadow-sm uppercase tracking-widest",
                          log.newStatus === 'functional' ? "bg-primary/10 text-primary" : 
                          log.newStatus === 'maintenance' ? "bg-tertiary/10 text-tertiary" : "bg-error/10 text-error"
                        )}>
                          {log.newStatus === 'functional' ? 'سليم / نشط' : log.newStatus === 'maintenance' ? 'قيد الصيانة' : 'تالف / خارج الخدمة'}
                        </span>
                        <span className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest">{log.date?.toDate()?.toLocaleString('ar-DZ')}</span>
                      </div>
                      <p className="text-base text-on-surface/70 font-bold leading-relaxed">{log.note}</p>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* QR Code Modal */}
      <AnimatePresence>
        {isQRModalOpen && qrCodeItem && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQRModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-outline/10 p-8 flex flex-col items-center gap-6"
            >
              <div className="text-center">
                <h3 className="text-xl font-black text-primary">{qrCodeItem.name}</h3>
                <p className="text-xs text-secondary font-bold">{qrCodeItem.serialNumber}</p>
              </div>
              
              <div className="bg-surface p-4 rounded-3xl shadow-inner border border-outline/5">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({ id: qrCodeItem.id, type: 'equipment', name: qrCodeItem.name }))}`}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>
              
              <div className="w-full space-y-3">
                <button 
                  onClick={() => window.print()}
                  className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                >
                  <Printer size={18} />
                  طباعة الملصق
                </button>
                <button 
                  onClick={() => setIsQRModalOpen(false)}
                  className="w-full py-3 rounded-xl border border-outline/20 font-bold text-secondary hover:bg-surface-container-high transition-all"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Smart Update Confirmation Modal */}
      <AnimatePresence>
        {isBulkConfirmOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBulkConfirmOpen(false)} className="absolute inset-0 bg-primary/20 backdrop-blur-3xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-surface w-full max-w-md rounded-[40px] shadow-2xl p-10 text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                <Sparkles size={40} />
              </div>
              <h3 className="text-2xl font-black text-primary mb-4">تحديث ذكي شامل</h3>
              <p className="text-on-surface/60 font-bold mb-8 leading-relaxed">
                سيقوم النظام باستخدام الذكاء الاصطناعي لتحسين مسميات وأوصاف جميع الأجهزة في القائمة. هل تود الاستمرار؟
              </p>
              <div className="flex gap-4">
                <button onClick={handleBulkSmartUpdate} className="flex-1 bg-primary text-on-primary py-4 rounded-2xl font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">تأكيد التحديث</button>
                <button onClick={() => setIsBulkConfirmOpen(false)} className="flex-1 bg-surface-container-high text-on-surface/60 py-4 rounded-2xl font-black">إلغاء</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Suggested Update Modal */}
      <AnimatePresence>
        {isReviewModalOpen && suggestedUpdate && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/20 backdrop-blur-3xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-surface w-full max-w-lg rounded-[40px] shadow-2xl p-10 overflow-hidden">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-xl font-black text-primary">اقتراح تحسين البيانات</h3>
              </div>
              
              <div className="space-y-6 mb-10">
                <div className="p-6 bg-surface-container-low rounded-3xl border border-outline/5">
                  <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest mb-2">الاسم المقترح</p>
                  <p className="text-xl font-black text-primary">{suggestedUpdate.smartNameAr}</p>
                </div>
                <div className="p-6 bg-surface-container-low rounded-3xl border border-outline/5">
                  <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest mb-2">الوصف المقترح</p>
                  <p className="text-sm font-bold text-on-surface/70 leading-relaxed">{suggestedUpdate.smartDescriptionAr}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={handleApproveUpdate} className="flex-1 bg-primary text-on-primary py-4 rounded-2xl font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">اعتماد التحديث</button>
                <button onClick={() => { setIsReviewModalOpen(false); setSuggestedUpdate(null); }} className="flex-1 bg-surface-container-high text-on-surface/60 py-4 rounded-2xl font-black">تجاهل</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Progress Overlay */}
      <AnimatePresence>
        {isBulkUpdating && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/10 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-surface p-12 rounded-[40px] shadow-2xl text-center max-w-sm w-full mx-6">
              <RefreshCw className="w-16 h-16 text-primary mx-auto mb-6 animate-spin" />
              <h3 className="text-2xl font-black text-primary mb-2">جاري التحديث الذكي</h3>
              <p className="text-on-surface/40 font-bold mb-8">يرجى الانتظار، جاري معالجة البيانات...</p>
              <div className="h-4 bg-surface-container-high rounded-full overflow-hidden mb-2">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-xs font-black text-primary">{bulkProgress.current} من {bulkProgress.total}</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
              // Find item and pre-fill AddModal (or just filter list)
              const item = equipment.find(e => e.id === actualId || e.id === data);
              if (item) {
                setEditingEquipment(item);
                setNewEquipment({
                  name: item.name,
                  type: item.type,
                  serialNumber: item.serialNumber,
                  status: item.status,
                  totalQuantity: item.totalQuantity,
                  availableQuantity: item.availableQuantity,
                  brokenQuantity: item.brokenQuantity,
                  supplier: item.supplier || '',
                  location: item.location || '',
                  notes: item.notes || '',
                  foundationalInventory: item.foundationalInventory || '',
                  decennialReview: item.decennialReview || ''
                });
                setIsAddModalOpen(true);
              } else {
                alert('عذراً، لم يتم العثور على الصنف بهذه الشيفرة.');
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
