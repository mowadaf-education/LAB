export interface SafetyItem {
  id: string;
  name: string;
  status: 'صالح' | 'تحتاج تحديث' | 'منتهي';
  lastCheck: string;
  serialNumber: string;
  type: 'fire' | 'eye' | 'firstaid' | 'gas';
}

export interface Incident {
  id: string;
  date: any;
  type: string;
  status: 'تم التعامل' | 'قيد المتابعة' | 'جديد' | 'تحت التحقيق';
  reporter: string;
  severity: 'low' | 'medium' | 'high';
  description?: string;
  location?: string;
  injured?: string;
  witnesses?: string;
  firstAid?: string;
  analysis?: {
    rootCause: string;
    suggestedActions: string[];
    safetyTipsAr: string;
    longTermMitigation: string;
  };
}
