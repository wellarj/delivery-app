import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd }) => {
  const displayPrice = product.price / 100;
  const PLACEHOLDER_IMG = "https://placehold.co/400x300/f3f4f6/a3a3a3?text=Delicious";

  return (
    <div 
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full transform transition hover:-translate-y-1 hover:shadow-md cursor-pointer group"
      onClick={() => onAdd(product)}
    >
      <div className="h-40 sm:h-48 bg-gray-100 relative overflow-hidden">
        <img 
          src={product.image_url || PLACEHOLDER_IMG} 
          onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
            <span className="text-sm font-bold text-gray-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayPrice)}
            </span>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
            <h3 className="text-base font-bold text-gray-800 line-clamp-1">{product.name}</h3>
        </div>
        <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-grow leading-relaxed">{product.description}</p>
        
        <button 
          onClick={(e) => { e.stopPropagation(); onAdd(product); }}
          className="w-full bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 font-semibold py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
          </svg>
          Adicionar
        </button>
      </div>
    </div>
  );
};