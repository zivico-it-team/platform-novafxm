import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import CustomButton from '../common/CustomButton';
import CustomInput from '../common/CustomInput';
import { dateTime, money } from '../../utils/formatters';
import { useAppTheme } from '../../context/ThemeContext';

function Option({ active, label, onPress, colors }) {
  return (
    <Pressable
      onPress={onPress}
      className="min-h-[42px] flex-1 items-center justify-center rounded-xl border px-3"
      style={{ backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }}
    >
      <Text className="text-sm font-bold" style={{ color: active ? '#05130d' : colors.text }}>{label}</Text>
    </Pressable>
  );
}

function InfoTile({ label, value, tone, colors }) {
  return (
    <View className="min-w-[145px] flex-1 rounded-xl border p-3" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <Text className="text-xs font-semibold uppercase" style={{ color: colors.muted }}>{label}</Text>
      <Text className="mt-2 text-base font-extrabold" style={{ color: tone || colors.text }}>{value}</Text>
    </View>
  );
}

function WithdrawalHistory({ withdrawals, colors }) {
  return (
    <View className="mt-5 rounded-2xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <Text className="mb-3 text-base font-bold" style={{ color: colors.text }}>Withdrawal History</Text>
      {withdrawals.length ? (
        <View className="overflow-hidden rounded-xl border" style={{ borderColor: colors.border }}>
          <View className="flex-row px-3 py-2" style={{ backgroundColor: colors.panel }}>
            <Text className="flex-[1.4] text-xs font-bold uppercase" style={{ color: colors.muted }}>Date</Text>
            <Text className="flex-1 text-xs font-bold uppercase" style={{ color: colors.muted }}>Method</Text>
            <Text className="flex-1 text-xs font-bold uppercase" style={{ color: colors.muted }}>Amount</Text>
            <Text className="flex-1 text-xs font-bold uppercase" style={{ color: colors.muted }}>Status</Text>
          </View>
          {withdrawals.map((item) => (
            <View key={item.id} className="flex-row border-t px-3 py-3" style={{ borderColor: colors.border }}>
              <Text className="flex-[1.4] text-xs" style={{ color: colors.muted }}>{dateTime(item.createdAt)}</Text>
              <Text className="flex-1 text-xs" style={{ color: colors.text }}>{item.withdrawalMethod || (item.description?.toLowerCase().includes('crypto') ? 'Crypto' : 'Bank')}</Text>
              <Text className="flex-1 text-xs font-semibold" style={{ color: colors.text }}>{money(item.amount)} USD</Text>
              <Text className="flex-1 text-xs font-bold capitalize" style={{ color: ['approved', 'completed'].includes(item.status) ? colors.success : item.status === 'rejected' ? colors.danger : colors.primary }}>
                {item.status}
              </Text>
            </View>
          ))}
        </View>
      ) : <Text style={{ color: colors.muted }}>No withdrawal requests yet.</Text>}
    </View>
  );
}

export default function WithdrawForm({
  onSubmit,
  loading,
  disabled,
  disabledMessage,
  summary = {},
  transactions = [],
}) {
  const { colors } = useAppTheme();
  const [form, setForm] = useState({
    amount: '',
    withdrawalMethod: 'Bank',
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
  });
  const [message, setMessage] = useState('');
  const withdrawals = useMemo(() => transactions.filter((item) => item.type === 'withdrawal'), [transactions]);
  const pendingWithdrawals = withdrawals
    .filter((item) => item.status === 'pending')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const availableBalance = Number(summary.balance || 0);
  const withdrawableBalance = Math.max(availableBalance - pendingWithdrawals, 0);
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const setMethod = (withdrawalMethod) => setForm((current) => ({ ...current, withdrawalMethod }));

  const submit = async () => {
    try {
      if (disabled) throw new Error(disabledMessage || 'Withdrawals are unavailable.');
      const amount = Number(form.amount);
      if (!amount) throw new Error('Enter a valid withdrawal amount.');
      if (amount > withdrawableBalance) throw new Error('Withdrawal amount exceeds withdrawable balance.');
      if (!form.bankName || !form.accountNumber || !form.accountHolderName) throw new Error('Complete all withdrawal fields.');
      await onSubmit({ ...form, amount });
      setMessage('Success: withdrawal request submitted. Status is Pending until admin approval.');
      setForm({ amount: '', withdrawalMethod: form.withdrawalMethod, bankName: '', accountNumber: '', accountHolderName: '' });
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };
  return (
    <View className="flex-1 rounded-2xl border p-5" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
      <Text className="mb-5 text-lg font-bold" style={{ color: colors.text }}>Withdraw Funds</Text>

      <View className="mb-5 flex-row flex-wrap gap-3">
        <InfoTile label="Available Balance" value={`${money(availableBalance)} USD`} colors={colors} />
        <InfoTile label="Withdrawable Balance" value={`${money(withdrawableBalance)} USD`} colors={colors} />
      </View>

      <Text className="mb-2 text-sm font-medium" style={{ color: colors.muted }}>Withdrawal Method</Text>
      <View className="mb-4 flex-row gap-3">
        <Option active={form.withdrawalMethod === 'Bank'} label="Bank" onPress={() => setMethod('Bank')} colors={colors} />
        <Option active={form.withdrawalMethod === 'Crypto'} label="Crypto" onPress={() => setMethod('Crypto')} colors={colors} />
      </View>

      <CustomInput label="Amount (USD)" keyboardType="decimal-pad" value={form.amount} onChangeText={update('amount')} />
      <CustomInput label={form.withdrawalMethod === 'Bank' ? 'Bank name' : 'Crypto provider / network'} value={form.bankName} onChangeText={update('bankName')} />
      <CustomInput label={form.withdrawalMethod === 'Bank' ? 'Account number' : 'Wallet address'} value={form.accountNumber} onChangeText={update('accountNumber')} />
      <CustomInput label={form.withdrawalMethod === 'Bank' ? 'Account holder name' : 'Wallet holder name'} value={form.accountHolderName} onChangeText={update('accountHolderName')} />
      <CustomButton title="Request Withdrawal" onPress={submit} loading={loading} disabled={disabled} variant="primary" />
      {disabled && disabledMessage ? <Text className="mt-3 text-sm text-danger">{disabledMessage}</Text> : null}
      {message ? <Text className={`mt-3 text-sm ${message.startsWith('Success') ? 'text-success' : 'text-danger'}`}>{message}</Text> : null}
      <WithdrawalHistory withdrawals={withdrawals} colors={colors} />
    </View>
  );
}
