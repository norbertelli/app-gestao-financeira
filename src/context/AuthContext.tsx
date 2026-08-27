import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import {
  auth,
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  loginAsAdmin,
  logoutUser,
  onAuthChange,
  saveUserProfile,
  testConnection,
} from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isCloudSynced: boolean;
  isAdmin: boolean;
  userRole: 'admin' | 'user';
  lastSyncAt: Date | null;
  deviceId: string;
  login: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>;
  loginAsAdmin: (username?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  triggerSyncNotification: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(new Date());
  const [deviceId] = useState(() => {
    const existing = localStorage.getItem('finflow_device_id');
    if (existing) return existing;
    const generated = `dev_${Math.random().toString(36).substring(2, 9)}_${navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'}`;
    localStorage.setItem('finflow_device_id', generated);
    return generated;
  });

  useEffect(() => {
    // Run connection test
    testConnection();

    const unsubscribe = onAuthChange(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const isUserAdmin =
          currentUser.email === 'admin@finflow.app' ||
          currentUser.displayName === 'Administrador Master' ||
          localStorage.getItem('finflow_admin_mode') === 'true';
        setIsAdmin(isUserAdmin);

        try {
          await saveUserProfile(currentUser, isUserAdmin ? 'admin' : 'user');
        } catch (err) {
          console.error('Error saving profile:', err);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
      setLastSyncAt(new Date());
    });

    return () => unsubscribe();
  }, []);

  const handleLoginWithGoogle = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('finflow_admin_mode');
      const loggedUser = await loginWithGoogle();
      if (loggedUser) {
        await saveUserProfile(loggedUser, 'user');
      }
    } catch (err) {
      console.error('Failed to log in with Google:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      localStorage.removeItem('finflow_admin_mode');
      const loggedUser = await loginWithEmail(email, pass);
      if (loggedUser) {
        await saveUserProfile(loggedUser, 'user');
      }
    } catch (err) {
      console.error('Failed to log in with Email:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterWithEmail = async (email: string, pass: string, displayName?: string) => {
    setLoading(true);
    try {
      localStorage.removeItem('finflow_admin_mode');
      const loggedUser = await registerWithEmail(email, pass, displayName);
      if (loggedUser) {
        await saveUserProfile(loggedUser, 'user');
      }
    } catch (err) {
      console.error('Failed to register:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLoginAsAdmin = async (userParam?: string, passParam?: string) => {
    setLoading(true);
    try {
      localStorage.setItem('finflow_admin_mode', 'true');
      const adminUser = await loginAsAdmin(userParam, passParam);
      if (adminUser) {
        setIsAdmin(true);
        await saveUserProfile(adminUser, 'admin');
      }
    } catch (err) {
      console.error('Failed to log in as admin:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('finflow_admin_mode');
      await logoutUser();
      setIsAdmin(false);
    } catch (err) {
      console.error('Failed to log out:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerSyncNotification = () => {
    setLastSyncAt(new Date());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isCloudSynced: !!user,
        isAdmin,
        userRole: isAdmin ? 'admin' : 'user',
        lastSyncAt,
        deviceId,
        login: handleLoginWithGoogle,
        loginWithGoogle: handleLoginWithGoogle,
        loginWithEmail: handleLoginWithEmail,
        registerWithEmail: handleRegisterWithEmail,
        loginAsAdmin: handleLoginAsAdmin,
        logout,
        triggerSyncNotification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
