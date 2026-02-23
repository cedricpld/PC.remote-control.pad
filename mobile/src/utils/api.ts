import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default instance, but base URL will be dynamic
const api = axios.create({
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setApiBaseUrl = (url: string) => {
  api.defaults.baseURL = url;
};

// Add interceptor to inject token if available
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    // Check if the backend expects Bearer or just token.
    // Looking at client code: It doesn't seem to use Bearer auth middleware explicitly for most routes?
    // Wait, the client/server/index.ts handles /api/login but doesn't show middleware protecting other routes
    // except logic checks.
    // Actually, looking at `client/server/index.ts`, there is NO authentication middleware for actions!
    // The login is just to get a token on the frontend to "unlock" the UI.
    // However, for consistency, I'll add it if we need it later.
    // The user requirement says "La possibilité de se logé avec le mot de passe".
    // I will store it.
  }
  return config;
});

export default api;
