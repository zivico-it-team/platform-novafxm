import { useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Banknote, CheckCircle2, Clock3, ShieldCheck, Sparkles, UploadCloud, Wallet, X } from 'lucide-react-native';
import CustomButton from '../common/CustomButton';
import CustomInput from '../common/CustomInput';

const paymentMethods = [
  { label: 'BTC', description: 'Bitcoin transfer', icon: Banknote },
  { label: 'USDT (TRC20)', description: 'Tether on TRC20', icon: Banknote },
  { label: 'THB', description: 'Thai Baht transfer', icon: Banknote },
  { label: 'XRP', description: 'Ripple transfer', icon: Banknote },
  { label: 'USDC (ERC20)', description: 'USDC on ERC20', icon: Banknote },
];

const quickAmounts = [100, 250, 500, 1000];

function fileName(file) {
  return file?.name || 'Receipt selected';
}

function readFileDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function DepositForm({ onSubmit, loading, disabled, disabledMessage }) {
  const receiptInputRef = useRef(null);
  const [form, setForm] = useState({ amount: '', paymentMethod: 'BTC', referenceNumber: '', note: '' });
  const [receipt, setReceipt] = useState(null);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const openReceiptPicker = () => {
    if (Platform.OS === 'web') receiptInputRef.current?.click();
  };
  const generateReference = () => {
    const stamp = Date.now().toString().slice(-8);
    update('referenceNumber')(`DEP-${stamp}`);
  };
  const selectedMethod = paymentMethods.find((method) => method.label === form.paymentMethod) || paymentMethods[0];
  const submit = async () => {
    try {
      setSuccess(false);
      if (disabled) throw new Error(disabledMessage || 'Deposits are unavailable.');
      if (!Number(form.amount) || Number(form.amount) < 100 || !form.referenceNumber.trim() || !receipt) throw new Error('Minimum deposit is $100. Reference number and receipt are required.');
      const receiptImage = receipt ? await readFileDataUrl(receipt) : null;
      await onSubmit({ ...form, amount: Number(form.amount), receiptImage });
      setMessage('Deposit request submitted for approval.');
      setSuccess(true);
      setForm({ amount: '', paymentMethod: 'BTC', referenceNumber: '', note: '' });
      setReceipt(null);
    } catch (error) {
      setMessage(error.message);
      setSuccess(false);
    }
  };
  return (
    <View className="flex-1 overflow-hidden rounded-2xl border border-border bg-panel">
      <View className="border-b border-border bg-surface px-5 py-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-black text-white">Deposit Funds</Text>
            <Text className="mt-1 text-sm text-muted">Submit a funding request with receipt proof.</Text>
          </View>
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/15">
            <Wallet size={22} color="#D4AF37" />
          </View>
        </View>
      </View>

      <View className="gap-5 p-5 xl:flex-row">
        <View className="flex-1">
          <View className="mb-4">
            <View className="flex-row items-end justify-between">
              <Text className="text-xs font-bold uppercase text-muted">Deposit Amount</Text>
              <Text className="text-xs font-bold text-white">USD</Text>
            </View>
            <CustomInput
              label=""
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={form.amount}
              onChangeText={update('amount')}
              className="mb-0 mt-2"
              style={{ borderColor: '#D4AF37', fontSize: 22, fontWeight: '900' }}
            />
            <View className="mt-2 flex-row justify-between">
              <Text className="text-xs text-muted">Minimum Deposit: $100</Text>
              <Text className="text-xs text-muted">Processing Time: 5 - 30 Minutes</Text>
            </View>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {quickAmounts.map((amount) => (
                <Pressable
                  key={amount}
                  onPress={() => update('amount')(String(amount))}
                  className={`rounded-full border px-3 py-2 ${String(amount) === String(form.amount) ? 'border-primary bg-primary/10' : 'border-border bg-surface'}`}
                >
                  <Text className={`text-xs font-bold ${String(amount) === String(form.amount) ? 'text-primary' : 'text-muted'}`}>${amount}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Text className="mb-3 text-xs font-bold uppercase text-muted">Payment Method</Text>
          <View className="mb-5 flex-row flex-wrap gap-3">
            {paymentMethods.map(({ label, description, icon: Icon }) => {
              const selected = form.paymentMethod === label;
              return (
                <Pressable
                  key={label}
                  onPress={() => update('paymentMethod')(label)}
                  className={`min-h-[92px] flex-1 min-w-[160px] rounded-xl border p-4 ${selected ? 'border-primary bg-primary/10' : 'border-border bg-surface'}`}
                >
                  <View className="flex-row items-center justify-between">
                    <Icon size={24} color="#12cf7a" />
                    {selected ? (
                      <View className="h-6 w-6 items-center justify-center rounded-full bg-primary">
                        <CheckCircle2 size={14} color="#0B0B0B" />
                      </View>
                    ) : null}
                  </View>
                  <Text className={`mt-3 text-sm font-bold ${selected ? 'text-primary' : 'text-white'}`}>{label}</Text>
                  <Text className="mt-1 text-[11px] text-muted">{description}</Text>
                </Pressable>
              );
            })}
          </View>

          <View className="mb-5 flex-row items-center rounded-2xl border border-primary/30 bg-primary/10 p-4">
            <Sparkles size={18} color="#D4AF37" />
            <View className="ml-3 flex-1">
              <Text className="text-sm font-bold text-white">Selected Method: {selectedMethod.label}</Text>
              <Text className="mt-1 text-xs text-muted">{selectedMethod.description}. Upload the receipt after completing the transfer.</Text>
            </View>
          </View>

          <View className="mb-4 lg:flex-row lg:items-end lg:gap-3">
            <CustomInput className="flex-1" label="Reference Number" placeholder="Transaction or receipt reference" value={form.referenceNumber} onChangeText={update('referenceNumber')} />
            <Pressable onPress={generateReference} className="mb-4 min-h-[46px] items-center justify-center rounded-xl border border-primary/60 bg-primary/10 px-4">
              <Text className="text-xs font-bold text-primary">Generate Reference</Text>
            </Pressable>
          </View>
          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-muted">Upload Receipt</Text>
            <Pressable onPress={openReceiptPicker} className="min-h-[118px] items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-5">
              {Platform.OS === 'web' ? (
                <input
                  ref={receiptInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  type="file"
                  onChange={(event) => setReceipt(event.target.files?.[0] || null)}
                />
              ) : null}
              <View className="mb-3 h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <UploadCloud size={23} color="#D4AF37" />
              </View>
              <Text className="text-center font-bold text-white">{receipt ? fileName(receipt) : 'Click to upload or drag and drop'}</Text>
              <Text className="mt-1 text-center text-xs text-muted">{receipt ? 'Receipt attached and ready to submit' : 'JPG or PNG receipt image'}</Text>
            </Pressable>
            {receipt ? (
              <Pressable onPress={() => setReceipt(null)} className="mt-2 flex-row items-center self-start rounded-full border border-border px-3 py-2">
                <X size={14} color="#8fa0bb" />
                <Text className="ml-2 text-xs font-bold text-muted">Remove receipt</Text>
              </Pressable>
            ) : null}
          </View>
          <CustomInput label="Note (Optional)" placeholder="Optional note for admin review" value={form.note} onChangeText={update('note')} />
          <View className="mb-4 flex-row rounded-xl border border-success/20 bg-success/10 p-3">
            <ShieldCheck size={17} color="#12cf7a" />
            <Text className="ml-2 flex-1 text-xs font-semibold text-white">Funds are credited only after payment verification. Never share your account password with anyone.</Text>
          </View>
          <CustomButton title="Submit Deposit Request" onPress={submit} loading={loading} disabled={disabled} variant="success" />
        </View>

        <View className="w-full gap-4 xl:w-[280px]">
          <View className="rounded-2xl border border-border bg-surface p-5">
            <View className="mb-4 h-12 w-12 items-center justify-center rounded-2xl bg-success/10">
              <ShieldCheck size={24} color="#12cf7a" />
            </View>
            <Text className="text-lg font-black text-white">Deposit Process</Text>
            <View className="mt-5 gap-4">
              {['Request Submitted', 'Waiting for Review', 'Approved', 'Funds Credited'].map((item, index) => (
                <View key={item} className="flex-row">
                  <View className={`mr-3 h-7 w-7 items-center justify-center rounded-full border ${index === 0 ? 'border-success bg-success' : 'border-muted'}`}>
                    {index === 0 ? <CheckCircle2 size={15} color="#0B0B0B" /> : <Clock3 size={14} color="#8fa0bb" />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-white">{item}</Text>
                    <Text className="mt-1 text-xs text-muted">{index === 0 ? 'You submit your deposit request' : index === 1 ? 'Admin is reviewing your request' : index === 2 ? 'Your deposit has been approved' : 'Amount added to your wallet'}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
          <View className="rounded-2xl border border-border bg-surface p-5">
            <Clock3 size={24} color="#12cf7a" />
            <Text className="mt-3 text-base font-black text-white">Estimated Processing Time</Text>
            <Text className="mt-3 text-sm leading-5 text-muted">Standard review: 5 - 30 Minutes</Text>
            <Text className="mt-1 text-sm leading-5 text-muted">Weekends and holidays: up to 24 hours</Text>
          </View>
        </View>
      </View>

      <View className="px-5 pb-5">
        {disabled && disabledMessage ? <Text className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{disabledMessage}</Text> : null}
        {message ? <Text className={`mt-3 rounded-xl border p-3 text-sm ${success ? 'border-success/40 bg-success/10 text-success' : 'border-danger/40 bg-danger/10 text-danger'}`}>{message}</Text> : null}
      </View>
    </View>
  );
}
