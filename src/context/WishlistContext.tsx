import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import type { Product } from '../types';

interface WishlistContextType {
  wishlist: string[]; // product IDs
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
const WISHLIST_STORAGE_KEY = 'rehaanClothing_wishlist';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync with Firestore if logged in
  useEffect(() => {
    if (!user) return;

    const loadUserWishlist = async () => {
      try {
        const userWishlistRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userWishlistRef);
        if (snap.exists() && snap.data().wishlist) {
          const cloudWishlist = snap.data().wishlist as string[];
          // Merge local and cloud
          const merged = Array.from(new Set([...wishlist, ...cloudWishlist]));
          setWishlist(merged);
          localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(merged));
          await setDoc(userWishlistRef, { wishlist: merged }, { merge: true });
        } else if (wishlist.length > 0) {
          await setDoc(userWishlistRef, { wishlist }, { merge: true });
        }
      } catch (e) {
        console.warn('Sync wishlist error:', e);
      }
    };

    loadUserWishlist();
  }, [user]);

  // Persist to local storage and Firestore on updates
  const updateWishlistState = async (newWishlist: string[]) => {
    setWishlist(newWishlist);
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(newWishlist));
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { wishlist: newWishlist }, { merge: true });
      }
    } catch (e) {
      console.warn('Wishlist persist error:', e);
    }
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const toggleWishlist = (productId: string) => {
    if (isInWishlist(productId)) {
      updateWishlistState(wishlist.filter((id) => id !== productId));
    } else {
      updateWishlistState([...wishlist, productId]);
    }
  };

  const removeFromWishlist = (productId: string) => {
    updateWishlistState(wishlist.filter((id) => id !== productId));
  };

  const clearWishlist = () => {
    updateWishlistState([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
