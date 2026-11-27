// mobile/src/components/ui/Board.tsx
// Building blocks that mirror belikhub-design-board.html: inset groups, rows, serif titles,
// segmented control, bottom sheet, logo mark and topographic contours.
// Everything is drawn with Views and text; no icon font or SVG needed.

import React, { ReactNode } from 'react';
import { View, Text, Modal, ScrollView, StyleSheet, StyleProp, ViewStyle, Pressable } from 'react-native';
import { colors, typography, radius } from '../../theme/tokens';
import { PressableScale } from './PressableScale';

const T = colors.light;

/* ---------------- Titles ---------------- */

export const ScreenTitle: React.FC<{ title: string; subtitle?: string; right?: ReactNode; style?: StyleProp<ViewStyle> }> = ({
  title,
  subtitle,
  right,
  style
}) => (
  <View style={[s.titleRow, style]}>
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={s.title} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
    </View>
    {right}
  </View>
);

/* ---------------- Inset group ---------------- */

export interface GroupProps {
  head?: string;
  headRight?: string;
  foot?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const Group: React.FC<GroupProps> = ({ head, headRight, foot, children, style, testID }) => {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={style}>
      {head ? (
        <View style={s.groupHead}>
          <Text style={s.groupHeadText}>{head}</Text>
          {headRight ? <Text style={s.groupHeadRight}>{headRight}</Text> : null}
        </View>
      ) : null}
      <View style={s.group} testID={testID}>
        {items.map((child, i) => (
          <View key={i} style={i > 0 ? s.divider : undefined}>
            {child}
          </View>
        ))}
      </View>
      {foot ? <Text style={s.groupFoot}>{foot}</Text> : null}
    </View>
  );
};

export interface RowProps {
  title?: string;
  sub?: string;
  right?: ReactNode;
  strong?: boolean;
  mark?: { text: string; bg: string };
  chevron?: boolean;
  onPress?: () => void;
  testID?: string;
  mono?: boolean;
  children?: ReactNode;
}

export const Row: React.FC<RowProps> = ({ title, sub, right, strong, mark, chevron, onPress, testID, mono, children }) => {
  const body = (
    <View style={s.row}>
      {mark ? (
        <View style={[s.mark, { backgroundColor: mark.bg }]}>
          <Text style={s.markText}>{mark.text}</Text>
        </View>
      ) : null}
      <View style={s.rowText}>
        {title ? <Text style={[s.rowTitle, mono && { fontFamily: typography.fontFamilies.mono }]}>{title}</Text> : null}
        {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
        {children}
      </View>
      {right != null ? (
        typeof right === 'string' ? (
          <Text style={[s.rowRight, strong && s.rowRightStrong]}>{right}</Text>
        ) : (
          <View style={s.rowRightBox}>{right}</View>
        )
      ) : null}
      {chevron ? <Text style={s.chev}>›</Text> : null}
    </View>
  );
  if (!onPress) return <View testID={testID}>{body}</View>;
  return (
    <PressableScale onPress={onPress} scaleTo={0.992} testID={testID} accessibilityRole="button" accessibilityLabel={title}>
      {body}
    </PressableScale>
  );
};

/** A row of metrics split by hairlines, like the board's telemetry strip. */
export const Metrics: React.FC<{ items: { label: string; value: string; unit?: string }[] }> = ({ items }) => (
  <View style={s.metrics}>
    {items.map((m, i) => (
      <View key={m.label} style={[s.metric, i > 0 && s.metricDivider]}>
        <Text style={s.rowSub}>{m.label}</Text>
        <Text style={s.metricValue} numberOfLines={1} adjustsFontSizeToFit>
          {m.value}
          {m.unit ? <Text style={s.metricUnit}> {m.unit}</Text> : null}
        </Text>
      </View>
    ))}
  </View>
);

/* ---------------- Segmented control ---------------- */

export function Segmented<V extends string | number | boolean>({
  items,
  value,
  onChange,
  style
}: {
  items: { v: V; l: string }[];
  value: V;
  onChange: (v: V) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[s.seg, style]} accessibilityRole="tablist">
      {items.map((it) => {
        const on = it.v === value;
        return (
          <PressableScale
            key={String(it.v)}
            onPress={() => onChange(it.v)}
            scaleTo={0.98}
            haptic="selection"
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[s.segItem, on && s.segItemOn]}
          >
            <Text style={[s.segText, { opacity: on ? 1 : 0.72 }]}>{it.l}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

/* ---------------- Bottom sheet ---------------- */

export const Sheet: React.FC<{ visible: boolean; title: string; onClose: () => void; children: ReactNode }> = ({
  visible,
  title,
  onClose,
  children
}) => (
  <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <View style={s.sheetWrap}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Tutup" />
      <View style={s.sheet} accessibilityViewIsModal>
        <View style={s.grab} />
        <View style={s.sheetHead}>
          <Text style={s.sheetTitle} accessibilityRole="header">
            {title}
          </Text>
          <PressableScale onPress={onClose} accessibilityLabel="Tutup" hitSlop={8} style={s.closeBtn}>
            <Text style={s.closeX}>×</Text>
          </PressableScale>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

/* ---------------- Brand drawings ---------------- */

export const Logo: React.FC<{ size?: number; color?: string; leafColor?: string }> = ({
  size = 58,
  color = '#fff',
  leafColor = '#124734'
}) => {
  const leaf = size * 0.3;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden>
      <View
        style={{
          width: size * 0.62,
          height: size * 0.62,
          backgroundColor: color,
          borderTopLeftRadius: 0,
          borderTopRightRadius: size * 0.31,
          borderBottomLeftRadius: size * 0.31,
          borderBottomRightRadius: size * 0.31,
          transform: [{ rotate: '45deg' }],
          marginTop: size * 0.1
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: size * 0.46,
          width: leaf,
          height: leaf,
          backgroundColor: leafColor,
          borderTopLeftRadius: 0,
          borderTopRightRadius: leaf / 2,
          borderBottomLeftRadius: leaf / 2,
          borderBottomRightRadius: 0,
          transform: [{ translateX: leaf * 0.35 }]
        }}
      />
    </View>
  );
};

/** Topographic rings. Parent must be position:relative / overflow:hidden. */
export const Contours: React.FC<{ n?: number; gap?: number; rightOffset?: number; top?: number; opacity?: number; height?: number }> = ({
  n = 13,
  gap = 30,
  rightOffset = 100,
  top = 120,
  opacity = 0.13,
  height = 460
}) => (
  <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height }}>
    {Array.from({ length: n }, (_, i) => (i + 1) * gap).map((r) => (
      <View
        key={r}
        style={{
          position: 'absolute',
          width: r * 2,
          height: r * 2,
          borderRadius: r,
          borderWidth: 1,
          borderColor: `rgba(255,255,255,${opacity})`,
          right: rightOffset - r,
          top: top - r
        }}
      />
    ))}
  </View>
);

export const LiveDot: React.FC<{ color?: string }> = ({ color = '#16A34A' }) => (
  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
);

const s = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4, paddingTop: 6 },
  title: {
    fontFamily: typography.fontFamilies.display,
    fontSize: 34,
    fontWeight: '500',
    letterSpacing: -0.4,
    lineHeight: 37,
    color: T.ink
  },
  subtitle: { fontFamily: typography.fontFamilies.text, fontSize: 14, color: T.muted, marginTop: 2, lineHeight: 19 },

  groupHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 4,
    paddingTop: 20,
    paddingBottom: 7
  },
  groupHeadText: {
    fontFamily: typography.fontFamilies.text,
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: T.muted
  },
  groupHeadRight: { fontFamily: typography.fontFamilies.text, fontSize: 12.5, color: T.muted },
  group: { backgroundColor: '#fff', borderRadius: radius.md, overflow: 'hidden' },
  divider: { borderTopWidth: 1, borderTopColor: T.line },
  groupFoot: { fontFamily: typography.fontFamilies.text, fontSize: 12.5, color: T.muted, lineHeight: 17, paddingHorizontal: 4, paddingTop: 7 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 14, minHeight: 48 },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: typography.fontFamilies.text, fontSize: 16, fontWeight: '500', color: T.ink, lineHeight: 20 },
  rowSub: { fontFamily: typography.fontFamilies.text, fontSize: 13, color: T.muted, lineHeight: 17 },
  rowRight: { fontFamily: typography.fontFamilies.text, fontSize: 15, color: T.muted },
  rowRightStrong: { color: T.ink, fontWeight: '600' },
  rowRightBox: { alignItems: 'flex-end', gap: 4 },
  chev: { fontSize: 22, color: 'rgba(15,23,42,0.3)', lineHeight: 22 },
  mark: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  markText: { fontFamily: typography.fontFamilies.text, fontSize: 14, fontWeight: '700', color: '#fff' },

  metrics: { flexDirection: 'row' },
  metric: { flex: 1, paddingVertical: 9, paddingHorizontal: 14, minWidth: 0 },
  metricDivider: { borderLeftWidth: 1, borderLeftColor: T.line },
  metricValue: { fontFamily: typography.fontFamilies.text, fontSize: 25, fontWeight: '600', color: T.ink, lineHeight: 29 },
  metricUnit: { fontSize: 12, fontWeight: '500', color: T.muted },

  seg: { flexDirection: 'row', backgroundColor: 'rgba(15,23,42,0.07)', borderRadius: 10, padding: 2 },
  segItem: { flex: 1, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  segItemOn: {
    backgroundColor: '#fff',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.16,
    shadowRadius: 3,
    elevation: 1
  },
  segText: { fontFamily: typography.fontFamilies.text, fontSize: 13.5, fontWeight: '600', color: T.ink },

  sheetWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet: {
    backgroundColor: T.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center'
  },
  grab: { width: 36, height: 5, borderRadius: 3, backgroundColor: 'rgba(15,23,42,0.18)', alignSelf: 'center', marginBottom: 10 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sheetTitle: { fontFamily: typography.fontFamilies.display, fontSize: 24, fontWeight: '500', color: T.ink, flex: 1 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(15,23,42,0.07)', alignItems: 'center', justifyContent: 'center' },
  closeX: { fontSize: 22, lineHeight: 24, color: T.ink }
});
