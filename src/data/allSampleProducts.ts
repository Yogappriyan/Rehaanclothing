import { SAMPLE_CATEGORIES } from './categoriesData';
import { KURTIS_PRODUCTS } from './kurtisProducts';
import { SAREES_PRODUCTS } from './sareesProducts';
import { DRESSES_PRODUCTS } from './dressesProducts';
import { COORDS_PRODUCTS } from './coordsProducts';
import { WESTERN_PRODUCTS } from './westernProducts';
import type { Product, Category } from '../types';

export { SAMPLE_CATEGORIES };
export { KURTIS_PRODUCTS, SAREES_PRODUCTS, DRESSES_PRODUCTS, COORDS_PRODUCTS, WESTERN_PRODUCTS };

export const ALL_SAMPLE_PRODUCTS: Omit<Product, 'id'>[] = [
  ...KURTIS_PRODUCTS,
  ...SAREES_PRODUCTS,
  ...DRESSES_PRODUCTS,
  ...COORDS_PRODUCTS,
  ...WESTERN_PRODUCTS,
];
