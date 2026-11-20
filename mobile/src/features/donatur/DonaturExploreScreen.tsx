// mobile/src/features/donatur/DonaturExploreScreen.tsx
// Donatur Explore: filterable campaign cards showing funding progress, revitalization %, KK beneficiaries, and ~5 km region label

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Badge, Button, ProgressBar, EmptyState, PressableScale } from '../../components/ui';
import { colors, typography, spacing, radius } from '../../theme/tokens';
import { useAuth, useApi } from '../../auth/AuthProvider';
import { RevitalizationCampaign } from '../../api/types';
import { formatRupiah } from '../warga/wargaUtils';
import { calculateFundingProgress, filterCampaignsByStatus } from './donaturUtils';
import { DonaturCampaignDetailScreen } from './DonaturCampaignDetailScreen';

type CampaignFilter = 'all' | 'active' | 'completed';

export const DonaturExploreScreen: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { user, activeRole } = useAuth();
  const api = useApi();

  const [campaigns, setCampaigns] = useState<RevitalizationCampaign[]>([]);
  const [filter, setFilter] = useState<CampaignFilter>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    try {
      const res = await api.listCampaigns();
      if (res.campaigns) {
        setCampaigns(res.campaigns);
      }
    } catch (err) {
      console.warn('DonaturExploreScreen: loadCampaigns error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns, activeRole]);

  // If a campaign is selected, render DonaturCampaignDetailScreen with back button
  if (selectedCampaignId) {
    return (
      <DonaturCampaignDetailScreen
        campaignId={selectedCampaignId}
        onClose={() => setSelectedCampaignId(null)}
        onDonationSuccess={() => {
          loadCampaigns();
        }}
      />
    );
  }

  const filteredCampaigns = filterCampaignsByStatus(campaigns, filter);

  return (
    <Screen
      loading={loading}
      scrollable
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        loadCampaigns();
      }}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.headerGreeting, { color: theme.muted }]}>
            Kolaborasi Konservasi Air
          </Text>
          <Text style={[styles.headerTitle, { color: theme.ink }]}>
            Program Revitalisasi Mata Air
          </Text>
        </View>
        <Badge
          label={user?.donorType === 'organization' ? 'Mitra CSR' : 'Donatur'}
          variant="accent"
          size="md"
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { id: 'all', label: 'Semua Program' },
          { id: 'active', label: 'Aktif Berjalan' },
          { id: 'completed', label: 'Selesai' }
        ].map((f) => {
          const isSelected = filter === f.id;
          return (
            <PressableScale
              key={f.id}
              testID={`filter-campaign-${f.id}`}
              onPress={() => setFilter(f.id as CampaignFilter)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isSelected ? theme.accent : theme.surface,
                  borderColor: isSelected ? theme.accent : theme.border
                }
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: isSelected ? theme.accentInk : theme.ink,
                    fontWeight: isSelected ? typography.fontWeights.bold : typography.fontWeights.medium
                  }
                ]}
              >
                {f.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>

      {/* Campaigns List */}
      {filteredCampaigns.length === 0 ? (
        <EmptyState
          title="Tidak Ada Program"
          description="Belum ada program revitalisasi untuk kriteria filter yang dipilih."
          icon="leaf-outline"
        />
      ) : (
        filteredCampaigns.map((camp) => {
          const funding = calculateFundingProgress(camp.targetAmount, camp.collectedAmount);
          return (
            <Card
              key={camp.id}
              variant="elevated"
              padding="lg"
              style={styles.campaignCard}
              testID={`campaign-card-${camp.id}`}
            >
              {/* Top Meta: Spring Name & ~5 km region label */}
              <View style={styles.cardMetaRow}>
                <View style={styles.springInfoRow}>
                  <Ionicons name="location-outline" size={14} color={theme.accent} />
                  <Text style={[styles.springLocation, { color: theme.muted }]}>
                    {camp.springName || 'Mata Air'} • Batang (~5 km radius)
                  </Text>
                </View>
                <Badge
                  label={camp.status === 'active' ? 'Aktif' : 'Selesai'}
                  variant={camp.status === 'active' ? 'success' : 'neutral'}
                  size="sm"
                />
              </View>

              {/* Title & Description */}
              <Text style={[styles.campaignCardTitle, { color: theme.ink }]}>
                {camp.title}
              </Text>
              {camp.description ? (
                <Text style={[styles.campaignCardDesc, { color: theme.muted }]} numberOfLines={2}>
                  {camp.description}
                </Text>
              ) : null}

              {/* Impact Highlights: KK beneficiaries */}
              <View style={styles.impactHighlightRow}>
                <View style={[styles.impactChip, { backgroundColor: theme.accentMuted }]}>
                  <Ionicons name="people-outline" size={14} color={theme.accent} />
                  <Text style={[styles.impactChipText, { color: theme.accent }]}>
                    ~2.500 KK Penerima Air
                  </Text>
                </View>

                <View style={[styles.impactChip, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="leaf-outline" size={14} color="#16a34a" />
                  <Text style={[styles.impactChipText, { color: '#15803d' }]}>
                    Fisik: {camp.progressPercent || 0}%
                  </Text>
                </View>
              </View>

              {/* Funding Progress Bar */}
              <View style={styles.fundingWrap}>
                <View style={styles.fundingTopRow}>
                  <Text style={[styles.fundingCollected, { color: theme.ink }]}>
                    {formatRupiah(camp.collectedAmount)}
                  </Text>
                  <Text style={[styles.fundingPercentage, { color: theme.accent }]}>
                    {funding.percent}%
                  </Text>
                </View>
                <ProgressBar progress={funding.percent} height={8} />
                <View style={styles.fundingBottomRow}>
                  <Text style={[styles.fundingTarget, { color: theme.muted }]}>
                    Target: {formatRupiah(camp.targetAmount)}
                  </Text>
                  {funding.remaining > 0 && (
                    <Text style={[styles.fundingRemaining, { color: theme.muted }]}>
                      Sisa {formatRupiah(funding.remaining)}
                    </Text>
                  )}
                </View>
              </View>

              {/* Action Button: Detail & Donasi */}
              <Button
                testID={`btn-open-campaign-${camp.id}`}
                title="Lihat Program & Donasi"
                variant="primary"
                size="md"
                icon={<Ionicons name="heart-outline" size={16} color={theme.accentInk} />}
                onPress={() => setSelectedCampaignId(camp.id)}
                style={styles.openDetailBtn}
              />
            </Card>
          );
        })
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  headerGreeting: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium
  },
  headerTitle: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1
  },
  filterChipText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  campaignCard: {
    marginBottom: spacing.md
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  springInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  springLocation: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs
  },
  campaignCardTitle: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    marginTop: 2
  },
  campaignCardDesc: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    lineHeight: 18,
    marginTop: 4
  },
  impactHighlightRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: spacing.sm
  },
  impactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm
  },
  impactChipText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: 11,
    fontWeight: typography.fontWeights.semibold
  },
  fundingWrap: {
    marginVertical: spacing.xs
  },
  fundingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  fundingCollected: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold
  },
  fundingPercentage: {
    fontFamily: typography.fontFamilies.display,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold
  },
  fundingBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4
  },
  fundingTarget: {
    fontFamily: typography.fontFamilies.text,
    fontSize: 11
  },
  fundingRemaining: {
    fontFamily: typography.fontFamilies.text,
    fontSize: 11
  },
  openDetailBtn: {
    marginTop: spacing.sm
  }
});
