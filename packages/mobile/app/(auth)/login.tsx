import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import {
  colors,
  colorAlpha,
  fontSize,
  fontWeight,
  spacing,
  borderRadius,
  shadows,
  layout,
} from '@/lib/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Preencha todos os campos.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Glow orb decorativo */}
        <View style={styles.glowOrb} pointerEvents="none" />

        {/* Header com logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Feather name="zap" size={28} color={colors.text} />
            </LinearGradient>
            <Text style={styles.logo}>Brandly</Text>
          </View>
          <Text style={styles.tagline}>Profissao Creator</Text>
          <Text style={styles.subtitle}>Entre na sua conta</Text>
        </View>

        {/* Erro */}
        {error ? (
          <View style={styles.errorContainer}>
            <Feather name="alert-circle" size={14} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Formulario */}
        <View style={styles.form}>
          {/* Campo Email */}
          <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
            <Feather
              name="mail"
              size={18}
              color={emailFocused ? colors.primaryLight : colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>

          {/* Campo Senha */}
          <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
            <Feather
              name="lock"
              size={18}
              color={passwordFocused ? colors.primaryLight : colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
          </View>

          {/* Botao Entrar */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
            style={[styles.buttonShadow, isLoading && styles.buttonDisabled]}
          >
            <LinearGradient
              colors={
                isLoading
                  ? [colors.primaryDark, colors.primaryDark]
                  : [colors.primary, colors.primaryLight]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <>
                  <Text style={styles.buttonText}>Entrar</Text>
                  <Feather name="arrow-right" size={18} color={colors.text} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Link Cadastro */}
        <Link href="/(auth)/register" asChild>
          <TouchableOpacity style={styles.linkContainer}>
            <Text style={styles.linkText}>
              Nao tem conta?{' '}
              <Text style={styles.linkHighlight}>Cadastre-se gratuitamente</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },

  // Glow orb decorativo
  glowOrb: {
    position: 'absolute',
    top: -80,
    left: '50%',
    marginLeft: -120,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colorAlpha.primary15,
    // blur simulado com opacidade em camadas
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl + spacing.sm,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  logoGradient: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glowPrimarySubtle,
  },
  logo: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primaryLight,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Erro
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colorAlpha.danger10,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.sm,
    flex: 1,
  },

  // Formulario
  form: {
    gap: spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: layout.inputHeight + 4,
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    backgroundColor: colorAlpha.primary10,
    ...shadows.glowPrimarySubtle,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    height: '100%',
  },

  // Botao
  buttonShadow: {
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    ...shadows.glowPrimary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  button: {
    borderRadius: borderRadius.lg,
    height: layout.buttonHeightLg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },

  // Link
  linkContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  linkHighlight: {
    color: colors.primaryLight,
    fontWeight: fontWeight.semibold,
  },
});
