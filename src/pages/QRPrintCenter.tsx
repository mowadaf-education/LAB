import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { db, getUserCollection } from '../firebase';
import { getDocs, query, orderBy } from 'firebase/firestore';
import { LayoutDashboard, CheckSquare, Square, Printer, FlaskConical, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import logo from '/ministry-logo.png';


interface Equipment {
  id: string;
  name: string;
  type: string;
}

interface Chemical {
  id: string;
  nameAr: string;
  nameEn: string;
}

type TabType = 'equipment' | 'chemicals';

export default function QRPrintCenter() {
  const { schoolId } = useSchool();
  const [activeTab, setActiveTab] = useState<TabType>('equipment');
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [chemicalList, setChemicalList] = useState<Chemical[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ id: string, name: string, qrValue: string, collection: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const equipSnap = await getDocs(query(getUserCollection(schoolId, 'equipment')));
      const eqData: Equipment[] = [];
      equipSnap.forEach(doc => {
        eqData.push({ id: doc.id, ...doc.data() } as Equipment);
      });
      setEquipmentList(eqData);

      const chemSnap = await getDocs(query(getUserCollection(schoolId, 'equipment')));
      const chData: Chemical[] = [];
      chemSnap.forEach(doc => {
        chData.push({ id: doc.id, ...doc.data() } as Chemical);
      });
      setChemicalList(chData);
    } catch (error) {
      console.error('Error fetching data for QR print:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string, name: string, collection: string) => {
    setSelectedItems(prev => {
      const exists = prev.find(item => item.id === id);
      if (exists) {
        return prev.filter(item => item.id !== id);
      } else {
        return [...prev, { id, name, qrValue: `APP_ID_${id}_${collection}`, collection }];
      }
    });
  };

  const selectAll = () => {
    if (activeTab === 'equipment') {
      const allSelected = equipmentList.every(eq => selectedItems.some(item => item.id === eq.id));
      if (allSelected) {
        setSelectedItems(prev => prev.filter(item => item.collection !== 'equipment'));
      } else {
        const newSelection = equipmentList
          .filter(eq => !selectedItems.some(item => item.id === eq.id))
          .map(eq => ({ id: eq.id, name: eq.name, qrValue: `APP_ID_${eq.id}_equipment`, collection: 'equipment' }));
        setSelectedItems(prev => [...prev, ...newSelection]);
      }
    } else {
      const allSelected = chemicalList.every(ch => selectedItems.some(item => item.id === ch.id));
      if (allSelected) {
        setSelectedItems(prev => prev.filter(item => item.collection !== 'chemicals'));
      } else {
        const newSelection = chemicalList
          .filter(ch => !selectedItems.some(item => item.id === ch.id))
          .map(ch => ({ id: ch.id, name: ch.nameAr || ch.nameEn || 'مادة بدون اسم', qrValue: `APP_ID_${ch.id}_chemicals`, collection: 'chemicals' }));
        setSelectedItems(prev => [...prev, ...newSelection]);
      }
    }
  };

  const isAllSelected = () => {
    if (activeTab === 'equipment' && equipmentList.length > 0) {
      return equipmentList.every(eq => selectedItems.some(item => item.id === eq.id));
    } else if (activeTab === 'chemicals' && chemicalList.length > 0) {
      return chemicalList.every(ch => selectedItems.some(item => item.id === ch.id));
    }
    return false;
  };

  return (
    <div className="p-8 pb-32">
       <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #print-area, #print-area * { visibility: visible; }
            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0;
              margin: 0;
              display: grid !important;
              grid-template-columns: repeat(4, 1fr);
              row-gap: 5mm;
              column-gap: 5mm;
            }
            .qr-sticker {
              border: 1px solid #e2e8f0;
              padding: 10px;
              border-radius: 8px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              page-break-inside: avoid;
              text-align: center;
              height: 48mm;
              width: 48mm;
              background-color: #fff;
            }
            .qr-sticker img.logo {
              height: 20px;
              margin-bottom: 5px;
            }
            .qr-sticker .title {
              font-size: 8px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .qr-sticker .item-name {
              font-size: 10px;
              font-weight: bold;
              margin-bottom: 5px;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            .qr-sticker svg {
              width: 50% !important;
              height: auto !important;
            }
            .no-print { display: none !important; }
            @page { margin: 10mm; }
          }
        `}
      </style>

      <div className="no-print">
        
        
        <header className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-primary mb-3">مركز طباعة القصاصات</h1>
            <p className="text-lg text-secondary max-w-2xl">
              تحديد التجهيزات أو المواد الكيميائية لطباعة بطاقات التعريف الدائمة مع رموز QR لإلصاقها على العتاد.
            </p>
          </div>
          <button 
            onClick={() => window.print()}
            disabled={selectedItems.length === 0}
            className="px-8 py-4 bg-tertiary text-on-tertiary rounded-2xl font-bold hover:shadow-lg hover:shadow-tertiary/30 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer size={24} />
            <span>طباعة القصاصات المحددة ({selectedItems.length})</span>
          </button>
        </header>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-outline-variant/30 pb-2">
          <button
            onClick={() => setActiveTab('equipment')}
            className={`px-6 py-3 rounded-t-2xl font-bold flex items-center gap-2 transition-colors ${activeTab === 'equipment' ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-secondary-container text-secondary'}`}
          >
            <Monitor size={20} />
            <span>العتاد والأجهزة</span>
          </button>
          <button
            onClick={() => setActiveTab('chemicals')}
            className={`px-6 py-3 rounded-t-2xl font-bold flex items-center gap-2 transition-colors ${activeTab === 'chemicals' ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-secondary-container text-secondary'}`}
          >
            <FlaskConical size={20} />
            <span>المواد الكيميائية</span>
          </button>
        </div>

        {/* Data Table */}
        <div className="bg-surface rounded-3xl border border-outline-variant/50 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-secondary">جاري تحميل البيانات...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-surface-container-low text-secondary">
                  <tr>
                    <th className="p-4 w-16 text-center">
                      <button onClick={selectAll} className="text-primary hover:text-primary/80 transition-colors">
                        {isAllSelected() ? <CheckSquare size={24} /> : <Square size={24} />}
                      </button>
                    </th>
                    <th className="p-4 font-bold">الاسم</th>
                    <th className="p-4 font-bold w-48 text-left">المعرف الفردي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {activeTab === 'equipment' && equipmentList.map(eq => {
                    const isSelected = selectedItems.some(i => i.id === eq.id);
                    return (
                      <tr key={eq.id} className={`hover:bg-secondary-container/20 transition-colors cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`} onClick={() => toggleSelection(eq.id, eq.name, 'equipment')}>
                        <td className="p-4 text-center">
                          {isSelected ? <CheckSquare size={20} className="text-primary mx-auto" /> : <Square size={20} className="text-secondary mx-auto" />}
                        </td>
                        <td className="p-4 font-semibold text-primary">{eq.name}</td>
                        <td className="p-4 text-xs font-mono text-secondary text-left">{eq.id}</td>
                      </tr>
                    );
                  })}

                  {activeTab === 'chemicals' && chemicalList.map(ch => {
                    const isSelected = selectedItems.some(i => i.id === ch.id);
                    const nameToUse = ch.nameAr || ch.nameEn || 'مادة بدون اسم';
                    return (
                      <tr key={ch.id} className={`hover:bg-secondary-container/20 transition-colors cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`} onClick={() => toggleSelection(ch.id, nameToUse, 'chemicals')}>
                        <td className="p-4 text-center">
                          {isSelected ? <CheckSquare size={20} className="text-primary mx-auto" /> : <Square size={20} className="text-secondary mx-auto" />}
                        </td>
                        <td className="p-4 font-semibold text-primary">{nameToUse}</td>
                        <td className="p-4 text-xs font-mono text-secondary text-left">{ch.id}</td>
                      </tr>
                    );
                  })}
                  
                  {(activeTab === 'equipment' && equipmentList.length === 0) && (
                     <tr><td colSpan={3} className="p-8 text-center text-secondary">لا توجد أجهزة مسجلة.</td></tr>
                  )}
                  {(activeTab === 'chemicals' && chemicalList.length === 0) && (
                     <tr><td colSpan={3} className="p-8 text-center text-secondary">لا توجد مواد كيميائية مسجلة.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Print Area - Only visible during print */}
      <div id="print-area" className="hidden">
        {selectedItems.map((item, idx) => (
          <div key={`${item.id}-${idx}`} className="qr-sticker">
            <img src={logo} alt="Ministry Logo" className="logo" />
            <div className="title">مخبر المؤسسة</div>
            <div className="item-name">{item.name}</div>
            <QRCodeSVG value={item.qrValue} size={100} level="H" />
          </div>
        ))}
      </div>
    </div>
  );
}