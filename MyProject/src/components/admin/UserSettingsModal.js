import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import CustomButton from '../common/CustomButton';
import CustomInput from '../common/CustomInput';

function ask(message, onConfirm) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (window.confirm(message)) onConfirm();
    return;
  }
  Alert.alert('Confirm action', message, [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', style: 'destructive', onPress: onConfirm }]);
}

export default function UserSettingsModal({ user, loading, onClose, onSave, onStatus, onReset }) {
  const [leverage, setLeverage] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setLeverage(String(user?.leverage || 100));
    setAdminNotes(user?.adminNotes || '');
    setError('');
  }, [user]);

  if (!user) return null;

  const save = () => {
    const value = Number(String(leverage).replace('1:', ''));
    if (!Number.isInteger(value) || value < 1 || value > 1000) {
      setError('Leverage must be between 1 and 1000.');
      return;
    }
    onSave({ leverage: value, adminNotes });
  };
  const frozen = user.tradingStatus === 'frozen';

  return (
    <View className="absolute inset-0 z-50 items-center justify-center bg-black/70 px-4">
      <View className="w-full max-w-xl rounded-2xl border border-border bg-panel p-6">
        <View className="mb-5 flex-row justify-between">
          <Text className="text-xl font-bold text-white">Account Controls</Text>
          <Pressable onPress={onClose}><Text className="text-xl text-muted">x</Text></Pressable>
        </View>
        <Text className="mb-5 text-muted">{user.name} | {user.accountType} | {frozen ? 'Frozen' : 'Active'}</Text>
        <CustomInput label="Leverage (1:x)" value={leverage} onChangeText={setLeverage} keyboardType="number-pad" error={error} />
        <CustomInput label="Admin notes" value={adminNotes} onChangeText={setAdminNotes} placeholder="Internal note visible only to admin" multiline />
        <CustomButton title="Save Leverage and Notes" loading={loading} onPress={save} className="mb-3" />
        <View className="flex-row">
          <CustomButton
            title={frozen ? 'Unfreeze Trading' : 'Freeze Trading'}
            variant={frozen ? 'success' : 'danger'}
            className="mr-3 flex-1"
            disabled={loading}
            onPress={() => ask(`${frozen ? 'Enable' : 'Disable'} trading for ${user.name}?`, onStatus)}
          />
          <CustomButton
            title="Reset Demo"
            variant="secondary"
            className="flex-1"
            disabled={loading || user.accountType !== 'Demo'}
            onPress={() => ask(`Reset ${user.name}'s demo balance to $5,000?`, onReset)}
          />
        </View>
      </View>
    </View>
  );
}
