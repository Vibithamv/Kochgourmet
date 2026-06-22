export interface KochgourmetLoginUser {
  firstName: string;
  lastName: string;
  email: string;
  uid: number;
  '@id'?: string;
}

export interface KochgourmetRefreshResponse {
  token: string;
  expiresAt?: string;
  refreshToken?: string;
}

export interface KochgourmetLoginResponse {
  token: string;
  expiresAt?: string;
  refreshToken?: string;
  user?: KochgourmetLoginUser;
  email?: string;
  firstName?: string;
  lastName?: string;
  uid?: number;
}
