import { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { getMyMarkets } from '../../src/api/trader';
import { getMyDues, payDuesInvoice } from '../../src/api/markets';
import { apiErrorMessage } from '../../src/api/client';
import { DuesInvoice } from '../../src/api/types';
import { formatNaira } from '../../src/utils/currency';
import { colors, radius, spacing } from '../../src/theme';

const STATUS_TONE = {
  pending: 'warning',
  overdue: 'negative',
  paid: 'positive',
  waived: 'default',
} as const;

export default function DuesScreen() {
  const [marketId, setMarketId] = useState<string | null>(null);
  const [dues, setDues] = useState<DuesInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
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
      if (!mine) {
        setMarketId(null);
        setDues([]);
        return;
      }
      const duesData = await getMyDues(mine.marketId);
      if (seq !== requestSeq.current) return;
      setMarketId(mine.marketId);
      setDues(duesData);
    } catch (err) {
      if (seq === requestSeq.current) Alert.alert('Could not load dues', apiErrorMessage(err));
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
    if (!marketId) return;
    setPayingId(invoice.id);
    try {
      await payDuesInvoice(marketId, invoice.id);
      await load();
    } catch (err) {
      Alert.alert('Could not record payment', apiErrorMessage(err));
    } finally {
      setPayingId(null);
    }
  }

  const total = dues.filter((d) => d.status === 'pending' || d.status === 'overdue').reduce((sum, d) => sum + d.amount, 0);

  return (
    <ScreenContainer refreshing={loading} onRefresh={load}>
      <Text style={styles.title}>Dues</Text>
      {total > 0 && <Text style={styles.total}>Outstanding: {formatNaira(total)}</Text>}

      {dues.length === 0 && !loading ? (
        <Text style={styles.empty}>
          {marketId ? 'No dues invoices yet.' : "You're not in a market yet — nothing to show."}
        </Text>
      ) : (
        dues.map((d) => (
          <View key={d.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.levyName}>{d.levy?.name ?? 'Due'}</Text>
              <Badge label={d.status} tone={STATUS_TONE[d.status]} />
            </View>
            <Text style={styles.period}>{d.period}</Text>
            <Text style={styles.amount}>{formatNaira(d.amount)}</Text>
            {(d.status === 'pending' || d.status === 'overdue') && (
              <Button label="Mark as paid" onPress={() => handlePay(d)} loading={payingId === d.id} />
            )}
            {d.status === 'paid' && d.paidAt ? (
              <Text style={styles.paidNote}>Paid {new Date(d.paidAt).toLocaleDateString()}</Text>
            ) : null}
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
  total: {
    color: colors.textMuted,
    fontWeight: '600',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levyName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  period: {
    color: colors.textMuted,
    fontSize: 13,
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  paidNote: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
