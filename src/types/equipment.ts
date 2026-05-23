export interface Equipment {
  id: string;
  name: string;
  type: 'glassware' | 'tech' | 'other';
  serialNumber: string;
  status: 'functional' | 'maintenance' | 'broken';
  totalQuantity: number;
  availableQuantity: number;
  brokenQuantity: number;
  lastCalibration?: string;
  nextCalibration?: string;
  supplier?: string;
  location?: string;
  notes?: string;
  foundationalInventory?: string;
  decennialReview?: string;
  smartNameAr?: string;
  smartDescriptionAr?: string;
  imageKeyword?: string;
  lastSmartUpdate?: any;
}

export interface MaintenanceLog {
  id: string;
  equipmentId: string;
  previousStatus: string;
  newStatus: string;
  date: any;
  note: string;
}
