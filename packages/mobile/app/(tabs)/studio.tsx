import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { brandsApi, scriptsApi } from '@/lib/api';
import { borderRadius, colorAlpha, colors, fontSize, layout, shadows, spacing } from '@/lib/theme';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ───

interface Brand {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface Briefing {
  id: string;
  title: string;
  description: string;
  tone: string;
}

interface Script {
  id: string;
  briefingId: string;
  hook: string;
  body: string;
  cta: string;
  fullScript: string;
  isUsed: boolean;
  createdAt: string;
}

type TabOption = 'generate' | 'library';

// ─── Main Screen ───

export default function StudioScreen() {
  useAuth();

  const [tab, setTab] = useState<TabOption>('generate');
  const [myBrands, setMyBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [selectedBriefing, setSelectedBriefing] = useState<Briefing | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [libraryScripts, setLibraryScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedScript, setExpandedScript] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scriptModalVisible, setScriptModalVisible] = useState(false);
  const [selectedFullScript, setSelectedFullScript] = useState<Script | null>(null);

  // ─── Data Fetching ───

  const fetchBrands = useCallback(async () => {
    try {
      setError(null);
      const res = (await brandsApi.my()) as any;
      const brandsList = res?.brands ?? res ?? [];
      setMyBrands(brandsList);
    } catch (err: any) {
      setError(err.message ?? 'Erro ao carregar marcas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchBriefings = useCallback(async (brandId: string) => {
    try {
      const res = (await brandsApi.detail(brandId)) as any;
      setBriefings(res?.briefings ?? []);
    } catch {
      setBriefings([]);
    }
  }, []);

  const fetchLibrary = useCallback(async () => {
    try {
      const res = (await scriptsApi.list()) as any;
      setLibraryScripts(res?.scripts ?? []);
    } catch {
      setLibraryScripts([]);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  useEffect(() => {
    if (tab === 'library') {
      fetchLibrary();
    }
  }, [tab, fetchLibrary]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (tab === 'generate') {
      fetchBrands();
    } else {
      fetchLibrary().finally(() => setRefreshing(false));
    }
  }, [tab, fetchBrands, fetchLibrary]);

  // ─── Actions ───

  const handleSelectBrand = useCallback(
    (brand: Brand) => {
      setSelectedBrand(brand);
      setSelectedBriefing(null);
      setScripts([]);
      fetchBriefings(brand.id);
    },
    [fetchBriefings],
  );

  const handleGenerate = useCallback(async () => {
    if (!selectedBriefing) return;

    setGenerating(true);
    try {
      const res = (await scriptsApi.generate({ briefingId: selectedBriefing.id })) as any;
      setScripts(res?.scripts ?? []);
      Alert.alert(
        'Roteiros Gerados!',
        `${res?.total ?? 0} roteiros criados (${res?.technique ?? '3x3x2'}) via ${res?.generatedBy ?? 'IA'}`,
      );
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Falha ao gerar roteiros');
    } finally {
      setGenerating(false);
    }
  }, [selectedBriefing]);

  const handleCopy = useCallback(async (script: Script) => {
    await Clipboard.setStringAsync(script.fullScript);
    setCopiedId(script.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleMarkUsed = useCallback(async (script: Script) => {
    try {
      await scriptsApi.markUsed(script.id);
      // Atualizar lista local
      const updateList = (list: Script[]) =>
        list.map((s) => (s.id === script.id ? { ...s, isUsed: true } : s));
      setScripts(updateList);
      setLibraryScripts(updateList);
    } catch {
      Alert.alert('Erro', 'Falha ao marcar roteiro como usado');
    }
  }, []);

  const handleOpenScript = useCallback((script: Script) => {
    setSelectedFullScript(script);
    setScriptModalVisible(true);
  }, []);

  // ─── Render Helpers ───

  const renderScriptCard = useCallback(
    (script: Script) => {
      const isExpanded = expandedScript === script.id;
      const isCopied = copiedId === script.id;

      return (
        <View key={script.id} style={[styles.scriptCard, script.isUsed && styles.scriptCardUsed]}>
          {/* Colored left accent border */}
          <View style={styles.scriptCardAccent} />

          <Pressable onPress={() => handleOpenScript(script)} style={styles.scriptCardInner}>
            <View style={styles.scriptHeader}>
              <View style={styles.scriptHookRow}>
                <View style={styles.scriptHookIcon}>
                  <Feather name="zap" size={12} color={colors.primary} />
                </View>
                <Text style={styles.hookText} numberOfLines={isExpanded ? undefined : 2}>
                  {script.hook}
                </Text>
              </View>
              {script.isUsed && (
                <View style={styles.usedBadge}>
                  <Feather name="check" size={10} color={colors.textMuted} />
                  <Text style={styles.usedBadgeText}>Usado</Text>
                </View>
              )}
            </View>

            <Text style={styles.bodyPreview} numberOfLines={isExpanded ? undefined : 2}>
              {script.body}
            </Text>

            <View style={styles.ctaRow}>
              <Feather name="arrow-right-circle" size={12} color={colors.accent} />
              <Text style={styles.ctaText} numberOfLines={1}>
                {script.cta}
              </Text>
            </View>
          </Pressable>

          <View style={styles.scriptActions}>
            <Pressable
              style={[styles.actionButton, styles.copyButton, isCopied && styles.copyButtonDone]}
              onPress={() => handleCopy(script)}
            >
              <Feather name={isCopied ? 'check' : 'copy'} size={13} color={isCopied ? colors.success : colors.primary} />
              <Text style={[styles.actionButtonText, isCopied && { color: colors.success }]}>
                {isCopied ? 'Copiado' : 'Copiar'}
              </Text>
            </Pressable>
            {!script.isUsed && (
              <Pressable
                style={[styles.actionButton, styles.useButton]}
                onPress={() => handleMarkUsed(script)}
              >
                <Feather name="check-circle" size={13} color={colors.success} />
                <Text style={[styles.actionButtonText, { color: colors.success }]}>Marcar Usado</Text>
              </Pressable>
            )}
          </View>
        </View>
      );
    },
    [expandedScript, copiedId, handleCopy, handleMarkUsed, handleOpenScript],
  );

  // ─── Tab: Generate ───

  const renderGenerateTab = () => (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {/* Step 1: Selecionar marca */}
      <View style={styles.stepLabelRow}>
        <View style={styles.stepIconBadge}>
          <Feather name="briefcase" size={12} color={colors.primary} />
        </View>
        <Text style={styles.stepLabel}>1. Selecione a marca</Text>
      </View>
      {myBrands.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Feather name="briefcase" size={28} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyText}>
            Voce ainda nao esta conectado a nenhuma marca.
          </Text>
          <Text style={styles.emptySubtext}>
            Va em Marcas no menu do Perfil para se conectar.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.brandChips}
        >
          {myBrands.map((brand) => {
            const isActive = selectedBrand?.id === brand.id;
            return (
              <Pressable
                key={brand.id}
                onPress={() => handleSelectBrand(brand)}
              >
                {isActive ? (
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.brandChip, styles.brandChipActive]}
                  >
                    <Text style={[styles.brandChipText, styles.brandChipTextActive]}>
                      {brand.name}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.brandChip}>
                    <Text style={styles.brandChipText}>{brand.name}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Step 2: Selecionar briefing */}
      {selectedBrand && (
        <>
          <View style={styles.stepLabelRow}>
            <View style={styles.stepIconBadge}>
              <Feather name="file-text" size={12} color={colors.primary} />
            </View>
            <Text style={styles.stepLabel}>2. Selecione o briefing</Text>
          </View>
          {briefings.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Feather name="file-text" size={28} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyText}>
                Nenhum briefing ativo para {selectedBrand.name}.
              </Text>
            </View>
          ) : (
            briefings.map((briefing) => {
              const isActive = selectedBriefing?.id === briefing.id;
              return (
                <Pressable
                  key={briefing.id}
                  style={[
                    styles.briefingCard,
                    isActive && styles.briefingCardActive,
                  ]}
                  onPress={() => setSelectedBriefing(briefing)}
                >
                  {isActive && <View style={styles.briefingAccentBorder} />}
                  <View style={styles.briefingCardInner}>
                    <View style={styles.briefingTitleRow}>
                      <Text style={styles.briefingTitle}>{briefing.title}</Text>
                      {isActive && (
                        <Feather name="check-circle" size={18} color={colors.primary} />
                      )}
                    </View>
                    <Text style={styles.briefingDesc} numberOfLines={2}>
                      {briefing.description}
                    </Text>
                    {briefing.tone && (
                      <View style={styles.toneBadge}>
                        <Text style={styles.toneBadgeText}>Tom: {briefing.tone}</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })
          )}
        </>
      )}

      {/* Step 3: Gerar */}
      {selectedBriefing && (
        <>
          <View style={styles.stepLabelRow}>
            <View style={styles.stepIconBadge}>
              <Feather name="cpu" size={12} color={colors.primary} />
            </View>
            <Text style={styles.stepLabel}>3. Gerar roteiros com IA</Text>
          </View>
          <Pressable
            onPress={handleGenerate}
            disabled={generating}
            style={generating ? { opacity: 0.7 } : undefined}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.generateButton, shadows.glowPrimary]}
            >
              {generating ? (
                <View style={styles.generatingRow}>
                  <ActivityIndicator size="small" color={colors.text} />
                  <Text style={styles.generateButtonText}>Gerando roteiros...</Text>
                </View>
              ) : (
                <View style={styles.generatingRow}>
                  <Feather name="zap" size={20} color={colors.text} />
                  <Text style={styles.generateButtonText}>
                    Gerar Roteiros (3x3x2)
                  </Text>
                </View>
              )}
            </LinearGradient>
          </Pressable>
          <Text style={styles.generateHint}>
            A IA gera 3 ganchos × 3 corpos × 2 CTAs = ate 18 combinacoes unicas
          </Text>
        </>
      )}

      {/* Roteiros gerados */}
      {scripts.length > 0 && (
        <>
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>
            {scripts.length} Roteiros Gerados
          </Text>
          {scripts.map(renderScriptCard)}
        </>
      )}
    </ScrollView>
  );

  // ─── Tab: Library ───

  const renderLibraryTab = () => {
    const unused = libraryScripts.filter((s) => !s.isUsed);
    const used = libraryScripts.filter((s) => s.isUsed);

    return (
      <ScrollView contentContainerStyle={styles.tabContent}>
        {libraryScripts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Feather name="layers" size={32} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyText}>
              Sua biblioteca esta vazia.
            </Text>
            <Text style={styles.emptySubtext}>
              Gere roteiros na aba "Gerar" para comecar.
            </Text>
          </View>
        ) : (
          <>
            {/* Stats Row */}
            <View style={styles.libraryStats}>
              <View style={styles.libraryStat}>
                <View style={[styles.libraryStatIcon, { backgroundColor: colorAlpha.primary20 }]}>
                  <Feather name="layers" size={16} color={colors.primary} />
                </View>
                <Text style={styles.libraryStatValue}>{libraryScripts.length}</Text>
                <Text style={styles.libraryStatLabel}>Total</Text>
              </View>
              <View style={styles.libraryStatDivider} />
              <View style={styles.libraryStat}>
                <View style={[styles.libraryStatIcon, { backgroundColor: colorAlpha.success20 }]}>
                  <Feather name="check-circle" size={16} color={colors.success} />
                </View>
                <Text style={[styles.libraryStatValue, { color: colors.success }]}>
                  {unused.length}
                </Text>
                <Text style={styles.libraryStatLabel}>Disponiveis</Text>
              </View>
              <View style={styles.libraryStatDivider} />
              <View style={styles.libraryStat}>
                <View style={[styles.libraryStatIcon, { backgroundColor: colorAlpha.muted20 }]}>
                  <Feather name="archive" size={16} color={colors.textMuted} />
                </View>
                <Text style={[styles.libraryStatValue, { color: colors.textMuted }]}>
                  {used.length}
                </Text>
                <Text style={styles.libraryStatLabel}>Usados</Text>
              </View>
            </View>

            {unused.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Disponiveis ({unused.length})</Text>
                {unused.map(renderScriptCard)}
              </>
            )}

            {used.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
                  Usados ({used.length})
                </Text>
                {used.map(renderScriptCard)}
              </>
            )}
          </>
        )}
      </ScrollView>
    );
  };

  // ─── Script Detail Modal ───

  const renderScriptModal = () => (
    <Modal
      visible={scriptModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setScriptModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View style={styles.modalTitleRow}>
            <Feather name="file-text" size={18} color={colors.primary} />
            <Text style={styles.modalTitle}>Roteiro Completo</Text>
          </View>
          <Pressable style={styles.modalCloseBtn} onPress={() => setScriptModalVisible(false)}>
            <Feather name="x" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        {selectedFullScript && (
          <ScrollView style={styles.modalBody}>
            {/* Gancho */}
            <View style={styles.modalSection}>
              <View style={styles.modalSectionHeader}>
                <View style={[styles.modalSectionIconBadge, { backgroundColor: colorAlpha.primary20 }]}>
                  <Feather name="zap" size={12} color={colors.primary} />
                </View>
                <Text style={[styles.modalSectionLabel, { color: colors.primary }]}>GANCHO</Text>
              </View>
              <View style={[styles.modalSectionBody, { borderLeftColor: colors.primary }]}>
                <Text style={styles.modalSectionText}>{selectedFullScript.hook}</Text>
              </View>
            </View>

            {/* Corpo */}
            <View style={styles.modalSection}>
              <View style={styles.modalSectionHeader}>
                <View style={[styles.modalSectionIconBadge, { backgroundColor: colorAlpha.info20 }]}>
                  <Feather name="align-left" size={12} color={colors.info} />
                </View>
                <Text style={[styles.modalSectionLabel, { color: colors.info }]}>CORPO</Text>
              </View>
              <View style={[styles.modalSectionBody, { borderLeftColor: colors.info }]}>
                <Text style={styles.modalSectionText}>{selectedFullScript.body}</Text>
              </View>
            </View>

            {/* CTA */}
            <View style={styles.modalSection}>
              <View style={styles.modalSectionHeader}>
                <View style={[styles.modalSectionIconBadge, { backgroundColor: colorAlpha.accent20 }]}>
                  <Feather name="arrow-right-circle" size={12} color={colors.accent} />
                </View>
                <Text style={[styles.modalSectionLabel, { color: colors.accent }]}>CTA</Text>
              </View>
              <View style={[styles.modalSectionBody, { borderLeftColor: colors.accent }]}>
                <Text style={styles.modalSectionText}>{selectedFullScript.cta}</Text>
              </View>
            </View>

            <View style={styles.modalDivider} />

            {/* Roteiro completo */}
            <View style={styles.modalSection}>
              <View style={styles.modalSectionHeader}>
                <View style={[styles.modalSectionIconBadge, { backgroundColor: colorAlpha.muted20 }]}>
                  <Feather name="code" size={12} color={colors.textSecondary} />
                </View>
                <Text style={styles.modalSectionLabel}>ROTEIRO COMPLETO</Text>
              </View>
              <View style={styles.modalFullScriptBlock}>
                <Text style={styles.modalFullScript}>{selectedFullScript.fullScript}</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  handleCopy(selectedFullScript);
                  Alert.alert('Copiado!', 'Roteiro copiado para a area de transferencia.');
                }}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalActionButton}
                >
                  <Feather name="copy" size={16} color={colors.text} />
                  <Text style={styles.modalActionText}>Copiar Roteiro</Text>
                </LinearGradient>
              </Pressable>
              {!selectedFullScript.isUsed && (
                <Pressable
                  style={[styles.modalActionButton, { backgroundColor: colorAlpha.success20, borderWidth: 1, borderColor: colors.success }]}
                  onPress={() => {
                    handleMarkUsed(selectedFullScript);
                    setSelectedFullScript({ ...selectedFullScript, isUsed: true });
                  }}
                >
                  <Feather name="check-circle" size={16} color={colors.success} />
                  <Text style={[styles.modalActionText, { color: colors.success }]}>Marcar como Usado</Text>
                </Pressable>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  // ─── Loading / Error States ───

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={fetchBrands}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  // ─── Main Render ───

  return (
    <View style={styles.container}>
      {/* Tab Switcher — pill segmented control */}
      <View style={styles.tabBarWrapper}>
        <View style={styles.tabBar}>
          <Pressable style={styles.tabItemWrapper} onPress={() => setTab('generate')}>
            {tab === 'generate' ? (
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tabItemActive}
              >
                <Feather name="cpu" size={14} color={colors.text} />
                <Text style={styles.tabTextActive}>Gerar</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabItemInactive}>
                <Feather name="cpu" size={14} color={colors.textMuted} />
                <Text style={styles.tabText}>Gerar</Text>
              </View>
            )}
          </Pressable>

          <Pressable style={styles.tabItemWrapper} onPress={() => setTab('library')}>
            {tab === 'library' ? (
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tabItemActive}
              >
                <Feather name="layers" size={14} color={colors.text} />
                <Text style={styles.tabTextActive}>Biblioteca</Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabItemInactive}>
                <Feather name="layers" size={14} color={colors.textMuted} />
                <Text style={styles.tabText}>Biblioteca</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {tab === 'generate' ? renderGenerateTab() : renderLibraryTab()}

      {renderScriptModal()}
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.md,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  retryButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  retryText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },

  // Tab Bar — segmented control
  tabBarWrapper: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: 4,
    gap: 4,
  },
  tabItemWrapper: {
    flex: 1,
  },
  tabItemActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  tabItemInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },

  // Tab Content
  tabContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },

  // Step Labels
  stepLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  stepIconBadge: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.xs,
    backgroundColor: colorAlpha.primary20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Brand Chips
  brandChips: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  brandChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandChipActive: {
    borderWidth: 0,
  },
  brandChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  brandChipTextActive: {
    color: colors.text,
    fontWeight: '600',
  },

  // Briefing Cards
  briefingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  briefingCardActive: {
    borderColor: colors.primary,
    backgroundColor: colorAlpha.primary10,
  },
  briefingAccentBorder: {
    width: 3,
    backgroundColor: colors.primary,
    borderTopLeftRadius: borderRadius.md,
    borderBottomLeftRadius: borderRadius.md,
  },
  briefingCardInner: {
    flex: 1,
    padding: spacing.md,
  },
  briefingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  briefingTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  briefingDesc: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  toneBadge: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colorAlpha.accent20,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  toneBadgeText: {
    color: colors.accent,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },

  // Generate Button
  generateButton: {
    borderRadius: borderRadius.md,
    height: layout.buttonHeightLg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  generatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  generateHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // Section
  sectionDivider: {
    height: layout.dividerHeight,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
  },

  // Script Card
  scriptCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  scriptCardAccent: {
    width: 3,
    backgroundColor: colors.primary,
  },
  scriptCardInner: {
    flex: 1,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  scriptCardUsed: {
    opacity: 0.5,
    borderColor: colorAlpha.muted40,
  },
  scriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  scriptHookRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: spacing.xs,
    marginRight: spacing.sm,
  },
  scriptHookIcon: {
    marginTop: 2,
  },
  hookText: {
    color: colors.primaryLight,
    fontSize: fontSize.md,
    fontWeight: '700',
    flex: 1,
  },
  usedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colorAlpha.muted30,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  usedBadgeText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  bodyPreview: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  ctaText: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: '600',
    flex: 1,
  },
  scriptActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  copyButton: {
    backgroundColor: colorAlpha.primary20,
  },
  copyButtonDone: {
    backgroundColor: colorAlpha.success20,
  },
  useButton: {
    backgroundColor: colorAlpha.success20,
  },
  actionButtonText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },

  // Library Stats
  libraryStats: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  libraryStat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  libraryStatIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  libraryStatValue: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  libraryStatLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },
  libraryStatDivider: {
    width: layout.dividerHeight,
    height: layout.avatarSm,
    backgroundColor: colors.border,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    flex: 1,
    padding: spacing.md,
  },
  modalSection: {
    marginBottom: spacing.lg,
  },
  modalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  modalSectionIconBadge: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSectionLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  modalSectionBody: {
    borderLeftWidth: 2,
    paddingLeft: spacing.md,
    paddingVertical: spacing.xs,
  },
  modalSectionText: {
    color: colors.text,
    fontSize: fontSize.md,
    lineHeight: 24,
  },
  modalDivider: {
    height: layout.dividerHeight,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  modalFullScriptBlock: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    overflow: 'hidden',
  },
  modalFullScript: {
    color: colors.text,
    fontSize: fontSize.md,
    lineHeight: 26,
    fontFamily: 'monospace',
  },
  modalActions: {
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  modalActionButton: {
    height: layout.buttonHeight,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalActionText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
