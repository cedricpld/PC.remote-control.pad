import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setApiBaseUrl } from '../utils/api';

interface AuthContextType {
  serverUrl: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  setServerConnection: (ip: string, port: string) => Promise<void>;
  checkConnection: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [serverUrl, setServerUrlState] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storedIp = await AsyncStorage.getItem('server_ip');
      const storedPort = await AsyncStorage.getItem('server_port');
      const storedToken = await AsyncStorage.getItem('auth_token');

      if (storedIp && storedPort) {
        const url = `http://${storedIp}:${storedPort}`;
        setServerUrlState(url);
        setApiBaseUrl(url);

        // If we have a token, we assume logged in for now, but valid check would be better
        if (storedToken) {
           setIsAuthenticated(true);
        }
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    } finally {
      setIsLoading(false);
    }
  };

  const setServerConnection = async (ip: string, port: string) => {
    const url = `http://${ip}:${port}`;
    setServerUrlState(url);
    setApiBaseUrl(url);
    await AsyncStorage.setItem('server_ip', ip);
    await AsyncStorage.setItem('server_port', port);
  };

  const login = async (password: string) => {
    if (!serverUrl) return false;
    try {
      const response = await api.post('/api/login', { password });
      if (response.data && response.data.token) {
        await AsyncStorage.setItem('auth_token', response.data.token);
        setIsAuthenticated(true);
        return true;
      }
    } catch (error) {
      console.error("Login failed", error);
    }
    return false;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    setIsAuthenticated(false);
  };

  const checkConnection = async () => {
      if (!serverUrl) return false;
      try {
          await api.get('/api/server-status', { timeout: 2000 });
          return true;
      } catch (e) {
          return false;
      }
  }

  return (
    <AuthContext.Provider value={{
        serverUrl,
        isAuthenticated,
        isLoading,
        login,
        logout,
        setServerConnection,
        checkConnection
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
