import { useEffect } from 'react';
import { StreamDeck } from "@/components/stream-deck";
import { fetchWithAuth } from '@/utils/api'; // Assurez-vous que le chemin est correct

export default function Index() {
  // Fonction pour récupérer la configuration
  const fetchConfig = async () => {
    try {
      console.log('Tentative de récupération de la configuration côté client');
      const response = await fetchWithAuth('/api/config');
      const data = await response.json();
      console.log('Configuration reçue côté client :', data);
      // Vous pouvez traiter les données de configuration ici, par exemple en les passant à StreamDeck
    } catch (error) {
      console.error("Erreur lors de la récupération de la configuration côté client :", error);
    }
  };

  // Utilisez useEffect pour appeler fetchConfig après l'authentification
  useEffect(() => {
    // Remplacez cette condition par la logique d'authentification appropriée
    const isAuthenticated = !!sessionStorage.getItem('control-pad-auth-token');
    if (isAuthenticated) {
      fetchConfig();
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <StreamDeck />
    </div>
  );
}
