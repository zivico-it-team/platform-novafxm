import { useState } from 'react';
import { Text, View } from 'react-native';
import CustomButton from '../common/CustomButton';
import CustomInput from '../common/CustomInput';

export default function WithdrawForm({ onSubmit, loading }) {
  const [form, setForm] = useState({ amount: '', bankName: '', accountNumber: '', accountHolderName: '' });
  const [message, setMessage] = useState('');
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    try {
      if (!Number(form.amount) || !form.bankName || !form.accountNumber || !form.accountHolderName) throw new Error('Complete all withdrawal fields.');
      await onSubmit({ ...form, amount: Number(form.amount) });
      setMessage('Withdrawal request submitted for approval.');
      setForm({ amount: '', bankName: '', accountNumber: '', accountHolderName: '' });
    } catch (error) {
      setMessage(error.message);
    }
  };
  return (
    <View className="flex-1 rounded-2xl border border-border bg-panel p-5">
      <Text className="mb-5 text-lg font-bold text-white">Withdraw Funds</Text>
      <CustomInput label="Amount (USD)" keyboardType="decimal-pad" value={form.amount} onChangeText={update('amount')} />
      <CustomInput label="Bank name" value={form.bankName} onChangeText={update('bankName')} />
      <CustomInput label="Account number" value={form.accountNumber} onChangeText={update('accountNumber')} />
      <CustomInput label="Account holder name" value={form.accountHolderName} onChangeText={update('accountHolderName')} />
      <CustomButton title="Request Withdrawal" onPress={submit} loading={loading} variant="primary" />
      {message ? <Text className="mt-3 text-sm text-muted">{message}</Text> : null}
    </View>
  );
}
