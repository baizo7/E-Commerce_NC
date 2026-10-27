export type Role = 'CUSTOMER' | 'VENDOR' | 'ADMIN';

export interface VendorProfile {
  id: number;
  user: number;
  user_email: string;
  store_name: string;
  slug: string;
  description: string;
  logo_url: string;
  banner_url: string;
  business_email: string;
  business_phone: string;
  business_address: string;
  tax_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  commission_rate: string | number;
  rating: string | number;
  total_sales: string | number;
  product_count?: number;
  created_at: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: Role;
  phone: string;
  avatar_url?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  vendor_profile?: VendorProfile;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  icon: string;
  is_active: boolean;
  product_count?: number;
}

export interface ProductImage {
  id: number;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Review {
  id: number;
  customer_name: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
}

export interface Product {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  description?: string;
  price: string | number;
  compare_at_price?: string | number | null;
  sku?: string;
  inventory_count: number;
  low_stock_threshold?: number;
  is_in_stock: boolean;
  is_low_stock?: boolean;
  rating: string | number;
  review_count: number;
  is_featured: boolean;
  is_active: boolean;
  is_approved: boolean;
  primary_image: string;
  images?: ProductImage[];
  vendor: number | VendorProfile;
  vendor_name?: string;
  vendor_slug?: string;
  category?: number | Category | null;
  category_name?: string;
  reviews?: Review[];
  created_at: string;
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  subtotal: string | number;
}

export interface VendorCartGroup {
  id: number;
  store_name: string;
  slug: string;
  items_count: number;
  subtotal: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total_items: number;
  subtotal: string | number;
  vendors_involved: VendorCartGroup[];
  updated_at: string;
}

export interface OrderItem {
  id: number;
  product?: number;
  product_title: string;
  product_sku: string;
  vendor: number;
  vendor_name: string;
  price: string | number;
  tax_rate?: string | number;
  commission_rate?: string | number;
  quantity: number;
  subtotal: string | number;
  image_url: string;
}

export interface VendorOrder {
  id: number;
  order: number;
  order_number: string;
  vendor: number;
  vendor_name: string;
  vendor_slug: string;
  customer_email: string;
  shipping_name: string;
  shipping_city: string;
  shipping_address: string;
  subtotal: string | number;
  commission_rate: string | number;
  commission_amount: string | number;
  net_vendor_amount: string | number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  tracking_number: string;
  carrier: string;
  shipped_at?: string | null;
  delivered_at?: string | null;
  items?: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  order: number;
  order_number: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  amount: string | number;
  amount_in_subunits: number;
  currency: string;
  status: 'CREATED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
  is_verified: boolean;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer: number;
  customer_email: string;
  total_items_amount: string | number;
  shipping_amount: string | number;
  tax_amount: string | number;
  grand_total: string | number;
  status: 'PENDING_PAYMENT' | 'PAID' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'PAYMENT_FAILED';
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  payment_method: string;
  payment_id: string;
  shipping_name: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state?: string;
  shipping_postal_code: string;
  shipping_country: string;
  vendor_orders: VendorOrder[];
  items: OrderItem[];
  payments?: Payment[];
  razorpay_payload?: {
    order_id: number;
    order_number: string;
    razorpay_order_id: string;
    amount: number;
    amount_in_subunits: number;
    currency: string;
    key_id: string;
  };
  created_at: string;
  updated_at: string;
}

export interface VendorAnalytics {
  gross_sales: number;
  net_earnings: number;
  commission_paid: number;
  total_orders: number;
  pending_fulfillment: number;
  completed_orders: number;
  total_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
  store_name: string;
  rating: number;
  recent_orders: {
    id: number;
    order_number: string;
    customer_email: string;
    subtotal: number;
    net_amount: number;
    status: string;
    created_at: string;
  }[];
}

export interface AdminAnalytics {
  total_gmv: number;
  total_commission: number;
  total_orders: number;
  total_vendors: number;
  pending_vendors: number;
  approved_vendors: number;
  total_customers: number;
  total_products: number;
  pending_products: number;
  top_vendors: {
    id: number;
    store_name: string;
    total_sales: number;
    rating: number;
    status: string;
  }[];
  recent_orders: {
    id: number;
    order_number: string;
    customer_email: string;
    grand_total: number;
    status: string;
    payment_status: string;
    created_at: string;
  }[];
}
