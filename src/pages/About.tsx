import React from 'react';
import { MapPin, Phone, Mail, Sparkles, Heart, ShieldCheck } from 'lucide-react';
import type { BusinessSettings } from '../types';

interface AboutProps {
  settings: BusinessSettings;
  onNavigate: (route: string) => void;
}

export const About: React.FC<AboutProps> = ({ settings, onNavigate }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4">
        <span className="text-xs uppercase tracking-widest text-[#9A8568] font-semibold">
          Our Heritage & Passion
        </span>
        <h1 className="font-editorial text-4xl sm:text-5xl text-[#292522] font-normal">
          The Story of House Of Rehaan
        </h1>
        <p className="text-base text-[#766F68] max-w-2xl mx-auto font-light leading-relaxed">
          Rooted in the historic city of Tiruchirappalli (Trichy), Tamil Nadu, House Of Rehaan is a women's
          fashion house born out of an appreciation for authentic textiles, modern tailoring, and everyday grace.
        </p>
      </div>

      {/* Visual Story image */}
      <div className="aspect-16/9 rounded-md overflow-hidden bg-[#F4EFE6] border border-[#E9DFD0] shadow-sm">
        <img
          src="/lookbook-banner.jpg"
          alt="House Of Rehaan Craftsmanship"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Brand Philosophy Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 bg-white border border-[#E9DFD0] rounded-md space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#E9DFD0]/40 flex items-center justify-center text-[#9A8568]">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-editorial text-xl text-[#292522]">Curated Distinctiveness</h3>
          <p className="text-xs text-[#766F68] leading-relaxed">
            We avoid mass, impersonal production. Every collection at House Of Rehaan is hand-selected in small,
            deliberate batches to ensure exceptional drape, texture, and lasting charm.
          </p>
        </div>

        <div className="p-6 bg-white border border-[#E9DFD0] rounded-md space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#E9DFD0]/40 flex items-center justify-center text-[#9A8568]">
            <Heart className="w-5 h-5" />
          </div>
          <h3 className="font-editorial text-xl text-[#292522]">Tradition Meets Contemporary</h3>
          <p className="text-xs text-[#766F68] leading-relaxed">
            From fluid chanderi and breathable mulmul cotton to structured co-ord sets and modern ethnic
            silhouettes, our designs celebrate women across every walk of life.
          </p>
        </div>

        <div className="p-6 bg-white border border-[#E9DFD0] rounded-md space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#E9DFD0]/40 flex items-center justify-center text-[#9A8568]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-editorial text-xl text-[#292522]">Trichy Boutique Care</h3>
          <p className="text-xs text-[#766F68] leading-relaxed">
            Every garment shipped across India undergoes thorough in-house inspection, ensuring that every stitch
            and finish reflects our boutique standards.
          </p>
        </div>
      </div>

      {/* Location & Visiting Us */}
      <div className="bg-[#F6F1EA] p-8 sm:p-12 rounded-md border border-[#E9DFD0] space-y-6">
        <div className="max-w-xl space-y-3">
          <span className="text-xs uppercase tracking-widest text-[#9A8568] font-semibold">
            Visit Our Boutique
          </span>
          <h2 className="font-editorial text-2xl sm:text-3xl text-[#292522]">
            House Of Rehaan Studio in Trichy
          </h2>
          <p className="text-xs sm:text-sm text-[#766F68] leading-relaxed">
            We warmly welcome you to visit our store to experience fabrics, try sizes, or discuss customized fits
            directly with our styling team.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-[#E9DFD0] text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-semibold text-[#292522]">
              <MapPin className="w-4 h-4 text-[#9A8568]" />
              <span>Studio Address</span>
            </div>
            <a
              href={settings.googleMapsUrl || 'https://maps.app.goo.gl/mLggnqsck5AnXRRN6'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#766F68] hover:text-[#292522] hover:underline leading-relaxed block"
              title="View on Google Maps"
            >
              Plot No. 46, 2nd Cross,<br />
              Kailash Nagar, Kattur,<br />
              Trichy – 620019, Tamil Nadu, India
            </a>
            <a
              href={settings.googleMapsUrl || 'https://maps.app.goo.gl/mLggnqsck5AnXRRN6'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#9A8568] hover:text-[#292522] hover:underline text-[11px] font-semibold inline-flex items-center gap-1 pt-1"
            >
              <span>Get Directions on Google Maps →</span>
            </a>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 font-semibold text-[#292522]">
              <Phone className="w-4 h-4 text-[#9A8568]" />
              <span>Boutique Phone</span>
            </div>
            <p className="text-[#766F68]">+91 9790478436</p>
            <p className="text-[#766F68]">Available Mon - Sat, 10 AM - 8 PM IST</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 font-semibold text-[#292522]">
              <Mail className="w-4 h-4 text-[#9A8568]" />
              <span>Official Email</span>
            </div>
            <p className="text-[#766F68]">houseofrehaan@gmail.com</p>
            <p className="text-[#766F68]">animeflicks2310@gmail.com</p>
          </div>
        </div>

        <div className="pt-2 flex gap-4">
          <button
            onClick={() => onNavigate('shop')}
            className="px-6 py-3 bg-[#292522] hover:bg-[#9A8568] text-white text-xs font-semibold uppercase tracking-widest rounded-xs transition-colors cursor-pointer"
          >
            Explore Collection
          </button>
          <button
            onClick={() => onNavigate('contact')}
            className="px-6 py-3 border border-[#E9DFD0] text-[#292522] text-xs font-semibold uppercase tracking-widest rounded-xs hover:bg-white transition-colors cursor-pointer"
          >
            Contact Team
          </button>
        </div>
      </div>
    </div>
  );
};
