import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { cartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const isActive = (path: string) => location.pathname === path ? "text-[#F5824A]" : "text-gray-400 hover:text-[#254F22]";

  // Hide Bottom Nav on Checkout/Auth pages for better focus
  const hideNav = ['/login', '/checkout'].includes(location.pathname) || location.pathname.startsWith('/payment');

  return (
    <div className="min-h-screen flex flex-col bg-[#EDE4C2] pb-20 sm:pb-0 font-sans">
      {/* Mobile Header (Logo & Cart Icon) - Only visible on Home/Orders */}
      {!hideNav && (
        <header className="bg-white sticky top-0 z-30 shadow-sm sm:hidden px-4 py-3 flex justify-between items-center border-b border-[#254F22]/10">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#254F22] rounded-lg flex items-center justify-center text-white font-bold font-serif italic">M</div>
                <span className="text-xl font-extrabold text-[#254F22] tracking-tight">Manuelita</span>
            </div>
            {isAuthenticated && (
                <Link to="/checkout" className="relative p-2 text-[#254F22]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    {cartCount > 0 && (
                        <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-[#A03A13] rounded-full border-2 border-white">
                            {cartCount}
                        </span>
                    )}
                </Link>
            )}
        </header>
      )}

      {/* Desktop Header */}
      <nav className="hidden sm:block bg-white shadow-sm sticky top-0 z-50 border-b border-[#254F22]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer gap-2" onClick={() => navigate('/')}>
              <div className="w-8 h-8 bg-[#254F22] rounded-lg flex items-center justify-center text-white font-bold font-serif italic">M</div>
              <span className="text-xl font-extrabold text-[#254F22] tracking-tight">Manuelita</span>
            </div>
            
            <div className="flex items-center space-x-8">
              <Link to="/" className={`font-medium ${isActive('/')}`}>Cardápio</Link>
              {isAuthenticated && <Link to="/orders" className={`font-medium ${isActive('/orders')}`}>Meus Pedidos</Link>}
              
              <Link to="/checkout" className="relative p-2 bg-[#EDE4C2] rounded-full text-[#254F22] hover:bg-[#F5824A]/20 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-[#A03A13] rounded-full border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                  <button onClick={() => { localStorage.removeItem('auth_token'); navigate('/login'); }} className="text-sm font-medium text-gray-500 hover:text-[#A03A13]">
                    Sair
                  </button>
              ) : (
                <Link to="/login" className="px-4 py-2 bg-[#254F22] text-white rounded-lg text-sm font-medium hover:bg-[#1a3818]">
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow w-full max-w-7xl mx-auto sm:px-6 lg:px-8 py-4 sm:py-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      {!hideNav && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 pb-safe sm:hidden z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center h-16">
                <Link to="/" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/')}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="text-[10px] font-medium">Início</span>
                </Link>
                
                <Link to="/orders" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive('/orders')}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-[10px] font-medium">Pedidos</span>
                </Link>

                <Link to={isAuthenticated ? "/checkout" : "/login"} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location.pathname === '/checkout' ? 'text-[#F5824A]' : 'text-gray-400'}`}>
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-2 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-[#A03A13] rounded-full border-2 border-white">
                                {cartCount}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-medium">Carrinho</span>
                </Link>

                <div className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-400" onClick={() => { if(isAuthenticated) { localStorage.removeItem('auth_token'); navigate('/login'); } else { navigate('/login'); } }}>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-[10px] font-medium">{isAuthenticated ? 'Sair' : 'Perfil'}</span>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};