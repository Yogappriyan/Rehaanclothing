import type { Category } from '../types';

export const SAMPLE_CATEGORIES: Omit<Category, 'id'>[] = [
  {
    name: 'Kurtis & Tunics',
    slug: 'kurtis-tunics',
    description: 'Everyday elegance and artisanal Chikankari, Chanderi, and Mulmul cotton tunics.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    active: true,
    displayOrder: 1,
  },
  {
    name: 'Handcrafted Sarees',
    slug: 'handcrafted-sarees',
    description: 'Timeless weaves in Organza, Chiffon, Georgette, and festive Banarasi silks.',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
    active: true,
    displayOrder: 2,
  },
  {
    name: 'Designer Dresses',
    slug: 'designer-dresses',
    description: 'Contemporary tiered midis, flowing maxis, wrap dresses, and breezy linen styles.',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80',
    active: true,
    displayOrder: 3,
  },
  {
    name: 'Co-ord Sets',
    slug: 'co-ord-sets',
    description: 'Effortlessly polished tailored two-piece trouser sets, kaftans, and relaxed linen suits.',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
    active: true,
    displayOrder: 4,
  },
  {
    name: 'Western & Fusion',
    slug: 'western-fusion',
    description: 'Modern silhouettes blending structured Western cuts with rich Indian craftsmanship.',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    active: true,
    displayOrder: 5,
  },
];
