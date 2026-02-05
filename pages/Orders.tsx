import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Order, Product, OrderItem } from '../types';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [repeatingOrder, setRepeatingOrder] = useState(false);
  
  const navigate = useNavigate();
  const { addToCart, clearCart } = useCart();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('', { params: { action: 'list_orders' } });
      setOrders(response.data.data || []);
    } catch (error) {
      console.error("Error fetching orders", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDetails = (orderId: number) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };

  // Helper to safely parse items from JSON string or return array
  const getOrderItems = (order: Order): OrderItem[] => {
    if (!order.items) return [];
    if (Array.isArray(order.items)) return order.items;
    try {
        // Handle cases where DB returns escaped string or raw JSON string
        return typeof order.items === 'string' ? JSON.parse(order.items) : [];
    } catch (e) {
        console.error("Failed to parse items for order", order.id, e);
        return [];
    }
  };

  const handleRepeatOrder = async (order: Order) => {
    const items = getOrderItems(order);
    if (!items || items.length === 0) return;
    setRepeatingOrder(true);
    
    try {
        const prodRes = await api.get('', { params: { action: 'list_products' } });
        let currentProducts: Product[] = [];
        if (prodRes.data && Array.isArray(prodRes.data.data)) {
            currentProducts = prodRes.data.data;
        }

        clearCart();
        let unavailableCount = 0;

        for (const item of items) {
            const product = currentProducts.find(p => p.id === item.product_id);
            if (product) {
                addToCart(product, item.quantity, item.notes);
            } else {
                unavailableCount++;
            }
        }

        if (unavailableCount > 0) {
            alert(`${unavailableCount} item(s) deste pedido não estão mais disponíveis e foram removidos.`);
        }

        navigate('/checkout');

    } catch (error) {
        console.error("Error repeating order", error);
        alert("Erro ao repetir pedido. Tente novamente.");
    } finally {
        setRepeatingOrder(false);
    }
  };

  // Helper to determine the "real" status.
  const getEffectiveStatus = (order: Order) => {
    // Backend SQL now joins billings, so order.status might already be the billing status
    // But we keep the check for robustness
    if (order.billing && order.billing.status) {
        return order.billing.status.toLowerCase();
    }
    return order.status ? order.status.toLowerCase() : 'pending';
  };

  const isPaid = (order: Order) => {
    const s = getEffectiveStatus(order);
    return s === 'paid' || s === 'completed' || s === 'approved';
  };

  const isDelivered = (order: Order) => {
    if (!isPaid(order)) return false;
    const diff = Date.now() - new Date(order.created_at).getTime();
    return diff > (3 * 60 * 60 * 1000); // 3 hours assumption
  };

  const getStatusBadge = (order: Order) => {
    const s = getEffectiveStatus(order);

    if (s === 'cancelled' || s === 'expired' || s === 'refunded') {
        return <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-bold uppercase tracking-wide rounded-full bg-red-100 text-red-800">Cancelado</span>;
    }

    if (isDelivered(order)) {
        return <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-bold uppercase tracking-wide rounded-full bg-blue-100 text-blue-800">Entregue</span>;
    }

    if (isPaid(order)) {
        return <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-bold uppercase tracking-wide rounded-full bg-green-100 text-green-800">Confirmado</span>;
    }

    return <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-bold uppercase tracking-wide rounded-full bg-yellow-100 text-yellow-800">Pendente</span>;
  };
  
  const getDeliveryText = (order: Order) => {
    const s = getEffectiveStatus(order);
    
    if (s === 'cancelled' || s === 'expired' || s === 'refunded') return "Pedido cancelado.";
    if (isDelivered(order)) return "Pedido entregue com sucesso.";
    if (!isPaid(order)) return "Aguardando confirmação de pagamento.";

    const date = new Date(order.created_at);
    const minTime = new Date(date.getTime() + 30 * 60000);
    const maxTime = new Date(date.getTime() + 60 * 60000);
    const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return `Previsão: ${formatTime(minTime)} - ${formatTime(maxTime)}`;
  };

  const calculateFinalPrice = (order: Order) => {
    // If discount exists, total usually represents subtotal in DB, so we subtract discount
    return Math.max(0, Number(order.total) - Number(order.discount || 0)) / 100;
  };

  const PLACEHOLDER_IMG = "https://placehold.co/100x100?text=Produto";

  if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#254F22]"></div>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      <h2 className="text-2xl font-bold text-[#254F22] mb-6">Meus Pedidos</h2>
      
      {orders.length === 0 ? (
        <div className="text-center bg-white p-10 rounded-2xl shadow-sm border border-[#254F22]/10">
            <div className="mb-4 text-[#F5824A]/50">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            </div>
            <p className="text-gray-500 mb-6">Você ainda não fez nenhum pedido no Manuelita.</p>
            <button onClick={() => navigate('/')} className="bg-[#254F22] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#1a3818] transition">
                Fazer meu primeiro pedido
            </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
             const items = getOrderItems(order);
             const finalPrice = calculateFinalPrice(order);
             // Ensure strict number checking for discount
             const discountVal = Number(order.discount || 0);
             const hasDiscount = discountVal > 0;
             const grossTotal = Number(order.total) / 100;

             return (
                <div key={order.id} className="bg-white shadow-sm rounded-2xl border border-[#254F22]/10 overflow-hidden transition-all duration-300">
                <div 
                    className="px-6 py-5 cursor-pointer bg-white hover:bg-gray-50 transition"
                    onClick={() => handleToggleDetails(order.id)}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#254F22]/10 rounded-full flex items-center justify-center text-[#254F22] font-bold text-sm">
                                #{order.id}
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-medium">
                                    {new Date(order.created_at).toLocaleDateString()} • {new Date(order.created_at).toLocaleTimeString().slice(0,5)}
                                </p>
                                {getStatusBadge(order)}
                            </div>
                        </div>

                        <div className="text-right">
                             {hasDiscount && (
                                <span className="text-xs font-medium text-red-400 line-through block">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(grossTotal)}
                                </span>
                            )}
                            <span className={`font-bold text-lg ${hasDiscount ? 'text-green-700' : 'text-gray-900'}`}>
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalPrice)}
                            </span>
                        </div>
                    </div>

                    {/* Quick Item Summary in List View */}
                    <div className="mt-2 text-sm text-gray-600 line-clamp-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                        {items.length > 0 ? (
                            items.map(i => `${i.quantity}x ${i.product_name || i.name || 'Item'}`).join(', ')
                        ) : (
                            <span className="italic text-gray-400">Ver detalhes do pedido...</span>
                        )}
                    </div>
                    
                    <div className="flex justify-center mt-2">
                         <div className={`transition-transform duration-300 ${expandedOrderId === order.id ? 'rotate-180 text-[#254F22]' : 'text-gray-300'}`}>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
                
                {expandedOrderId === order.id && (
                    <div className="p-0 border-t border-gray-100 animate-fadeIn">
                        {/* Delivery Status Bar */}
                        <div className={`px-6 py-4 flex items-center gap-3 ${isDelivered(order) ? 'bg-blue-50 text-blue-800' : isPaid(order) ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-semibold text-sm">
                                {getDeliveryText(order)}
                            </span>
                        </div>

                        <div className="p-6 bg-gray-50 space-y-6">
                            <div className="space-y-4">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-start text-sm bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                                        <div className="flex items-start gap-3">
                                            {/* We use a generic image placeholder if item specific image isn't available in JSON */}
                                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                                            <img 
                                                src={item.image_url || PLACEHOLDER_IMG} 
                                                onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
                                                alt={item.product_name || item.name} 
                                                className="w-full h-full object-cover" 
                                            />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{item.quantity}x {item.product_name || item.name}</p>
                                                {item.notes && <p className="text-xs text-gray-500 italic mt-0.5 bg-gray-50 px-2 py-1 rounded inline-block">"{item.notes}"</p>}
                                                {/* Display options if available */}
                                                {item.options && Array.isArray(item.options) && item.options.length > 0 && (
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        {item.options.map((opt: any) => opt.name || 'Opção Extra').join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-gray-700 font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price / 100)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-white p-4 rounded-xl border border-gray-100">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Observações</p>
                                    <p className="text-gray-700">{order.notes || 'Nenhuma observação no pedido.'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Pagamento</p>
                                    <p className="text-gray-700 font-medium mb-3">
                                        {order.payment_method === 'CARD' ? 'Cartão de Crédito' : order.payment_method === 'CASH' ? 'Dinheiro / Entrega' : 'PIX'}
                                        {isPaid(order) && <span className="text-green-600 ml-2 font-bold">✓ Pago</span>}
                                    </p>
                                    
                                    {/* Detailed Price Breakdown */}
                                    <div className="space-y-2 mb-4 border-t border-gray-100 pt-3">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Subtotal:</span>
                                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(grossTotal)}</span>
                                        </div>
                                        
                                        {hasDiscount && (
                                            <div className="flex justify-between text-green-700 font-medium bg-green-50 px-2 py-1 rounded">
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                                                    Cupom {order.coupon_code && <span className="uppercase font-bold">({order.coupon_code})</span>}
                                                </span>
                                                <span>- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discountVal / 100)}</span>
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between items-end pt-3 mt-1 border-t border-dashed border-gray-300">
                                            <span className="font-bold text-gray-800">Total Pago:</span>
                                            <div className="flex flex-col items-end">
                                                <span className="text-xl font-extrabold text-[#254F22]">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalPrice)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => handleRepeatOrder(order)}
                                        disabled={repeatingOrder}
                                        className="w-full bg-[#F5824A] text-white py-3 rounded-xl font-bold hover:bg-[#A03A13] transition shadow-md disabled:opacity-50 active:scale-95"
                                    >
                                        {repeatingOrder ? 'Verificando...' : 'Repetir Pedido'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                </div>
             );
          })}
        </div>
      )}
    </div>
  );
};