export interface User {
  _id: string;
  email: string;
  phone?: string;
  role: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  status?: string;
  profileImage?: string;
  department?: string;
  designation?: string;
  employeeId?: string;
}

export interface LoginCredentials {
  identifier: string;
  password?: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
  errors?: unknown;
}
