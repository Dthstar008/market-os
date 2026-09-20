import { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ScreenContainer } from '../../src/components/ScreenContainer';
import { TextField } from '../../src/components/TextField';
import { Button } from '../../src/components/Button';
import { getMyTraderProfile, updateMyTraderProfile } from '../../src/api/trader';
import { apiErrorMessage } from '../../src/api/client';
import { colors, spacing } from '../../src/theme';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  // Screens stay mounted across tab switches, so an older, slower fetch can
  // resolve after a newer one — this sequence number lets us drop stale responses.
  const requestSeq = useRef(0);

  const load = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    try {
      const trader = await getMyTraderProfile();
      if (seq !== requestSeq.current) return;
      setName(trader.name ?? '');
      setOwnerName(trader.ownerName ?? '');
      setPhone(trader.phone ?? '');
      setCategory(trader.category ?? '');
      setEmergencyContact(trader.emergencyContact ?? '');
    } catch (err) {
      if (seq === requestSeq.current) Alert.alert('Could not load profile', apiErrorMessage(err));
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleSave() {
    setSaving(true);
    try {
      await updateMyTraderProfile({
        name: name.trim(),
        ownerName: ownerName.trim() || undefined,
        phone: phone.trim() || undefined,
        category: category.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
      });
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (err) {
      Alert.alert('Could not save profile', apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer refreshing={loading} onRefresh={load}>
      <Text style={styles.title}>Trader profile</Text>
      <Text style={styles.subtitle}>Kept by your market association as your member record.</Text>

      <TextField label="Shop / stall name" value={name} onChangeText={setName} placeholder="Chidi Phone Accessories" />
      <TextField label="Your name" value={ownerName} onChangeText={setOwnerName} placeholder="Chidi Eze" />
      <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="080..." />
      <TextField label="Product category" value={category} onChangeText={setCategory} placeholder="Electronics" />
      <TextField
        label="Emergency contact"
        value={emergencyContact}
        onChangeText={setEmergencyContact}
        placeholder="Name and phone number"
      />

      <Button label="Save changes" onPress={handleSave} loading={saving} disabled={!name.trim()} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
});
