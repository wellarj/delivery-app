import { useState, useEffect } from 'react';
import { Product } from '../types';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (product: Product, quantity: number, notes?: string) => void;
}

export const ProductModal = ({ product, isOpen, onClose, onConfirm }: ProductModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setNotes('');
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const displayPrice = (product.price / 100);
  const total = displayPrice * quantity;
  const PLACEHOLDER_IMG = "https://placehold.co/600x400/f3f4f6/a3a3a3?text=Tasty";

  return (
    <div className="fixed inset-0 z-[60] flex justify-center items-end sm:items-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
        
        {/* Modal Content - Bottom Sheet on Mobile, Centered Card on Desktop */}
        <div className="bg-white w-full sm:w-[480px] sm:rounded-2xl rounded-t-2xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-slideUp sm:animate-fadeIn">
            
            {/* Image Header */}
            <div className="relative h-48 sm:h-56 bg-gray-100 flex-shrink-0">
                <img 
                    src={product.image_url || PLACEHOLDER_IMG} 
                    onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
                    className="w-full h-full object-cover"
                    alt={product.name}
                />
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-md text-gray-500 hover:text-gray-900 transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            {/* Content Scrollable */}
            <div className="p-6 overflow-y-auto">
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
                    <span className="text-xl font-semibold text-orange-600">
                         {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayPrice)}
                    </span>
                </div>
                <p className="text-gray-500 leading-relaxed text-sm mb-6">{product.description}</p>

                {/* Notes Input */}
                <div className="mb-6">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Alguma observação?
                    </label>
                    <textarea
                        rows={3}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition outline-none resize-none"
                        placeholder="Ex: Sem cebola, capricha no molho..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-100 bg-white pb-safe">
                <div className="flex items-center gap-4">
                    {/* Qty Stepper */}
                    <div className="flex items-center bg-gray-100 rounded-xl h-12 px-2">
                        <button 
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-8 h-full text-gray-500 hover:text-orange-600 text-xl font-bold disabled:opacity-30"
                            disabled={quantity <= 1}
                        >
                            −
                        </button>
                        <span className="w-8 text-center font-bold text-gray-900">{quantity}</span>
                        <button 
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-8 h-full text-gray-500 hover:text-orange-600 text-xl font-bold"
                        >
                            +
                        </button>
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={() => onConfirm(product, quantity, notes)}
                        className="flex-1 bg-orange-600 text-white font-bold h-12 rounded-xl hover:bg-orange-700 active:scale-95 transition shadow-lg shadow-orange-200 flex justify-between items-center px-6"
                    >
                        <span>Adicionar</span>
                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};