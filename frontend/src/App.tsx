import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastNotification } from './components/ToastNotification';

// Customer Pages
import { HomePage } from './pages/customer/HomePage';
import { CatalogPage } from './pages/customer/CatalogPage';
import { ProductDetailPage } from './pages/customer/ProductDetailPage';
import { VendorDirectoryPage } from './pages/customer/VendorDirectoryPage';
import { VendorStorefrontPage } from './pages/customer/VendorStorefrontPage';
import { CartPage } from './pages/customer/CartPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { OrderSuccessPage } from './pages/customer/OrderSuccessPage';
import { CustomerOrdersPage } from './pages/customer/CustomerOrdersPage';
import { OrderDetailPage } from './pages/customer/OrderDetailPage';
import { ContactPage } from './pages/customer/ContactPage';
import { ProfilePage } from './pages/customer/ProfilePage';

// Vendor Pages
import { VendorDashboardPage } from './pages/vendor/VendorDashboardPage';
import { VendorProductsPage } from './pages/vendor/VendorProductsPage';
import { VendorOrdersPage } from './pages/vendor/VendorOrdersPage';
import { VendorEarningsPage } from './pages/vendor/VendorEarningsPage';
import { VendorSettingsPage } from './pages/vendor/VendorSettingsPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminVendorsPage } from './pages/admin/AdminVendorsPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Protected Route wrappers
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const VendorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          {/* Customer & Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<CatalogPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/vendors" element={<VendorDirectoryPage />} />
          <Route path="/vendors/:slug" element={<VendorStorefrontPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success/:orderNumber" element={<OrderSuccessPage />} />
          <Route path="/orders" element={<CustomerOrdersPage />} />
          <Route path="/orders/:orderNumber" element={<OrderDetailPage />} />
          <Route path="/profile" element={<AuthRoute><ProfilePage /></AuthRoute>} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Vendor Portal */}
          <Route path="/vendor/dashboard" element={<VendorRoute><VendorDashboardPage /></VendorRoute>} />
          <Route path="/vendor/products" element={<VendorRoute><VendorProductsPage /></VendorRoute>} />
          <Route path="/vendor/orders" element={<VendorRoute><VendorOrdersPage /></VendorRoute>} />
          <Route path="/vendor/earnings" element={<VendorRoute><VendorEarningsPage /></VendorRoute>} />
          <Route path="/vendor/settings" element={<VendorRoute><VendorSettingsPage /></VendorRoute>} />

          {/* Admin Portal */}
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
          <Route path="/admin/vendors" element={<AdminRoute><AdminVendorsPage /></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><AdminProductsPage /></AdminRoute>} />
          <Route path="/admin/categories" element={<AdminRoute><AdminCategoriesPage /></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute><AdminOrdersPage /></AdminRoute>} />

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <ToastNotification />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
