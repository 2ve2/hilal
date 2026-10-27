import { StyleSheet, Text, View } from 'react-native';
import { formatHijri, toHijri } from 'react-native-hilal';

const today = toHijri(new Date());

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{formatHijri(today)}</Text>
      <Text style={styles.text}>{formatHijri(today, { locale: 'en' })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    marginVertical: 4,
  },
});
