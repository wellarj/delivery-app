import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { CheckStatusResponse } from '../types';

export const PaymentStatus = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  
  // Get initial data passed from Checkout navigation
  const initialPaymentLink = location.state?.paymentLink;
  
  const [status, setStatus] = useState<string>('pending');
  const [isPolling, setIsPolling] = useState(true);
  const [loadingManual, setLoadingManual] = useState(false);
  
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Start polling on mount
    startPolling();
    return () => stopPolling();
  }, [id]);

  const checkStatus = async () => {
    if (!id) return;
    try {
      // The new endpoint returns { status: 'PAID', billing: '...' } directly
      const response = await api.get<CheckStatusResponse>('', {
        params: { action: 'check_payment_status', order_id: id }
      });
      
      const currentStatus = response.data.status?.toLowerCase();
      
      if (currentStatus) {
        setStatus(currentStatus);
        
        if (currentStatus === 'paid' || currentStatus === 'completed') {
          handlePaymentSuccess();
        } else if (currentStatus === 'cancelled' || currentStatus === 'expired') {
          stopPolling();
        }
      }
    } catch (error) {
      console.error("Polling error", error);
    }
  };

  const startPolling = () => {
    if (pollIntervalRef.current) return;
    // Check immediately then every 5s
    checkStatus();
    pollIntervalRef.current = setInterval(checkStatus, 5000);
    setIsPolling(true);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  };

  const handlePaymentSuccess = () => {
    stopPolling();
    // Clear cart as payment is confirmed
    clearCart();
    // Show success UI handled by render
  };

  const handleManualCheck = async () => {
    setLoadingManual(true);
    await checkStatus();
    setLoadingManual(false);
  };

  const handleOpenPayment = () => {
    if (initialPaymentLink) {
      window.open(initialPaymentLink, '_blank');
    }
  };

  if (status === 'paid' || status === 'completed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fadeIn">
        <div className="bg-green-100 text-green-600 p-6 rounded-full mb-6">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Pagamento Confirmado!</h2>
        <p className="text-gray-600 mb-8 max-w-md">
          Recebemos a confirmação do seu pagamento. Seu pedido #{id} já está sendo preparado.
        </p>
        <button 
          onClick={() => navigate('/orders')}
          className="bg-orange-600 text-white px-8 py-3 rounded-md font-bold hover:bg-orange-700 transition shadow-lg"
        >
          Acompanhar Pedido
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-orange-600 p-6 text-white text-center">
          <h2 className="text-2xl font-bold">Aguardando Pagamento</h2>
          <p className="opacity-90">Pedido #{id}</p>
        </div>
        
        <div className="p-8 flex flex-col items-center text-center space-y-6">
          <div className="animate-pulse bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-600 rounded-full animate-bounce"></span>
            Verificando status: {status.toUpperCase()}
          </div>

          <p className="text-gray-600">
            Clique no botão abaixo para realizar o pagamento seguro via AbacatePay.
            Assim que concluir, esta tela atualizará automaticamente.
          </p>

          {initialPaymentLink ? (
             <button
              onClick={handleOpenPayment}
              className="w-full sm:w-auto bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition shadow-md flex items-center justify-center gap-2"
            >
              <span>Pagar Agora</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              </svg>
            </button>
          ) : (
            <div className="text-red-500 bg-red-50 p-4 rounded-md">
              Link de pagamento não disponível. Tente atualizar ou acesse seus pedidos.
            </div>
          )}

          <div className="w-full border-t border-gray-100 pt-6 mt-2">
            <p className="text-sm text-gray-400 mb-4">Já realizou o pagamento?</p>
            <button 
              onClick={handleManualCheck}
              disabled={loadingManual}
              className="text-orange-600 font-medium hover:text-orange-800 flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
            >
              <svg 
                className={`w-5 h-5 ${loadingManual ? 'animate-spin' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Atualizar Status Manualmente
            </button>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-6">
        <button 
          onClick={() => navigate('/orders')} 
          className="text-gray-500 hover:text-gray-700 text-sm underline"
        >
          Voltar para Meus Pedidos
        </button>
      </div>
    </div>
  );
};