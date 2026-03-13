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

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [referralFocused, setReferralFocused] = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Preencha todos os campos obrigatorios.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await register(name.trim(), email.trim(), password, referralCode.trim() || undefined);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao criar conta. Tente novamente.');
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

        {/* Header */}
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
          <Text style={styles.subtitle}>Crie sua conta gratuitamente</Text>
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
          {/* Nome */}
          <View style={[styles.inputWrapper, nameFocused && styles.inputWrapperFocused]}>
            <Feather
              name="user"
              size={18}
              color={nameFocused ? colors.primaryLight : colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
            />
          </View>

          {/* Email */}
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

          {/* Senha */}
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

          {/* Codigo de indicacao */}
          <View style={[styles.inputWrapper, referralFocused && styles.inputWrapperFocused, styles.inputWrapperOptional]}>
            <Feather
              name="gift"
              size={18}
              color={referralFocused ? colors.accent : colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Codigo de indicacao (opcional)"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              value={referralCode}
              onChangeText={setReferralCode}
              onFocus={() => setReferralFocused(true)}
              onBlur={() => setReferralFocused(false)}
            />
            {referralCode.length > 0 && (
              <View style={styles.bonusBadge}>
                <Text style={styles.bonusBadgeText}>Bonus</Text>
              </View>
            )}
          </View>

          {/* Botao Criar Conta */}
          <TouchableOpacity
            onPress={handleRegister}
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
                  <Text style={styles.buttonText}>Criar conta</Text>
                  <Feather name="arrow-right" size={18} color={colors.text} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Aviso de termos */}
          <Text style={styles.termsText}>
            Ao criar sua conta voce concorda com os{' '}
            <Text style={styles.termsLink}>Termos de Uso</Text> e{' '}
            <Text style={styles.termsLink}>Politica de Privacidade</Text>.
          </Text>
        </View>

        {/* Link Login */}
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.linkContainer}>
            <Text style={styles.linkText}>
              Ja tem conta?{' '}
              <Text style={styles.linkHighlight}>Entrar</Text>
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
    top: -60,
    left: '50%',
    marginLeft: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colorAlpha.primary10,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
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
    fontSize: fontSize['4xl'],
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
  inputWrapperOptional: {
    borderStyle: 'dashed',
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
  bonusBadge: {
    backgroundColor: colorAlpha.accent20,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  bonusBadgeText: {
    color: colors.accent,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
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

  // Termos
  termsText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primaryLight,
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
