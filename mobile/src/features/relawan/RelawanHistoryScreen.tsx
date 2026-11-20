// mobile/src/features/relawan/RelawanHistoryScreen.tsx
// Volunteer report history list with status filtering, photo preview, and points tracking

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  useColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Badge, Button, EmptyState, PressableScale } from '../../components/ui';
import { colors, typography, spacing, radius } from '../../theme/tokens';
import { useAuth, useApi } from '../../auth/AuthProvider';
import { FieldReport, ReportStatus } from '../../api/types';
import { getReportStatusMeta } from './relawanUtils';

type FilterTab = 'all' | ReportStatus;

export const RelawanHistoryScreen: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { user } = useAuth();
  const api = useApi();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('all');

  const loadReports = useCallback(async () => {
    try {
      const res = await api.listMyReports();
      if (res?.reports) {
        setReports(res.reports);
      }
    } catch (e) {
      console.warn('RelawanHistoryScreen: Error loading reports', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReports();
  };

  const filteredReports = reports.filter((r) => {
    if (selectedFilter === 'all') return true;
    return r.status === selectedFilter;
  });

  return (
    <Screen
      loading={loading}
      scrollable
      refreshing={refreshing}
      onRefresh={handleRefresh}
      contentContainerStyle={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.ink }]}>Riwayat Laporan</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Daftar kontribusi survei, restorasi, pohon & rorak Anda
          </Text>
        </View>
        <Badge
          label={`${reports.length} Laporan`}
          variant="accent"
          size="sm"
        />
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {(
          [
            { key: 'all', label: 'Semua' },
            { key: 'pending', label: 'Menunggu' },
            { key: 'approved', label: 'Disetujui' },
            { key: 'rejected', label: 'Ditolak' }
          ] as { key: FilterTab; label: string }[]
        ).map((tab) => {
          const isActive = selectedFilter === tab.key;
          return (
            <PressableScale
              key={tab.key}
              onPress={() => setSelectedFilter(tab.key)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? theme.accent : theme.surface,
                  borderColor: isActive ? theme.accent : theme.border
                }
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: isActive ? theme.accentInk : theme.ink,
                    fontWeight: isActive ? 'bold' : 'normal'
                  }
                ]}
              >
                {tab.label}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="document-text-outline" size={48} color={theme.muted} />}
          title="Tidak Ada Laporan"
          description={
            selectedFilter === 'all'
              ? 'Anda belum mengirimkan laporan kegiatan lapangan. Gunakan tab Lapor untuk mengirim laporan pertama.'
              : `Tidak ditemukan laporan dengan status ${selectedFilter}.`
          }
        />
      ) : (
        filteredReports.map((report) => {
          const statusMeta = getReportStatusMeta(report.status);
          const hasGps = report.lat !== undefined && report.lng !== undefined;
          const formattedDate = report.createdAt
            ? new Date(report.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            : '';

          return (
            <Card
              key={report.id}
              variant="outlined"
              padding="md"
              style={styles.card}
            >
              {/* Card Top Row */}
              <View style={styles.cardTopRow}>
                <Badge label={report.reportType} variant="accent" size="sm" />
                <Badge label={statusMeta.label} variant={statusMeta.tone} size="sm" />
              </View>

              {/* Location & Date */}
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color={theme.muted} />
                <Text style={[styles.locationText, { color: theme.ink }]} numberOfLines={1}>
                  {report.location}
                </Text>
                {formattedDate ? (
                  <Text style={[styles.dateText, { color: theme.muted }]}>
                    • {formattedDate}
                  </Text>
                ) : null}
              </View>

              {/* Photo Thumbnail if available */}
              {report.photoUrl && (
                <View style={styles.photoContainer}>
                  <Image
                    source={{ uri: report.photoUrl }}
                    style={styles.reportPhoto}
                    resizeMode="cover"
                  />
                </View>
              )}

              {/* Notes Excerpt */}
              <Text style={[styles.notesText, { color: theme.muted }]}>
                {report.notes}
              </Text>

              {/* Footer info: GPS & Points */}
              <View style={styles.cardFooter}>
                {hasGps ? (
                  <View style={styles.gpsRow}>
                    <Ionicons name="navigate" size={14} color={theme.accent} />
                    <Text style={[styles.gpsText, { color: theme.muted }]}>
                      {report.lat?.toFixed(4)}, {report.lng?.toFixed(4)}
                    </Text>
                  </View>
                ) : (
                  <View />
                )}

                <View style={styles.pointsWrap}>
                  <Ionicons name="ribbon" size={14} color={theme.success} />
                  <Text style={[styles.pointsText, { color: theme.success }]}>
                    +{report.points ?? 50} Poin
                  </Text>
                </View>
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.display
  },
  subtitle: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
    fontFamily: typography.fontFamilies.text
  },
  filterRow: {
    gap: spacing.xs,
    paddingVertical: spacing.xxs
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1.5
  },
  filterChipText: {
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.text
  },
  card: {
    borderRadius: radius.lg,
    gap: spacing.xs
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xxs
  },
  locationText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    flex: 1
  },
  dateText: {
    fontSize: typography.fontSizes.xs
  },
  photoContainer: {
    marginVertical: spacing.xs,
    borderRadius: radius.md,
    overflow: 'hidden'
  },
  reportPhoto: {
    width: '100%',
    height: 160,
    backgroundColor: '#e2e8f0'
  },
  notesText: {
    fontSize: typography.fontSizes.xs,
    lineHeight: 18,
    marginVertical: spacing.xxs
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)'
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  gpsText: {
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.mono
  },
  pointsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  pointsText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.mono
  }
});
