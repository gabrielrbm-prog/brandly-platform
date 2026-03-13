import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Platform, View, Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { borderRadius, fontSize, fontWeight, spacing } from '@/lib/theme';

export default function TabLayout() {
  const { colors, colorAlpha } = useTheme();

  return (
    <Tabs
      screenOptions={{
        // Header estilo premium
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colorAlpha.primary15,
        } as any,
        headerTintColor: colors.text,
        headerTitleStyle: {
          color: colors.primary,
          fontWeight: fontWeight.bold,
          fontSize: fontSize.lg,
          letterSpacing: 0.5,
        },
        // Tab bar com visual polido
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colorAlpha.primary20,
          height: Platform.OS === 'ios' ? 82 : 64,
          paddingTop: spacing.xs,
          paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
          // Sombra sutil para profundidade
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 12,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Brandly',
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Text style={{ color: colors.primary, fontSize: fontSize.lg, fontWeight: fontWeight.bold, letterSpacing: 0.5 }}>
                Brandly
              </Text>
            </View>
          ),
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, paddingTop: spacing.xs, borderRadius: borderRadius.md, minWidth: 44 },
              focused && { backgroundColor: colorAlpha.primary10 },
            ]}>
              <Feather name="home" size={20} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 3 }} />}
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ fontSize: 10, fontWeight: focused ? fontWeight.semibold : fontWeight.normal, color: focused ? colors.primary : colors.textMuted, marginTop: 2 }}>
              Inicio
            </Text>
          ),
          tabBarShowLabel: true,
        }}
      />
      <Tabs.Screen
        name="videos"
        options={{
          title: 'Videos',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, paddingTop: spacing.xs, borderRadius: borderRadius.md, minWidth: 44 },
              focused && { backgroundColor: colorAlpha.primary10 },
            ]}>
              <Feather name="video" size={20} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 3 }} />}
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ fontSize: 10, fontWeight: focused ? fontWeight.semibold : fontWeight.normal, color: focused ? colors.primary : colors.textMuted, marginTop: 2 }}>
              Videos
            </Text>
          ),
          tabBarShowLabel: true,
        }}
      />
      <Tabs.Screen
        name="network"
        options={{
          title: 'Rede',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, paddingTop: spacing.xs, borderRadius: borderRadius.md, minWidth: 44 },
              focused && { backgroundColor: colorAlpha.primary10 },
            ]}>
              <Feather name="users" size={20} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 3 }} />}
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ fontSize: 10, fontWeight: focused ? fontWeight.semibold : fontWeight.normal, color: focused ? colors.primary : colors.textMuted, marginTop: 2 }}>
              Rede
            </Text>
          ),
          tabBarShowLabel: true,
        }}
      />
      <Tabs.Screen
        name="financial"
        options={{
          title: 'Financeiro',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, paddingTop: spacing.xs, borderRadius: borderRadius.md, minWidth: 44 },
              focused && { backgroundColor: colorAlpha.primary10 },
            ]}>
              <Feather name="dollar-sign" size={20} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 3 }} />}
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ fontSize: 10, fontWeight: focused ? fontWeight.semibold : fontWeight.normal, color: focused ? colors.primary : colors.textMuted, marginTop: 2 }}>
              Financeiro
            </Text>
          ),
          tabBarShowLabel: true,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, paddingTop: spacing.xs, borderRadius: borderRadius.md, minWidth: 44 },
              focused && { backgroundColor: colorAlpha.primary10 },
            ]}>
              <Feather name="user" size={20} color={color} />
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginTop: 3 }} />}
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={{ fontSize: 10, fontWeight: focused ? fontWeight.semibold : fontWeight.normal, color: focused ? colors.primary : colors.textMuted, marginTop: 2 }}>
              Perfil
            </Text>
          ),
          tabBarShowLabel: true,
        }}
      />
      {/* Telas acessiveis via navegacao, ocultas da tab bar */}
      <Tabs.Screen name="brands" options={{ href: null, title: 'Marcas' }} />
      <Tabs.Screen name="social" options={{ href: null, title: 'Social' }} />
      <Tabs.Screen name="courses" options={{ href: null, title: 'Formacao' }} />
      <Tabs.Screen name="community" options={{ href: null, title: 'Comunidade' }} />
      <Tabs.Screen name="studio" options={{ href: null, title: 'Studio IA' }} />
    </Tabs>
  );
}
