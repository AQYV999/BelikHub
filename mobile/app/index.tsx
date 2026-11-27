// mobile/app/index.tsx
// The whole app: the design board's phone (screens 1.1 to 6.4), ported 1:1.

import React from 'react';
import { Platform, View, Text } from 'react-native';
import MobileApp from '../src/proto/board';

export default function Index() {
  if (Platform.OS !== 'web') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#F8FAFC' }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#0F172A', textAlign: 'center' }}>
          Versi native BelikHub sedang dibangun ulang dari papan desain. Buka lewat web untuk saat ini.
        </Text>
      </View>
    );
  }
  return <MobileApp />;
}
