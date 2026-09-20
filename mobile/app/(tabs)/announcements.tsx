import { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { getMyMarkets } from '../../src/api/trader';
import { getAnnouncements } from '../../src/api/markets';
import { apiErrorMessage } from '../../src/api/client';
import { Announcement } from '../../src/api/types';
import { colors, radius, spacing } from '../../src/theme';

export default function AnnouncementsScreen() {
  const [hasMarket, setHasMarket] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  // Screens stay mounted across tab switches, so an older, slower fetch can
  // resolve after a newer one — this sequence number lets us drop stale responses.
  const requestSeq = useRef(0);

  const load = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const memberships = await getMyMarkets();
      if (seq !== requestSeq.current) return;
      const mine = memberships[0];
      const announcementsData = mine ? await getAnnouncements(mine.marketId) : [];
      if (seq !== requestSeq.current) return;
      setHasMarket(!!mine);
      setAnnouncements(announcementsData);
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
      <Text style={styles.title}>Announcements</Text>

      {announcements.length === 0 && !loading ? (
        <Text style={styles.empty}>
          {hasMarket ? 'No announcements yet.' : "You're not in a market yet — nothing to show."}
        </Text>
      ) : (
        announcements.map((a) => (
          <View key={a.id} style={styles.card}>
            <Text style={styles.cardTitle}>{a.title}</Text>
            <Text style={styles.cardBody}>{a.body}</Text>
            <Text style={styles.meta}>
              {a.createdBy?.name ?? 'Market association'} · {new Date(a.createdAt).toLocaleDateString()}
            </Text>
          </View>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
