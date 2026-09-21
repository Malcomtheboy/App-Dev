import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/theme-context';

export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <SafeAreaView style={[styles.card, { backgroundColor: colors.surface }]} edges={['bottom']}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={[styles.close, { backgroundColor: colors.iconCircle }]}>
            <Ionicons name="close" size={17} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        {children}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  card: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingTop: 10, maxHeight: '86%' },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 19, fontWeight: '700', letterSpacing: -0.3 },
  close: { height: 32, width: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
