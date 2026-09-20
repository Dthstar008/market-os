import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { getMyMarkets } from '../../src/api/trader';
import { getAnnouncements, getMyDues, payDuesInvoice } from '../../src/api/markets';
import { apiErrorMessage } from '../../src/api/client';
import { Announcement, DuesInvoice, MarketMembership } from '../../src/api/types';
import { formatNaira } from '../../src/utils/currency';
import { useAuthStore } from '../../src/store/auth-store';
import { colors, radius, spacing } from '../../src/theme';

const STATUS_TONE = {
  pending: 'warning',
  overdue: 'negative',
  paid: 'positive',
  waived: 'default',
} as const;

export default function HomeScreen() {
  const trader = useAuthStore((s) => s.trader);
  const logout = useAuthStore((s) => s.logout);
  const [membership, setMembership] = useState<MarketMembership | null | undefined>(undefined);
  const [dues, setDues] = useState<DuesInvoice[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  // Screens stay mounted across tab switches, so an older, slower fetch can
  // resolve after a newer one — this sequence number lets us drop stale responses.
  const requestSeq = useRef(0);

  const load = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    try {
      const memberships = await getMyMarkets();
      if (seq !== requestSeq.current) return;
      const mine = memberships[0] ?? null;
      setMembership(mine);
      if (mine) {
        const [duesData, announcementsData] = await Promise.all([
          getMyDues(mine.marketId),
          getAnnouncements(mine.marketId),
        ]);
        if (seq !== requestSeq.current) return;
        setDues(duesData);
        setAnnouncements(announcementsData.slice(0, 2));
      }
    } catch (err) {
      if (seq === requestSeq.current) setError(apiErrorMessage(err));
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handlePay(invoice: DuesInvoice) {
    if (!membership) return;
    setPayingId(invoice.id);
    try {
      await payDuesInvoice(membership.marketId, invoice.id);
      await load();
    } catch (err) {
      Alert.alert('Could not record payment', apiErrorMessage(err));
    } finally {
      setPayingId(null);
    }
  }

  const outstanding = dues.filter((d) => d.status === 'pending' || d.status === 'overdue');
  const nextDue = outstanding[0];

  return (
    <ScreenContainer refreshing={loading} onRefresh={load}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>{trader?.name ?? 'Your profile'}</Text>
          <Text style={styles.subtitle}>{membership?.market?.name ?? 'Market OS'}</Text>
        </View>
        <Pressable
          onPress={() => {
            logout();
            router.replace('/login');
          }}
        >
          <Text style={styles.logout}>Log out</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {membership === null && !loading && !error ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>You're not in a market yet</Text>
          <Text style={styles.emptyBody}>
            Ask your market association's admin to add you as a member — give them the email you
            registered with.
          </Text>
        </View>
      ) : null}

      {membership ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Market dues</Text>
            {nextDue ? (
              <>
                <View style={styles.rowBetween}>
                  <Text style={styles.dueLabel}>{nextDue.levy?.name ?? 'Due'} — {nextDue.period}</Text>
                  <Badge label={nextDue.status} tone={STATUS_TONE[nextDue.status]} />
                </View>
                <Text style={styles.dueAmount}>{formatNaira(nextDue.amount)}</Text>
                <Button
                  label="Mark as paid"
                  onPress={() => handlePay(nextDue)}
                  loading={payingId === nextDue.id}
                />
              </>
            ) : (
              <Text style={styles.subtitle}>All dues paid — nothing outstanding.</Text>
            )}
            {outstanding.length > 1 && (
              <Text style={styles.moreDue}>+{outstanding.length - 1} more outstanding — see Dues tab</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent announcements</Text>
            {announcements.length === 0 ? (
              <Text style={styles.subtitle}>No announcements yet.</Text>
            ) : (
              announcements.map((a) => (
                <View key={a.id} style={styles.announcementRow}>
                  <Text style={styles.announcementTitle}>{a.title}</Text>
                  <Text style={styles.announcementBody} numberOfLines={2}>{a.body}</Text>
                </View>
              ))
            )}
          </View>
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  logout: {
    color: colors.danger,
    fontWeight: '600',
  },
  errorText: {
    color: colors.danger,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptyBody: {
    fontSize: 14,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueLabel: {
    color: colors.text,
    fontWeight: '600',
  },
  dueAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  moreDue: {
    fontSize: 12,
    color: colors.textMuted,
  },
  announcementRow: {
    gap: 2,
  },
  announcementTitle: {
    fontWeight: '600',
    color: colors.text,
  },
  announcementBody: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
