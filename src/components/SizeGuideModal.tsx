import React, { useState, useEffect } from 'react';
import { X, Ruler, HelpCircle, Check, MessageCircle } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
  productName?: string;
}

type Unit = 'inches' | 'cm';

interface SizeRow {
  size: string;
  brandSize: string;
  bust: [number, number]; // [min, max] in inches
  waist: [number, number];
  hip: [number, number];
  shoulder: number;
  length: number;
}

interface BottomSizeRow {
  size: string;
  brandSize: string;
  waist: [number, number];
  hip: [number, number];
  length: number;
  inseam: number;
}

const KURTI_SIZES: SizeRow[] = [
  { size: 'XS', brandSize: '34', bust: [32, 34], waist: [26, 28], hip: [35, 37], shoulder: 14.0, length: 44 },
  { size: 'S', brandSize: '36', bust: [34, 36], waist: [28, 30], hip: [37, 39], shoulder: 14.5, length: 45 },
  { size: 'M', brandSize: '38', bust: [36, 38], waist: [30, 32], hip: [39, 41], shoulder: 15.0, length: 45 },
  { size: 'L', brandSize: '40', bust: [38, 40], waist: [32, 34], hip: [41, 43], shoulder: 15.5, length: 46 },
  { size: 'XL', brandSize: '42', bust: [40, 42], waist: [34, 36], hip: [43, 45], shoulder: 16.0, length: 46 },
  { size: 'XXL', brandSize: '44', bust: [42, 44], waist: [36, 38], hip: [45, 47], shoulder: 16.5, length: 47 },
  { size: '3XL', brandSize: '46', bust: [44, 46], waist: [38, 40], hip: [47, 49], shoulder: 17.0, length: 47 },
];

const DRESS_SIZES: SizeRow[] = [
  { size: 'XS', brandSize: '34', bust: [32, 33], waist: [25, 27], hip: [34, 36], shoulder: 13.5, length: 48 },
  { size: 'S', brandSize: '36', bust: [34, 35], waist: [27, 29], hip: [36, 38], shoulder: 14.0, length: 49 },
  { size: 'M', brandSize: '38', bust: [36, 37], waist: [29, 31], hip: [38, 40], shoulder: 14.5, length: 50 },
  { size: 'L', brandSize: '40', bust: [38, 40], waist: [31, 33], hip: [40, 42], shoulder: 15.0, length: 51 },
  { size: 'XL', brandSize: '42', bust: [41, 43], waist: [34, 36], hip: [43, 45], shoulder: 15.5, length: 52 },
  { size: 'XXL', brandSize: '44', bust: [44, 46], waist: [37, 39], hip: [46, 48], shoulder: 16.0, length: 52 },
  { size: '3XL', brandSize: '46', bust: [47, 49], waist: [40, 42], hip: [49, 51], shoulder: 16.5, length: 53 },
];

const BOTTOM_SIZES: BottomSizeRow[] = [
  { size: 'XS', brandSize: '26', waist: [25, 27], hip: [34, 36], length: 37, inseam: 27 },
  { size: 'S', brandSize: '28', waist: [27, 29], hip: [36, 38], length: 38, inseam: 27.5 },
  { size: 'M', brandSize: '30', waist: [29, 31], hip: [38, 40], length: 38.5, inseam: 28 },
  { size: 'L', brandSize: '32', waist: [31, 33], hip: [40, 42], length: 39, inseam: 28 },
  { size: 'XL', brandSize: '34', waist: [33, 35], hip: [42, 44], length: 39.5, inseam: 28.5 },
  { size: 'XXL', brandSize: '36', waist: [35, 38], hip: [44, 47], length: 40, inseam: 29 },
  { size: '3XL', brandSize: '38', waist: [38, 41], hip: [47, 50], length: 40.5, inseam: 29 },
];

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  isOpen,
  onClose,
  category = '',
  productName = '',
}) => {
  const [unit, setUnit] = useState<Unit>('inches');
  const [activeTab, setActiveTab] = useState<'kurtis' | 'dresses' | 'bottoms'>('kurtis');

  // Determine initial tab based on product category
  useEffect(() => {
    if (!isOpen) return;
    const cat = category.toLowerCase();
    if (cat.includes('dress') || cat.includes('gown') || cat.includes('frock')) {
      setActiveTab('dresses');
    } else if (cat.includes('pant') || cat.includes('bottom') || cat.includes('trouser') || cat.includes('palazzo')) {
      setActiveTab('bottoms');
    } else {
      setActiveTab('kurtis');
    }
  }, [isOpen, category]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toUnit = (inches: number): string => {
    if (unit === 'cm') {
      return (inches * 2.54).toFixed(1);
    }
    return inches.toString();
  };

  const toRange = (range: [number, number]): string => {
    if (unit === 'cm') {
      const min = (range[0] * 2.54).toFixed(0);
      const max = (range[1] * 2.54).toFixed(0);
      return `${min} - ${max}`;
    }
    return `${range[0]} - ${range[1]}`;
  };

  return (
    <div
      id="size-guide-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="size-guide-modal-card"
        className="bg-white border border-[#E9DFD0] rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#E9DFD0] flex items-start justify-between bg-[#FAF8F4]">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#9A8568] font-semibold">
              <Ruler className="w-4 h-4 text-[#9A8568]" />
              <span>Garment Size Chart</span>
            </div>
            <h2 className="font-editorial text-2xl text-[#292522] mt-1">
              Find Your Perfect Fit
            </h2>
            {productName && (
              <p className="text-xs text-[#766F68] mt-0.5 line-clamp-1">
                Measurements guide for <span className="text-[#292522] font-medium">{productName}</span>
              </p>
            )}
          </div>
          <button
            id="close-size-guide-btn"
            onClick={onClose}
            className="p-1.5 text-[#766F68] hover:text-[#292522] hover:bg-zinc-200/50 rounded-full transition-colors cursor-pointer"
            aria-label="Close size guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Toolbar: Tabs & Unit Toggle */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-[#E9DFD0] flex flex-wrap items-center justify-between gap-3 bg-white">
          {/* Garment Category Tabs */}
          <div className="flex items-center gap-1 bg-[#FAF8F4] p-1 rounded-sm border border-[#E9DFD0]">
            <button
              onClick={() => setActiveTab('kurtis')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xs transition-colors cursor-pointer ${
                activeTab === 'kurtis'
                  ? 'bg-[#292522] text-white shadow-xs'
                  : 'text-[#766F68] hover:text-[#292522]'
              }`}
            >
              Kurtis & Ethnic Tops
            </button>
            <button
              onClick={() => setActiveTab('dresses')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xs transition-colors cursor-pointer ${
                activeTab === 'dresses'
                  ? 'bg-[#292522] text-white shadow-xs'
                  : 'text-[#766F68] hover:text-[#292522]'
              }`}
            >
              Dresses & Gowns
            </button>
            <button
              onClick={() => setActiveTab('bottoms')}
              className={`px-3 py-1.5 text-xs font-medium rounded-xs transition-colors cursor-pointer ${
                activeTab === 'bottoms'
                  ? 'bg-[#292522] text-white shadow-xs'
                  : 'text-[#766F68] hover:text-[#292522]'
              }`}
            >
              Pants & Bottoms
            </button>
          </div>

          {/* Unit Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#766F68] font-medium">Unit:</span>
            <div className="inline-flex rounded-xs border border-[#E9DFD0] bg-[#FAF8F4] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setUnit('inches')}
                className={`px-2.5 py-1 rounded-xs font-semibold cursor-pointer transition-colors ${
                  unit === 'inches'
                    ? 'bg-[#9A8568] text-white shadow-2xs'
                    : 'text-[#766F68] hover:text-[#292522]'
                }`}
              >
                Inches (in)
              </button>
              <button
                type="button"
                onClick={() => setUnit('cm')}
                className={`px-2.5 py-1 rounded-xs font-semibold cursor-pointer transition-colors ${
                  unit === 'cm'
                    ? 'bg-[#9A8568] text-white shadow-2xs'
                    : 'text-[#766F68] hover:text-[#292522]'
                }`}
              >
                Centimeters (cm)
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body: Scrollable Table & Guidelines */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Sizing Table */}
          <div className="overflow-x-auto border border-[#E9DFD0] rounded-md">
            {activeTab !== 'bottoms' ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F4] border-b border-[#E9DFD0] text-[#292522] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-3.5 sm:px-4">Size</th>
                    <th className="py-3 px-3 sm:px-3.5">India/Bust</th>
                    <th className="py-3 px-3 sm:px-3.5">Bust ({unit === 'inches' ? 'in' : 'cm'})</th>
                    <th className="py-3 px-3 sm:px-3.5">Waist ({unit === 'inches' ? 'in' : 'cm'})</th>
                    <th className="py-3 px-3 sm:px-3.5">Hip ({unit === 'inches' ? 'in' : 'cm'})</th>
                    <th className="py-3 px-3 sm:px-3.5">Shoulder ({unit === 'inches' ? 'in' : 'cm'})</th>
                    <th className="py-3 px-3 sm:px-3.5">Length ({unit === 'inches' ? 'in' : 'cm'})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9DFD0]/60 text-[#292522]">
                  {(activeTab === 'kurtis' ? KURTI_SIZES : DRESS_SIZES).map((row, idx) => (
                    <tr
                      key={row.size}
                      className={`hover:bg-[#FAF8F4]/80 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF8F4]/30'
                      }`}
                    >
                      <td className="py-3 px-3.5 sm:px-4 font-bold text-[#292522]">{row.size}</td>
                      <td className="py-3 px-3 sm:px-3.5 font-medium text-[#766F68]">{row.brandSize}</td>
                      <td className="py-3 px-3 sm:px-3.5 font-semibold text-[#9A8568]">{toRange(row.bust)}</td>
                      <td className="py-3 px-3 sm:px-3.5">{toRange(row.waist)}</td>
                      <td className="py-3 px-3 sm:px-3.5">{toRange(row.hip)}</td>
                      <td className="py-3 px-3 sm:px-3.5">{toUnit(row.shoulder)}</td>
                      <td className="py-3 px-3 sm:px-3.5">{toUnit(row.length)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F4] border-b border-[#E9DFD0] text-[#292522] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-3.5 sm:px-4">Size</th>
                    <th className="py-3 px-3 sm:px-3.5">Waist Size</th>
                    <th className="py-3 px-3 sm:px-3.5">Waist ({unit === 'inches' ? 'in' : 'cm'})</th>
                    <th className="py-3 px-3 sm:px-3.5">Hip ({unit === 'inches' ? 'in' : 'cm'})</th>
                    <th className="py-3 px-3 sm:px-3.5">Length ({unit === 'inches' ? 'in' : 'cm'})</th>
                    <th className="py-3 px-3 sm:px-3.5">Inseam ({unit === 'inches' ? 'in' : 'cm'})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9DFD0]/60 text-[#292522]">
                  {BOTTOM_SIZES.map((row, idx) => (
                    <tr
                      key={row.size}
                      className={`hover:bg-[#FAF8F4]/80 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF8F4]/30'
                      }`}
                    >
                      <td className="py-3 px-3.5 sm:px-4 font-bold text-[#292522]">{row.size}</td>
                      <td className="py-3 px-3 sm:px-3.5 font-medium text-[#766F68]">{row.brandSize}</td>
                      <td className="py-3 px-3 sm:px-3.5 font-semibold text-[#9A8568]">{toRange(row.waist)}</td>
                      <td className="py-3 px-3 sm:px-3.5">{toRange(row.hip)}</td>
                      <td className="py-3 px-3 sm:px-3.5">{toUnit(row.length)}</td>
                      <td className="py-3 px-3 sm:px-3.5">{toUnit(row.inseam)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* How to Measure Section */}
          <div className="bg-[#FAF8F4] border border-[#E9DFD0] rounded-md p-4 sm:p-5 space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#292522] flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#9A8568]" />
              <span>How to Measure Accurately</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-[#766F68]">
              <div className="p-2.5 bg-white border border-[#E9DFD0]/60 rounded-xs space-y-1">
                <span className="font-semibold text-[#292522] block">1. Bust / Chest</span>
                <p className="leading-relaxed">
                  Measure around the fullest part of your bust while keeping the tape comfortably level.
                </p>
              </div>
              <div className="p-2.5 bg-white border border-[#E9DFD0]/60 rounded-xs space-y-1">
                <span className="font-semibold text-[#292522] block">2. Natural Waist</span>
                <p className="leading-relaxed">
                  Measure around your natural waistline, typically the narrowest point above your navel.
                </p>
              </div>
              <div className="p-2.5 bg-white border border-[#E9DFD0]/60 rounded-xs space-y-1">
                <span className="font-semibold text-[#292522] block">3. Fullest Hip</span>
                <p className="leading-relaxed">
                  Stand with feet together and measure around the fullest curve of your hips and seat.
                </p>
              </div>
              <div className="p-2.5 bg-white border border-[#E9DFD0]/60 rounded-xs space-y-1">
                <span className="font-semibold text-[#292522] block">4. Garment Length</span>
                <p className="leading-relaxed">
                  Measured straight down from the highest point of the shoulder seam to the bottom hemline.
                </p>
              </div>
            </div>
          </div>

          {/* Fit Recommendations & Tailoring Notice */}
          <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#766F68]">
            <div className="space-y-0.5">
              <span className="font-semibold text-[#292522] block">
                Between sizes or unsure about your fit?
              </span>
              <p>
                We recommend choosing the larger size for regular cottons, or contacting our boutique
                for custom alterations.
              </p>
            </div>
            <a
              href="https://wa.me/919790478436?text=Hello%20House%20Of%20Rehaan,%20I%20need%20assistance%20choosing%20the%20right%20size."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xs font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Stylist</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E9DFD0] flex items-center justify-between bg-[#FAF8F4] text-xs">
          <span className="text-[#766F68]">
            All garments include a 1-inch internal margin for minor adjustments.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#292522] hover:bg-[#9A8568] text-white font-semibold rounded-xs transition-colors cursor-pointer"
          >
            Got it, Close
          </button>
        </div>
      </div>
    </div>
  );
};
