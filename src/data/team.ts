export interface TeamMember {
  order: number;
  fullName: string;
  studentId: string;
}

export const TEAM_MEMBERS: readonly TeamMember[] = [
  {
    order: 1,
    fullName: 'Nguyễn Ngọc Yến Nhi',
    studentId: '3125330197',
  },
  {
    order: 2,
    fullName: 'Nguyễn Ngọc Thảo Nguyên',
    studentId: '3125330185',
  },
  {
    order: 3,
    fullName: 'Đỗ Anh Thư',
    studentId: '3125330288',
  },
  {
    order: 4,
    fullName: 'Trương Đặng Trúc Nguyên',
    studentId: '3125330187',
  },
  {
    order: 5,
    fullName: 'Nguyễn Duy Khang',
    studentId: '3125330118',
  },
  {
    order: 6,
    fullName: 'La Ngọc Sương',
    studentId: '3123330328',
  },
  {
    order: 7,
    fullName: 'Lê Thị Kim Hà',
    studentId: '3125330073',
  },
  {
    order: 8,
    fullName: 'Ngô Thị Minh Thư',
    studentId: '3125330291',
  },
] as const;
