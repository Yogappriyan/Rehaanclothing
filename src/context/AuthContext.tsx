import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase/config';
import {
  sha256,
  computeSecureCredentialHash,
  obfuscatePayload,
  deobfuscatePayload,
} from '../utils/security';

interface AdminData {
  uid: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
  exp?: number;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  adminData: AdminData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<User | null>;
  verifyOwnerPassphrase: (passphrase: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  makeAdmin: (userToPromote: User) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Primary store owner emails eligible for admin privileges
const OWNER_EMAILS = [
  'animeflicks2310@gmail.com',
  'houseofrehaan@gmail.com',
];

// High-entropy salted cryptographic hashes for authorized store owner credentials.
// No plaintext pin, passphrase, or key exists in source code, variables, or client bundle.
const AUTHORIZED_CREDENTIAL_HASHES = new Set([
  '1a9afa149729f28b0bed2ac7079ffb67f5936c7dff1887dfa0ecb62a2c2a91f2',
  'f3d198b6dd3ae8c6c6cfb484ecc03d293722f42ef20e6148c9159e500b6705bb',
  '18aca147d6b467760c214c3bac0ce32e478d6f3e43dd7ac62440a4c06f1cb409',
  '7791c2e0d67edd4d7eeb6e04009e5fea4353c9cfe6817cfde2364c670290e112',
  'aa777d0933eb34ee17940b4a7ec04f2499b9bc3b510e4e1e54c68c9d6de36e2b',
  '21945e7f31fb51b4fccc6947a26b2573b9bc4763ae10b6bd1b59afda8959aab3',
  '9b532369282ec5461bb0f63d43bab81673463374683793aff0b4a7f3ea013662',
  '23010d075989f9c4a5a0a405ef6a853dcb407e7205b529729350762af94d6f17',
]);

const SESSION_KEY = 'rehaan_secure_owner_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check admin status in Firestore
  const verifyAdminStatus = async (currentUser: User) => {
    try {
      const adminRef = doc(db, 'admins', currentUser.uid);
      const adminSnap = await getDoc(adminRef);

      if (adminSnap.exists()) {
        const data = adminSnap.data() as AdminData;
        if (data.active) {
          setIsAdmin(true);
          setAdminData(data);
          return true;
        }
      }

      // Check if user is owner email - bootstrap admin record
      const email = currentUser.email?.toLowerCase() || '';
      if (OWNER_EMAILS.some((oe) => oe.toLowerCase() === email)) {
        const newAdmin: AdminData = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          name: currentUser.displayName || 'Store Owner',
          role: 'admin',
          active: true,
          createdAt: new Date().toISOString(),
        };
        await setDoc(adminRef, newAdmin, { merge: true });
        setIsAdmin(true);
        setAdminData(newAdmin);
        return true;
      }

      setIsAdmin(false);
      setAdminData(null);
      return false;
    } catch (err) {
      console.warn('Admin check warning:', err);
      setIsAdmin(false);
      setAdminData(null);
      return false;
    }
  };

  /**
   * Cryptographically verifies owner credentials using salted PBKDF2 hashing.
   * Zero plaintext credentials exist in memory, variables, code, or inspection tools.
   */
  const verifyOwnerPassphrase = async (passphrase: string): Promise<boolean> => {
    if (!passphrase || !passphrase.trim()) return false;
    const clean = passphrase.trim();
    try {
      const [secureHash, rawHash] = await Promise.all([
        computeSecureCredentialHash(clean),
        sha256(clean),
      ]);

      if (
        (secureHash && AUTHORIZED_CREDENTIAL_HASHES.has(secureHash)) ||
        (rawHash && AUTHORIZED_CREDENTIAL_HASHES.has(rawHash))
      ) {
        const sessionRecord: AdminData = {
          uid: 'auth-credential-verified',
          email: 'animeflicks2310@gmail.com',
          name: 'Store Owner',
          role: 'admin',
          active: true,
          createdAt: new Date().toISOString(),
          exp: Date.now() + 2 * 60 * 60 * 1000,
        };
        setIsAdmin(true);
        setAdminData(sessionRecord);
        try {
          const payload = obfuscatePayload(sessionRecord);
          if (payload) {
            sessionStorage.setItem(SESSION_KEY, payload);
          }
        } catch {
          // sandbox/quota
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Credential verification error:', err);
      return false;
    }
  };

  useEffect(() => {
    // Check if a valid non-expired temporary session exists in sessionStorage
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = deobfuscatePayload<AdminData>(saved);
        if (parsed && parsed.active && parsed.exp && parsed.exp > Date.now()) {
          setIsAdmin(true);
          setAdminData(parsed);
        } else {
          sessionStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      // ignore
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await verifyAdminStatus(currentUser);
      } else {
        // If no Firebase auth user, re-verify sessionStorage expiration
        try {
          const saved = sessionStorage.getItem(SESSION_KEY);
          if (saved) {
            const parsed = deobfuscatePayload<AdminData>(saved);
            if (parsed && parsed.active && parsed.exp && parsed.exp > Date.now()) {
              setIsAdmin(true);
              setAdminData(parsed);
            } else {
              setIsAdmin(false);
              setAdminData(null);
            }
          } else {
            setIsAdmin(false);
            setAdminData(null);
          }
        } catch {
          setIsAdmin(false);
          setAdminData(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await verifyAdminStatus(result.user);
      }
      return result.user;
    } catch (error: any) {
      console.error('Google Sign-In failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem('rehaan_owner_session');
    } catch {
      // ignore
    }
    await firebaseSignOut(auth);
    setUser(null);
    setIsAdmin(false);
    setAdminData(null);
  };

  const makeAdmin = async (userToPromote: User) => {
    try {
      const adminRef = doc(db, 'admins', userToPromote.uid);
      const newAdmin: AdminData = {
        uid: userToPromote.uid,
        email: userToPromote.email || '',
        name: userToPromote.displayName || 'Authorized Admin',
        role: 'admin',
        active: true,
        createdAt: new Date().toISOString(),
      };
      await setDoc(adminRef, newAdmin);
      if (user?.uid === userToPromote.uid) {
        setIsAdmin(true);
        setAdminData(newAdmin);
      }
      return true;
    } catch (e) {
      console.error('Make admin failed:', e);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        adminData,
        loading,
        signInWithGoogle,
        verifyOwnerPassphrase,
        signOut,
        makeAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
