import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import CustomButton from '../common/CustomButton';
import CustomInput from '../common/CustomInput';
import { money } from '../../utils/formatters';

function ask(message, onConfirm) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (window.confirm(message)) onConfirm();
    return;
  }
  Alert.alert('Confirm balance update', message, [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', onPress: onConfirm }]);
}

export default function UpdateBalanceModal({ user, initialOperation, loading, onClose, onConfirm }) {
  const [operation, setOperation] = useState(initialOperation || 'add_balance');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setOperation(initialOperation || 'add_balance');
    setAmount('');
    setNote('');
    setError('');
  }, [user, initialOperation]);

  if (!user) return null;

  const submit = () => {
    const numeric = Number(amount);
    if (!(numeric > 0)) {
      setError('Amount must be positive.');
      return;
    }
    if (operation === 'deduct_balance' && numeric > Number(user.wallet?.balance || 0)) {
      setError('Deduct cannot exceed wallet balance.');
      return;
    }
    setError('');
    ask(`Confirm ${operation === 'add_balance' ? 'add' : 'deduct'} $${money(numeric)} for ${user.name}?`, () => onConfirm({ operation, amount: numeric, note }));
  };

  return (
    <View className="absolute inset-0 z-50 items-center justify-center bg-black/70 px-4">
      <View className="w-full max-w-lg rounded-2xl border border-border bg-panel p-6">
        <View className="mb-5 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-white">Update Balance</Text>
          <Pressable onPress={onClose}><Text className="text-xl text-muted">x</Text></Pressable>
        </View>
        <Text className="mb-5 text-sm text-muted">{user.name} | Available ${money(user.wallet?.balance)}</Text>
        <View className="mb-5 flex-row">
          {[
            ['add_balance', 'Add Balance'],
            ['deduct_balance', 'Deduct Balance'],
          ].map(([value, title]) => (
            <Pressable key={value} onPress={() => setOperation(value)} className={`mr-3 rounded-xl border px-4 py-3 ${operation === value ? 'border-primary bg-primary/20' : 'border-border bg-surface'}`}>
              <Text className={operation === value ? 'font-semibold text-primary' : 'text-white'}>{title}</Text>
            </Pressable>
          ))}
        </View>
        <CustomInput label="Amount (USD)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" error={error} />
        <CustomInput label="Reason / note" value={note} onChangeText={setNote} placeholder="Why is this balance changing?" multiline />
        <View className="flex-row justify-end">
          <CustomButton title="Cancel" variant="secondary" className="mr-3" disabled={loading} onPress={onClose} />
          <CustomButton title="Confirm" variant={operation === 'add_balance' ? 'success' : 'danger'} loading={loading} onPress={submit} />
        </View>
      </View>
    </View>
  );
}
