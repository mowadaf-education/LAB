import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { db, getUserCollection } from '../firebase';
import { getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { 
  Wallet, Receipt, Users, Plus, Trash2, Edit, CheckCircle2, 
  Clock, XCircle, FileText, ShoppingCart, AlertCircle, 
  TrendingDown, TrendingUp, Save, X, Phone, Mail, MapPin 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';


interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}

interface OrderItem {
  id: string; // unique id for row
  name: string;
  quantity: number;
  unitPrice: number;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  date: any;
  status: 'draft' | 'sent' | 'received' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  total: number;
  notes: string;
}

interface BudgetConfig {
  annualBudget: number;
  fiscalYear: string;
}

export default function BudgetPurchases() {
  const { schoolId } = useSchool();
  const [activeTab, setActiveTab] = useState<'budget' | 'orders' | 'suppliers'>('orders');
  const [loading, setLoading] = useState(true);
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig>({ annualBudget: 0, fiscalYear: new Date().getFullYear().toString() });
  const [lowStockSuggestions, setLowStockSuggestions] = useState<any[]>([]);

  // Modals
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<Partial<Supplier>>({});
  
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Partial<PurchaseOrder>>({
    status: 'draft',
    items: [],
    subtotal: 0,
    total: 0
  });

  const [showBudgetModal, setShowBudgetModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch budget
      const budgetDoc = await getDoc(doc(getUserCollection(schoolId, 'budget_config'), 'budget'));
      if (budgetDoc.exists()) {
        setBudgetConfig(budgetDoc.data() as BudgetConfig);
      }

      // Fetch suppliers
      const supSnap = await getDocs(query(getUserCollection(schoolId, 'suppliers')));
      const supData = supSnap.docs.map(d => ({ id: d.id, ...d.data() } as Supplier));
      setSuppliers(supData);

      // Fetch orders
      const ordSnap = await getDocs(query(getUserCollection(schoolId, 'purchase_orders'), orderBy('date', 'desc')));
      const ordData = ordSnap.docs.map(d => ({ id: d.id, ...d.data() } as PurchaseOrder));
      setOrders(ordData);

      // Fetch low stock chemicals to suggest
      const chemSnap = await getDocs(query(getUserCollection(schoolId, 'chemicals')));
      const lowStock = chemSnap.docs
        .map(d => d.data())
        .filter(c => Number(c.quantity) <= 5)
        .map(c => ({ name: c.nameAr || c.nameEn, currentStock: c.quantity }));
      setLowStockSuggestions(lowStock);

    } catch (error) {
      console.error("Error fetching budget data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const spentBudget = orders
    .filter(o => o.status === 'sent' || o.status === 'received')
    .reduce((sum, o) => sum + o.total, 0);
  
  const remainingBudget = budgetConfig.annualBudget - spentBudget;
  const spentPercentage = budgetConfig.annualBudget > 0 ? (spentBudget / budgetConfig.annualBudget) * 100 : 0;

  // Handlers for Suppliers
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentSupplier.id) {
      await updateDoc(doc(getUserCollection(schoolId, 'suppliers'), currentSupplier.id), currentSupplier);
    } else {
      await addDoc(getUserCollection(schoolId, 'suppliers'), currentSupplier);
    }
    setShowSupplierModal(false);
    fetchData();
  };

  // Handlers for Orders
  const calculateOrderTotals = (items: OrderItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    return { subtotal, total: subtotal }; // Assuming 0 tax for educational institutions, can be adjusted
  };

  const handleItemChange = (itemId: string, field: keyof OrderItem, value: any) => {
    const newItems = (currentOrder.items || []).map(item => {
      if (item.id === itemId) return { ...item, [field]: value };
      return item;
    });
    const totals = calculateOrderTotals(newItems);
    setCurrentOrder(prev => ({ ...prev, items: newItems, ...totals }));
  };

  const handleAddItem = () => {
    const newItem: OrderItem = { id: Date.now().toString(), name: '', quantity: 1, unitPrice: 0 };
    const newItems = [...(currentOrder.items || []), newItem];
    const totals = calculateOrderTotals(newItems);
    setCurrentOrder(prev => ({ ...prev, items: newItems, ...totals }));
  };

  const handleRemoveItem = (itemId: string) => {
    const newItems = (currentOrder.items || []).filter(item => item.id !== itemId);
    const totals = calculateOrderTotals(newItems);
    setCurrentOrder(prev => ({ ...prev, items: newItems, ...totals }));
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const orderData = {
      ...currentOrder,
      date: currentOrder.id ? currentOrder.date : serverTimestamp()
    };

    if (currentOrder.id) {
      await updateDoc(doc(getUserCollection(schoolId, 'purchase_orders'), currentOrder.id), orderData);
    } else {
      // Auto-generate logic could go here
      const newOrderNum = 'PO-' + new Date().getFullYear() + '-' + Math.floor(Math.random()*1000).toString().padStart(3, '0');
      await addDoc(getUserCollection(schoolId, 'purchase_orders'), { ...orderData, orderNumber: currentOrder.orderNumber || newOrderNum });
    }
    setShowOrderModal(false);
    fetchData();
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    await updateDoc(doc(getUserCollection(schoolId, 'purchase_orders'), orderId), { status });
    fetchData();
  };

  // Handler for Budget
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    await setDoc(doc(getUserCollection(schoolId, 'budget_config'), 'budget'), budgetConfig);
    setShowBudgetModal(false);
    fetchData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD' }).format(amount);
  };

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto">
      
      
      <header className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-primary mb-3 flex items-center gap-4">
            <Wallet size={40} className="text-tertiary" />
            تسيير الميزانية والطلبيات
          </h1>
          <p className="text-lg text-secondary">
            متابعة الميزانية السنوية للمخبر، إدارة طلبات التموين، وتنظيم سجل الممونين.
          </p>
        </div>
      </header>

      {/* Financial Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface rounded-3xl p-6 border border-outline-variant shadow-sm relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity"><Wallet size={120} /></div>
          <h3 className="text-secondary font-bold mb-2">الميزانية السنوية ({budgetConfig.fiscalYear})</h3>
          <p className="text-3xl font-black text-primary">{formatCurrency(budgetConfig.annualBudget)}</p>
          <button onClick={() => setShowBudgetModal(true)} className="mt-4 text-xs font-bold text-tertiary hover:underline flex items-center gap-1">
            <Edit size={14}/> تعديل الميزانية
          </button>
        </div>
        <div className="bg-surface rounded-3xl p-6 border border-outline-variant shadow-sm relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 opacity-5 text-error group-hover:opacity-10 transition-opacity"><TrendingDown size={120} /></div>
          <h3 className="text-secondary font-bold mb-2">النفقات والطلبيات المؤكدة</h3>
          <p className="text-3xl font-black text-error">{formatCurrency(spentBudget)}</p>
          <div className="w-full bg-surface-container-high rounded-full h-2 mt-4 overflow-hidden">
            <div className="bg-error h-2 rounded-full transition-all" style={{ width: Math.min(spentPercentage, 100) + '%' }}></div>
          </div>
        </div>
        <div className="bg-surface rounded-3xl p-6 border border-outline-variant shadow-sm relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 opacity-5 text-success group-hover:opacity-10 transition-opacity"><TrendingUp size={120} /></div>
          <h3 className="text-secondary font-bold mb-2">الميزانية المتبقية</h3>
          <p className="text-3xl font-black text-success">{formatCurrency(remainingBudget)}</p>
          <p className="text-xs text-secondary mt-4 font-bold">{Math.max(100 - spentPercentage, 0).toFixed(1)}% من الميزانية متوفرة</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-outline-variant/30 pb-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={"px-6 py-3 rounded-t-2xl font-bold flex items-center gap-2 transition-colors " + (activeTab === 'orders' ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-secondary-container text-secondary')}
        >
          <ShoppingCart size={20} />
          <span>الطلبيات (Bon de Commande)</span>
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={"px-6 py-3 rounded-t-2xl font-bold flex items-center gap-2 transition-colors " + (activeTab === 'suppliers' ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-secondary-container text-secondary')}
        >
          <Users size={20} />
          <span>سجل الممونين</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-secondary">جاري تحميل البيانات...</div>
      ) : activeTab === 'orders' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-surface-container p-6 rounded-2xl shadow-sm border border-outline-variant/30">
             <div>
               <h2 className="text-xl font-bold text-primary">طلبات التموين</h2>
               <p className="text-sm text-secondary mt-1">إنشاء طلبات الشراء للمواد والعتاد الناقص وإرسالها للممونين.</p>
             </div>
             <button 
                onClick={() => {
                  setCurrentOrder({ status: 'draft', items: [], subtotal: 0, total: 0 });
                  setShowOrderModal(true);
                }}
                className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
              >
                <Plus size={20} /> طلب جديد
              </button>
          </div>

          <div className="bg-surface rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
             <table className="w-full text-right">
                <thead className="bg-surface-container-low text-secondary">
                  <tr>
                    <th className="p-4 font-bold">رقم الطلب</th>
                    <th className="p-4 font-bold">التاريخ</th>
                    <th className="p-4 font-bold">الممون</th>
                    <th className="p-4 font-bold">المبلغ الإجمالي</th>
                    <th className="p-4 font-bold text-center">الحالة</th>
                    <th className="p-4 font-bold text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-secondary-container/20 transition-colors">
                      <td className="p-4 font-bold text-primary font-mono">{order.orderNumber}</td>
                      <td className="p-4 text-sm font-semibold">{order.date?.toDate().toLocaleDateString('ar-DZ') || 'N/A'}</td>
                      <td className="p-4 text-secondary">{order.supplierName}</td>
                      <td className="p-4 font-black">{formatCurrency(order.total)}</td>
                      <td className="p-4 text-center">
                        {order.status === 'draft' && <span className="inline-flex items-center gap-1 bg-surface-container-high text-secondary text-xs font-bold px-3 py-1 rounded-full"><FileText size={14}/> مسودة</span>}
                        {order.status === 'sent' && <span className="inline-flex items-center gap-1 bg-tertiary/10 text-tertiary text-xs font-bold px-3 py-1 rounded-full"><Clock size={14}/> أرسلت</span>}
                        {order.status === 'received' && <span className="inline-flex items-center gap-1 bg-success/10 text-success text-xs font-bold px-3 py-1 rounded-full"><CheckCircle2 size={14}/> مستلمة</span>}
                        {order.status === 'cancelled' && <span className="inline-flex items-center gap-1 bg-error/10 text-error text-xs font-bold px-3 py-1 rounded-full"><XCircle size={14}/> ملغاة</span>}
                      </td>
                      <td className="p-4 flex gap-2 justify-center">
                         <button onClick={() => { setCurrentOrder(order); setShowOrderModal(true); }} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit size={18} /></button>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={6} className="p-12 text-center text-secondary border-dashed border-outline-variant">لا توجد طلبيات مسجلة حالياً.</td></tr>
                  )}
                </tbody>
             </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-surface-container p-6 rounded-2xl shadow-sm border border-outline-variant/30">
             <div>
               <h2 className="text-xl font-bold text-primary">الممونين والشركاء</h2>
               <p className="text-sm text-secondary mt-1">دليل الشركات والموردين المعتمدين لتجهيز المخبر.</p>
             </div>
             <button 
                onClick={() => { setCurrentSupplier({}); setShowSupplierModal(true); }}
                className="px-6 py-3 bg-tertiary text-on-tertiary rounded-xl font-bold flex items-center gap-2 hover:bg-tertiary/90 transition-colors"
              >
                <Plus size={20} /> إضافة ممون
              </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map(sup => (
              <div key={sup.id} className="bg-surface rounded-2xl p-6 border border-outline-variant/50 shadow-sm hover:shadow-md transition-shadow relative">
                <button 
                  onClick={() => { setCurrentSupplier(sup); setShowSupplierModal(true); }}
                  className="absolute top-4 left-4 p-2 text-secondary hover:text-primary hover:bg-primary/10 rounded-full transition-all"
                >
                  <Edit size={18} />
                </button>
                <h3 className="text-2xl font-bold text-primary mb-1">{sup.name}</h3>
                <p className="text-sm text-secondary font-bold mb-4">{sup.contactPerson}</p>
                <div className="space-y-2 text-sm text-secondary">
                  <p className="flex items-center gap-2"><Phone size={16} className="text-outline"/> <span dir="ltr">{sup.phone}</span></p>
                  <p className="flex items-center gap-2"><Mail size={16} className="text-outline"/> {sup.email}</p>
                  <p className="flex items-center gap-2"><MapPin size={16} className="text-outline"/> {sup.address}</p>
                </div>
              </div>
            ))}
            {suppliers.length === 0 && (
              <div className="col-span-full p-12 bg-surface-container-low rounded-2xl text-center text-secondary border border-dashed border-outline-variant/50">
                لم يتم تسجيل أي ممون بعد. أضف بيانات الموردين لتسهيل رفع الطلبيات.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      <AnimatePresence>
        {/* ADD/EDIT SUPPLIER MODAL */}
        {showSupplierModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-surface w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-outline-variant">
              <div className="p-6 bg-surface-container-low border-b border-outline-variant/50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-primary">{currentSupplier.id ? 'تعديل بيانات الممون' : 'ممون جديد'}</h3>
                <button onClick={() => setShowSupplierModal(false)} className="p-2 hover:bg-outline-variant/30 rounded-full text-secondary"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveSupplier} className="p-6 space-y-4">
                <div><label className="block text-sm font-bold text-primary mb-1">اسم الشركة / المورد</label><input required type="text" value={currentSupplier.name || ''} onChange={e => setCurrentSupplier({...currentSupplier, name: e.target.value})} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:border-primary outline-none" /></div>
                <div><label className="block text-sm font-bold text-primary mb-1">الشخص المرجعي / مسؤول المبيعات</label><input type="text" value={currentSupplier.contactPerson || ''} onChange={e => setCurrentSupplier({...currentSupplier, contactPerson: e.target.value})} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:border-primary outline-none" /></div>
                <div><label className="block text-sm font-bold text-primary mb-1">رقم الهاتف</label><input type="text" dir="ltr" value={currentSupplier.phone || ''} onChange={e => setCurrentSupplier({...currentSupplier, phone: e.target.value})} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:border-primary outline-none text-left" /></div>
                <div><label className="block text-sm font-bold text-primary mb-1">البريد الإلكتروني</label><input type="email" dir="ltr" value={currentSupplier.email || ''} onChange={e => setCurrentSupplier({...currentSupplier, email: e.target.value})} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:border-primary outline-none text-left" /></div>
                <div><label className="block text-sm font-bold text-primary mb-1">العنوان</label><textarea value={currentSupplier.address || ''} onChange={e => setCurrentSupplier({...currentSupplier, address: e.target.value})} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:border-primary outline-none resize-none" rows={2}></textarea></div>
                
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 py-3 bg-tertiary text-on-tertiary rounded-xl font-bold hover:bg-tertiary/90 flex items-center justify-center gap-2"><Save size={20} /> حفظ البيانات</button>
                  <button type="button" onClick={() => setShowSupplierModal(false)} className="px-6 py-3 bg-surface-container text-secondary rounded-xl font-bold hover:bg-outline-variant/30">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* ORDER MODAL */}
        {showOrderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 py-10 bg-scrim/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-surface w-full max-w-4xl h-full max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-outline-variant">
              <div className="p-6 bg-surface-container-low border-b border-outline-variant/50 flex justify-between items-center shrink-0">
                <h3 className="text-xl font-bold text-primary flex items-center gap-2"><ShoppingCart /> {currentOrder.id ? 'معاينة / تعديل الطلبية' : 'إنشاء طلبية جديدة'}</h3>
                <div className="flex items-center gap-4">
                   {currentOrder.id && (
                     <select 
                       value={currentOrder.status} 
                       onChange={e => handleUpdateOrderStatus(currentOrder.id!, e.target.value)}
                       className={"px-3 py-1 rounded-lg text-sm font-bold outline-none border-none " + 
                         (currentOrder.status === 'draft' ? 'bg-surface-container-high text-secondary' :
                          currentOrder.status === 'sent' ? 'bg-tertiary/20 text-tertiary' :
                          currentOrder.status === 'received' ? 'bg-success/20 text-success' : 'bg-error/20 text-error')
                       }
                     >
                       <option value="draft">مسودة</option>
                       <option value="sent">أرسلت للمورد</option>
                       <option value="received">التسليم مكتمل (تخصيص الميزانية)</option>
                       <option value="cancelled">ملغاة</option>
                     </select>
                   )}
                   <button onClick={() => setShowOrderModal(false)} className="p-2 hover:bg-outline-variant/30 rounded-full text-secondary"><X size={20} /></button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto flex-1 bg-surface flex flex-col gap-6">
                
                <div className="grid grid-cols-2 gap-6 bg-surface-container p-6 rounded-2xl border border-outline-variant/50">
                  <div>
                    <label className="block text-sm font-bold text-primary mb-2">رقم الطلبية (يولد تلقائياً إن ترك فارغاً)</label>
                    <input type="text" placeholder="PO-2026-..." value={currentOrder.orderNumber || ''} onChange={e => setCurrentOrder({...currentOrder, orderNumber: e.target.value})} className="w-full bg-surface px-4 py-2 rounded-lg border border-outline-variant focus:border-primary outline-none font-mono text-left" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-primary mb-2">اختيار الممون</label>
                    <select 
                      required 
                      value={currentOrder.supplierId || ''} 
                      onChange={e => {
                        const sup = suppliers.find(s => s.id === e.target.value);
                        setCurrentOrder({...currentOrder, supplierId: e.target.value, supplierName: sup?.name || ''});
                      }} 
                      className="w-full bg-surface px-4 py-2 rounded-lg border border-outline-variant focus:border-primary outline-none"
                    >
                      <option value="">-- اختر ممون --</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                {lowStockSuggestions.length > 0 && !currentOrder.id && (
                  <div className="bg-error/5 border border-error/20 rounded-2xl p-4 flex flex-col gap-2">
                     <p className="text-sm font-bold text-error flex items-center gap-2"><AlertCircle size={16}/> اقتراحات النواقص (مخزون منخفض):</p>
                     <div className="flex flex-wrap gap-2">
                       {lowStockSuggestions.map((ls, i) => (
                         <span key={i} className="text-xs bg-surface border border-error/20 text-secondary px-2 py-1 rounded-md">
                           {ls.name} ({ls.currentStock} متبقي)
                         </span>
                       ))}
                     </div>
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-primary">قائمة المواد المطلوبة</h4>
                    <button type="button" onClick={handleAddItem} className="text-sm px-3 py-1 bg-secondary-container text-primary font-bold rounded-lg hover:bg-secondary-container/80 flex items-center gap-1"><Plus size={16}/> إضافة مادة</button>
                  </div>
                  <table className="w-full text-right bg-surface border border-outline-variant/30 rounded-xl overflow-hidden">
                    <thead className="bg-surface-container-low text-secondary text-sm">
                      <tr>
                        <th className="p-3 w-1/2">تعيين المادة / العتاد</th>
                        <th className="p-3 w-1/6">الكمية</th>
                        <th className="p-3 w-1/6">السعر الوحدوي (دج)</th>
                        <th className="p-3 w-1/6">المجموع</th>
                        <th className="p-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {(currentOrder.items || []).map((item, idx) => (
                        <tr key={item.id} className="hover:bg-secondary-container/5">
                          <td className="p-2"><input type="text" placeholder="اسم المادة" value={item.name} onChange={e => handleItemChange(item.id, 'name', e.target.value)} className="w-full bg-transparent border-b border-outline-variant focus:border-primary outline-none px-2 py-1" /></td>
                          <td className="p-2"><input type="number" min="1" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)} className="w-full bg-transparent border-b border-outline-variant focus:border-primary outline-none px-2 py-1 text-center" /></td>
                          <td className="p-2"><input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full bg-transparent border-b border-outline-variant focus:border-primary outline-none px-2 py-1 text-center" /></td>
                          <td className="p-2 font-mono text-sm text-secondary text-center">{formatCurrency(item.quantity * item.unitPrice)}</td>
                          <td className="p-2 text-center"><button onClick={() => handleRemoveItem(item.id)} className="text-error/50 hover:text-error"><Trash2 size={16}/></button></td>
                        </tr>
                      ))}
                      {(!currentOrder.items || currentOrder.items.length === 0) && (
                        <tr><td colSpan={5} className="p-8 text-center text-secondary border-dashed border-outline-variant">الطلبية فارغة. اضغط "إضافة مادة" للبدء.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/50 self-end w-full md:w-1/2 mt-4 space-y-3">
                   <div className="flex justify-between text-secondary">
                     <span>المجموع الفرعي:</span>
                     <span className="font-mono">{formatCurrency(currentOrder.subtotal || 0)}</span>
                   </div>
                   <div className="flex justify-between text-primary font-black text-xl pt-3 border-t border-outline-variant/50">
                     <span>الإجمالي الصافي:</span>
                     <span className="font-mono">{formatCurrency(currentOrder.total || 0)}</span>
                   </div>
                </div>

              </div>
              <div className="p-6 bg-surface-container-low border-t border-outline-variant/50 flex gap-3 shrink-0">
                <button onClick={handleSaveOrder} className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary/90 flex items-center justify-center gap-2 shadow-md shadow-primary/20"><Save size={20} /> حفظ الطلبية {currentOrder.status === 'draft' ? '(كمسودة)' : ''}</button>
                <button onClick={() => setShowOrderModal(false)} className="px-6 py-3 bg-surface text-secondary rounded-xl font-bold hover:bg-surface-container border border-outline-variant">إغلاق</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* BUDGET CONFIG MODAL */}
        {showBudgetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-surface w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-outline-variant">
              <div className="p-6 bg-surface-container-low border-b border-outline-variant/50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-primary">إعدادات الميزانية</h3>
                <button onClick={() => setShowBudgetModal(false)} className="p-2 hover:bg-outline-variant/30 rounded-full text-secondary"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveBudget} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-primary mb-1">الميزانية السنوية الإجمالية (دج)</label>
                  <input required min="0" step="1000" type="number" value={budgetConfig.annualBudget || 0} onChange={e => setBudgetConfig({...budgetConfig, annualBudget: parseFloat(e.target.value) || 0})} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:border-primary outline-none text-left" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-primary mb-1">السنة المالية / الدراسية</label>
                  <input required type="text" value={budgetConfig.fiscalYear || ''} onChange={e => setBudgetConfig({...budgetConfig, fiscalYear: e.target.value})} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:border-primary outline-none" />
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2"><Save size={20} /> حفظ</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}