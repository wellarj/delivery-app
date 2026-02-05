import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Coupon } from '../types';

export const Coupons = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoupons = async () => {
        try {
            const response = await api.get('', { params: { action: 'list_coupons' } });
            if (response.data && Array.isArray(response.data.data)) {
                setCoupons(response.data.data);
            } else {
                setCoupons([]);
            }
        } catch (err) {
            console.error("Failed to load coupons", err);
            setError("Não foi possível carregar os cupons.");
        } finally {
            setLoading(false);
        }
    };

    fetchCoupons();
  }, []);

  const handleUseCoupon = (code: string) => {
    // Salva o cupom para aplicar automaticamente no checkout
    localStorage.setItem('selected_coupon', code);
    navigate('/checkout');
  };

  const getMinOrderText = (coupon: Coupon) => {
    // API returns min_order_display as BRL units (e.g. 20 for R$20.00)
    // Validate_coupon returns min_order_value in cents
    
    let value = 0;
    if (coupon.min_order_display !== undefined) {
        value = Number(coupon.min_order_display);
    } else if (coupon.min_order_value !== undefined) {
        value = coupon.min_order_value / 100;
    }

    if (value <= 0) return 'Sem valor mínimo';
    
    return `Mínimo: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}`;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white border border-gray-200 text-[#254F22] hover:bg-gray-50 transition shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="text-2xl font-bold text-[#254F22]">Cupons Disponíveis</h1>
        </div>

        {loading ? (
           <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>)}
           </div>
        ) : error ? (
            <div className="text-center py-10 text-red-500 bg-red-50 rounded-xl">
                {error}
            </div>
        ) : (
            <div className="space-y-4">
                {coupons.map((coupon) => (
                    <div 
                        key={coupon.id} 
                        onClick={() => handleUseCoupon(coupon.code)}
                        className="bg-white border border-[#254F22]/10 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden group hover:border-[#F5824A]/50 transition cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 bg-[#EDE4C2] w-16 h-16 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                        
                        <div className="flex gap-4 w-full">
                            <div className="bg-[#254F22] text-white p-4 rounded-xl flex items-center justify-center shadow-lg group-hover:bg-[#F5824A] transition-colors h-16 w-16 flex-shrink-0">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                            </div>
                            <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-extrabold text-[#254F22] tracking-wide">{coupon.code}</h3>
                                    {coupon.usage_status && coupon.usage_status !== 'Ilimitado' && (
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                                            Uso: {coupon.usage_status}
                                        </span>
                                    )}
                                </div>
                                
                                <p className="text-[#A03A13] font-bold text-lg mt-1">
                                    {coupon.discount_display || (coupon.type === 'PERCENTAGE' ? `${coupon.value}% OFF` : `R$ ${coupon.value/100} OFF`)}
                                </p>
                                
                                <div className="flex flex-wrap gap-2 mt-2">
                                     <span className="text-xs bg-[#EDE4C2] text-[#A03A13] px-2 py-1 rounded font-bold">
                                         {getMinOrderText(coupon)}
                                     </span>
                                     {coupon.description && (
                                         <span className="text-xs text-gray-500 flex items-center">
                                             {coupon.description}
                                         </span>
                                     )}
                                </div>
                            </div>
                        </div>
                        
                        <button 
                            className="hidden sm:block px-6 py-2 border-2 border-[#254F22] text-[#254F22] font-bold rounded-lg group-hover:bg-[#254F22] group-hover:text-white transition whitespace-nowrap"
                        >
                            Usar Cupom
                        </button>
                    </div>
                ))}

                {coupons.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                        <div className="bg-gray-100 p-4 rounded-full mb-4 text-gray-400">
                             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-700">Sem cupons ativos</h3>
                        <p className="text-gray-500 text-sm mt-1">Fique ligado, em breve teremos novas ofertas!</p>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};