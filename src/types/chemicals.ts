export interface Chemical {
  id: string;
  nameEn: string;
  nameAr: string;
  formula: string;
  casNumber?: string;
  storageTemp?: string;
  unit: string;
  quantity: number;
  state: string;
  hazardClass: string;
  ghs: string[];
  shelf: string;
  expiryDate: string;
  notes: string;
}

export const GHS_ICONS: Record<string, string> = {
  'GHS01': '/ghs/GHS01.png',
  'GHS02': '/ghs/GHS02.png',
  'GHS03': '/ghs/GHS03.png',
  'GHS04': '/ghs/GHS04.png',
  'GHS05': '/ghs/GHS05.png',
  'GHS06': '/ghs/GHS06.png',
  'GHS07': '/ghs/GHS07.png',
  'GHS08': '/ghs/GHS08.png',
  'GHS09': '/ghs/GHS09.png',
};

export const GHS_LABELS: Record<string, string> = {
  'GHS01': 'متفجرات',
  'GHS02': 'قابل للاشتعال',
  'GHS03': 'مؤكسد',
  'GHS04': 'غاز تحت الضغط',
  'GHS05': 'أكال / مسبب للتآكل',
  'GHS06': 'سمية حادة (قاتل)',
  'GHS07': 'تهيج / تحسس / خطر',
  'GHS08': 'خطر صحي جسيم',
  'GHS09': 'خطر بيئي',
};
