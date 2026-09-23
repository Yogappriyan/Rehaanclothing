import React from 'react';
import { Phone, Mail, MapPin, MessageCircle, ArrowUpRight, Heart } from 'lucide-react';
import { Logo } from './Logo';
import type { BusinessSettings } from '../types';

interface FooterProps {
  onNavigate: (route: string, param?: string) => void;
  settings: BusinessSettings;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, settings }) => {
  return (
    <footer id="main-footer" className="bg-[#FAF8F4] border-t border-[#E9DFD0] text-[#292522] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#E9DFD0]">
          {/* Brand Col */}
          <div className="space-y-4">
            <button
              onClick={() => {
                onNavigate('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="cursor-pointer text-left"
            >
              <Logo size="lg" />
            </button>
            <p className="text-sm text-[#766F68] leading-relaxed max-w-sm">
              Thoughtfully selected women's clothing rooted in timeless craftsmanship, comfortable
              fabrics, and graceful silhouettes. Trichy, Tamil Nadu.
            </p>
            {settings.whatsappEnabled && settings.whatsappNumber && (
              <a
                href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(
                  'Hello Rehaan Clothing, I would like to know more about your collection.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-[#25D366]/10 text-[#128C7E] rounded-full hover:bg-[#25D366]/20 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
            )}
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest font-semibold text-[#9A8568]">
              Explore
            </h4>
            <ul className="space-y-2 text-sm text-[#766F68]">
              <li>
                <button
                  onClick={() => onNavigate('shop')}
                  className="hover:text-[#9A8568] transition-colors cursor-pointer"
                >
                  All Collections
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('new-arrivals')}
                  className="hover:text-[#9A8568] transition-colors cursor-pointer"
                >
                  New Arrivals
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('sale')}
                  className="hover:text-[#9A8568] transition-colors cursor-pointer"
                >
                  Sale & Offers
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('about')}
                  className="hover:text-[#9A8568] transition-colors cursor-pointer"
                >
                  Our Boutique Story
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('contact')}
                  className="hover:text-[#9A8568] transition-colors cursor-pointer"
                >
                  Contact & Store Visits
                </button>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest font-semibold text-[#9A8568]">
              Categories
            </h4>
            <ul className="space-y-2 text-sm text-[#766F68]">
              {['Dresses', 'Kurtis', 'Sarees', 'Western Wear', 'Ethnic Wear', 'Co-ord Sets'].map(
                (cat) => (
                  <li key={cat}>
                    <button
                      onClick={() => onNavigate('shop', cat)}
                      className="hover:text-[#9A8568] transition-colors cursor-pointer"
                    >
                      {cat}
                    </button>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Contact & Boutique Info */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest font-semibold text-[#9A8568]">
              Boutique Studio
            </h4>
            <div className="space-y-2.5 text-sm text-[#766F68]">
              <p className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#9A8568] shrink-0 mt-0.5" />
                <span>
                  {settings.address ||
                    'Plot No. 46, 2nd Cross, Sathanur, Trichy – 620102, Tamil Nadu, India'}
                </span>
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#9A8568] shrink-0" />
                <a
                  href={`tel:${settings.phone || '+919790478436'}`}
                  className="hover:text-[#292522] transition-colors font-medium"
                >
                  {settings.phone || '+91 9790478436'}
                </a>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#9A8568] shrink-0" />
                <a
                  href={`mailto:${settings.email || 'houseofrehaan@gmail.com'}`}
                  className="hover:text-[#292522] transition-colors"
                >
                  {settings.email || 'houseofrehaan@gmail.com'}
                </a>
              </p>
              <p className="text-xs text-[#766F68] pt-1">
                Store Hours: {settings.businessHours || 'Mon - Sat: 10:00 AM - 8:30 PM'}
              </p>
              {settings.googleMapsUrl && (
                <a
                  href={settings.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#9A8568] hover:underline pt-1"
                >
                  <span>Get Directions on Google Maps</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#766F68] gap-4">
          <p>© {new Date().getFullYear()} Rehaan Clothing. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <button
              onClick={() => onNavigate('admin')}
              className="hover:text-[#292522] transition-colors cursor-pointer"
            >
              Admin Portal
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="hover:text-[#292522] transition-colors cursor-pointer"
            >
              Help & Support
            </button>
            <span className="flex items-center gap-1 text-[#766F68]">
              Crafted with <Heart className="w-3 h-3 text-[#9A8568] fill-[#9A8568]" /> in Trichy
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
