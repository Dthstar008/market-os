import { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '../../../src/components/ScreenContainer';
import { TextField } from '../../../src/components/TextField';
import { Button } from '../../../src/components/Button';
import { Badge } from '../../../src/components/Badge';
import { addMember, listMembers, lookupTraderByEmail, resolveAdminMarketId } from '../../../src/api/admin';
import { apiErrorMessage } from '../../../src/api/client';
import { MarketMembership } from '../../../src/api/types';
import { colors, radius, spacing } from '../../../src/theme';

const STATUS_TONE = {
  active: 'positive',
  suspended: 'warning',
  exited: 'negative',
} as const;

export default function AdminMembersScreen() {
  const { marketId: paramMarketId } = useLocalSearchParams<{ marketId?: string }>();
  const [marketId, setMarketId] = useState<string | null>(null);
  const [members, setMembers] = useState<MarketMembership[]>([]);
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
        setMembers([]);
        return;
      }
      const memberData = await listMembers(resolvedId);
      if (seq !== requestSeq.current) return;
      setMarketId(resolvedId);
      setMembers(memberData);
    } catch (err) {
      if (seq === requestSeq.current) Alert.alert('Could not load members', apiErrorMessage(err));
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [paramMarketId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <ScreenContainer refreshing={loading} onRefresh={load}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Members</Text>
        <Button label={showForm ? 'Cancel' : 'Add member'} variant="secondary" onPress={() => setShowForm((v) => !v)} />
      </View>

      {showForm && marketId && (
        <AddMemberForm
          marketId={marketId}
          onAdded={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {members.length === 0 && !loading ? (
        <Text style={styles.empty}>No members yet.</Text>
      ) : (
        members.map((m) => (
          <View key={m.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.traderName}>{m.trader?.name ?? 'Trader'}</Text>
              <Badge label={m.status} tone={STATUS_TONE[m.status]} />
            </View>
            {m.trader?.ownerName ? <Text style={styles.detail}>{m.trader.ownerName}</Text> : null}
            {m.trader?.phone ? <Text style={styles.detail}>{m.trader.phone}</Text> : null}
            {(m.section || m.stallNumber) && (
              <Text style={styles.detail}>
                {[m.section, m.stallNumber].filter(Boolean).join(' · ')}
              </Text>
            )}
          </View>
        ))
      )}
    </ScreenContainer>
  );
}

function AddMemberForm({ marketId, onAdded }: { marketId: string; onAdded: () => void }) {
  const [email, setEmail] = useState('');
  const [section, setSection] = useState('');
  const [stallNumber, setStallNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const trader = await lookupTraderByEmail(email.trim());
      await addMember(marketId, {
        traderId: trader.traderId,
        section: section.trim() || undefined,
        stallNumber: stallNumber.trim() || undefined,
      });
      onAdded();
    } catch (err) {
      Alert.alert('Could not add member', apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.form}>
      <Text style={styles.formLabel}>The trader must already have a Market OS account.</Text>
      <TextField
        label="Trader's email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="trader@market.com"
      />
      <TextField label="Section (optional)" value={section} onChangeText={setSection} placeholder="Electronics Wing" />
      <TextField label="Stall number (optional)" value={stallNumber} onChangeText={setStallNumber} placeholder="B-14" />
      <Button label="Add to market" onPress={handleSubmit} loading={submitting} disabled={!email.trim()} />
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
  formLabel: {
    fontSize: 13,
    color: colors.textMuted,
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
});
