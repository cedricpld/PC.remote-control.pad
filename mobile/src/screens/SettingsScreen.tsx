import React from 'react';
import { View, StyleSheet, Text, Switch } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GlassButton } from '../components/ui/GlassButton';
import { GlassView } from '../components/ui/GlassView';
import { LinearGradient } from 'expo-linear-gradient';
import { LogOut, Moon, Sun } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export const SettingsScreen: React.FC = () => {
  const { colors, theme, toggleTheme } = useTheme();
  const { logout, serverUrl } = useAuth();
  const navigation = useNavigation<any>();

  const handleLogout = async () => {
      await logout();
      navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
        <LinearGradient
            colors={[colors.background, '#1e293b']}
            style={StyleSheet.absoluteFill}
        />
        <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        </View>

        <View style={styles.content}>
            <GlassView style={[styles.section, { backgroundColor: colors.surface }]}>
                <View style={styles.row}>
                    <View style={styles.rowContent}>
                        <Text style={[styles.label, { color: colors.text }]}>Dark Mode</Text>
                        <Text style={[styles.sublabel, { color: colors.textSecondary }]}>Toggle app theme</Text>
                    </View>
                    <Switch
                        value={theme === 'dark'}
                        onValueChange={toggleTheme}
                        trackColor={{ false: '#767577', true: colors.accent }}
                        thumbColor="#f4f3f4"
                    />
                </View>
            </GlassView>

            <GlassView style={[styles.section, { backgroundColor: colors.surface, marginTop: 16 }]}>
                <View style={styles.row}>
                    <View style={styles.rowContent}>
                        <Text style={[styles.label, { color: colors.text }]}>Server Connection</Text>
                        <Text style={[styles.sublabel, { color: colors.textSecondary }]}>{serverUrl}</Text>
                    </View>
                </View>
                <GlassButton
                    title="Disconnect"
                    onPress={handleLogout}
                    variant="danger"
                    icon={LogOut}
                    style={{ marginTop: 16 }}
                />
            </GlassView>

             <View style={{ marginTop: 32 }}>
                <GlassButton title="Back" onPress={() => navigation.goBack()} variant="secondary" />
             </View>
        </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
      paddingTop: 60,
      paddingHorizontal: 24,
      marginBottom: 24
  },
  title: {
      fontSize: 32,
      fontWeight: 'bold'
  },
  content: {
      paddingHorizontal: 24
  },
  section: {
      padding: 16,
      borderRadius: 16
  },
  row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
  },
  rowContent: {
      flex: 1
  },
  label: {
      fontSize: 16,
      fontWeight: '600'
  },
  sublabel: {
      fontSize: 12,
      marginTop: 4
  }
});
