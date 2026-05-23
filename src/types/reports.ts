export interface ReportRow {
  id: number;
  teacher: string;
  teacherSubject?: string;
  time: string;
  class: string;
  activityType: string;
  activityTitle: string;
  equipment: string;
  notes: string;
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  rank?: string;
}

export interface InstitutionSettings {
  directorate: string;
  school: string;
  address: string;
  jobTitle: string;
}

export interface SavedReport {
  id: string;
  date: string;
  reportNumber?: string;
  rows: Omit<ReportRow, 'id'>[];
  labNotes: string;
  supervisorNotes: string;
  directorNotes: string;
  createdBy: string;
  createdAt: any;
}
