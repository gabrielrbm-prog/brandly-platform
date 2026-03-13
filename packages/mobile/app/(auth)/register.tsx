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
import { useTheme } from '@/contexts/ThemeContext';
import {
  fontSize,
  fontWeight,
  spacing,
  borderRadius,
  layout,
} from '@/lib/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { colors, colorAlpha, shadows } = useTheme();

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
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Glow orb decorativo */}
        <View style={[styles.glowOrb, { backgroundColor: colorAlpha.primary10 }]} pointerEvents="none" />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.logoGradient, shadows.glowPrimarySubtle]}
            >
              <Feather name="zap" size={28} color={colors.text} />
            </LinearGradient>
            <Text style={[styles.logo, { color: colors.text }]}>Brandly</Text>
          </View>
          <Text style={[styles.tagline, { color: colors.primaryLight }]}>Profissao Creator</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Crie sua conta gratuitamente</Text>
        </View>

        {/* Erro */}
        {error ? (
          <View style={[styles.errorContainer, { backgroundColor: colorAlpha.danger10 }]}>
            <Feather name="alert-circle" size={14} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        ) : null}

        {/* Formulario */}
        <View style={styles.form}>
          {/* Nome */}
          <View style={[
            styles.inputWrapper,
            { backgroundColor: colors.surface, borderColor: colors.border },
            nameFocused && { borderColor: colors.primary, backgroundColor: colorAlpha.primary10, ...shadows.glowPrimarySubtle },
          ]}>
            <Feather
              name="user"
              size={18}
              color={nameFocused ? colors.primaryLight : colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
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
          <View style={[
            styles.inputWrapper,
            { backgroundColor: colors.surface, borderColor: colors.border },
            emailFocused && { borderColor: colors.primary, backgroundColor: colorAlpha.primary10, ...shadows.glowPrimarySubtle },
          ]}>
            <Feather
              name="mail"
              size={18}
              color={emailFocused ? colors.primaryLight : colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
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
          <View style={[
            styles.inputWrapper,
            { backgroundColor: colors.surface, borderColor: colors.border },
            passwordFocused && { borderColor: colors.primary, backgroundColor: colorAlpha.primary10, ...shadows.glowPrimarySubtle },
          ]}>
            <Feather
              name="lock"
              size={18}
              color={passwordFocused ? colors.primaryLight : colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
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
          <View style={[
            styles.inputWrapper,
            styles.inputWrapperOptional,
            { backgroundColor: colors.surface, borderColor: colors.border },
            referralFocused && { borderColor: colors.primary, backgroundColor: colorAlpha.primary10, ...shadows.glowPrimarySubtle },
          ]}>
            <Feather
              name="gift"
              size={18}
              color={referralFocused ? colors.accent : colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
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
              <View style={[styles.bonusBadge, { backgroundColor: colorAlpha.accent20, borderColor: colors.accent }]}>
                <Text style={[styles.bonusBadgeText, { color: colors.accent }]}>Bonus</Text>
              </View>
            )}
          </View>

          {/* Botao Criar Conta */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.85}
            style={[styles.buttonShadow, shadows.glowPrimary, isLoading && styles.buttonDisabled]}
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
                  <Text style={[styles.buttonText, { color: colors.text }]}>Criar conta</Text>
                  <Feather name="arrow-right" size={18} color={colors.text} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Aviso de termos */}
          <Text style={[styles.termsText, { color: colors.textMuted }]}>
            Ao criar sua conta voce concorda com os{' '}
            <Text style={{ color: colors.primaryLight }}>Termos de Uso</Text> e{' '}
            <Text style={{ color: colors.primaryLight }}>Politica de Privacidade</Text>.
          </Text>
        </View>

        {/* Link Login */}
        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.linkContainer}>
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>
              Ja tem conta?{' '}
              <Text style={[styles.linkHighlight, { color: colors.primaryLight }]}>Entrar</Text>
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
  },
  logo: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.extrabold,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    marginTop: spacing.xs,
  },

  // Erro
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
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
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: layout.inputHeight + 4,
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
    height: '100%',
  },
  bonusBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
  },
  bonusBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },

  // Botao
  buttonShadow: {
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
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
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },

  // Termos
  termsText: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Link
  linkContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  linkText: {
    fontSize: fontSize.sm,
  },
  linkHighlight: {
    fontWeight: fontWeight.semibold,
  },
});
