import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import CustomButton from '../common/CustomButton';
import CustomInput from '../common/CustomInput';
import { dateTime, money } from '../../utils/formatters';

function Option({ active, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className="min-h-[42px] flex-1 items-center justify-center rounded-xl border px-3"
      style={{ backgroundColor: active ? '#D4AF37' : '#111827', borderColor: active ? '#D4AF37' : '#243142' }}
    >
      <Text className="text-sm font-bold" style={{ color: active ? '#05130d' : '#f8fafc' }}>{label}</Text>
    </Pressable>
  );
}

function InfoTile({ label, value, tone = 'text-white' }) {
  return (
    <View className="min-w-[145px] flex-1 rounded-xl border border-border bg-surface p-3">
      <Text className="text-xs font-semibold uppercase text-muted">{label}</Text>
      <Text className={`mt-2 text-base font-extrabold ${tone}`}>{value}</Text>
    </View>
  );
}

function WithdrawalHistory({ withdrawals }) {
  return (
    <View className="mt-5 rounded-2xl border border-border bg-surface p-4">
      <Text className="mb-3 text-base font-bold text-white">Withdrawal History</Text>
      {withdrawals.length ? (
        <View className="overflow-hidden rounded-xl border border-border">
          <View className="flex-row bg-panel px-3 py-2">
            <Text className="flex-[1.4] text-xs font-bold uppercase text-muted">Date</Text>
            <Text className="flex-1 text-xs font-bold uppercase text-muted">Method</Text>
            <Text className="flex-1 text-xs font-bold uppercase text-muted">Amount</Text>
            <Text className="flex-1 text-xs font-bold uppercase text-muted">Status</Text>
          </View>
          {withdrawals.map((item) => (
            <View key={item.id} className="flex-row border-t border-border px-3 py-3">
              <Text className="flex-[1.4] text-xs text-muted">{dateTime(item.createdAt)}</Text>
              <Text className="flex-1 text-xs text-white">{item.withdrawalMethod || (item.description?.toLowerCase().includes('crypto') ? 'Crypto' : 'Bank')}</Text>
              <Text className="flex-1 text-xs font-semibold text-white">{money(item.amount)} USD</Text>
              <Text className={`flex-1 text-xs font-bold capitalize ${['approved', 'completed'].includes(item.status) ? 'text-success' : item.status === 'rejected' ? 'text-danger' : 'text-primary'}`}>
                {item.status}
              </Text>
            </View>
          ))}
        </View>
      ) : <Text className="text-muted">No withdrawal requests yet.</Text>}
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
    <View className="flex-1 rounded-2xl border border-border bg-panel p-5">
      <Text className="mb-5 text-lg font-bold text-white">Withdraw Funds</Text>

      <View className="mb-5 flex-row flex-wrap gap-3">
        <InfoTile label="Available Balance" value={`${money(availableBalance)} USD`} />
        <InfoTile label="Withdrawable Balance" value={`${money(withdrawableBalance)} USD`} />
      </View>

      <Text className="mb-2 text-sm font-medium text-muted">Withdrawal Method</Text>
      <View className="mb-4 flex-row gap-3">
        <Option active={form.withdrawalMethod === 'Bank'} label="Bank" onPress={() => setMethod('Bank')} />
        <Option active={form.withdrawalMethod === 'Crypto'} label="Crypto" onPress={() => setMethod('Crypto')} />
      </View>

      <CustomInput label="Amount (USD)" keyboardType="decimal-pad" value={form.amount} onChangeText={update('amount')} />
      <CustomInput label={form.withdrawalMethod === 'Bank' ? 'Bank name' : 'Crypto provider / network'} value={form.bankName} onChangeText={update('bankName')} />
      <CustomInput label={form.withdrawalMethod === 'Bank' ? 'Account number' : 'Wallet address'} value={form.accountNumber} onChangeText={update('accountNumber')} />
      <CustomInput label={form.withdrawalMethod === 'Bank' ? 'Account holder name' : 'Wallet holder name'} value={form.accountHolderName} onChangeText={update('accountHolderName')} />
      <CustomButton title="Request Withdrawal" onPress={submit} loading={loading} disabled={disabled} variant="primary" />
      {disabled && disabledMessage ? <Text className="mt-3 text-sm text-danger">{disabledMessage}</Text> : null}
      {message ? <Text className={`mt-3 text-sm ${message.startsWith('Success') ? 'text-success' : 'text-danger'}`}>{message}</Text> : null}
      <WithdrawalHistory withdrawals={withdrawals} />
    </View>
  );
}
