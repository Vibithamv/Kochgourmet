export interface User {
  // id: string;
  // email: string;
  // full_name: string;
  // avatar_url?: string;
  // kyc_status: 'pending' | 'approved' | 'rejected';
  // created_at: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  firstName: string;
  lastName: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  location: string;
  target_amount: number;
  raised_amount: number;
  minimum_investment: number;
  expected_return: number;
  duration_months: number;
  image_url: string;
  status: 'active' | 'funded' | 'completed';
  created_at: string;
  tenant_id: string;
}

export interface Investment {
  id: string;
  offering_id: string;
  name: string;
  image: string;
  invested: string;
  tokenBalance: string;
  decimal: string;
  transaction_date: string;
  walletAddress: string;
  publicAddress: string;
  symbol: string;
  invested_amount: string;
}

export interface Portfolio {
  total_invested: number;
  current_value: number;
  total_return: number;
  return_percentage: number;
  active_investments: number;
}

export interface Transaction {
  id: string;
  // user_id: string;
  type: 'Send' | 'Receive';
  amount: number;
  amountInCurrency: number;
  symbol: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  description: string;
  currency: string;
}

export interface Tenant {
  id: string;
  name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  domain: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  address: string;
  type: string;
  is_primary: boolean;
  created_at: string;
  status: string;
  sign_message?: string;
}

export interface Accounts {
  id: string;
  name: string;
  email: string;
  account_type?: 'INDIVIDUAL' | 'COMPANY';
}
