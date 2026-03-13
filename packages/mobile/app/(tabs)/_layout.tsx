import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { colors, colorAlpha, borderRadius, fontSize, fontWeight, spacing } from '@/lib/theme';

function TabBarLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontSize: 10,
        fontWeight: focused ? fontWeight.semibold : fontWeight.normal,
        color: focused ? colors.primary : colors.textMuted,
        marginTop: 2,
      }}
    >
      {label}
    </Text>
  );
}

export default function TabLayout() {
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
            <View style={styles.headerTitle}>
              <Text style={styles.headerBrand}>Brandly</Text>
            </View>
          ),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <Feather name="home" size={20} color={color} />
              {focused && <View style={styles.tabDot} />}
            </View>
          ),
          tabBarLabel: ({ focused }) => <TabBarLabel label="Inicio" focused={focused} />,
          tabBarShowLabel: true,
        }}
      />
      <Tabs.Screen
        name="videos"
        options={{
          title: 'Videos',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <Feather name="video" size={20} color={color} />
              {focused && <View style={styles.tabDot} />}
            </View>
          ),
          tabBarLabel: ({ focused }) => <TabBarLabel label="Videos" focused={focused} />,
          tabBarShowLabel: true,
        }}
      />
      <Tabs.Screen
        name="network"
        options={{
          title: 'Rede',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <Feather name="users" size={20} color={color} />
              {focused && <View style={styles.tabDot} />}
            </View>
          ),
          tabBarLabel: ({ focused }) => <TabBarLabel label="Rede" focused={focused} />,
          tabBarShowLabel: true,
        }}
      />
      <Tabs.Screen
        name="financial"
        options={{
          title: 'Financeiro',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <Feather name="dollar-sign" size={20} color={color} />
              {focused && <View style={styles.tabDot} />}
            </View>
          ),
          tabBarLabel: ({ focused }) => <TabBarLabel label="Financeiro" focused={focused} />,
          tabBarShowLabel: true,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
              <Feather name="user" size={20} color={color} />
              {focused && <View style={styles.tabDot} />}
            </View>
          ),
          tabBarLabel: ({ focused }) => <TabBarLabel label="Perfil" focused={focused} />,
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

const styles = StyleSheet.create({
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerBrand: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    borderRadius: borderRadius.md,
    minWidth: 44,
  },
  tabIconActive: {
    backgroundColor: colorAlpha.primary10,
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 3,
  },
});
