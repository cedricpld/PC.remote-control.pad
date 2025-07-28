import * as React from 'react';
import { SimpleLoginPage } from '@/components/ui/simple-login';

const SESSION_KEY = 'control-pad-auth-token';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Check if the auth token exists in the browser's session storage
  const [isAuthenticated, setIsAuthenticated] = React.useState(!!sessionStorage.getItem(SESSION_KEY));
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = async (password?: string) => {
    setError(null);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const data = await response.json();
        // If login is successful, store the token and set authenticated to true
        sessionStorage.setItem(SESSION_KEY, data.token);
        setIsAuthenticated(true);
      } else {
        setError('Mot de passe incorrect.');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur.');
    }
  };

  // If authenticated, render the children (your StreamDeck page)
  // Otherwise, render the login page
  return isAuthenticated ? children : <SimpleLoginPage onLogin={handleLogin} error={error} />;
};