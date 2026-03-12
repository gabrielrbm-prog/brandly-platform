import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0A0A0A' },
        headerTintColor: '#FFFFFF',
        tabBarStyle: {
          backgroundColor: '#0A0A0A',
          borderTopColor: '#1A1A1A',
        },
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#6B7280',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="brands"
        options={{
          title: 'Marcas',
          tabBarIcon: ({ color, size }) => (
            <Feather name="briefcase" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="videos"
        options={{
          title: 'Videos',
          tabBarIcon: ({ color, size }) => (
            <Feather name="video" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ color, size }) => (
            <Feather name="bar-chart-2" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="financial"
        options={{
          title: 'Financeiro',
          tabBarIcon: ({ color, size }) => (
            <Feather name="dollar-sign" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
