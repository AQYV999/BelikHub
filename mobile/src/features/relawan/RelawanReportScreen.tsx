// mobile/src/features/relawan/RelawanReportScreen.tsx
// Field report submission screen supporting 4 report types, GPS auto-capture & manual fallback, photo upload

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useColorScheme
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Badge, Button, Input, ImageUploadField, PressableScale, useToast } from '../../components/ui';
import { colors, typography, spacing, radius, textStyles } from '../../theme/tokens';
import { useAuth, useApi } from '../../auth/AuthProvider';
import { ReportType } from '../../api/types';
import {
  REPORT_TYPES,
  validateFieldReportInput
} from './relawanUtils';

export const RelawanReportScreen: React.FC = () => {
  const toast = useToast();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const { user, refreshProfile } = useAuth();
  const api = useApi();

  const [reportType, setReportType] = useState<ReportType>('Survei Mata Air');
  const [locationText, setLocationText] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // GPS state
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [capturingGps, setCapturingGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string>('');
  const [showManualGps, setShowManualGps] = useState<boolean>(false);
  const [manualLatStr, setManualLatStr] = useState<string>('');
  const [manualLngStr, setManualLngStr] = useState<string>('');

  // Photo state
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);

  // Form submission state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Handle GPS Auto-Capture via expo-location
  const handleCaptureGps = async () => {
    setGpsError('');
    setCapturingGps(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsError('Izin lokasi ditolak. Silakan masukkan koordinat secara manual.');
        setShowManualGps(true);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      const capturedLat = parseFloat(position.coords.latitude.toFixed(6));
      const capturedLng = parseFloat(position.coords.longitude.toFixed(6));

      setLat(capturedLat);
      setLng(capturedLng);
      setManualLatStr(String(capturedLat));
      setManualLngStr(String(capturedLng));
    } catch (e: any) {
      setGpsError('Gagal mendeteksi lokasi otomatis. Gunakan input koordinat manual.');
      setShowManualGps(true);
    } finally {
      setCapturingGps(false);
    }
  };

  // Handle manual coordinate input apply
  const handleApplyManualGps = () => {
    const parsedLat = parseFloat(manualLatStr);
    const parsedLng = parseFloat(manualLngStr);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      setGpsError('Koordinat manual harus berupa angka desimal valid.');
      return;
    }

    setLat(parsedLat);
    setLng(parsedLng);
    setGpsError('');
  };

  // Clear GPS
  const handleClearGps = () => {
    setLat(undefined);
    setLng(undefined);
    setManualLatStr('');
    setManualLngStr('');
    setGpsError('');
  };

  // Handle Submit Report
  const handleSubmit = async () => {
    setValidationError('');
    setSuccessMessage('');

    // Prepare input for validation
    const inputData = {
      reportType,
      location: locationText,
      notes,
      lat,
      lng,
      photoPath: photoPath || undefined,
      photoUrl: photoUrl || undefined
    };

    const validation = validateFieldReportInput(inputData);
    if (!validation.valid) {
      setValidationError(validation.error || 'Mohon lengkapi data laporan dengan benar.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createReport({
        reportType,
        location: locationText.trim(),
        notes: notes.trim(),
        lat,
        lng,
        photoPath: photoPath || undefined,
        photoUrl: photoUrl || undefined
      });

      if (res.success) {
        setSuccessMessage(
          `Laporan berhasil dikirim! ID: ${res.id}. Poin relawan bertambah +${res.points || 50}.`
        );
        // Reset form
        setLocationText('');
        setNotes('');
        setLat(undefined);
        setLng(undefined);
        setManualLatStr('');
        setManualLngStr('');
        setPhotoPath(null);
        setPhotoUrl(null);
        setShowManualGps(false);
        await refreshProfile();
      }
    } catch (e: any) {
      setValidationError(e?.message || 'Gagal mengirim laporan. Silakan periksa koneksi Anda.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scrollable contentContainerStyle={styles.container}>
      {/* Title */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.ink }]}>Laporan Lapangan</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Dokumentasikan survei mata air, restorasi, pohon & rorak
          </Text>
        </View>
        <Badge label="Relawan Konservasi" variant="accent" size="sm" />
      </View>

      {/* Success Banner */}
      {successMessage ? (
        <Card variant="flat" padding="md" style={[styles.alertCard, { backgroundColor: theme.successBg }]}>
          <View style={styles.alertRow}>
            <Ionicons name="checkmark-circle" size={24} color={theme.success} />
            <View style={styles.alertTextCol}>
              <Text style={[styles.alertTitle, { color: theme.successInk }]}>
                Pengiriman Sukses
              </Text>
              <Text style={[styles.alertBody, { color: theme.successInk }]}>
                {successMessage}
              </Text>
            </View>
          </View>
        </Card>
      ) : null}

      {/* Validation Error Banner */}
      {validationError ? (
        <Card variant="flat" padding="md" style={[styles.alertCard, { backgroundColor: theme.errorBg }]}>
          <View style={styles.alertRow}>
            <Ionicons name="alert-circle" size={24} color={theme.error} />
            <View style={styles.alertTextCol}>
              <Text style={[styles.alertTitle, { color: theme.errorInk }]}>
                Periksa Kembali Formulir
              </Text>
              <Text style={[styles.alertBody, { color: theme.errorInk }]}>
                {validationError}
              </Text>
            </View>
          </View>
        </Card>
      ) : null}

      {/* 1. Report Category Chips */}
      <Card variant="outlined" padding="md" style={styles.card}>
        <Text style={[styles.sectionHeading, { color: theme.ink }]}>
          1. Kategori Kegiatan Lapangan
        </Text>
        <Text style={[styles.sectionSubtitle, { color: theme.muted }]}>
          Pilih salah satu dari 4 program konservasi resmi BelikHub:
        </Text>

        <View style={styles.chipGrid}>
          {REPORT_TYPES.map((type) => {
            const isSelected = type === reportType;
            return (
              <PressableScale
                key={type}
                testID={`chip-report-type-${type}`}
                onPress={() => setReportType(type)}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: isSelected ? theme.accent : theme.surface,
                    borderColor: isSelected ? theme.accent : theme.border
                  }
                ]}
              >
                <Ionicons
                  name={
                    type === 'Survei Mata Air'
                      ? 'search-outline'
                      : type === 'Restorasi Mata Air'
                      ? 'water-outline'
                      : type === 'Penanaman Pohon'
                      ? 'leaf-outline'
                      : 'construct-outline'
                  }
                  size={16}
                  color={isSelected ? theme.accentInk : theme.ink}
                />
                <Text
                  style={[
                    styles.typeChipText,
                    {
                      color: isSelected ? theme.accentInk : theme.ink,
                      fontWeight: isSelected ? 'bold' : 'normal'
                    }
                  ]}
                >
                  {type}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      </Card>

      {/* 2. Location & GPS */}
      <Card variant="outlined" padding="md" style={styles.card}>
        <Text style={[styles.sectionHeading, { color: theme.ink }]}>
          2. Lokasi & Titik GPS
        </Text>

        <Input
          testID="input-report-location"
          label="Nama Lokasi / Dusun"
          placeholder="Contoh: Lereng Mata Air Tuk Bismo, Desa Silurah"
          value={locationText}
          onChangeText={setLocationText}
          maxLength={200}
          helperText={`${locationText.length}/200 karakter`}
        />

        {/* GPS Capture Controls */}
        <View style={styles.gpsContainer}>
          <View style={styles.gpsHeaderRow}>
            <Text style={[styles.gpsLabel, { color: theme.ink }]}>
              Koordinat GPS:
            </Text>
            {lat !== undefined && lng !== undefined && (
              <PressableScale onPress={handleClearGps}>
                <Text style={[styles.clearGpsText, { color: theme.error }]}>Hapus GPS</Text>
              </PressableScale>
            )}
          </View>

          {/* Captured GPS Pill */}
          {lat !== undefined && lng !== undefined ? (
            <View style={[styles.gpsPill, { backgroundColor: theme.surface }]}>
              <Ionicons name="navigate-circle" size={20} color={theme.accent} />
              <Text style={[styles.gpsCoordsText, { color: theme.ink }]}>
                {lat}, {lng}
              </Text>
              <Badge label="GPS Terekam" variant="success" size="sm" />
            </View>
          ) : (
            <View style={styles.gpsActionRow}>
              <Button
                testID="btn-capture-gps"
                title={capturingGps ? 'Mendeteksi GPS...' : 'Ambil GPS Otomatis'}
                variant="outline"
                size="sm"
                loading={capturingGps}
                onPress={handleCaptureGps}
                icon={<Ionicons name="locate" size={16} color={theme.accent} />}
              />
              <Button
                title={showManualGps ? 'Sembunyikan Manual' : 'Input Manual'}
                variant="ghost"
                size="sm"
                onPress={() => setShowManualGps(!showManualGps)}
              />
            </View>
          )}

          {gpsError ? (
            <Text style={[styles.gpsErrorText, { color: theme.warningInk }]}>
              {gpsError}
            </Text>
          ) : null}

          {/* Manual Coordinates Input Form (Graceful Fallback) */}
          {showManualGps && (
            <View style={[styles.manualGpsBox, { backgroundColor: theme.surface }]}>
              <Text style={[styles.manualGpsTitle, { color: theme.ink }]}>
                Input Koordinat Manual (Batas Indonesia: -11.5..6.5, 94..141.5)
              </Text>
              <View style={styles.manualGpsInputs}>
                <Input
                  label="Latitude"
                  placeholder="-7.3621"
                  value={manualLatStr}
                  onChangeText={setManualLatStr}
                  keyboardType="numeric"
                  containerStyle={{ flex: 1 }}
                />
                <Input
                  label="Longitude"
                  placeholder="109.9042"
                  value={manualLngStr}
                  onChangeText={setManualLngStr}
                  keyboardType="numeric"
                  containerStyle={{ flex: 1 }}
                />
              </View>
              <Button
                title="Terapkan Koordinat"
                variant="secondary"
                size="sm"
                onPress={handleApplyManualGps}
                style={styles.applyManualBtn}
              />
            </View>
          )}
        </View>
      </Card>

      {/* 3. Field Notes */}
      <Card variant="outlined" padding="md" style={styles.card}>
        <Text style={[styles.sectionHeading, { color: theme.ink }]}>
          3. Catatan Pengamatan Lapangan
        </Text>
        <Input
          testID="input-report-notes"
          placeholder="Tuliskan temuan debit, vegetasi pelindung, erosi, perbaikan pipa, atau kondisi rorak..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          maxLength={2000}
          style={styles.notesInput}
          helperText={`${notes.length}/2000 karakter`}
        />
      </Card>

      {/* 4. Photo Evidence */}
      <Card variant="outlined" padding="md" style={styles.card}>
        <Text style={[styles.sectionHeading, { color: theme.ink }]}>
          4. Foto Bukti Lapangan
        </Text>
        <ImageUploadField
          label="Unggah Foto Dokumentasi"
          helperText="Ambil foto langsung atau pilih dari galeri. Otomatis dikompresi maks 1280px."
          valueUri={photoUrl}
          onChange={async (base64) => {
            if (!base64) return;
            setUploadingPhoto(true);
            try {
              const res = await api.uploadImage('report_photo', base64);
              setPhotoPath(res.objectPath);
              setPhotoUrl(res.readUrl);
            } catch (e: any) {
              toast.error(e?.message || 'Gagal memproses gambar foto.', 'Gagal Unggah');
            } finally {
              setUploadingPhoto(false);
            }
          }}
          onClear={() => {
            setPhotoPath(null);
            setPhotoUrl(null);
          }}
        />
      </Card>

      {/* Submit Button */}
      <Button
        testID="btn-submit-report"
        title="Kirim Laporan Lapangan"
        variant="primary"
        size="lg"
        loading={submitting || uploadingPhoto}
        onPress={handleSubmit}
        icon={<Ionicons name="cloud-upload-outline" size={20} color="#ffffff" />}
        style={styles.submitBtn}
      />
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
    alignItems: 'flex-start',
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
  alertCard: {
    borderRadius: radius.md
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  alertTextCol: {
    flex: 1
  },
  alertTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold
  },
  alertBody: {
    fontSize: typography.fontSizes.xs,
    marginTop: 2,
    lineHeight: 16
  },
  card: {
    borderRadius: radius.lg,
    gap: spacing.sm
  },
  sectionHeading: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    fontFamily: typography.fontFamilies.display
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.text
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.5
  },
  typeChipText: {
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.text
  },
  gpsContainer: {
    marginTop: spacing.xs,
    gap: spacing.xs
  },
  gpsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  gpsLabel: {
    ...textStyles.label,
  },
  clearGpsText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium
  },
  gpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: radius.md
  },
  gpsCoordsText: {
    fontSize: typography.fontSizes.xs,
    fontFamily: typography.fontFamilies.mono
  },
  gpsActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  gpsErrorText: {
    fontSize: typography.fontSizes.xs,
    marginTop: spacing.xxs
  },
  manualGpsBox: {
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.xs
  },
  manualGpsTitle: {
    ...textStyles.label,
    marginBottom: spacing.xs
  },
  manualGpsInputs: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  applyManualBtn: {
    marginTop: spacing.xs
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top'
  },
  submitBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxl
  }
});
