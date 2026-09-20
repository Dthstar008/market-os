import { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '../../../src/components/ScreenContainer';
import { TextField } from '../../../src/components/TextField';
import { Button } from '../../../src/components/Button';
import { createAnnouncement, resolveAdminMarketId } from '../../../src/api/admin';
import { getAnnouncements } from '../../../src/api/markets';
import { apiErrorMessage } from '../../../src/api/client';
import { Announcement } from '../../../src/api/types';
import { colors, radius, spacing } from '../../../src/theme';

export default function AdminAnnouncementsScreen() {
  const { marketId: paramMarketId } = useLocalSearchParams<{ marketId?: string }>();
  const [marketId, setMarketId] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const requestSeq = useRef(0);

  const load = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const resolvedId = await resolveAdminMarketId(paramMarketId);
      if (seq !== requestSeq.current) return;
      if (!resolvedId) {
        setMarketId(null);
        setAnnouncements([]);
        return;
      }
      const announcementData = await getAnnouncements(resolvedId);
      if (seq !== requestSeq.current) return;
      setMarketId(resolvedId);
      setAnnouncements(announcementData);
    } catch (err) {
      if (seq === requestSeq.current) Alert.alert('Could not load announcements', apiErrorMessage(err));
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <ScreenContainer refreshing={loading} onRefresh={load}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Announcements</Text>
        <Button label={showForm ? 'Cancel' : 'New'} variant="secondary" onPress={() => setShowForm((v) => !v)} />
      </View>

      {showForm && marketId && (
        <NewAnnouncementForm
          marketId={marketId}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {announcements.length === 0 && !loading ? (
        <Text style={styles.empty}>No announcements yet.</Text>
      ) : (
        announcements.map((a) => (
          <View key={a.id} style={styles.card}>
            <Text style={styles.cardTitle}>{a.title}</Text>
            <Text style={styles.cardBody}>{a.body}</Text>
            <Text style={styles.meta}>{new Date(a.createdAt).toLocaleDateString()}</Text>
          </View>
        ))
      )}
    </ScreenContainer>
  );
}

function NewAnnouncementForm({ marketId, onCreated }: { marketId: string; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await createAnnouncement(marketId, { title: title.trim(), body: body.trim() });
      setTitle('');
      setBody('');
      onCreated();
    } catch (err) {
      Alert.alert('Could not post announcement', apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.form}>
      <TextField label="Title" value={title} onChangeText={setTitle} placeholder="Market sanitation exercise" />
      <TextField label="Message" value={body} onChangeText={setBody} placeholder="All traders are expected to participate..." multiline />
      <Button label="Post announcement" onPress={handleSubmit} loading={submitting} disabled={!title.trim() || !body.trim()} />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  cardBody: {
    color: colors.text,
    fontSize: 14,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
