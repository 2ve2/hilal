import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { DEMOS } from './demos';

const light = {
  page: '#F2F4F7',
  text: '#101828',
  muted: '#667085',
  chip: '#FFFFFF',
  chipText: '#344054',
  chipBorder: '#E4E7EC',
  accent: '#0F766E',
  code: '#FFFFFF',
  codeText: '#1D2939',
};

const dark: typeof light = {
  page: '#0B0D10',
  text: '#F2F4F7',
  muted: '#98A2B3',
  chip: '#1A1F25',
  chipText: '#D0D5DD',
  chipBorder: '#2A3038',
  accent: '#2DD4BF',
  code: '#14171B',
  codeText: '#E4E7EC',
};

export default function App() {
  return (
    <SafeAreaProvider>
      <Showcase />
    </SafeAreaProvider>
  );
}

function Showcase() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const [demoId, setDemoId] = useState(DEMOS[0]!.id);
  const demo = DEMOS.find((d) => d.id === demoId) ?? DEMOS[0]!;
  const isDark =
    demo.dark === 'always' || (demo.dark === 'auto' && scheme === 'dark');
  const colors = isDark ? dark : light;

  return (
    <View style={[styles.page, { backgroundColor: colors.page }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 },
        ]}
      >
        <View style={styles.hero}>
          <Crescent color={colors.accent} background={colors.page} />
          <View>
            <Text style={[styles.brand, { color: colors.text }]}>
              Hilal <Text style={{ color: colors.accent }}>هلال</Text>
            </Text>
            <Text style={[styles.tagline, { color: colors.muted }]}>
              Hijri & Gregorian date picker for React Native
            </Text>
          </View>
        </View>

        <View style={styles.chips}>
          {DEMOS.map((d) => {
            const active = d.id === demo.id;
            return (
              <Pressable
                key={d.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setDemoId(d.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.accent : colors.chip,
                    borderColor: active ? colors.accent : colors.chipBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? colors.page : colors.chipText },
                  ]}
                >
                  {d.title}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.description, { color: colors.muted }]}>
          {demo.description}
        </Text>

        {/* Remount per demo so each one starts from its own defaults. */}
        <demo.Component key={demo.id} />

        <View
          style={[
            styles.code,
            { backgroundColor: colors.code, borderColor: colors.chipBorder },
          ]}
        >
          <Text style={[styles.codeText, { color: colors.codeText }]}>
            {demo.code}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/** A crescent drawn with two circles: no image assets needed. */
function Crescent({
  color,
  background,
}: {
  color: string;
  background: string;
}) {
  return (
    <View style={[styles.moon, { backgroundColor: color }]}>
      <View style={[styles.moonShadow, { backgroundColor: background }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    maxWidth: 480,
    paddingHorizontal: 16,
    width: '100%',
  },
  hero: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  moon: {
    borderRadius: 22,
    height: 44,
    overflow: 'hidden',
    width: 44,
  },
  moonShadow: {
    borderRadius: 22,
    height: 44,
    position: 'absolute',
    top: -6,
    width: 44,
    start: 12,
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
  },
  tagline: {
    fontSize: 14,
    marginTop: 2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    marginTop: 16,
  },
  code: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  codeText: {
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    fontSize: 13,
    lineHeight: 19,
  },
});
