import React, { useState, useMemo } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import type { Product } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onNavigate: (route: string, param?: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchName = p.name?.toLowerCase().includes(q);
      const matchCat = p.category?.toLowerCase().includes(q);
      const matchSub = p.subcategory?.toLowerCase().includes(q);
      const matchFabric = p.fabric?.toLowerCase().includes(q);
      const matchOccasion = p.occasion?.toLowerCase().includes(q);
      const matchPattern = p.pattern?.toLowerCase().includes(q);
      const matchColors = p.colors?.some((c) => c.name.toLowerCase().includes(q));
      return (
        matchName ||
        matchCat ||
        matchSub ||
        matchFabric ||
        matchOccasion ||
        matchPattern ||
        matchColors
      );
    });
  }, [searchQuery, products]);

  if (!isOpen) return null;

  const popularSearches = ['Linen Dress', 'Chanderi Kurti', 'Tissue Saree', 'Co-ord Sets', 'Ethnic Wear'];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#FAF8F4]/98 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-4xl w-full mx-auto px-4 py-8 flex-1 flex flex-col">
        {/* Top bar with close */}
        <div className="flex items-center justify-between pb-6 border-b border-[#E9DFD0]">
          <span className="text-xs uppercase tracking-widest text-[#9A8568] font-semibold">
            Search Rehaan Clothing
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#766F68] hover:text-[#292522] hover:bg-[#E9DFD0]/40 transition-colors cursor-pointer"
            aria-label="Close search"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Input */}
        <div className="relative mt-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[#9A8568]" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by dress, kurti, saree, fabric, occasion..."
            className="w-full pl-14 pr-4 py-4 text-xl sm:text-2xl font-editorial text-[#292522] placeholder:text-[#766F68]/50 bg-transparent border-b-2 border-[#E9DFD0] focus:border-[#9A8568] focus:outline-hidden transition-colors"
          />
        </div>

        {/* Popular Tags */}
        {!searchQuery.trim() && (
          <div className="mt-8">
            <h4 className="text-xs uppercase tracking-wider text-[#766F68] font-medium mb-3">
              Popular Searches
            </h4>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => setSearchQuery(term)}
                  className="px-3.5 py-1.5 text-xs bg-[#E9DFD0]/40 hover:bg-[#9A8568] hover:text-white text-[#292522] rounded-full transition-colors cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="mt-8 flex-1 overflow-y-auto">
          {searchQuery.trim() && filtered.length === 0 ? (
            <div className="py-12 text-center text-[#766F68]">
              <p className="font-editorial text-lg text-[#292522]">
                We couldn't find anything matching your search.
              </p>
              <p className="text-xs mt-1">Try searching for styles like "kurti", "dress", or "saree".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-8">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onClose();
                    onNavigate('product-details', item.slug || item.id);
                  }}
                  className="group flex gap-3.5 p-3 rounded-md border border-[#E9DFD0]/80 bg-white hover:border-[#9A8568] transition-all cursor-pointer shadow-2xs"
                >
                  <img
                    src={item.images?.[0] || item.thumbnail}
                    alt={item.name}
                    className="w-16 h-20 object-cover rounded-xs bg-[#F4EFE6] shrink-0"
                  />
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] uppercase tracking-wider text-[#9A8568]">
                      {item.category}
                    </span>
                    <h5 className="font-editorial text-sm font-medium text-[#292522] line-clamp-1 group-hover:text-[#9A8568] transition-colors">
                      {item.name}
                    </h5>
                    <span className="text-xs font-semibold text-[#292522] mt-1">
                      ₹{(item.salePrice || item.price).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
