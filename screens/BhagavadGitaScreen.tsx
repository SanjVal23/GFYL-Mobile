import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface MaterialItem {
  id: string;
  title: string;
  caption?: string;
  url: string;
  category?: string;
}

// Link to the Drive folder containing the class materials
const driveFolderUrl = 'https://drive.google.com/drive/folders/1c_Yj2OU9drQrEeel0_ifW1t_y_PuyMRV';

const materials: MaterialItem[] = [
  {
    id: '1',
    title: 'Class Materials (All Files)',
    caption: 'Slides, PDFs and presentations for all classes — opens Google Drive folder',
    url: driveFolderUrl,
    category: 'Class Materials',
  },
  {
    id: '2',
    title: 'Presentation - Class 1A-2 (PDF)',
    caption: 'Slides for Class 1A-2 (PDF)',
    url: driveFolderUrl, // users can find the specific file inside the folder
    category: 'Class Materials',
  },
  {
    id: '3',
    title: 'Class 3 (PDF)',
    caption: 'Class 3 handout and notes',
    url: driveFolderUrl,
    category: 'Class Materials',
  },
];

export default function BhagavadGitaScreen() {
  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Failed to open link:', err));
  };

  return (
    <LinearGradient colors={['#172554', '#1e3a8a']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gita For Youth Leadership</Text>
        <Text style={styles.headerSubtitle}>Course Materials — Class Files</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 30 }}>
        {materials.map((m) => (
          <TouchableOpacity key={m.id} onPress={() => openLink(m.url)}>
            <View style={styles.materialCard}>
              <View style={styles.materialInfo}>
                <Text style={styles.materialTitle}>{m.title}</Text>
                {m.caption ? <Text style={styles.materialCaption}>{m.caption}</Text> : null}
              </View>
              <View style={styles.openButton}>
                <Text style={styles.openButtonText}>Open</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 0 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#cbd5e1', marginTop: 4 },
  scrollView: { flex: 1 },
  materialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e40af',
    marginHorizontal: 15,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  materialInfo: { flex: 1 },
  materialTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 6 },
  materialCaption: { fontSize: 14, color: '#cbd5e1' },
  openButton: { backgroundColor: '#fb923c', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  openButtonText: { color: '#fff', fontWeight: '600' },
});
