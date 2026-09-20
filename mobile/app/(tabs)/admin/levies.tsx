import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '../../../src/components/ScreenContainer';
import { TextField } from '../../../src/components/TextField';
import { Button } from '../../../src/components/Button';
import { Badge } from '../../../src/components/Badge';
import { createLevy, generateDues, listLevies, resolveAdminMarketId, setLevyActive } from '../../../src/api/admin';
import { apiErrorMessage } from '../../../src/api/client';
import { Levy, LevyFrequency } from '../../../src/api/types';
import { formatNaira } from '../../../src/utils/currency';
import { colors, radius, spacing } from '../../../src/theme';

const FREQUENCIES: LevyFrequency[] = ['monthly', 'weekly', 'one_time'];

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7); // "2026-09"
}

export default function AdminLeviesScreen() {
  const { marketId: paramMarketId } = useLocalSearchParams<{ marketId?: string }>();
  const [marketId, setMarketId] = useState<string | null>(null);
  const [levies, setLevies] = useState<Levy[]>([]);
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
        setLevies([]);
        return;
      }
      const levyData = await listLevies(resolvedId);
      if (seq !== requestSeq.current) return;
      setMarketId(resolvedId);
      setLevies(levyData);
    } catch (err) {
      if (seq === requestSeq.current) Alert.alert('Could not load levies', apiErrorMessage(err));
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
        <Text style={styles.title}>Levies</Text>
        <Button label={showForm ? 'Cancel' : 'New levy'} variant="secondary" onPress={() => setShowForm((v) => !v)} />
      </View>

      {showForm && marketId && (
        <NewLevyForm
          marketId={marketId}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {levies.length === 0 && !loading ? (
        <Text style={styles.empty}>No levies defined yet.</Text>
      ) : (
        levies.map((levy) => (
          <LevyCard key={levy.id} levy={levy} marketId={marketId!} onChanged={load} />
        ))
      )}
    </ScreenContainer>
  );
}

function NewLevyForm({ marketId, onCreated }: { marketId: string; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<LevyFrequency>('monthly');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await createLevy(marketId, { name: name.trim(), amount: parseFloat(amount), frequency });
      onCreated();
    } catch (err) {
      Alert.alert('Could not create levy', apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.form}>
      <TextField label="Name" value={name} onChangeText={setName} placeholder="Monthly Association Dues" />
      <TextField label="Amount (₦)" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="2000" />
      <Text style={styles.formLabel}>Frequency</Text>
      <View style={styles.chipRow}>
        {FREQUENCIES.map((f) => (
          <Pressable key={f} onPress={() => setFrequency(f)} style={[styles.chip, frequency === f && styles.chipActive]}>
            <Text style={[styles.chipText, frequency === f && styles.chipTextActive]}>{f.replace('_', ' ')}</Text>
          </Pressable>
        ))}
      </View>
      <Button label="Create levy" onPress={handleSubmit} loading={submitting} disabled={!name.trim() || !amount} />
    </View>
  );
}

function LevyCard({ levy, marketId, onChanged }: { levy: Levy; marketId: string; onChanged: () => void }) {
  const [showGenerate, setShowGenerate] = useState(false);
  const [period, setPeriod] = useState(currentPeriod());
  const [generating, setGenerating] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const result = await generateDues(marketId, { levyId: levy.id, period: period.trim() });
      Alert.alert('Dues generated', `Created ${result.created} invoice(s), skipped ${result.skipped} already-invoiced member(s).`);
      setShowGenerate(false);
    } catch (err) {
      Alert.alert('Could not generate dues', apiErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  async function handleToggleActive() {
    setTogglingActive(true);
    try {
      await setLevyActive(marketId, levy.id, !levy.active);
      onChanged();
    } catch (err) {
      Alert.alert('Could not update levy', apiErrorMessage(err));
    } finally {
      setTogglingActive(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.levyName}>{levy.name}</Text>
        <Badge label={levy.active ? 'active' : 'inactive'} tone={levy.active ? 'positive' : 'default'} />
      </View>
      <Text style={styles.detail}>{formatNaira(levy.amount)} · {levy.frequency.replace('_', ' ')}</Text>

      {showGenerate ? (
        <View style={styles.generateRow}>
          <View style={{ flex: 1 }}>
            <TextField label="Period" value={period} onChangeText={setPeriod} placeholder="2026-09" />
          </View>
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <View style={{ flex: 1 }}>
          <Button
            label={showGenerate ? 'Confirm generate' : 'Generate dues'}
            onPress={showGenerate ? handleGenerate : () => setShowGenerate(true)}
            loading={generating}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={levy.active ? 'Deactivate' : 'Activate'}
            variant="secondary"
            onPress={handleToggleActive}
            loading={togglingActive}
          />
        </View>
      </View>
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
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
  detail: {
    color: colors.textMuted,
    fontSize: 13,
    textTransform: 'capitalize',
  },
  generateRow: {
    flexDirection: 'row',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
