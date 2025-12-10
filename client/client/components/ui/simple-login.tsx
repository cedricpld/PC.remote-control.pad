import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound } from 'lucide-react';

interface SimpleLoginProps {
  onLogin: (password?: string) => void;
  error?: string | null;
}

export const SimpleLoginPage: React.FC<SimpleLoginProps> = ({ onLogin, error }) => {
  const [password, setPassword] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(password);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <KeyRound className="mx-auto h-12 w-12 mb-4 text-primary" />
          <CardTitle className="text-2xl">Accès Sécurisé</CardTitle>
          <CardDescription>
            Veuillez entrer le mot de passe pour accéder au Control Pad.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">Déverrouiller</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};