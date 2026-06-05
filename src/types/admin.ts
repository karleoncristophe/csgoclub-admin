export interface AdminEntity {
  _id: string
  name: string
  email: string
  role?: string
  active?: boolean
  deleted?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface AdminAuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AdminSignInResponse extends AdminAuthTokens {
  admin: {
    _id: string
    name: string
    email: string
    role: string
  }
}

export interface AdminListResponse {
  data: AdminEntity[]
  total: number
  page: number
  limit: number
  totalPages: number
}
