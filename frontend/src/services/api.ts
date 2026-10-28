import axios from 'axios';
import {
  User,
  VendorProfile,
  Category,
  Product,
  Cart,
  Order,
  VendorOrder,
  VendorAnalytics,
  AdminAnalytics,
  AdminUser,
  EmailLog,
  ApiResponse,
  unwrapResults
} from '../types';

const api = axios.create({
  baseURL: '/api',
});

// Request interceptor: attach JWT access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post('/api/auth/token/refresh/', {
            refresh: refreshToken,
          });
          const newAccess = res.data.access;
          localStorage.setItem('access_token', newAccess);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await api.post('/auth/token/', credentials);
    if (res.data.access) {
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  register: async (payload: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    role: string;
    store_name?: string;
    store_description?: string;
  }) => {
    const res = await api.post('/auth/register/', payload);
    return res.data;
  },
  getProfile: async (): Promise<User> => {
    const res = await api.get('/auth/me/');
    return res.data;
  },
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const res = await api.patch('/auth/me/', data);
    return res.data;
  },
  changePassword: async (payload: { current_password: string; new_password: string }): Promise<{ message: string }> => {
    const res = await api.post('/auth/change-password/', payload);
    return res.data;
  },
  uploadAvatar: async (file: File): Promise<{ message: string; avatar_url: string; user: User }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await api.post('/auth/avatar/', formData);
    return res.data;
  },
  removeAvatar: async (): Promise<{ message: string; avatar_url: string; user: User }> => {
    const res = await api.delete('/auth/avatar/');
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
};

// Catalog & Product Services
export const productService = {
  getCategories: async (): Promise<Category[]> => {
    const res = await api.get('/categories/');
    return res.data;
  },
  getProducts: async (params?: {
    search?: string;
    category?: string;
    vendor?: string;
    min_price?: number;
    max_price?: number;
    in_stock?: boolean;
    featured?: boolean;
    sort?: string;
    page?: number;
  }) => {
    const res = await api.get('/products/', { params });
    return res.data;
  },
  getProductDetail: async (slug: string): Promise<Product> => {
    const res = await api.get(`/products/${slug}/`);
    return res.data;
  },
  createReview: async (slug: string, review: { rating: number; title: string; comment: string }) => {
    const res = await api.post(`/products/${slug}/reviews/`, review);
    return res.data;
  },
};

// Cart Services
export const cartService = {
  getCart: async (): Promise<Cart> => {
    const res = await api.get('/cart/');
    return res.data;
  },
  addToCart: async (productId: number, quantity: number = 1): Promise<Cart> => {
    const res = await api.post('/cart/', { product_id: productId, quantity });
    return res.data;
  },
  updateCartItem: async (itemId: number, quantity: number): Promise<Cart> => {
    const res = await api.patch(`/cart/items/${itemId}/`, { quantity });
    return res.data;
  },
  removeCartItem: async (itemId: number): Promise<Cart> => {
    const res = await api.delete(`/cart/items/${itemId}/`);
    return res.data;
  },
  clearCart: async (): Promise<Cart> => {
    const res = await api.post('/cart/clear/');
    return res.data;
  },
};

// Order & Checkout Services
export const orderService = {
  checkout: async (payload: {
    shipping_name: string;
    shipping_email: string;
    shipping_phone: string;
    shipping_address: string;
    shipping_city: string;
    shipping_state?: string;
    shipping_postal_code: string;
    shipping_country?: string;
    payment_method: string;
  }): Promise<Order> => {
    const res = await api.post('/v1/orders/checkout/', payload);
    return res.data;
  },
  createRazorpayOrder: async (orderNumber: string) => {
    const res = await api.post('/v1/payments/razorpay/create/', { order_number: orderNumber });
    return res.data;
  },
  verifyRazorpayPayment: async (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    const res = await api.post('/v1/payments/razorpay/verify/', payload);
    return res.data;
  },
  recordRazorpayFailure: async (payload: {
    razorpay_order_id: string;
    error_code?: string;
    error_description?: string;
    error_source?: string;
    error_step?: string;
    error_reason?: string;
  }) => {
    const res = await api.post('/v1/payments/razorpay/fail/', payload);
    return res.data;
  },
  createStripeIntent: async (orderNumber: string) => {
    const res = await api.post('/v1/payments/stripe/create-intent/', { order_number: orderNumber });
    return res.data;
  },
  initiateRefund: async (orderNumber: string, amount?: number, reason?: string) => {
    const res = await api.post('/v1/payments/razorpay/refund/', {
      order_number: orderNumber,
      amount,
      reason,
    });
    return res.data;
  },
  getCustomerOrders: async (): Promise<ApiResponse<Order>> => {
    const res = await api.get('/v1/orders/');
    return res.data;
  },
  getOrderDetail: async (orderNumber: string): Promise<Order> => {
    const res = await api.get(`/v1/orders/${orderNumber}/`);
    return res.data;
  },
};

// Vendor Services
export const vendorService = {
  getPublicVendors: async (): Promise<ApiResponse<VendorProfile>> => {
    const res = await api.get('/vendors/');
    return res.data;
  },
  getPublicVendorDetail: async (slug: string): Promise<VendorProfile> => {
    const res = await api.get(`/vendors/${slug}/`);
    return res.data;
  },
  getMyProfile: async (): Promise<VendorProfile> => {
    const res = await api.get('/vendor/profile/');
    return res.data;
  },
  updateMyProfile: async (data: Partial<VendorProfile>): Promise<VendorProfile> => {
    const res = await api.patch('/vendor/profile/', data);
    return res.data;
  },
  getMyProducts: async (params?: { search?: string }) => {
    const res = await api.get('/vendor/products/', { params });
    return res.data;
  },
  createProduct: async (productData: any): Promise<Product> => {
    const res = await api.post('/vendor/products/', productData);
    return res.data;
  },
  updateProduct: async (id: number, productData: any): Promise<Product> => {
    const res = await api.patch(`/vendor/products/${id}/`, productData);
    return res.data;
  },
  deleteProduct: async (id: number) => {
    const res = await api.delete(`/vendor/products/${id}/`);
    return res.data;
  },
  getMyOrders: async (params?: { status?: string }) => {
    const res = await api.get('/vendor/orders/', { params });
    return res.data;
  },
  updateOrderStatus: async (
    orderId: number,
    data: { status?: string; tracking_number?: string; carrier?: string }
  ): Promise<VendorOrder> => {
    const res = await api.patch(`/vendor/orders/${orderId}/status/`, data);
    return res.data;
  },
  getAnalytics: async (): Promise<VendorAnalytics> => {
    const res = await api.get('/vendor/analytics/');
    return res.data;
  },
  uploadProductImage: async (file: File): Promise<{ message: string; image_url: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post('/products/upload-image/', formData);
    return res.data;
  },
  uploadStoreBranding: async (
    file: File,
    type: 'logo' | 'banner'
  ): Promise<{ message: string; url: string; vendor: VendorProfile }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const res = await api.post('/auth/vendor/branding/', formData);
    return res.data;
  },
  quickUpdateProduct: async (
    id: number,
    data: { inventory_count?: number; is_active?: boolean }
  ): Promise<Product> => {
    const res = await api.patch(`/vendor/products/${id}/`, data);
    return res.data;
  },
  activateStore: async (data?: { store_name?: string; description?: string }): Promise<{ message: string; vendor: VendorProfile; user: User }> => {
    const res = await api.post('/vendor/activate/', data || {});
    return res.data;
  },
  exportCsvUrl: () => {
    return '/api/v1/vendor/export-csv/';
  },
};

// Admin Services
export const adminService = {
  getVendors: async (params?: { status?: string; search?: string }) => {
    const res = await api.get('/admin/vendors/', { params });
    return res.data;
  },
  updateVendorStatus: async (
    vendorId: number,
    data: { status: string; commission_rate?: number; reason?: string }
  ): Promise<VendorProfile> => {
    const res = await api.patch(`/admin/vendors/${vendorId}/status/`, data);
    return res.data;
  },
  getAllProducts: async (params?: { is_approved?: boolean | string; search?: string; vendor?: string; category?: string }) => {
    const res = await api.get('/admin/products/', { params });
    return res.data;
  },
  moderateProduct: async (
    productId: number,
    data: { is_approved?: boolean; is_featured?: boolean; is_active?: boolean }
  ): Promise<Product> => {
    const res = await api.patch(`/admin/products/${productId}/moderate/`, data);
    return res.data;
  },
  bulkModerateProducts: async (
    productIds: number[],
    action: 'approve' | 'delist' | 'feature' | 'unfeature'
  ): Promise<{ message: string; updated_count: number }> => {
    const res = await api.post('/admin/products/bulk-moderate/', { product_ids: productIds, action });
    return res.data;
  },
  createCategory: async (categoryData: Partial<Category>): Promise<Category> => {
    const res = await api.post('/admin/categories/', categoryData);
    return res.data;
  },
  uploadCategoryImage: async (file: File): Promise<{ message: string; image_url: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post('/categories/upload-image/', formData);
    return res.data;
  },
  updateCategory: async (id: number, categoryData: Partial<Category>): Promise<Category> => {
    const res = await api.patch(`/admin/categories/${id}/`, categoryData);
    return res.data;
  },
  deleteCategory: async (id: number) => {
    const res = await api.delete(`/admin/categories/${id}/`);
    return res.data;
  },
  getAllOrders: async (params?: { status?: string; search?: string }) => {
    const res = await api.get('/admin/orders/', { params });
    return res.data;
  },
  disburseVendorOrder: async (vendorOrderId: number, reference?: string): Promise<{ message: string; is_disbursed: boolean }> => {
    const res = await api.post(`/admin/vendor-orders/${vendorOrderId}/disburse/`, { reference });
    return res.data;
  },
  getUsers: async (params?: { role?: string; search?: string }): Promise<AdminUser[]> => {
    const res = await api.get('/admin/users/', { params });
    return unwrapResults<AdminUser>(res.data);
  },
  updateUserRole: async (userId: number, role: string): Promise<{ message: string; user: AdminUser }> => {
    const res = await api.patch(`/admin/users/${userId}/role/`, { role });
    return res.data;
  },
  exportLedgerCsvUrl: (): string => {
    return '/api/v1/analytics/admin/export-csv/';
  },
  getAnalytics: async (): Promise<AdminAnalytics> => {
    const res = await api.get('/admin/analytics/');
    return res.data;
  },
};

// Email & Notification Services
export const emailService = {
  getEmailLogs: async (): Promise<ApiResponse<EmailLog>> => {
    const res = await api.get('/v1/emails/');
    return res.data;
  },
  sendTestEmail: async (toEmail: string): Promise<{ success: boolean; recipient: string; status: string; error_message?: string; backend: string }> => {
    const res = await api.post('/v1/emails/send-test/', { to_email: toEmail });
    return res.data;
  },
  resendEmail: async (id: number): Promise<{ success: boolean; message: string }> => {
    const res = await api.post(`/v1/emails/${id}/resend/`);
    return res.data;
  },
  sendContactQuery: async (payload: {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    query_type?: string;
  }) => {
    const res = await api.post('/v1/contact/', payload);
    return res.data;
  },
};

export default api;
