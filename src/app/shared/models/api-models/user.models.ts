import { ICourseResponse } from './course.models';
import { TRole } from '../role.enum';

export interface IUserRequest {
  email: string;
  password: string;
  name: string;
  studyCycleYearA: number | null;
  studyCycleYearB: number | null;
  courseId: number | null;
  group: string | null;
}

export interface IUserLoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface IUserResponse {
  id: number;
  email: string;
  role: TRole;
  name: string;
  studyCycleYearA: number | null;
  studyCycleYearB: number | null;
  lastPlayed: string;
  banned: boolean;
  course: ICourseResponse;
  group: string;
}

export interface IUserStatsResponse {
  games: number;
  plays: number;
  totalStorageMb: number;
  firstPlayed: string;
  lastPlayed: string;
}

export interface ILimitsResponse {
  studentLimitMb: number;
  teacherLimitMb: number;
  adminLimitMb: number;
}

export interface IUserEditRequest {
  name: string;
  studyCycleYearA: number | null;
  studyCycleYearB: number | null;
  courseId: number | null;
  group: string | null;
}
