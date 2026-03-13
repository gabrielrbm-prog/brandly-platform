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
import { brandsApi, scriptsApi } from '@/lib/api';
import { borderRadius, colorAlpha, colors, fontSize, layout, spacing } from '@/lib/theme';
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
          <Pressable onPress={() => handleOpenScript(script)}>
            <View style={styles.scriptHeader}>
              <Text style={styles.hookText} numberOfLines={isExpanded ? undefined : 2}>
                {script.hook}
              </Text>
              {script.isUsed && (
                <View style={styles.usedBadge}>
                  <Text style={styles.usedBadgeText}>Usado</Text>
                </View>
              )}
            </View>

            <Text style={styles.bodyPreview} numberOfLines={isExpanded ? undefined : 2}>
              {script.body}
            </Text>

            <Text style={styles.ctaText} numberOfLines={1}>
              {script.cta}
            </Text>
          </Pressable>

          <View style={styles.scriptActions}>
            <Pressable
              style={[styles.actionButton, styles.copyButton]}
              onPress={() => handleCopy(script)}
            >
              <Text style={styles.actionButtonText}>
                {isCopied ? '✓ Copiado' : 'Copiar'}
              </Text>
            </Pressable>
            {!script.isUsed && (
              <Pressable
                style={[styles.actionButton, styles.useButton]}
                onPress={() => handleMarkUsed(script)}
              >
                <Text style={styles.actionButtonText}>Marcar Usado</Text>
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
      <Text style={styles.stepLabel}>1. Selecione a marca</Text>
      {myBrands.length === 0 ? (
        <View style={styles.emptyState}>
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
          {myBrands.map((brand) => (
            <Pressable
              key={brand.id}
              style={[
                styles.brandChip,
                selectedBrand?.id === brand.id && styles.brandChipActive,
              ]}
              onPress={() => handleSelectBrand(brand)}
            >
              <Text
                style={[
                  styles.brandChipText,
                  selectedBrand?.id === brand.id && styles.brandChipTextActive,
                ]}
              >
                {brand.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Step 2: Selecionar briefing */}
      {selectedBrand && (
        <>
          <Text style={styles.stepLabel}>2. Selecione o briefing</Text>
          {briefings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Nenhum briefing ativo para {selectedBrand.name}.
              </Text>
            </View>
          ) : (
            briefings.map((briefing) => (
              <Pressable
                key={briefing.id}
                style={[
                  styles.briefingCard,
                  selectedBriefing?.id === briefing.id && styles.briefingCardActive,
                ]}
                onPress={() => setSelectedBriefing(briefing)}
              >
                <Text style={styles.briefingTitle}>{briefing.title}</Text>
                <Text style={styles.briefingDesc} numberOfLines={2}>
                  {briefing.description}
                </Text>
                {briefing.tone && (
                  <View style={styles.toneBadge}>
                    <Text style={styles.toneBadgeText}>Tom: {briefing.tone}</Text>
                  </View>
                )}
              </Pressable>
            ))
          )}
        </>
      )}

      {/* Step 3: Gerar */}
      {selectedBriefing && (
        <>
          <Text style={styles.stepLabel}>3. Gerar roteiros com IA</Text>
          <Pressable
            style={[styles.generateButton, generating && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <View style={styles.generatingRow}>
                <ActivityIndicator size="small" color={colors.text} />
                <Text style={styles.generateButtonText}>Gerando roteiros...</Text>
              </View>
            ) : (
              <Text style={styles.generateButtonText}>
                Gerar Roteiros (3x3x2)
              </Text>
            )}
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
            <Text style={styles.emptyText}>
              Sua biblioteca esta vazia.
            </Text>
            <Text style={styles.emptySubtext}>
              Gere roteiros na aba "Gerar" para comecar.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.libraryStats}>
              <View style={styles.libraryStat}>
                <Text style={styles.libraryStatValue}>{libraryScripts.length}</Text>
                <Text style={styles.libraryStatLabel}>Total</Text>
              </View>
              <View style={styles.libraryStatDivider} />
              <View style={styles.libraryStat}>
                <Text style={[styles.libraryStatValue, { color: colors.success }]}>
                  {unused.length}
                </Text>
                <Text style={styles.libraryStatLabel}>Disponiveis</Text>
              </View>
              <View style={styles.libraryStatDivider} />
              <View style={styles.libraryStat}>
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
          <Text style={styles.modalTitle}>Roteiro Completo</Text>
          <Pressable onPress={() => setScriptModalVisible(false)}>
            <Text style={styles.modalClose}>Fechar</Text>
          </Pressable>
        </View>

        {selectedFullScript && (
          <ScrollView style={styles.modalBody}>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionLabel}>GANCHO</Text>
              <Text style={styles.modalSectionText}>{selectedFullScript.hook}</Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionLabel}>CORPO</Text>
              <Text style={styles.modalSectionText}>{selectedFullScript.body}</Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionLabel}>CTA</Text>
              <Text style={styles.modalSectionText}>{selectedFullScript.cta}</Text>
            </View>

            <View style={styles.modalDivider} />

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionLabel}>ROTEIRO COMPLETO</Text>
              <Text style={styles.modalFullScript}>{selectedFullScript.fullScript}</Text>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalActionButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  handleCopy(selectedFullScript);
                  Alert.alert('Copiado!', 'Roteiro copiado para a area de transferencia.');
                }}
              >
                <Text style={styles.modalActionText}>Copiar Roteiro</Text>
              </Pressable>
              {!selectedFullScript.isUsed && (
                <Pressable
                  style={[styles.modalActionButton, { backgroundColor: colors.success }]}
                  onPress={() => {
                    handleMarkUsed(selectedFullScript);
                    setSelectedFullScript({ ...selectedFullScript, isUsed: true });
                  }}
                >
                  <Text style={styles.modalActionText}>Marcar como Usado</Text>
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
      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabItem, tab === 'generate' && styles.tabItemActive]}
          onPress={() => setTab('generate')}
        >
          <Text style={[styles.tabText, tab === 'generate' && styles.tabTextActive]}>
            Gerar
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabItem, tab === 'library' && styles.tabItemActive]}
          onPress={() => setTab('library')}
        >
          <Text style={[styles.tabText, tab === 'library' && styles.tabTextActive]}>
            Biblioteca
          </Text>
        </Pressable>
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

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  // Tab Content
  tabContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },

  // Step Labels
  stepLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
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
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  briefingCardActive: {
    borderColor: colors.primary,
    backgroundColor: colorAlpha.primary10,
  },
  briefingTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
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
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: layout.buttonHeightLg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.7,
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
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  scriptCardUsed: {
    opacity: 0.6,
    borderColor: colorAlpha.muted40,
  },
  scriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  hookText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.sm,
  },
  usedBadge: {
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
  ctaText: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  scriptActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  copyButton: {
    backgroundColor: colorAlpha.primary20,
  },
  useButton: {
    backgroundColor: colorAlpha.success20,
  },
  actionButtonText: {
    color: colors.text,
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
  },
  libraryStatValue: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  libraryStatLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
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
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
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
  modalTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  modalClose: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  modalBody: {
    flex: 1,
    padding: spacing.md,
  },
  modalSection: {
    marginBottom: spacing.lg,
  },
  modalSectionLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: spacing.xs,
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
  modalFullScript: {
    color: colors.text,
    fontSize: fontSize.md,
    lineHeight: 26,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
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
  },
  modalActionText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
