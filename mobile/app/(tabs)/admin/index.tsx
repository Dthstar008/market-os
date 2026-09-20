import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ScreenContainer } from '../../../src/components/ScreenContainer';
import { TextField } from '../../../src/components/TextField';
import { Button } from '../../../src/components/Button';
import { StatCard } from '../../../src/components/StatCard';
import {
  createMarket,
  getAccountingSummary,
  getInviteCode,
  getMyAdminMarkets,
  joinMarketAsAdmin,
} from '../../../src/api/admin';
import { apiErrorMessage } from '../../../src/api/client';
import { AccountingSummary, Market } from '../../../src/api/types';
import { formatNaira } from '../../../src/utils/currency';
import { colors, radius, spacing } from '../../../src/theme';

export default function AdminHomeScreen() {
  const [loading, setLoading] = useState(false);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [summary, setSummary] = useState<AccountingSummary | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [revealingCode, setRevealingCode] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const requestSeq = useRef(0);

  const load = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const data = await getMyAdminMarkets();
      if (seq !== requestSeq.current) return;
      setMarkets(data);
      const stillSelected = data.find((m) => m.id === selectedId);
      const active = stillSelected ?? data[0] ?? null;
      setSelectedId(active?.id ?? null);
      setInviteCode(null);
      if (active) {
        const summaryData = await getAccountingSummary(active.id);
        if (seq !== requestSeq.current) return;
        setSummary(summaryData);
      } else {
        setSummary(null);
      }
    } catch (err) {
      Alert.alert('Could not load admin dashboard', apiErrorMessage(err));
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [selectedId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const market = markets.find((m) => m.id === selectedId) ?? null;

  async function handleRevealCode() {
    if (!market) return;
    setRevealingCode(true);
    try {
      setInviteCode(await getInviteCode(market.id));
    } catch (err) {
      Alert.alert('Could not fetch invite code', apiErrorMessage(err));
    } finally {
      setRevealingCode(false);
    }
  }

  async function handleJoinAnother() {
    setJoining(true);
    try {
      const joined = await joinMarketAsAdmin(joinCode.trim());
      setJoinCode('');
      setSelectedId(joined.id);
      await load();
    } catch (err) {
      Alert.alert('Could not join as admin', apiErrorMessage(err));
    } finally {
      setJoining(false);
    }
  }

  if (market) {
    return (
      <ScreenContainer refreshing={loading} onRefresh={load}>
        {markets.length > 1 && (
          <View style={styles.chipRow}>
            {markets.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => setSelectedId(m.id)}
                style={[styles.chip, m.id === selectedId && styles.chipActive]}
              >
                <Text style={[styles.chipText, m.id === selectedId && styles.chipTextActive]}>{m.name}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={styles.marketName}>{market.name}</Text>
        {market.location ? <Text style={styles.subtitle}>{market.location}</Text> : null}

        {summary && (
          <View style={styles.grid}>
            <StatCard label="Members" value={String(summary.memberCount)} />
            <StatCard label="Balance" value={formatNaira(summary.balance)} tone={summary.balance >= 0 ? 'positive' : 'negative'} />
            <StatCard label="Dues collected" value={formatNaira(summary.dues.collected)} tone="positive" />
            <StatCard label="Dues outstanding" value={formatNaira(summary.dues.outstanding)} tone="negative" />
          </View>
        )}

        <View style={styles.menu}>
          <MenuLink label="Members" symbol="👥" onPress={() => router.push({ pathname: '/admin/members', params: { marketId: market.id } })} />
          <MenuLink label="Levies & generate dues" symbol="🧾" onPress={() => router.push({ pathname: '/admin/levies', params: { marketId: market.id } })} />
          <MenuLink label="All dues" symbol="📋" onPress={() => router.push({ pathname: '/admin/dues', params: { marketId: market.id } })} />
          <MenuLink label="Market expenses" symbol="💸" onPress={() => router.push({ pathname: '/admin/expenses', params: { marketId: market.id } })} />
          <MenuLink label="Announcements" symbol="📣" onPress={() => router.push({ pathname: '/admin/announcements', params: { marketId: market.id } })} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Invite a co-admin</Text>
          <Text style={styles.subtitle}>
            Share this code with a secretary or treasurer so they can administer this market too.
          </Text>
          {inviteCode ? (
            <Text style={styles.code}>{inviteCode}</Text>
          ) : (
            <Button label="Show invite code" variant="secondary" onPress={handleRevealCode} loading={revealingCode} />
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Administer another market</Text>
          <Text style={styles.subtitle}>Enter an invite code from another market's admin to co-administer it too.</Text>
          <TextField label="Admin invite code" value={joinCode} onChangeText={setJoinCode} autoCapitalize="characters" placeholder="A1B2C3D4E5" />
          <Button label="Join" variant="secondary" onPress={handleJoinAnother} loading={joining} disabled={!joinCode.trim()} />
        </View>
      </ScreenContainer>
    );
  }

  return <AdminOnboarding loading={loading} onDone={load} />;
}

function MenuLink({ label, symbol, onPress }: { label: string; symbol: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.menuRow}>
      <Text style={styles.menuSymbol}>{symbol}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuChevron}>›</Text>
    </Pressable>
  );
}

function AdminOnboarding({ loading, onDone }: { loading: boolean; onDone: () => void }) {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);

  async function handleCreate() {
    setCreating(true);
    try {
      await createMarket({
        name: name.trim(),
        location: location.trim() || undefined,
        description: description.trim() || undefined,
      });
      onDone();
    } catch (err) {
      Alert.alert('Could not create market', apiErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin() {
    setJoining(true);
    try {
      await joinMarketAsAdmin(code.trim());
      onDone();
    } catch (err) {
      Alert.alert('Could not join as admin', apiErrorMessage(err));
    } finally {
      setJoining(false);
    }
  }

  return (
    <ScreenContainer refreshing={loading} onRefresh={onDone}>
      <Text style={styles.marketName}>Admin</Text>
      <Text style={styles.subtitle}>You don't administer a market yet.</Text>

      {mode === 'choose' && (
        <View style={styles.card}>
          <Button label="Create a market" onPress={() => setMode('create')} />
          <Button label="Join with an admin code" variant="secondary" onPress={() => setMode('join')} />
        </View>
      )}

      {mode === 'create' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create your market</Text>
          <TextField label="Market name" value={name} onChangeText={setName} placeholder="Computer Village Market Association" />
          <TextField label="Location" value={location} onChangeText={setLocation} placeholder="Ikeja, Lagos" />
          <TextField label="Description" value={description} onChangeText={setDescription} placeholder="Electronics traders association" />
          <Button label="Create" onPress={handleCreate} loading={creating} disabled={!name.trim()} />
          <Button label="Back" variant="secondary" onPress={() => setMode('choose')} />
        </View>
      )}

      {mode === 'join' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Join as an admin</Text>
          <Text style={styles.subtitle}>Enter the invite code your market association's chairman shared with you.</Text>
          <TextField label="Admin invite code" value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="A1B2C3D4E5" />
          <Button label="Join" onPress={handleJoin} loading={joining} disabled={!code.trim()} />
          <Button label="Back" variant="secondary" onPress={() => setMode('choose')} />
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  marketName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
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
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuSymbol: {
    fontSize: 18,
  },
  menuLabel: {
    flex: 1,
    color: colors.text,
    fontWeight: '600',
  },
  menuChevron: {
    color: colors.textMuted,
    fontSize: 18,
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
  code: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.primary,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});
