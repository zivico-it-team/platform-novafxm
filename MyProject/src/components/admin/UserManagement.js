import { useMemo, useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { ChevronDown, Edit3, Eye, Trash2, X } from 'lucide-react-native';
import CustomButton from '../common/CustomButton';
import CustomInput from '../common/CustomInput';
import { useAppTheme } from '../../context/ThemeContext';
import { dateTime, money } from '../../utils/formatters';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  country: '',
  dateOfBirth: '',
  accountType: 'Demo',
  leverage: '100',
  tradingStatus: 'active',
  verificationStatus: 'unverified',
  adminNotes: '',
};

const freshEmptyForm = () => ({ ...emptyForm });

const accountTypes = ['Demo', 'Live'];
const tradingStatuses = ['active', 'frozen'];
const verificationStatuses = ['unverified', 'pending', 'approved', 'rejected'];
const countries = [
  { name: 'Afghanistan', code: '+93' }, { name: 'Albania', code: '+355' }, { name: 'Algeria', code: '+213' },
  { name: 'Andorra', code: '+376' }, { name: 'Angola', code: '+244' }, { name: 'Antigua and Barbuda', code: '+1' },
  { name: 'Argentina', code: '+54' }, { name: 'Armenia', code: '+374' }, { name: 'Australia', code: '+61' },
  { name: 'Austria', code: '+43' }, { name: 'Azerbaijan', code: '+994' }, { name: 'Bahamas', code: '+1' },
  { name: 'Bahrain', code: '+973' }, { name: 'Bangladesh', code: '+880' }, { name: 'Barbados', code: '+1' },
  { name: 'Belarus', code: '+375' }, { name: 'Belgium', code: '+32' }, { name: 'Belize', code: '+501' },
  { name: 'Benin', code: '+229' }, { name: 'Bhutan', code: '+975' }, { name: 'Bolivia', code: '+591' },
  { name: 'Bosnia and Herzegovina', code: '+387' }, { name: 'Botswana', code: '+267' }, { name: 'Brazil', code: '+55' },
  { name: 'Brunei', code: '+673' }, { name: 'Bulgaria', code: '+359' }, { name: 'Burkina Faso', code: '+226' },
  { name: 'Burundi', code: '+257' }, { name: 'Cabo Verde', code: '+238' }, { name: 'Cambodia', code: '+855' },
  { name: 'Cameroon', code: '+237' }, { name: 'Canada', code: '+1' }, { name: 'Central African Republic', code: '+236' },
  { name: 'Chad', code: '+235' }, { name: 'Chile', code: '+56' }, { name: 'China', code: '+86' },
  { name: 'Colombia', code: '+57' }, { name: 'Comoros', code: '+269' }, { name: 'Congo', code: '+242' },
  { name: 'Costa Rica', code: '+506' }, { name: "Cote d'Ivoire", code: '+225' }, { name: 'Croatia', code: '+385' },
  { name: 'Cuba', code: '+53' }, { name: 'Cyprus', code: '+357' }, { name: 'Czech Republic', code: '+420' },
  { name: 'Democratic Republic of the Congo', code: '+243' }, { name: 'Denmark', code: '+45' }, { name: 'Djibouti', code: '+253' },
  { name: 'Dominica', code: '+1' }, { name: 'Dominican Republic', code: '+1' }, { name: 'Ecuador', code: '+593' },
  { name: 'Egypt', code: '+20' }, { name: 'El Salvador', code: '+503' }, { name: 'Equatorial Guinea', code: '+240' },
  { name: 'Eritrea', code: '+291' }, { name: 'Estonia', code: '+372' }, { name: 'Eswatini', code: '+268' },
  { name: 'Ethiopia', code: '+251' }, { name: 'Fiji', code: '+679' }, { name: 'Finland', code: '+358' },
  { name: 'France', code: '+33' }, { name: 'Gabon', code: '+241' }, { name: 'Gambia', code: '+220' },
  { name: 'Georgia', code: '+995' }, { name: 'Germany', code: '+49' }, { name: 'Ghana', code: '+233' },
  { name: 'Greece', code: '+30' }, { name: 'Grenada', code: '+1' }, { name: 'Guatemala', code: '+502' },
  { name: 'Guinea', code: '+224' }, { name: 'Guinea-Bissau', code: '+245' }, { name: 'Guyana', code: '+592' },
  { name: 'Haiti', code: '+509' }, { name: 'Honduras', code: '+504' }, { name: 'Hungary', code: '+36' },
  { name: 'Iceland', code: '+354' }, { name: 'India', code: '+91' }, { name: 'Indonesia', code: '+62' },
  { name: 'Iran', code: '+98' }, { name: 'Iraq', code: '+964' }, { name: 'Ireland', code: '+353' },
  { name: 'Israel', code: '+972' }, { name: 'Italy', code: '+39' }, { name: 'Jamaica', code: '+1' },
  { name: 'Japan', code: '+81' }, { name: 'Jordan', code: '+962' }, { name: 'Kazakhstan', code: '+7' },
  { name: 'Kenya', code: '+254' }, { name: 'Kiribati', code: '+686' }, { name: 'Kuwait', code: '+965' },
  { name: 'Kyrgyzstan', code: '+996' }, { name: 'Laos', code: '+856' }, { name: 'Latvia', code: '+371' },
  { name: 'Lebanon', code: '+961' }, { name: 'Lesotho', code: '+266' }, { name: 'Liberia', code: '+231' },
  { name: 'Libya', code: '+218' }, { name: 'Liechtenstein', code: '+423' }, { name: 'Lithuania', code: '+370' },
  { name: 'Luxembourg', code: '+352' }, { name: 'Madagascar', code: '+261' }, { name: 'Malawi', code: '+265' },
  { name: 'Malaysia', code: '+60' }, { name: 'Maldives', code: '+960' }, { name: 'Mali', code: '+223' },
  { name: 'Malta', code: '+356' }, { name: 'Marshall Islands', code: '+692' }, { name: 'Mauritania', code: '+222' },
  { name: 'Mauritius', code: '+230' }, { name: 'Mexico', code: '+52' }, { name: 'Micronesia', code: '+691' },
  { name: 'Moldova', code: '+373' }, { name: 'Monaco', code: '+377' }, { name: 'Mongolia', code: '+976' },
  { name: 'Montenegro', code: '+382' }, { name: 'Morocco', code: '+212' }, { name: 'Mozambique', code: '+258' },
  { name: 'Myanmar', code: '+95' }, { name: 'Namibia', code: '+264' }, { name: 'Nauru', code: '+674' },
  { name: 'Nepal', code: '+977' }, { name: 'Netherlands', code: '+31' }, { name: 'New Zealand', code: '+64' },
  { name: 'Nicaragua', code: '+505' }, { name: 'Niger', code: '+227' }, { name: 'Nigeria', code: '+234' },
  { name: 'North Korea', code: '+850' }, { name: 'North Macedonia', code: '+389' }, { name: 'Norway', code: '+47' },
  { name: 'Oman', code: '+968' }, { name: 'Pakistan', code: '+92' }, { name: 'Palau', code: '+680' },
  { name: 'Palestine', code: '+970' }, { name: 'Panama', code: '+507' }, { name: 'Papua New Guinea', code: '+675' },
  { name: 'Paraguay', code: '+595' }, { name: 'Peru', code: '+51' }, { name: 'Philippines', code: '+63' },
  { name: 'Poland', code: '+48' }, { name: 'Portugal', code: '+351' }, { name: 'Qatar', code: '+974' },
  { name: 'Romania', code: '+40' }, { name: 'Russia', code: '+7' }, { name: 'Rwanda', code: '+250' },
  { name: 'Saint Kitts and Nevis', code: '+1' }, { name: 'Saint Lucia', code: '+1' }, { name: 'Saint Vincent and the Grenadines', code: '+1' },
  { name: 'Samoa', code: '+685' }, { name: 'San Marino', code: '+378' }, { name: 'Sao Tome and Principe', code: '+239' },
  { name: 'Saudi Arabia', code: '+966' }, { name: 'Senegal', code: '+221' }, { name: 'Serbia', code: '+381' },
  { name: 'Seychelles', code: '+248' }, { name: 'Sierra Leone', code: '+232' }, { name: 'Singapore', code: '+65' },
  { name: 'Slovakia', code: '+421' }, { name: 'Slovenia', code: '+386' }, { name: 'Solomon Islands', code: '+677' },
  { name: 'Somalia', code: '+252' }, { name: 'South Africa', code: '+27' }, { name: 'South Korea', code: '+82' },
  { name: 'South Sudan', code: '+211' }, { name: 'Spain', code: '+34' }, { name: 'Sri Lanka', code: '+94' },
  { name: 'Sudan', code: '+249' }, { name: 'Suriname', code: '+597' }, { name: 'Sweden', code: '+46' },
  { name: 'Switzerland', code: '+41' }, { name: 'Syria', code: '+963' }, { name: 'Taiwan', code: '+886' },
  { name: 'Tajikistan', code: '+992' }, { name: 'Tanzania', code: '+255' }, { name: 'Thailand', code: '+66' },
  { name: 'Timor-Leste', code: '+670' }, { name: 'Togo', code: '+228' }, { name: 'Tonga', code: '+676' },
  { name: 'Trinidad and Tobago', code: '+1' }, { name: 'Tunisia', code: '+216' }, { name: 'Turkey', code: '+90' },
  { name: 'Turkmenistan', code: '+993' }, { name: 'Tuvalu', code: '+688' }, { name: 'Uganda', code: '+256' },
  { name: 'Ukraine', code: '+380' }, { name: 'United Arab Emirates', code: '+971' }, { name: 'United Kingdom', code: '+44' },
  { name: 'United States', code: '+1' }, { name: 'Uruguay', code: '+598' }, { name: 'Uzbekistan', code: '+998' },
  { name: 'Vanuatu', code: '+678' }, { name: 'Vatican City', code: '+39' }, { name: 'Venezuela', code: '+58' },
  { name: 'Vietnam', code: '+84' }, { name: 'Yemen', code: '+967' }, { name: 'Zambia', code: '+260' },
  { name: 'Zimbabwe', code: '+263' },
];

const countryByName = (name) => countries.find((country) => country.name === name);
const phoneWithoutDialCode = (phone) => String(phone || '').replace(/^\+\d{1,4}\s*/, '').trim();
const digitsOnly = (value) => String(value || '').replace(/\D/g, '');
const phoneWithCountryCode = (phone, countryName) => {
  const country = countryByName(countryName);
  if (!country) return phone;
  const localNumber = phoneWithoutDialCode(phone);
  return localNumber ? `${country.code} ${localNumber}` : `${country.code} `;
};
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

function validateUserForm(form, mode) {
  const errors = {};
  const country = countryByName(form.country);
  const email = String(form.email || '').trim();
  const phone = String(form.phone || '').trim();
  const localPhoneDigits = digitsOnly(phoneWithoutDialCode(phone));

  if (!String(form.name || '').trim()) errors.name = 'Full name is required.';
  if (!email) errors.email = 'Email is required.';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
  if (mode === 'add' && String(form.password || '').length < 8) errors.password = 'Password must be at least 8 characters.';
  if (mode === 'edit' && form.password && String(form.password).length < 8) errors.password = 'Password must be at least 8 characters.';
  if (!country) errors.country = 'Please select a country.';
  if (!phone) errors.phone = 'Phone number is required.';
  else if (!country) errors.phone = 'Select a country before entering the phone number.';
  else if (!phone.startsWith(country.code)) errors.phone = `Phone number must start with ${country.code}.`;
  else if (localPhoneDigits.length < 6 || localPhoneDigits.length > 14) errors.phone = 'Enter a valid phone number.';

  return errors;
}

function ask(message, onConfirm) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (window.confirm(message)) onConfirm();
    return;
  }
  Alert.alert('Confirm admin action', message, [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', style: 'destructive', onPress: onConfirm }]);
}

function pillClass(active) {
  return active ? 'border-primary bg-primary' : 'border-border bg-surface';
}

function PillGroup({ label, options, value, onChange }) {
  const { colors } = useAppTheme();

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold" style={{ color: colors.muted }}>{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option;
          return (
            <Pressable key={option} onPress={() => onChange(option)} className={`rounded-xl border px-4 py-3 ${pillClass(active)}`} style={active ? null : { backgroundColor: colors.surface, borderColor: colors.border }}>
              <Text className={`text-xs font-bold capitalize ${active ? 'text-black' : ''}`} style={active ? null : { color: colors.text }}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function CountrySelect({ value, onChange }) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  const selected = countryByName(value);

  const selectCountry = (country) => {
    onChange(country.name);
    setOpen(false);
  };

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-medium" style={{ color: colors.muted }}>Country</Text>
      <Pressable onPress={() => setOpen((current) => !current)} className="h-12 flex-row items-center justify-between rounded-xl border px-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <Text style={{ color: selected ? colors.text : colors.muted }}>{selected ? `${selected.name} (${selected.code})` : 'Select country'}</Text>
        <ChevronDown size={17} color={colors.muted} style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
      </Pressable>
      {open ? (
        <ScrollView nestedScrollEnabled className="mt-2 rounded-xl border" style={{ maxHeight: 260, backgroundColor: colors.panel, borderColor: colors.border }}>
          {countries.map((country) => (
            <Pressable
              key={country.name}
              onPress={() => selectCountry(country)}
              className={`border-b px-4 py-3 ${country.name === value ? 'bg-primary/10' : ''}`}
              style={{ borderColor: colors.border }}
            >
              <Text className={country.name === value ? 'font-bold text-primary' : ''} style={country.name === value ? null : { color: colors.text }}>{country.name} ({country.code})</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

function FieldError({ children }) {
  return children ? <Text className="mt-1 text-xs text-danger">{children}</Text> : null;
}

function ProfileField({ label, value }) {
  const { colors } = useAppTheme();

  return (
    <View className="mb-3 min-w-[180px] flex-1 rounded-xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <Text className="text-xs font-bold uppercase" style={{ color: colors.muted }}>{label}</Text>
      <Text className="mt-1 text-sm font-semibold" style={{ color: colors.text }}>{value || '-'}</Text>
    </View>
  );
}

function userToForm(user) {
  return {
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    phone: user?.phone || '',
    country: user?.country || '',
    dateOfBirth: user?.dateOfBirth || '',
    accountType: user?.accountType || 'Demo',
    leverage: String(user?.leverage || 100),
    tradingStatus: user?.tradingStatus || 'active',
    verificationStatus: user?.verificationStatus || 'unverified',
    adminNotes: user?.adminNotes || '',
  };
}

function UserFormModal({ mode, user, saving, onClose, onSubmit }) {
  const { colors } = useAppTheme();
  const [form, setForm] = useState(user ? userToForm(user) : freshEmptyForm());
  const [errors, setErrors] = useState({});
  const update = (key) => (value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: null }));
  };
  const updateCountry = (country) => {
    setForm((current) => ({ ...current, country, phone: phoneWithCountryCode(current.phone, country) }));
    setErrors((current) => ({ ...current, country: null, phone: null }));
  };
  const submit = async () => {
    const nextErrors = validateUserForm(form, mode);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    await onSubmit(form);
    if (mode === 'add') {
      setForm(freshEmptyForm());
      setErrors({});
    }
  };
  const title = mode === 'edit' ? 'Edit User Details' : 'Add New User';

  return (
    <View className="absolute inset-0 z-50 items-center justify-start bg-black/70 p-4 pt-6 md:pt-8">
      <View className="max-h-[92vh] w-full max-w-[860px] rounded-2xl border p-5" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>{title}</Text>
            <Text className="mt-1 text-sm" style={{ color: colors.muted }}>{mode === 'edit' ? 'Update client profile and account settings.' : 'Create a client login with a wallet and primary trading account.'}</Text>
          </View>
          <Pressable onPress={onClose} className="rounded-full p-2" style={{ backgroundColor: colors.surface }}>
            <X size={18} color={colors.muted} />
          </Pressable>
        </View>
        <ScrollView>
          <View className="gap-4 md:flex-row">
            <View className="flex-1">
              <CustomInput label="Full Name" value={form.name} onChangeText={update('name')} placeholder="Client name" autoComplete="off" importantForAutofill="no" error={errors.name} />
              <CustomInput label="Email" value={form.email} onChangeText={update('email')} placeholder="client@example.com" autoCapitalize="none" keyboardType="email-address" autoComplete="off" importantForAutofill="no" error={errors.email} />
              <CustomInput label={mode === 'edit' ? 'New Password (Optional)' : 'Password'} value={form.password} onChangeText={update('password')} placeholder="At least 8 characters" secureTextEntry autoComplete="new-password" importantForAutofill="no" error={errors.password} />
              <CountrySelect key={form.country || 'empty-country'} value={form.country} onChange={updateCountry} />
              <FieldError>{errors.country}</FieldError>
              <CustomInput label="Phone" value={form.phone} onChangeText={update('phone')} placeholder="Phone number" autoComplete="off" importantForAutofill="no" error={errors.phone} />
            </View>
            <View className="flex-1">
              <CustomInput label="Date of Birth" value={form.dateOfBirth} onChangeText={update('dateOfBirth')} placeholder="YYYY-MM-DD" autoComplete="off" importantForAutofill="no" />
              <CustomInput label="Leverage" value={form.leverage} onChangeText={update('leverage')} placeholder="100" keyboardType="number-pad" />
              <PillGroup label="Account Type" options={accountTypes} value={form.accountType} onChange={update('accountType')} />
              <PillGroup label="Trading Status" options={tradingStatuses} value={form.tradingStatus} onChange={update('tradingStatus')} />
              <PillGroup label="Verification" options={verificationStatuses} value={form.verificationStatus} onChange={update('verificationStatus')} />
            </View>
          </View>
          <CustomInput
            label="Admin Notes"
            value={form.adminNotes}
            onChangeText={update('adminNotes')}
            placeholder="Internal note"
            multiline
            style={{ minHeight: 90, textAlignVertical: 'top', paddingTop: 12 }}
          />
          <View className="mt-2 flex-row justify-end gap-3">
            <CustomButton title="Cancel" variant="secondary" onPress={onClose} className="min-w-[120px]" />
            <CustomButton title={mode === 'edit' ? 'Save Changes' : 'Add User'} loading={saving} onPress={submit} className="min-w-[150px]" />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function ProfileModal({ user, onClose, onEdit }) {
  const { colors } = useAppTheme();
  const wallet = user?.wallet || {};
  return (
    <View className="absolute inset-0 z-50 items-center justify-start bg-black/70 p-4 pt-6 md:pt-8">
      <View className="max-h-[92vh] w-full max-w-[920px] rounded-2xl border p-5" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>{user.name}</Text>
            <Text className="mt-1 text-sm" style={{ color: colors.muted }}>{user.email}</Text>
          </View>
          <View className="flex-row gap-2">
            <CustomButton title="Edit" variant="secondary" className="min-w-[90px]" onPress={() => onEdit(user)} />
            <Pressable onPress={onClose} className="rounded-full p-3" style={{ backgroundColor: colors.surface }}>
              <X size={18} color={colors.muted} />
            </Pressable>
          </View>
        </View>
        <ScrollView>
          <View className="mb-4 rounded-2xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <Text className="mb-3 text-sm font-bold uppercase" style={{ color: colors.muted }}>Profile Image</Text>
            {user.profileImage ? (
              <Image source={{ uri: user.profileImage }} className="h-[220px] w-full rounded-xl bg-black" resizeMode="contain" />
            ) : (
              <View className="h-[180px] items-center justify-center rounded-xl border border-dashed" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
                <Text className="text-sm font-semibold" style={{ color: colors.muted }}>No profile image uploaded.</Text>
              </View>
            )}
          </View>
          <View className="mb-4 flex-row flex-wrap gap-3">
            <ProfileField label="Phone" value={user.phone} />
            <ProfileField label="Country" value={user.country} />
            <ProfileField label="Date of Birth" value={user.dateOfBirth} />
            <ProfileField label="Role" value={user.role} />
            <ProfileField label="Account Type" value={user.accountType} />
            <ProfileField label="Trading Status" value={user.tradingStatus} />
            <ProfileField label="Verification" value={user.verificationStatus} />
            <ProfileField label="Leverage" value={`1:${user.leverage || 100}`} />
            <ProfileField label="Referral Code" value={user.referralCode} />
            <ProfileField label="Created" value={dateTime(user.createdAt)} />
          </View>
          <Text className="mb-3 text-lg font-bold" style={{ color: colors.text }}>Wallet Summary</Text>
          <View className="mb-4 flex-row flex-wrap gap-3">
            <ProfileField label="Balance" value={`$${money(wallet.balance)}`} />
            <ProfileField label="Equity" value={`$${money(wallet.equity)}`} />
            <ProfileField label="Margin" value={`$${money(wallet.margin)}`} />
            <ProfileField label="Free Funds" value={`$${money(wallet.freeFunds)}`} />
          </View>
          <Text className="mb-3 text-lg font-bold" style={{ color: colors.text }}>Trading Accounts</Text>
          <View className="mb-4 gap-2">
            {(user.tradingAccounts || []).map((account) => (
              <View key={account.id} className="flex-row flex-wrap items-center justify-between rounded-xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <View>
                  <Text className="font-bold" style={{ color: colors.text }}>{account.name}</Text>
                  <Text className="mt-1 text-sm" style={{ color: colors.muted }}>{account.type} | {account.status} | {account.isPrimary ? 'Primary' : 'Secondary'}</Text>
                </View>
                <Text className="font-bold text-primary">${money(account.balance)}</Text>
              </View>
            ))}
            {!user.tradingAccounts?.length ? <Text className="rounded-xl p-4" style={{ backgroundColor: colors.surface, color: colors.muted }}>No trading accounts found.</Text> : null}
          </View>
          <Text className="mb-3 text-lg font-bold" style={{ color: colors.text }}>Admin Notes</Text>
          <Text className="rounded-xl border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.muted }}>{user.adminNotes || 'No admin notes.'}</Text>
        </ScrollView>
      </View>
    </View>
  );
}

export default function UserManagement({ users, loading, busyId, onCreate, onUpdate, onRemove, onViewUser }) {
  const { colors } = useAppTheme();
  const [query, setQuery] = useState('');
  const [profileUser, setProfileUser] = useState(null);
  const [formState, setFormState] = useState(null);
  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    return users.filter((user) => {
      if (user.role === 'admin') return false;
      if (!term) return true;
      return [user.name, user.email, user.phone, user.country].some((value) => String(value || '').toLowerCase().includes(term));
    });
  }, [query, users]);

  const closeForm = () => setFormState(null);
  const openAddForm = () => setFormState({ mode: 'add', key: Date.now() });
  const submitForm = async (values) => {
    if (formState?.mode === 'edit') {
      await onUpdate(formState.user.id, values);
      closeForm();
    } else {
      await onCreate(values);
    }
  };
  const editUser = (user) => {
    setProfileUser(null);
    setFormState({ mode: 'edit', user });
  };
  const viewUser = (user) => {
    setProfileUser(user);
    onViewUser?.(user);
  };

  return (
    <View>
      <View className="mb-5 flex-row flex-wrap items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-xl font-bold" style={{ color: colors.text }}>User Management</Text>
          <Text className="mt-1 text-sm" style={{ color: colors.muted }}>View profiles, add users, edit details, and remove client accounts.</Text>
        </View>
        <CustomButton title="Add User" onPress={openAddForm} className="min-w-[130px]" />
      </View>
      <CustomInput label="Search Users" value={query} onChangeText={setQuery} placeholder="Search by name, email, phone or country" />
      <View className="overflow-hidden rounded-2xl border" style={{ backgroundColor: colors.panel, borderColor: colors.border }}>
        <ScrollView horizontal contentContainerStyle={{ minWidth: '100%' }}>
          <View style={{ minWidth: 1050, flexGrow: 1 }}>
            <View className="flex-row border-b p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              {['User', 'Phone', 'Country', 'Account', 'Verification', 'Wallet', 'Created', 'Actions'].map((heading, index) => (
                <Text key={heading} style={{ width: [250, 130, 130, 120, 130, 120, 130, 140][index], color: colors.muted }} className="text-xs font-bold uppercase">{heading}</Text>
              ))}
            </View>
            {filteredUsers.map((user) => {
              const blocked = loading || busyId === user.id;
              return (
                <View key={user.id} className="flex-row items-center border-b p-4" style={{ borderColor: colors.border }}>
                  <View style={{ width: 250 }}>
                    <Text className="font-bold" style={{ color: colors.text }}>{user.name}</Text>
                    <Text className="mt-1 text-xs" style={{ color: colors.muted }}>{user.email}</Text>
                  </View>
                  <Text style={{ width: 130, color: colors.muted }} className="text-sm">{user.phone || '-'}</Text>
                  <Text style={{ width: 130, color: colors.muted }} className="text-sm">{user.country || '-'}</Text>
                  <Text style={{ width: 120, color: colors.text }} className="text-sm">{user.accountType || '-'}</Text>
                  <Text style={{ width: 130, color: colors.text }} className="text-sm">{user.verificationStatus || '-'}</Text>
                  <Text style={{ width: 120 }} className="text-sm font-bold text-primary">${money(user.wallet?.balance)}</Text>
                  <Text style={{ width: 130, color: colors.muted }} className="text-sm">{dateTime(user.createdAt)}</Text>
                  <View style={{ width: 140 }} className="flex-row gap-2">
                    <Pressable disabled={blocked} onPress={() => viewUser(user)} className={`rounded-lg border p-2 ${blocked ? 'opacity-40' : ''}`} style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                      <Eye size={16} color={colors.text} />
                    </Pressable>
                    <Pressable disabled={blocked} onPress={() => editUser(user)} className={`rounded-lg border p-2 ${blocked ? 'opacity-40' : ''}`} style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                      <Edit3 size={16} color="#D4AF37" />
                    </Pressable>
                    <Pressable
                      disabled={blocked}
                      onPress={() => ask(`Remove ${user.name}? This will delete the user account and related wallet records.`, () => onRemove(user))}
                      className={`rounded-lg border border-danger/60 bg-danger/10 p-2 ${blocked ? 'opacity-40' : ''}`}
                    >
                      <Trash2 size={16} color="#f24d58" />
                    </Pressable>
                  </View>
                </View>
              );
            })}
            {!filteredUsers.length ? <Text className="p-8 text-center" style={{ color: colors.muted }}>No users found.</Text> : null}
          </View>
        </ScrollView>
      </View>
      {profileUser ? <ProfileModal user={profileUser} onClose={() => setProfileUser(null)} onEdit={editUser} /> : null}
      {formState ? (
        <UserFormModal
          key={formState.key || formState.user?.id || 'user-form'}
          mode={formState.mode}
          user={formState.user}
          saving={loading || busyId === formState.user?.id}
          onClose={closeForm}
          onSubmit={submitForm}
        />
      ) : null}
    </View>
  );
}
