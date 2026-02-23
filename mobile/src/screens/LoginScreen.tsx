import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { GlassInput } from '../components/ui/GlassInput';
import { GlassButton } from '../components/ui/GlassButton';
import { useTheme } from '../context/ThemeContext';
import { Lock, Server, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const LoginScreen: React.FC = () => {
  const { login, setServerConnection, isLoading } = useAuth();
  const { colors } = useTheme();

  const [ip, setIp] = useState('');
  const [port, setPort] = useState('3000');
  const [password, setPassword] = useState('');
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    if (!ip || !port || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setConnecting(true);
    try {
      await setServerConnection(ip, port);
      const success = await login(password);
      if (!success) {
        Alert.alert("Login Failed", "Check IP, Port, or Password.");
      }
      // If success, AuthContext updates isAuthenticated, triggering AppNavigator to switch screens automatically.
    } catch (e) {
      Alert.alert("Error", "Failed to connect.");
    } finally {
      setConnecting(false);
    }
  };

  if (isLoading) {
      return (
          <View style={[styles.container, { backgroundColor: colors.background }]}>
              <Text style={{ color: colors.text }}>Loading...</Text>
          </View>
      );
  }

  return (
    <View style={styles.container}>
        <LinearGradient
            colors={[colors.background, '#1e293b']}
            style={StyleSheet.absoluteFill}
        />
        <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>Control Pad</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Remote Access Client</Text>

            <View style={styles.form}>
                <GlassInput
                    label="Server IP"
                    placeholder="192.168.1.x"
                    value={ip}
                    onChangeText={setIp}
                    icon={Server}
                    autoCapitalize="none"
                    keyboardType="numeric"
                />

                <GlassInput
                    label="Port"
                    placeholder="3000"
                    value={port}
                    onChangeText={setPort}
                    icon={Server}
                    keyboardType="numeric"
                />

                <GlassInput
                    label="Password"
                    placeholder="••••••"
                    value={password}
                    onChangeText={setPassword}
                    icon={Lock}
                    secureTextEntry
                />

                <GlassButton
                    title="Connect"
                    onPress={handleConnect}
                    loading={connecting}
                    icon={ArrowRight}
                    style={{ marginTop: 20 }}
                />
            </View>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
      width: '100%',
      maxWidth: 400,
      padding: 24
  },
  title: {
      fontSize: 32,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8
  },
  subtitle: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 40
  },
  form: {
      gap: 16
  }
});
