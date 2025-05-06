// 用於註冊的 DTO
export interface RegisterUserDTO {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

// 用於登入的 DTO
export interface LoginUserDTO {
  email: string;
  password: string;
}

// 用於更新用戶資料的 DTO
export interface UpdateUserDTO {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

// 用於 API 響應的 DTO
export interface AuthResponseDTO {
  token: string;
  user: UserDTO;
}

export interface UserDTO {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
} 