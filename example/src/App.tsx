import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import { HilalCalendar, type SelectedDate } from 'react-native-hilal';

export default function App() {
  const [selected, setSelected] = useState<SelectedDate>();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <HilalCalendar onChange={setSelected} />
        <Text style={styles.selected}>
          {selected
            ? `${selected.formatted.hijri} · ${selected.formatted.gregorian}`
            : 'اختر يومًا'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  content: {
    padding: 16,
  },
  selected: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
  },
});
