import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Auth } from './pages/Auth';
import { Checkout } from './pages/Checkout';
import { Orders } from './pages/Orders';
import { PaymentStatus } from './pages/PaymentStatus';
import { Coupons } from './pages/Coupons';

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <div>Carregando...</div>;
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/coupons" element={<Coupons />} />
      <Route 
        path="/orders" 
        element={
          <PrivateRoute>
            <Orders />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/payment/:id" 
        element={
          <PrivateRoute>
            <PaymentStatus />
          </PrivateRoute>
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Layout>
            <AppRoutes />
          </Layout>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;