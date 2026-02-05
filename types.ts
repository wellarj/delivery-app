export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
}

export interface Category {
  id: number;
  name: string;
  product_count?: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id?: number;
  category_name?: string;
  image_url?: string;
  // Future proofing for options if needed in UI later
  options_summary?: any[]; 
}

export interface CartItem {
  tempId: string;
  product: Product;
  quantity: number;
  notes: string;
}

export interface OrderItemOption {
  id: number;
  option_item_id: number;
  created_at: string;
  name?: string; // Optional if you join later
  price?: number;
}

export interface OrderItem {
  id: number;
  product_id: number;
  name: string;
  product_name?: string; // Added to match new SQL query
  image_url?: string;
  quantity: number;
  price: number;
  notes?: string;
  options?: OrderItemOption[];
}

export interface Order {
  id: number;
  user_id: number;
  total: number;
  discount: number;
  status: string; // Changed to string to handle 'PAID', 'paid', 'PENDING', etc.
  created_at: string;
  payment_method: string;
  coupon_code?: string;
  notes?: string;
  items?: OrderItem[] | string; // Can be string (JSON from DB) or array
  // Property added to handle get_order response which includes billing info
  billing?: {
    status: string;
    billing_id?: string;
    url?: string;
  };
}

export interface CreateOrderResponse {
  success: boolean;
  order_id: number;
  total: number;
  final_total: number;
  discount: number;
  payment_link?: string;
  billing_id?: string;
  payment?: {
    billing_id?: string;
    url?: string;
    qr_code?: string;
    status?: string;
  };
  error?: string;
  payment_error?: string;
}

export interface Coupon {
  id: number;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  min_order_value?: number; // Raw value in cents (optional from list_coupons)
  description?: string;
  
  // Fields specifically from list_coupons endpoint
  discount_display?: string;
  min_order_display?: number | string; // Value in BRL units (not cents)
  usage_status?: string;
}

export interface CouponResponse {
  valid: boolean;
  message?: string;
  coupon?: Coupon;
  discount?: number;
  final_total?: number;
}

export interface CheckStatusResponse {
  status: string;
  billing: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface SavedAddress {
  id: string;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;
}

// Interface mapping the PHP response structure
// Updated to match the "notes AS delivery_address" query
export interface LastAddress {
  id: number;
  delivery_address: string; // This is now the full string from 'notes' column
  created_at: string;
}

export interface ApiError {
  error: string;
}