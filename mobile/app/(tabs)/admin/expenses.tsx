import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '../../../src/components/ScreenContainer';
import { TextField } from '../../../src/components/TextField';
import { Button } from '../../../src/components/Button';
import { createExpense, listExpenses, resolveAdminMarketId } from '../../../src/api/admin';
import { apiErrorMessage } from '../../../src/api/client';
import { MarketExpense, MarketExpenseCategory } from '../../../src/api/types';
import { formatNaira } from '../../../src/utils/currency';
import { colors, radius, spacing } from '../../../src/theme';

const CATEGORIES: MarketExpenseCategory[] = ['security', 'sanitation', 'electricity', 'administration', 'maintenance', 'other'];

export default function AdminExpensesScreen() {
  const { marketId: paramMarketId } = useLocalSearchParams<{ marketId?: string }>();
  const [marketId, setMarketId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<MarketExpense[]>([]);
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
        setExpenses([]);
        return;
      }
      const expenseData = await listExpenses(resolvedId);
      if (seq !== requestSeq.current) return;
      setMarketId(resolvedId);
      setExpenses(expenseData);
    } catch (err) {
      if (seq === requestSeq.current) Alert.alert('Could not load expenses', apiErrorMessage(err));
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [paramMarketId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <ScreenContainer refreshing={loading} onRefresh={load}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Market expenses</Text>
        <Button label={showForm ? 'Cancel' : 'Add expense'} variant="secondary" onPress={() => setShowForm((v) => !v)} />
      </View>

      {expenses.length > 0 && <Text style={styles.total}>Total: {formatNaira(total)}</Text>}

      {showForm && marketId && (
        <NewExpenseForm
          marketId={marketId}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {expenses.length === 0 && !loading ? (
        <Text style={styles.empty}>No market expenses recorded yet.</Text>
      ) : (
        expenses.map((e) => (
          <View key={e.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.category}>{e.category}</Text>
              <Text style={styles.amount}>{formatNaira(e.amount)}</Text>
            </View>
            {e.description ? <Text style={styles.description}>{e.description}</Text> : null}
            <Text style={styles.date}>{new Date(e.createdAt).toLocaleDateString()}</Text>
          </View>
        ))
      )}
    </ScreenContainer>
  );
}

function NewExpenseForm({ marketId, onCreated }: { marketId: string; onCreated: () => void }) {
  const [category, setCategory] = useState<MarketExpenseCategory>('other');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await createExpense(marketId, { category, amount: parseFloat(amount), description: description.trim() || undefined });
      onCreated();
    } catch (err) {
      Alert.alert('Could not add expense', apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.form}>
      <Text style={styles.formLabel}>Category</Text>
      <View style={styles.categoryRow}>
        {CATEGORIES.map((c) => (
          <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipActive]}>
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
          </Pressable>
        ))}
      </View>
      <TextField label="Amount (₦)" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="15000" />
      <TextField label="Note (optional)" value={description} onChangeText={setDescription} placeholder="Security guard salaries" />
      <Button label="Save expense" onPress={handleSubmit} loading={submitting} disabled={!amount} />
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
  total: {
    color: colors.textMuted,
    fontWeight: '600',
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
  categoryRow: {
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
  },
  chipTextActive: {
    color: colors.primary,
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
  },
  category: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  amount: {
    fontWeight: '700',
    color: colors.danger,
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
  },
  date: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
