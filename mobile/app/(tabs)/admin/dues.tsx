import { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '../../../src/components/ScreenContainer';
import { Badge } from '../../../src/components/Badge';
import { listAllDues, resolveAdminMarketId } from '../../../src/api/admin';
import { apiErrorMessage } from '../../../src/api/client';
import { DuesInvoice } from '../../../src/api/types';
import { formatNaira } from '../../../src/utils/currency';
import { colors, radius, spacing } from '../../../src/theme';

const STATUS_TONE = {
  pending: 'warning',
  overdue: 'negative',
  paid: 'positive',
  waived: 'default',
} as const;

export default function AdminDuesScreen() {
  const { marketId: paramMarketId } = useLocalSearchParams<{ marketId?: string }>();
  const [dues, setDues] = useState<DuesInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const requestSeq = useRef(0);

  const load = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const resolvedId = await resolveAdminMarketId(paramMarketId);
      if (seq !== requestSeq.current) return;
      const duesData = resolvedId ? await listAllDues(resolvedId) : [];
      if (seq !== requestSeq.current) return;
      setDues(duesData);
    } catch (err) {
      if (seq === requestSeq.current) Alert.alert('Could not load dues', apiErrorMessage(err));
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [paramMarketId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const outstanding = dues.filter((d) => d.status === 'pending' || d.status === 'overdue');
  const outstandingTotal = outstanding.reduce((sum, d) => sum + d.amount, 0);

  return (
    <ScreenContainer refreshing={loading} onRefresh={load}>
      <Text style={styles.title}>All dues</Text>
      {dues.length > 0 && (
        <Text style={styles.summary}>
          {outstanding.length} outstanding · {formatNaira(outstandingTotal)}
        </Text>
      )}

      {dues.length === 0 && !loading ? (
        <Text style={styles.empty}>No dues invoices yet.</Text>
      ) : (
        dues.map((d) => (
          <View key={d.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.traderName}>{d.membership?.trader?.name ?? 'Trader'}</Text>
              <Badge label={d.status} tone={STATUS_TONE[d.status]} />
            </View>
            <Text style={styles.detail}>{d.levy?.name ?? 'Due'} · {d.period}</Text>
            <Text style={styles.amount}>{formatNaira(d.amount)}</Text>
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
  summary: {
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
  traderName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  detail: {
    color: colors.textMuted,
    fontSize: 13,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});
