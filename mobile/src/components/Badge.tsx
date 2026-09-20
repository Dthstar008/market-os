import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

interface Props {
  label: string;
  tone?: 'default' | 'positive' | 'negative' | 'warning';
}

export function Badge({ label, tone = 'default' }: Props) {
  const palette = {
    default: { bg: colors.border, fg: colors.textMuted },
    positive: { bg: colors.primaryMuted, fg: colors.primary },
    negative: { bg: colors.dangerMuted, fg: colors.danger },
    warning: { bg: colors.warningMuted, fg: colors.warning },
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
