import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { ProductModal } from '../components/ProductModal';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const BANNERS = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?ixlib=rb-1.2.1&auto=format&fit=crop&w=1351&q=80",
    title: "Combos Especiais",
    subtitle: "O melhor sabor para sua fome."
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=1351&q=80",
    title: "Entrega Rápida",
    subtitle: "Chega quentinho em até 40 min!"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1351&q=80",
    title: "Promoção do Dia",
    subtitle: "Peça 2 Burguers e ganhe a batata."
  }
];

export const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const [priceSort, setPriceSort] = useState<'asc' | 'desc' | null>(null);

  const { addToCart } = useCart();

  // Carousel Rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('', { params: { action: 'list_products' } }),
        api.get('', { params: { action: 'list_categories' } })
      ]);
      
      // Handle Products
      let prodData = [];
      if (productsRes.data && Array.isArray(productsRes.data.data)) {
        prodData = productsRes.data.data;
      } else if (Array.isArray(productsRes.data)) {
         prodData = productsRes.data;
      }
      setProducts(prodData);

      // Handle Categories
      let catData = [];
      if (categoriesRes.data && Array.isArray(categoriesRes.data.data)) {
        catData = categoriesRes.data.data;
      }
      setCategories(catData);

    } catch (error) {
      console.error("Error fetching data", error);
      setError("Não foi possível carregar o cardápio. Tente recarregar a página.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCartClick = (product: Product) => {
    setModalProduct(product);
  };

  const handleConfirmAddToCart = (product: Product, qty: number, notes?: string) => {
    addToCart(product, qty, notes);
    setModalProduct(null);
  };

  // Derived filtered products
  const filteredProducts = useMemo(() => {
    let result = products;

    // 1. Category Filter
    if (selectedCategoryId !== 'all') {
      result = result.filter(p => p.category_id === selectedCategoryId);
    }

    // 2. Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q)
      );
    }

    // 3. Price Sort
    if (priceSort) {
      result = [...result].sort((a, b) => {
        return priceSort === 'asc' ? a.price - b.price : b.price - a.price;
      });
    }

    return result;
  }, [products, selectedCategoryId, searchQuery, priceSort]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8 px-4 bg-[#EDE4C2] sm:bg-transparent">
        <div className="w-full max-w-md mx-auto">
            <div className="bg-[#254F22] p-8 rounded-full inline-block mb-6 shadow-xl animate-bounce">
                <span className="text-6xl font-serif italic text-white font-bold">M</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#254F22] tracking-tight mb-4">
            Manuelita<span className="text-[#F5824A]">.</span>
            </h1>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed font-medium">
            Sabor autêntico e premium.<br/>Cadastre-se para acessar nosso cardápio exclusivo.
            </p>
            <div className="flex flex-col gap-3">
            <button 
                onClick={() => navigate('/login')}
                className="w-full py-4 rounded-xl text-lg font-bold text-white bg-[#254F22] hover:bg-[#1a3818] transition shadow-lg border border-[#1a3818]"
            >
                Entrar na Conta
            </button>
            <p className="text-xs text-gray-500 mt-4">Ao continuar, você concorda com nossos termos.</p>
            </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] px-4 text-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl mb-6 max-w-sm border border-red-100">
            <p className="font-semibold">{error}</p>
        </div>
        <button 
          onClick={fetchData}
          className="bg-[#254F22] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#1a3818] transition"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 sm:pb-8 animate-fadeIn px-4 sm:px-0">
      
      {/* Carousel Banner */}
      <div className="relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden shadow-md bg-gray-900 group">
        {BANNERS.map((banner, index) => (
            <div 
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            >
                <img 
                    src={banner.image} 
                    alt={banner.title} 
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10">
                    <h2 className="text-white text-3xl sm:text-4xl font-extrabold mb-2 drop-shadow-lg transform translate-y-0 transition-transform duration-700">
                        {banner.title}
                    </h2>
                    <p className="text-gray-200 text-sm sm:text-base max-w-md drop-shadow-md">
                        {banner.subtitle}
                    </p>
                </div>
            </div>
        ))}
        {/* Carousel Indicators */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {BANNERS.map((_, index) => (
                <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all ${index === currentSlide ? 'bg-white w-6' : 'bg-white/50'}`}
                />
            ))}
        </div>
      </div>

      {/* Store Info / Notices */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-[#254F22]/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm">
        <div className="flex items-center gap-3">
             <div className="bg-green-100 p-2 rounded-full text-[#254F22]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <div>
                 <p className="font-bold text-[#254F22]">Aberto Agora</p>
                 <p className="text-gray-500 text-xs">Fecha às 23:00</p>
             </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto hover:bg-gray-50 p-2 rounded-lg transition" onClick={() => navigate('/coupons')}>
             <div className="bg-[#F5824A]/20 p-2 rounded-full text-[#A03A13]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
             </div>
             <div className="flex-1 sm:flex-none cursor-pointer">
                 <p className="font-bold text-[#A03A13]">Cupons Disponíveis</p>
                 <p className="text-gray-500 text-xs">Toque para ver ofertas</p>
             </div>
             <svg className="w-4 h-4 text-[#A03A13]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="sticky top-0 sm:top-20 bg-[#EDE4C2] pt-2 pb-2 z-20 space-y-4">
        
        {/* Search Bar */}
        <div className="relative shadow-sm">
            <input 
                type="text" 
                placeholder="Busque por item ou ingrediente..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#254F22]/10 rounded-xl text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#254F22] shadow-sm transition outline-none"
            />
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        </div>

        {/* Categories (Horizontal Scroll) */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
                onClick={() => setSelectedCategoryId('all')}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-all transform active:scale-95 ${
                    selectedCategoryId === 'all'
                    ? 'bg-[#254F22] text-white shadow-md' 
                    : 'bg-white text-[#254F22] border border-[#254F22]/20 hover:bg-[#254F22]/5'
                }`}
            >
                Todos
            </button>
            {categories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-all transform active:scale-95 ${
                        selectedCategoryId === cat.id 
                        ? 'bg-[#254F22] text-white shadow-md' 
                        : 'bg-white text-[#254F22] border border-[#254F22]/20 hover:bg-[#254F22]/5'
                    }`}
                >
                    {cat.name}
                </button>
            ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex justify-between items-center px-1">
         <h2 className="text-lg font-bold text-[#254F22]">
             {selectedCategoryId === 'all' 
                ? 'Destaques' 
                : categories.find(c => c.id === selectedCategoryId)?.name || 'Produtos'} 
             <span className="ml-2 text-xs font-normal text-gray-500">({filteredProducts.length})</span>
         </h2>
         
         <button 
            onClick={() => setPriceSort(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1 text-xs font-semibold text-[#254F22] bg-white px-3 py-1.5 rounded-lg border border-[#254F22]/20"
         >
            Preço
            <svg className={`w-3 h-3 transition-transform ${priceSort === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
         </button>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4].map(i => (
                <div key={i} className="bg-white h-64 rounded-2xl animate-pulse"></div>
            ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAdd={handleAddToCartClick} 
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center opacity-70">
           <span className="text-4xl mb-3">🔍</span>
           <p className="text-gray-500 font-medium">Nenhum produto encontrado.</p>
           <button onClick={() => {setSearchQuery(''); setSelectedCategoryId('all');}} className="text-[#F5824A] text-sm mt-2 font-bold">Limpar filtros</button>
        </div>
      )}

      <ProductModal
        isOpen={!!modalProduct}
        product={modalProduct}
        onClose={() => setModalProduct(null)}
        onConfirm={handleConfirmAddToCart}
      />
    </div>
  );
};