export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  block: string; // 'Block A' | 'Block B' | 'Block C'
  roomNo?: string;
  password?: string;
}

export interface FoodItem {
  id: number | string;
  name: string;
  price: number;
  available: boolean;
  block: string; // which hostel mess this food belongs to
  description?: string;
  icon?: string;
}

export interface OrderItemPayload {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  order_id: string;
  token: string;
  student_id: string;
  student_name: string;
  block: string; // assigned hostel mess block
  items: OrderItemPayload[];
  total_amount: number;
  created_at: string;
  dinner_date: string;
  status: 'paid' | 'verified' | 'used';
  verified_at?: string;
  is_completed?: boolean;
  completion_status?: 'placed' | 'preparing' | 'completed';
  completed_at?: string;
}

export interface CrowdState {
  currentCount: number;
  capacity: number;
  waitTimeMinutes: number;
  statusLevel: string;
  tokensToday: number;
}

export type ActiveScreen = 'login' | 'student' | 'checkout' | 'pass' | 'admin';
