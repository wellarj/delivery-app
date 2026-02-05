import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CreateOrderResponse, CouponResponse, SavedAddress, LastAddress, CartItem, Product } from '../types';
import { ProductModal } from '../components/ProductModal';

export const Checkout = () => {
  const { items, removeFromCart, cartTotal, clearCart, updateCartItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Edit Item State
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  
  // Address State
  const [useNewAddress, setUseNewAddress] = useState(true);
  const [historyAddresses, setHistoryAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');

  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [complement, setComplement] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResponse['coupon'] | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{type: 'error' | 'success', text: string} | null>(null);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARD' | 'CASH'>('PIX');

  // Load Address History using the new endpoint
  useEffect(() => {
    const fetchAddressHistory = async () => {
        if (!isAuthenticated) return;
        try {
            const response = await api.get<{ data: LastAddress[] }>('', { params: { action: 'list_last_addresses' } });
            
            if (response.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
                // Filter out addresses that are empty
                const validAddresses = response.data.data.filter(addr => addr.delivery_address);
                
                if (validAddresses.length > 0) {
                    const mappedAddresses: SavedAddress[] = validAddresses.map(addr => {
                        // Clean up the "Endereço: " prefix if it exists in the database note
                        const cleanAddress = addr.delivery_address.replace(/^Endereço:\s*/i, '');
                        
                        return {
                            id: `last-${addr.id}`,
                            street: cleanAddress, // Store the full string in 'street'
                            number: '', // We don't have this separated anymore
                            neighborhood: '', 
                            city: '',
                            state: '',
                            cep: '', 
                            complement: ''
                        };
                    });

                    setHistoryAddresses(mappedAddresses);
                    setUseNewAddress(false);
                    setSelectedAddressId(mappedAddresses[0].id);
                }
            }
        } catch (e) {
            console.error("Failed to load address history", e);
        }
    };
    fetchAddressHistory();
  }, [isAuthenticated]);

  // Auto apply coupon from local storage
  useEffect(() => {
      const autoCoupon = localStorage.getItem('selected_coupon');
      if (autoCoupon) {
          setCouponCode(autoCoupon);
          // Trigger validation
          validateCoupon(autoCoupon);
          localStorage.removeItem('selected_coupon');
      }
  }, [cartTotal]); // Re-validate if cart total changes

  const validateCoupon = async (code: string) => {
    if (!code) return;
    setCouponLoading(true);
    setCouponMessage(null);
    try {
        const response = await api.post<CouponResponse>('', 
            { code: code, order_total: cartTotal },
            { params: { action: 'validate_coupon' } }
        );

        if (response.data.valid && response.data.coupon) {
            setAppliedCoupon(response.data.coupon);
            
            // Use server calculated discount if available, otherwise fallback
            if (response.data.discount !== undefined) {
                setDiscountAmount(response.data.discount);
            } else {
                let disc = 0;
                if (response.data.coupon.type === 'PERCENTAGE') {
                    disc = (cartTotal * response.data.coupon.value) / 100;
                } else {
                    disc = response.data.coupon.value;
                }
                setDiscountAmount(disc);
            }
            
            setCouponMessage({ type: 'success', text: 'Cupom aplicado com sucesso!' });
        } else {
            setAppliedCoupon(null);
            setDiscountAmount(0);
            setCouponMessage({ type: 'error', text: response.data.message || 'Cupom inválido.' });
        }
    } catch (error) {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponMessage({ type: 'error', text: 'Erro ao validar cupom.' });
    } finally {
        setCouponLoading(false);
    }
  };

  const handleApplyCoupon = () => validateCoupon(couponCode);

  const displaySubTotal = cartTotal / 100;
  const finalTotal = Math.max(0, cartTotal - discountAmount) / 100;

  const handleBlurCep = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`);
      if (!response.ok) throw new Error('CEP não encontrado');
      const data = await response.json();
      
      setStreet(data.street || '');
      setNeighborhood(data.neighborhood || '');
      setCity(data.city || '');
      setState(data.state || '');
      document.getElementById('address-number')?.focus();
    } catch (error) {
       // silent
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }

    // Determine final address data to send
    let finalAddressData = {
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        complement: ''
    };

    let addressString = '';

    if (useNewAddress) {
        if (!cep || !street || !number || !neighborhood || !city || !state) {
            alert("Por favor, preencha todos os campos obrigatórios do endereço.");
            return;
        }
        finalAddressData = { street, number, neighborhood, city, state, complement };
        addressString = `Endereço: ${street}, ${number} - ${neighborhood}, ${city}/${state}, CEP: ${cep}${complement ? ` - Comp: ${complement}` : ''}`;
    } else {
        const addr = historyAddresses.find(a => a.id === selectedAddressId);
        if (!addr) {
            alert("Endereço selecionado inválido.");
            return;
        }
        // Since we are reading from 'notes', addr.street contains the full text.
        // We just ensure we don't double prefix if it's already there
        addressString = addr.street.startsWith('Endereço:') ? addr.street : `Endereço: ${addr.street}`;
        
        // We send empty structured data for history addresses since we don't have the parts
        finalAddressData = { 
            street: addr.street, // Use full string here as fallback
            number: '', 
            neighborhood: '', 
            city: '', 
            state: '', 
            complement: '' 
        };
    }

    setLoading(true);
    try {
      const itemsPayload = items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        notes: item.notes
      }));

      const payload = {
        items: itemsPayload,
        notes: addressString,
        payment_method: paymentMethod,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        
        // Structured address data for DB (Only populated for new addresses usually)
        delivery_address: finalAddressData.street,
        delivery_number: finalAddressData.number,
        delivery_neighborhood: finalAddressData.neighborhood,
        delivery_city: finalAddressData.city,
        delivery_state: finalAddressData.state,
        delivery_complement: finalAddressData.complement
      };

      const response = await api.post<CreateOrderResponse>('', payload, { params: { action: 'create_order' } });
      
      if(response.data.success) {
        const link = response.data.payment?.url || response.data.payment_link;
        
        if (link && (paymentMethod === 'PIX' || paymentMethod === 'CARD')) {
          window.open(link, '_blank');
          navigate(`/payment/${response.data.order_id}`, {
            state: { paymentLink: link, orderId: response.data.order_id }
          });
        } else if (paymentMethod === 'CASH') {
          clearCart();
          navigate('/orders'); 
        } else {
           console.warn("No payment link returned for online payment");
           clearCart();
           navigate('/orders');
        }
      }
    } catch (error: any) {
      console.error("Error creating order", error);
      const msg = error.response?.data?.error || error.response?.data?.payment_error || error.message || "Erro ao criar pedido.";
      alert(msg);
    } finally {
        setLoading(false);
    }
  };

  const PLACEHOLDER_IMG = "https://placehold.co/100x100?text=Produto";

  // Edit Item Logic
  const handleEditItem = (item: CartItem) => {
    setEditingItem(item);
  };
  
  const confirmEditItem = (product: Product, quantity: number, notes?: string) => {
    if (editingItem) {
        updateCartItem(editingItem.tempId, quantity, notes);
        setEditingItem(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20 px-4">
        <div className="bg-[#254F22]/10 p-6 rounded-full inline-block mb-4">
             <svg className="w-12 h-12 text-[#254F22]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-[#254F22] mb-4">Seu carrinho está vazio</h2>
        <p className="text-gray-500 mb-8">Parece que você ainda não adicionou nenhum item.</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-[#254F22] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#1a3818] transition shadow-lg"
        >
          Ver Cardápio
        </button>
      </div>
    );
  }

  // Common input styles to ensure white background
  const inputStyle = "w-full bg-white border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#254F22] focus:border-transparent outline-none text-gray-900 shadow-sm";
  const labelStyle = "block text-xs font-bold text-[#254F22] mb-1 uppercase tracking-wide";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
      {/* Items List */}
      <div className="lg:col-span-2 space-y-6">
        <h2 className="text-2xl font-bold text-[#254F22]">Finalizar Pedido</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-[#254F22]/10 overflow-hidden">
          {items.map(item => {
             const itemPrice = item.product.price / 100;
             return (
              <div key={item.tempId} className="p-4 border-b border-[#254F22]/10 last:border-0 flex gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden border border-gray-100">
                  <img 
                    src={item.product.image_url || PLACEHOLDER_IMG} 
                    onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
                    className="w-full h-full object-cover" 
                    alt={item.product.name} 
                  />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-[#254F22] text-lg">{item.quantity}x {item.product.name}</h4>
                      {item.notes && (
                        <p className="text-sm text-gray-500 mt-1 italic bg-gray-50 px-2 py-1 rounded inline-block border border-gray-100">
                           "{item.notes}"
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#254F22] text-lg">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(itemPrice * item.quantity)}
                      </p>
                      <div className="flex gap-4 justify-end mt-2">
                        <button 
                          onClick={() => handleEditItem(item)}
                          className="text-sm text-[#F5824A] hover:text-[#A03A13] font-bold underline decoration-transparent hover:decoration-[#A03A13] transition"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => removeFromCart(item.tempId)}
                          className="text-sm text-red-500 hover:text-red-700 font-bold underline decoration-transparent hover:decoration-red-700 transition"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Summary */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#254F22]/10 sticky top-24">
          
          {/* Coupon Section */}
          <div className="mb-6">
             <label className={labelStyle}>Cupom de Desconto</label>
             <div className="flex gap-2">
                 <input 
                    type="text" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="INSIRA SEU CÓDIGO"
                    className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm text-[#254F22] uppercase focus:ring-2 focus:ring-[#254F22] focus:border-transparent outline-none shadow-sm"
                 />
                 <button 
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode}
                    className="bg-[#254F22] text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#1a3818] disabled:opacity-50 transition shadow-sm"
                 >
                    {couponLoading ? '...' : 'Aplicar'}
                 </button>
             </div>
             {couponMessage && (
                 <div className={`mt-3 p-3 rounded-lg text-sm font-bold flex items-center gap-2 ${couponMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                     {couponMessage.type === 'success' ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                     ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                     )}
                     {couponMessage.text}
                 </div>
             )}
          </div>

          <div className="space-y-3 mb-6 border-t border-[#254F22]/10 pt-4">
            <div className="flex justify-between text-gray-600 font-medium">
              <span>Subtotal</span>
              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displaySubTotal)}</span>
            </div>
            
            {discountAmount > 0 && (
                <div className="flex justify-between text-[#254F22] font-bold bg-[#254F22]/5 p-2 rounded-lg">
                    <span>Desconto</span>
                    <span>- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discountAmount / 100)}</span>
                </div>
            )}

            <div className="flex justify-between text-2xl font-extrabold text-[#254F22] border-t-2 border-dashed border-[#254F22]/20 pt-4 mt-2">
              <span>Total</span>
              <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalTotal)}</span>
            </div>
          </div>

          <div className="space-y-6">
            
            {/* Address Selection */}
            <div>
                <h4 className="font-bold text-[#254F22] mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Endereço de Entrega
                </h4>
                
                {historyAddresses.length > 0 && (
                    <div className="mb-4 space-y-2">
                        {historyAddresses.map(addr => (
                            <div 
                                key={addr.id}
                                onClick={() => { setUseNewAddress(false); setSelectedAddressId(addr.id); }}
                                className={`p-4 rounded-xl border cursor-pointer transition flex items-center gap-3 ${!useNewAddress && selectedAddressId === addr.id ? 'border-[#F5824A] bg-[#F5824A]/10 ring-1 ring-[#F5824A]' : 'border-gray-200 hover:border-[#F5824A] hover:bg-gray-50'}`}
                            >
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${!useNewAddress && selectedAddressId === addr.id ? 'border-[#F5824A]' : 'border-gray-400'}`}>
                                    {!useNewAddress && selectedAddressId === addr.id && <div className="w-2 h-2 rounded-full bg-[#F5824A]" />}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800 text-sm line-clamp-2">{addr.street}</p>
                                    {/* We don't have separate city/state fields for history items now, so we assume they are inside the string */}
                                </div>
                            </div>
                        ))}
                        
                        <div 
                            onClick={() => setUseNewAddress(true)}
                            className={`p-4 rounded-xl border border-dashed cursor-pointer flex items-center justify-center gap-2 text-sm font-bold transition ${useNewAddress ? 'border-[#254F22] text-[#254F22] bg-[#254F22]/5' : 'border-gray-300 text-gray-500 hover:border-[#254F22] hover:text-[#254F22]'}`}
                        >
                            <span>+ Novo Endereço</span>
                        </div>
                    </div>
                )}

                {/* New Address Form */}
                {useNewAddress && (
                    <div className="space-y-4 animate-fadeIn bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="grid grid-cols-5 gap-3">
                            <div className="col-span-2">
                                <label className={labelStyle}>CEP</label>
                                <input
                                    type="text"
                                    maxLength={9}
                                    value={cep}
                                    onChange={(e) => setCep(e.target.value)}
                                    onBlur={handleBlurCep}
                                    placeholder="00000-000"
                                    className={inputStyle}
                                />
                            </div>
                            <div className="col-span-3 flex items-end pb-3">
                                {loadingCep && <span className="text-xs text-[#F5824A] font-bold animate-pulse">Buscando endereço...</span>}
                            </div>
                        </div>

                        <div>
                            <label className={labelStyle}>Rua</label>
                            <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} className={inputStyle} />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className={labelStyle}>Número</label>
                                <input id="address-number" type="text" value={number} onChange={(e) => setNumber(e.target.value)} className={inputStyle} />
                            </div>
                            <div className="col-span-2">
                                <label className={labelStyle}>Bairro</label>
                                <input type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className={inputStyle} />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-3">
                            <div className="col-span-3">
                                <label className={labelStyle}>Cidade</label>
                                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputStyle} />
                            </div>
                            <div>
                                <label className={labelStyle}>UF</label>
                                <input type="text" value={state} onChange={(e) => setState(e.target.value)} className={inputStyle} />
                            </div>
                        </div>

                        <div>
                            <label className={labelStyle}>Complemento (Opcional)</label>
                            <input type="text" value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Ex: Apto 101" className={inputStyle} />
                        </div>
                    </div>
                )}
            </div>

            <div className="border-t border-[#254F22]/10 pt-4">
              <label className={labelStyle + " mb-3"}>Método de Pagamento</label>
              
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setPaymentMethod('PIX')}
                  className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${
                    paymentMethod === 'PIX' 
                      ? 'border-[#254F22] bg-[#254F22]/10 text-[#254F22] ring-2 ring-[#254F22] shadow-md' 
                      : 'border-gray-200 text-gray-600 hover:border-[#254F22]/50 hover:bg-gray-50'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-bold text-xs">PIX</span>
                </button>
                
                <button
                  onClick={() => setPaymentMethod('CARD')}
                  className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${
                    paymentMethod === 'CARD' 
                      ? 'border-[#254F22] bg-[#254F22]/10 text-[#254F22] ring-2 ring-[#254F22] shadow-md' 
                      : 'border-gray-200 text-gray-600 hover:border-[#254F22]/50 hover:bg-gray-50'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="font-bold text-xs">Cartão</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('CASH')}
                  className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${
                    paymentMethod === 'CASH' 
                      ? 'border-[#A03A13] bg-[#A03A13]/10 text-[#A03A13] ring-2 ring-[#A03A13] shadow-md' 
                      : 'border-gray-200 text-gray-600 hover:border-[#A03A13]/50 hover:bg-gray-50'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="font-bold text-xs">Entrega</span>
                </button>
              </div>

              <div className="mt-4 text-sm text-center bg-[#EDE4C2]/30 p-3 rounded-lg">
                {paymentMethod === 'CASH' ? (
                  <p className="text-[#A03A13] font-bold flex items-center justify-center gap-2">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     Pagamento realizado no momento da entrega.
                  </p>
                ) : (
                  <p className="text-gray-600 flex items-center justify-center gap-2">
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">SECURE</span>
                    Processado via <strong>AbacatePay</strong> 🥑
                  </p>
                )}
              </div>
            </div>

            <button 
              onClick={handleCreateOrder}
              disabled={loading}
              className="w-full bg-[#254F22] text-white font-bold py-4 rounded-xl hover:bg-[#1a3818] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xl flex justify-center items-center gap-3 text-lg mt-4 active:scale-[0.98]"
            >
              {loading ? (
                  <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando...
                  </>
              ) : (paymentMethod === 'CASH' ? `Confirmar Pedido` : `Pagar R$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(finalTotal)}`)}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <ProductModal
         isOpen={!!editingItem}
         product={editingItem?.product || null}
         onClose={() => setEditingItem(null)}
         onConfirm={confirmEditItem}
      />
    </div>
  );
};