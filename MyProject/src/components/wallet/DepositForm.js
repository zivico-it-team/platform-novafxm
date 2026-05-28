import { useRef, useState } from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';
import { CheckCircle2, ImagePlus, RefreshCw } from 'lucide-react-native';
import CustomButton from '../common/CustomButton';
import CustomInput from '../common/CustomInput';

const emptyForm = { amount: '', paymentMethod: 'Bank Transfer', referenceNumber: '', note: '', receiptImage: '' };
const maxReceiptSize = 3 * 1024 * 1024;

export default function DepositForm({ onSubmit, loading }) {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const chooseReceipt = () => {
    if (Platform.OS === 'web') fileInputRef.current?.click();
    else setMessage('Receipt photo upload is available on web for this version.');
  };

  const handleReceiptFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage('Please upload a valid receipt image.');
      return;
    }
    if (file.size > maxReceiptSize) {
      setMessage('Receipt image must be smaller than 3 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, receiptImage: String(reader.result || '') }));
      setMessage('Receipt uploaded successfully.');
    };
    reader.onerror = () => setMessage('Unable to read the receipt image.');
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    try {
      if (!Number(form.amount) || !form.referenceNumber.trim()) throw new Error('Amount and reference number are required.');
      if (!form.receiptImage) throw new Error('Receipt image is required for admin approval.');
      await onSubmit({ ...form, amount: Number(form.amount) });
      setMessage('Deposit request submitted for approval.');
      setForm(emptyForm);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
      <Text className="mb-2 text-sm font-semibold text-muted">Receipt image</Text>
      {Platform.OS === 'web' ? (
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleReceiptFile} style={{ display: 'none' }} />
      ) : null}
      {form.receiptImage ? (
        <View className="mb-4 overflow-hidden rounded-xl border border-success/40 bg-success/10">
          <Image source={{ uri: form.receiptImage }} resizeMode="cover" className="h-48 w-full" />
          <View className="p-4">
            <View className="mb-3 flex-row items-center">
              <CheckCircle2 size={18} color="#2ed573" />
              <Text className="ml-2 font-semibold text-success">Receipt uploaded successfully</Text>
            </View>
            <Pressable onPress={chooseReceipt} className="flex-row items-center justify-center rounded-xl border border-primary/50 bg-primary/10 px-4 py-3">
              <RefreshCw size={16} color="#27a8e9" />
              <Text className="ml-2 font-semibold text-primary">Change Receipt Image</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable onPress={chooseReceipt} className="mb-4 rounded-xl border border-dashed border-primary/60 bg-primary/10 p-5">
          <View className="items-center">
            <ImagePlus size={28} color="#27a8e9" />
            <Text className="mt-3 text-center font-semibold text-primary">Upload Receipt Image</Text>
            <Text className="mt-1 text-center text-xs text-muted">JPG, PNG or WEBP up to 3 MB</Text>
          </View>
        </Pressable>
      )}
      <CustomButton title="Submit Deposit" onPress={submit} loading={loading} variant="success" />
      {message ? <Text className="mt-3 text-sm text-muted">{message}</Text> : null}
    </View>
  );
}
