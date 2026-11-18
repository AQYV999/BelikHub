// mobile/src/components/ui/ImageUploadField.tsx
// Image picker with client-side compression via expo-image-manipulator
// Max width 1280px, JPEG quality 0.75, base64 output
// Gracefully operates across Web Preview, Android, and iOS

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
  ViewStyle,
  useColorScheme
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { colors, radius, typography, spacing } from '../../theme/tokens';
import { Button } from './Button';

export interface ImageUploadFieldProps {
  label?: string;
  helperText?: string;
  valueUri?: string | null;
  onChange: (base64Data: string, uri: string, mimeType: string) => void;
  onClear?: () => void;
  containerStyle?: ViewStyle;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label = 'Unggah Foto / Bukti',
  helperText = 'Format JPG/PNG, dikompresi otomatis maks 1280px.',
  valueUri,
  onChange,
  onClear,
  containerStyle
}) => {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? colors.dark : colors.light;
  const [compressing, setCompressing] = useState<boolean>(false);
  const [previewUri, setPreviewUri] = useState<string | null>(valueUri || null);

  useEffect(() => {
    setPreviewUri(valueUri || null);
  }, [valueUri]);

  const processAndCompressImage = async (uri: string) => {
    setCompressing(true);
    try {
      // Compress with expo-image-manipulator: max width 1280px, quality 0.75, JPEG format, base64 output
      const manipulated = await manipulateAsync(
        uri,
        [{ resize: { width: 1280 } }],
        {
          compress: 0.75,
          format: SaveFormat.JPEG,
          base64: true
        }
      );

      const base64Output = manipulated.base64 || '';
      setPreviewUri(manipulated.uri);
      onChange(base64Output, manipulated.uri, 'image/jpeg');
    } catch (err: any) {
      console.warn('ImageUploadField: Compression failed, using fallback:', err);
      // Fallback if manipulator fails on certain platforms
      setPreviewUri(uri);
      onChange('', uri, 'image/jpeg');
    } finally {
      setCompressing(false);
    }
  };

  const pickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted && Platform.OS !== 'web') {
        Alert.alert('Izin Galeri', 'Aplikasi memerlukan izin untuk mengakses galeri foto.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await processAndCompressImage(asset.uri);
      }
    } catch (error: any) {
      console.error('ImagePicker library error:', error);
      Alert.alert('Gagal Membuka Galeri', error.message || 'Terjadi kesalahan.');
    }
  };

  const pickFromCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted && Platform.OS !== 'web') {
        Alert.alert('Izin Kamera', 'Aplikasi memerlukan izin untuk mengakses kamera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await processAndCompressImage(asset.uri);
      }
    } catch (error: any) {
      console.error('ImagePicker camera error:', error);
      Alert.alert('Gagal Membuka Kamera', error.message || 'Terjadi kesalahan.');
    }
  };

  const handleClear = () => {
    setPreviewUri(null);
    onClear?.();
    onChange('', '', '');
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={[styles.label, { color: theme.ink }]}>{label}</Text> : null}

      {compressing ? (
        <View style={[styles.loadingBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ActivityIndicator color={theme.accent} size="small" />
          <Text style={[styles.loadingText, { color: theme.muted }]}>
            Mengompresi gambar (maks 1280px)...
          </Text>
        </View>
      ) : previewUri ? (
        <View style={[styles.previewContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="cover" />
          <View style={styles.previewActions}>
            <Button
              title="Ganti Foto"
              onPress={pickFromGallery}
              variant="outline"
              size="sm"
              style={styles.actionBtn}
            />
            <Button
              title="Hapus"
              onPress={handleClear}
              variant="danger"
              size="sm"
              style={styles.actionBtn}
            />
          </View>
        </View>
      ) : (
        <View style={[styles.pickerBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.pickerPrompt, { color: theme.muted }]}>
            Pilih gambar dari galeri atau ambil foto baru
          </Text>
          <View style={styles.pickerButtons}>
            <Button
              title="Galeri"
              onPress={pickFromGallery}
              variant="secondary"
              size="sm"
              style={styles.pickBtn}
            />
            <Button
              title="Kamera"
              onPress={pickFromCamera}
              variant="secondary"
              size="sm"
              style={styles.pickBtn}
            />
          </View>
        </View>
      )}

      {helperText ? (
        <Text style={[styles.helper, { color: theme.muted }]}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
    width: '100%'
  },
  label: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    marginBottom: spacing.xs
  },
  pickerBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pickerPrompt: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    marginBottom: spacing.md,
    textAlign: 'center'
  },
  pickerButtons: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  pickBtn: {
    minWidth: 90
  },
  loadingBox: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    marginTop: spacing.sm
  },
  previewContainer: {
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden'
  },
  previewImage: {
    width: '100%',
    height: 180
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.sm,
    gap: spacing.sm
  },
  actionBtn: {
    minWidth: 80
  },
  helper: {
    fontFamily: typography.fontFamilies.text,
    fontSize: typography.fontSizes.xs,
    marginTop: spacing.xxs
  }
});
