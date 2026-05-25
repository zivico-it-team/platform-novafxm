import { useState } from 'react';
import { Text, View } from 'react-native';
import CustomButton from '../common/CustomButton';
import CustomInput from '../common/CustomInput';

export default function DepositForm({ onSubmit, loading }) {
  const [form, setForm] = useState({ amount: '', paymentMethod: 'Bank Transfer', referenceNumber: '', note: '' });
  const [message, setMessage] = useState('');
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    try {
      if (!Number(form.amount) || !form.referenceNumber.trim()) throw new Error('Amount and reference number are required.');
      await onSubmit({ ...form, amount: Number(form.amount) });
      setMessage('Deposit request submitted for approval.');
      setForm({ amount: '', paymentMethod: 'Bank Transfer', referenceNumber: '', note: '' });
    } catch (error) {
      setMessage(error.message);
    }
  };
  return (
    <View className="flex-1 rounded-2xl border border-border bg-panel p-5">
      <Text className="mb-5 text-lg font-bold text-white">Deposit Funds</Text>
      <CustomInput label="Amount (USD)" keyboardType="decimal-pad" value={form.amount} onChangeText={update('amount')} />
      <CustomInput label="Payment method" value={form.paymentMethod} onChangeText={update('paymentMethod')} />
      <CustomInput label="Reference number" value={form.referenceNumber} onChangeText={update('referenceNumber')} />
      <CustomInput label="Note" value={form.note} onChangeText={update('note')} />
      <CustomButton title="Submit Deposit" onPress={submit} loading={loading} variant="success" />
      {message ? <Text className="mt-3 text-sm text-muted">{message}</Text> : null}
    </View>
  );
}
