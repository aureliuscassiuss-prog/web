export interface Schedule {
    day: string;
    startTime: string;
    endTime: string;
}

export interface Subject {
    id: string;
    name: string;
    code?: string;
    professor?: string;
    color: string;
    totalClasses: number;
    attendedClasses: number;
    schedule: Schedule[];
    minimumAttendance: number; // Percentage, e.g., 75
}

export interface AttendanceLog {
    id: string;
    subjectId: string;
    date: string; // ISO string
    status: 'present' | 'absent' | 'cancelled';
}
