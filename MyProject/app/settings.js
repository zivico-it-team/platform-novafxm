import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { Image, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import {
  Bell,
  CalendarDays,
  Camera,
  CheckCircle2,
  Copy,
  CreditCard,
  Headphones,
  Info,
  LockKeyhole,
  LogOut,
  Palette,
  Save,
  Settings2,
  Shield,
  SlidersHorizontal,
  UserRound,
  Volume2,
} from 'lucide-react-native';
import CustomButton from '../src/components/common/CustomButton';
import { useAuth } from '../src/hooks/useAuth';
import { useAppTheme } from '../src/context/ThemeContext';

const countries = [
  { name: 'Afghanistan', code: '+93' },
  { name: 'Albania', code: '+355' },
  { name: 'Algeria', code: '+213' },
  { name: 'Andorra', code: '+376' },
  { name: 'Angola', code: '+244' },
  { name: 'Antigua and Barbuda', code: '+1' },
  { name: 'Argentina', code: '+54' },
  { name: 'Armenia', code: '+374' },
  { name: 'Australia', code: '+61' },
  { name: 'Austria', code: '+43' },
  { name: 'Azerbaijan', code: '+994' },
  { name: 'Bahamas', code: '+1' },
  { name: 'Bahrain', code: '+973' },
  { name: 'Bangladesh', code: '+880' },
  { name: 'Barbados', code: '+1' },
  { name: 'Belarus', code: '+375' },
  { name: 'Belgium', code: '+32' },
  { name: 'Belize', code: '+501' },
  { name: 'Benin', code: '+229' },
  { name: 'Bhutan', code: '+975' },
  { name: 'Bolivia', code: '+591' },
  { name: 'Bosnia and Herzegovina', code: '+387' },
  { name: 'Botswana', code: '+267' },
  { name: 'Brazil', code: '+55' },
  { name: 'Brunei', code: '+673' },
  { name: 'Bulgaria', code: '+359' },
  { name: 'Burkina Faso', code: '+226' },
  { name: 'Burundi', code: '+257' },
  { name: 'Cabo Verde', code: '+238' },
  { name: 'Cambodia', code: '+855' },
  { name: 'Cameroon', code: '+237' },
  { name: 'Canada', code: '+1' },
  { name: 'Central African Republic', code: '+236' },
  { name: 'Chad', code: '+235' },
  { name: 'Chile', code: '+56' },
  { name: 'China', code: '+86' },
  { name: 'Colombia', code: '+57' },
  { name: 'Comoros', code: '+269' },
  { name: 'Congo', code: '+242' },
  { name: 'Costa Rica', code: '+506' },
  { name: "Cote d'Ivoire", code: '+225' },
  { name: 'Croatia', code: '+385' },
  { name: 'Cuba', code: '+53' },
  { name: 'Cyprus', code: '+357' },
  { name: 'Czech Republic', code: '+420' },
  { name: 'Democratic Republic of the Congo', code: '+243' },
  { name: 'Denmark', code: '+45' },
  { name: 'Djibouti', code: '+253' },
  { name: 'Dominica', code: '+1' },
  { name: 'Dominican Republic', code: '+1' },
  { name: 'Ecuador', code: '+593' },
  { name: 'Egypt', code: '+20' },
  { name: 'El Salvador', code: '+503' },
  { name: 'Equatorial Guinea', code: '+240' },
  { name: 'Eritrea', code: '+291' },
  { name: 'Estonia', code: '+372' },
  { name: 'Eswatini', code: '+268' },
  { name: 'Ethiopia', code: '+251' },
  { name: 'Fiji', code: '+679' },
  { name: 'Finland', code: '+358' },
  { name: 'France', code: '+33' },
  { name: 'Gabon', code: '+241' },
  { name: 'Gambia', code: '+220' },
  { name: 'Georgia', code: '+995' },
  { name: 'Germany', code: '+49' },
  { name: 'Ghana', code: '+233' },
  { name: 'Greece', code: '+30' },
  { name: 'Grenada', code: '+1' },
  { name: 'Guatemala', code: '+502' },
  { name: 'Guinea', code: '+224' },
  { name: 'Guinea-Bissau', code: '+245' },
  { name: 'Guyana', code: '+592' },
  { name: 'Haiti', code: '+509' },
  { name: 'Honduras', code: '+504' },
  { name: 'Hungary', code: '+36' },
  { name: 'Iceland', code: '+354' },
  { name: 'India', code: '+91' },
  { name: 'Indonesia', code: '+62' },
  { name: 'Iran', code: '+98' },
  { name: 'Iraq', code: '+964' },
  { name: 'Ireland', code: '+353' },
  { name: 'Israel', code: '+972' },
  { name: 'Italy', code: '+39' },
  { name: 'Jamaica', code: '+1' },
  { name: 'Japan', code: '+81' },
  { name: 'Jordan', code: '+962' },
  { name: 'Kazakhstan', code: '+7' },
  { name: 'Kenya', code: '+254' },
  { name: 'Kiribati', code: '+686' },
  { name: 'Kuwait', code: '+965' },
  { name: 'Kyrgyzstan', code: '+996' },
  { name: 'Laos', code: '+856' },
  { name: 'Latvia', code: '+371' },
  { name: 'Lebanon', code: '+961' },
  { name: 'Lesotho', code: '+266' },
  { name: 'Liberia', code: '+231' },
  { name: 'Libya', code: '+218' },
  { name: 'Liechtenstein', code: '+423' },
  { name: 'Lithuania', code: '+370' },
  { name: 'Luxembourg', code: '+352' },
  { name: 'Madagascar', code: '+261' },
  { name: 'Malawi', code: '+265' },
  { name: 'Malaysia', code: '+60' },
  { name: 'Maldives', code: '+960' },
  { name: 'Mali', code: '+223' },
  { name: 'Malta', code: '+356' },
  { name: 'Marshall Islands', code: '+692' },
  { name: 'Mauritania', code: '+222' },
  { name: 'Mauritius', code: '+230' },
  { name: 'Mexico', code: '+52' },
  { name: 'Micronesia', code: '+691' },
  { name: 'Moldova', code: '+373' },
  { name: 'Monaco', code: '+377' },
  { name: 'Mongolia', code: '+976' },
  { name: 'Montenegro', code: '+382' },
  { name: 'Morocco', code: '+212' },
  { name: 'Mozambique', code: '+258' },
  { name: 'Myanmar', code: '+95' },
  { name: 'Namibia', code: '+264' },
  { name: 'Nauru', code: '+674' },
  { name: 'Nepal', code: '+977' },
  { name: 'Netherlands', code: '+31' },
  { name: 'New Zealand', code: '+64' },
  { name: 'Nicaragua', code: '+505' },
  { name: 'Niger', code: '+227' },
  { name: 'Nigeria', code: '+234' },
  { name: 'North Korea', code: '+850' },
  { name: 'North Macedonia', code: '+389' },
  { name: 'Norway', code: '+47' },
  { name: 'Oman', code: '+968' },
  { name: 'Pakistan', code: '+92' },
  { name: 'Palau', code: '+680' },
  { name: 'Palestine', code: '+970' },
  { name: 'Panama', code: '+507' },
  { name: 'Papua New Guinea', code: '+675' },
  { name: 'Paraguay', code: '+595' },
  { name: 'Peru', code: '+51' },
  { name: 'Philippines', code: '+63' },
  { name: 'Poland', code: '+48' },
  { name: 'Portugal', code: '+351' },
  { name: 'Qatar', code: '+974' },
  { name: 'Romania', code: '+40' },
  { name: 'Russia', code: '+7' },
  { name: 'Rwanda', code: '+250' },
  { name: 'Saint Kitts and Nevis', code: '+1' },
  { name: 'Saint Lucia', code: '+1' },
  { name: 'Saint Vincent and the Grenadines', code: '+1' },
  { name: 'Samoa', code: '+685' },
  { name: 'San Marino', code: '+378' },
  { name: 'Sao Tome and Principe', code: '+239' },
  { name: 'Saudi Arabia', code: '+966' },
  { name: 'Senegal', code: '+221' },
  { name: 'Serbia', code: '+381' },
  { name: 'Seychelles', code: '+248' },
  { name: 'Sierra Leone', code: '+232' },
  { name: 'Singapore', code: '+65' },
  { name: 'Slovakia', code: '+421' },
  { name: 'Slovenia', code: '+386' },
  { name: 'Solomon Islands', code: '+677' },
  { name: 'Somalia', code: '+252' },
  { name: 'South Africa', code: '+27' },
  { name: 'South Korea', code: '+82' },
  { name: 'South Sudan', code: '+211' },
  { name: 'Spain', code: '+34' },
  { name: 'Sri Lanka', code: '+94' },
  { name: 'Sudan', code: '+249' },
  { name: 'Suriname', code: '+597' },
  { name: 'Sweden', code: '+46' },
  { name: 'Switzerland', code: '+41' },
  { name: 'Syria', code: '+963' },
  { name: 'Taiwan', code: '+886' },
  { name: 'Tajikistan', code: '+992' },
  { name: 'Tanzania', code: '+255' },
  { name: 'Thailand', code: '+66' },
  { name: 'Timor-Leste', code: '+670' },
  { name: 'Togo', code: '+228' },
  { name: 'Tonga', code: '+676' },
  { name: 'Trinidad and Tobago', code: '+1' },
  { name: 'Tunisia', code: '+216' },
  { name: 'Turkey', code: '+90' },
  { name: 'Turkmenistan', code: '+993' },
  { name: 'Tuvalu', code: '+688' },
  { name: 'Uganda', code: '+256' },
  { name: 'Ukraine', code: '+380' },
  { name: 'United Arab Emirates', code: '+971' },
  { name: 'United Kingdom', code: '+44' },
  { name: 'United States', code: '+1' },
  { name: 'Uruguay', code: '+598' },
  { name: 'Uzbekistan', code: '+998' },
  { name: 'Vanuatu', code: '+678' },
  { name: 'Vatican City', code: '+39' },
  { name: 'Venezuela', code: '+58' },
  { name: 'Vietnam', code: '+84' },
  { name: 'Yemen', code: '+967' },
  { name: 'Zambia', code: '+260' },
  { name: 'Zimbabwe', code: '+263' },
];

const countryByName = (name) => countries.find((country) => country.name === name) || countries[0];

const phoneWithoutDialCode = (phone) => String(phone || '').replace(/^\+\d{1,4}\s*/, '').trim();

const withCountryCode = (phone, countryName) => {
  const dialCode = countryByName(countryName).code;
  const localNumber = phoneWithoutDialCode(phone);
  return localNumber ? `${dialCode} ${localNumber}` : `${dialCode} `;
};

const isValidDateOfBirth = (value) => {
  const match = /^(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})$/.exec(String(value || '').trim());
  if (!match) return false;
  const [, dayValue, monthValue, yearValue] = match;
  const day = Number(dayValue);
  const month = Number(monthValue);
  const year = Number(yearValue);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day && date < new Date();
};

function readFileDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function SettingsMenuItem({ icon: Icon, title, subtitle, active }) {
  return (
    <View className={`flex-row items-center rounded-xl p-4 ${active ? 'border-l-4 border-primary bg-primary/10' : ''}`}>
      <View className={`mr-3 h-10 w-10 items-center justify-center rounded-xl ${active ? 'bg-primary/20' : 'bg-surface'}`}>
        <Icon size={19} color={active ? '#D4AF37' : '#9CA3AF'} />
      </View>
      <View>
        <Text className={`font-bold ${active ? 'text-primary' : 'text-white'}`}>{title}</Text>
        <Text className="mt-1 text-xs text-muted">{subtitle}</Text>
      </View>
    </View>
  );
}

function SettingsInput({ label, value, onChangeText, placeholder, editable = true, error, keyboardType }) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-bold text-white">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor="#8fa0bb"
        keyboardType={keyboardType}
        className={`rounded-xl border border-border bg-panel px-4 py-3 text-white ${editable ? '' : 'opacity-70'}`}
      />
      {error ? <Text className="mt-1 text-xs text-danger">{error}</Text> : null}
    </View>
  );
}

function CountrySelect({ value, onChange, editable, error }) {
  const [open, setOpen] = useState(false);
  const selectedCountry = countryByName(value);

  const selectCountry = (countryName) => {
    onChange(countryName);
    setOpen(false);
  };

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-bold text-white">Country</Text>
      <Pressable
        disabled={!editable}
        onPress={() => setOpen((current) => !current)}
        className={`rounded-xl border border-border bg-panel px-4 py-3 ${editable ? '' : 'opacity-70'}`}
      >
        <Text className="text-white">{selectedCountry.name} ({selectedCountry.code})</Text>
      </Pressable>
      {open && editable ? (
        <ScrollView nestedScrollEnabled className="mt-2 rounded-xl border border-border bg-panel" style={{ maxHeight: 320 }}>
          {countries.map((country) => (
            <Pressable
              key={country.name}
              onPress={() => selectCountry(country.name)}
              className={`border-b border-border px-4 py-3 ${country.name === value ? 'bg-primary/10' : ''}`}
            >
              <Text className={country.name === value ? 'font-bold text-primary' : 'text-white'}>{country.name} ({country.code})</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      {error ? <Text className="mt-1 text-xs text-danger">{error}</Text> : null}
    </View>
  );
}

function PasswordInput({ label, placeholder }) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-bold text-white">{label}</Text>
      <View className="flex-row items-center rounded-xl border border-border bg-panel px-4">
        <TextInput secureTextEntry placeholder={placeholder} placeholderTextColor="#8fa0bb" className="flex-1 py-3 text-white" />
        <Shield size={17} color="#8fa0bb" />
      </View>
    </View>
  );
}

function Requirement({ children }) {
  return (
    <View className="mb-4 flex-row items-center">
      <CheckCircle2 size={16} color="#22c55e" />
      <Text className="ml-3 text-sm text-muted">{children}</Text>
    </View>
  );
}

function AccountInfoTile({ label, value, badge, tone = 'success' }) {
  const toneStyle = tone === 'danger'
    ? { backgroundColor: '#f24d5826', color: '#f24d58' }
    : tone === 'warning'
      ? { backgroundColor: '#D4AF3726', color: '#D4AF37' }
      : { backgroundColor: '#12cf7a26', color: '#12cf7a' };

  return (
    <View className="min-w-[160px] flex-1">
      <Text className="mb-2 text-sm text-muted">{label}</Text>
      {badge ? (
        <View className="self-start rounded-lg px-3 py-2" style={{ backgroundColor: toneStyle.backgroundColor }}>
          <Text className="font-bold" style={{ color: toneStyle.color }}>{value}</Text>
        </View>
      ) : (
        <Text className="text-base font-bold text-white">{value}</Text>
      )}
    </View>
  );
}

export default function SettingsScreen() {
  const { user, logout, updateProfile } = useAuth();
  const { darkMode, toggleTheme } = useAppTheme();
  const profileImageInputRef = useRef(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    country: 'Sri Lanka',
    dateOfBirth: '',
    profileImage: null,
  });

  useEffect(() => {
    const country = user?.country || 'Sri Lanka';
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: withCountryCode(user?.phone, country),
      country,
      dateOfBirth: user?.dateOfBirth || '',
      profileImage: user?.profileImage || null,
    });
    setProfileErrors({});
    setEditingProfile(false);
  }, [user]);

  const signOut = async () => {
    await logout();
    router.replace('/login');
  };

  const validateProfile = () => {
    const selectedCountry = countryByName(profileForm.country);
    const nextErrors = {};
    const normalizedPhone = String(profileForm.phone || '').trim();

    if (!profileForm.name.trim()) nextErrors.name = 'Full name is required.';
    if (profileForm.name.trim().length < 2) nextErrors.name = 'Full name must be at least 2 characters.';
    if (!profileForm.email.trim()) nextErrors.email = 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!profileForm.country) nextErrors.country = 'Please select a country.';
    if (!normalizedPhone.startsWith(selectedCountry.code)) nextErrors.phone = `Phone number must start with ${selectedCountry.code}.`;
    if (phoneWithoutDialCode(normalizedPhone).replace(/\D/g, '').length < 7) nextErrors.phone = 'Enter a valid phone number.';
    if (!profileForm.dateOfBirth.trim()) nextErrors.dateOfBirth = 'Date of birth is required.';
    if (profileForm.dateOfBirth.trim() && !isValidDateOfBirth(profileForm.dateOfBirth)) nextErrors.dateOfBirth = 'Use a valid DD / MM / YYYY date.';

    setProfileErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveSettings = async () => {
    setMessage('');
    setError('');
    if (!validateProfile()) return;
    try {
      await updateProfile({
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        country: profileForm.country,
        dateOfBirth: profileForm.dateOfBirth.trim(),
        profileImage: profileForm.profileImage,
      });
      setMessage('Profile changes saved successfully.');
      setEditingProfile(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Profile changes could not be saved.');
    }
  };

  const cancelProfileEdit = () => {
    const country = user?.country || 'Sri Lanka';
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: withCountryCode(user?.phone, country),
      country,
      dateOfBirth: user?.dateOfBirth || '',
      profileImage: user?.profileImage || null,
    });
    setProfileErrors({});
    setMessage('');
    setError('');
    setEditingProfile(false);
  };

  const updateCountry = (country) => {
    setProfileForm((current) => ({ ...current, country, phone: withCountryCode(current.phone, country) }));
  };

  const openProfileImagePicker = () => {
    setEditingProfile(true);
    if (Platform.OS !== 'web') return;
    profileImageInputRef.current?.click();
  };

  const selectProfileImage = async (file) => {
    if (!file) return;
    setMessage('');
    setError('');
    if (!file.type?.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Profile photo must be 5MB or smaller.');
      return;
    }
    try {
      const profileImage = await readFileDataUrl(file);
      setProfileForm((current) => ({ ...current, profileImage }));
      setEditingProfile(true);
    } catch {
      setError('Profile photo could not be loaded.');
    }
  };

  const removeProfileImage = () => {
    setProfileForm((current) => ({ ...current, profileImage: null }));
    setEditingProfile(true);
  };

  const initials = (profileForm.name || profileForm.email || 'N')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <ScrollView className="flex-1 bg-[#0B0B0B]" contentContainerClassName="p-4 lg:p-8">
      <View className="mb-5 flex-row flex-wrap items-center justify-between gap-3">
        <View>
          <Text className="text-3xl font-extrabold text-white">Settings</Text>
          <Text className="mt-1 text-muted">Manage your account preferences and security</Text>
        </View>
        <Pressable onPress={() => router.push('/dashboard')} className="rounded-xl border border-border bg-panel px-4 py-3">
          <Text className="font-bold text-primary">Back to Dashboard</Text>
        </Pressable>
      </View>

      <View className="overflow-hidden rounded-2xl border border-border bg-panel lg:flex-row">
        <View className="border-b border-border p-5 lg:w-[320px] lg:border-b-0 lg:border-r">
          <Text className="text-2xl font-extrabold text-white">Settings</Text>
          <Text className="mt-3 leading-6 text-muted">Manage your account preferences and security</Text>

          <View className="mt-7 gap-2">
            <SettingsMenuItem icon={UserRound} title="Profile" subtitle="Edit your profile details" active />
            <SettingsMenuItem icon={Shield} title="Security" subtitle="Password and 2FA" />
            <SettingsMenuItem icon={Bell} title="Notifications" subtitle="Manage your alerts" />
            <SettingsMenuItem icon={SlidersHorizontal} title="Trading Preferences" subtitle="Set trading options" />
            <SettingsMenuItem icon={Palette} title="Appearance" subtitle="Customize your experience" />
            <SettingsMenuItem icon={Volume2} title="Sounds" subtitle="Manage sound settings" />
            <SettingsMenuItem icon={CreditCard} title="Payments" subtitle="Payment methods" />
            <SettingsMenuItem icon={Headphones} title="Support" subtitle="Help and support" />
            <Pressable onPress={signOut}>
              <SettingsMenuItem icon={LogOut} title="Session" subtitle="Sign out and sessions" />
            </Pressable>
          </View>

          <View className="mt-8 rounded-2xl border border-border bg-surface p-5">
            <View className="mb-4 h-10 w-10 items-center justify-center rounded-xl bg-panel">
              <Headphones size={19} color="#f3f7ff" />
            </View>
            <Text className="text-lg font-extrabold text-white">Need Help?</Text>
            <Text className="mt-3 leading-6 text-muted">If you need any support, our team is here to help you.</Text>
            <View className="mt-5 rounded-xl border border-primary px-4 py-3">
              <Text className="text-center font-bold text-primary">Contact Support</Text>
            </View>
          </View>
        </View>

        <View className="flex-1 p-5 lg:p-8">
          <View className="mb-6 flex-row flex-wrap items-center justify-between gap-4">
            <View>
              <Text className="text-3xl font-extrabold text-white">Profile</Text>
              <Text className="mt-2 text-muted">Manage your personal information and profile picture.</Text>
            </View>
            <View className="flex-row flex-wrap gap-3">
              {editingProfile ? (
                <>
                  <Pressable onPress={cancelProfileEdit} className="rounded-xl border border-border bg-panel px-6 py-4">
                    <Text className="font-extrabold text-white">Cancel</Text>
                  </Pressable>
                  <Pressable onPress={saveSettings} className="flex-row items-center rounded-xl bg-primary px-6 py-4">
                    <Save size={17} color="#05130d" />
                    <Text className="ml-2 font-extrabold text-black">Save Changes</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable onPress={() => setEditingProfile(true)} className="rounded-xl bg-primary px-6 py-4">
                  <Text className="font-extrabold text-black">Edit</Text>
                </Pressable>
              )}
            </View>
          </View>

          {message ? <Text className="mb-5 rounded-xl border border-success/40 bg-success/10 p-4 text-success">{message}</Text> : null}
          {error ? <Text className="mb-5 rounded-xl border border-danger/40 bg-danger/10 p-4 text-danger">{error}</Text> : null}

          <View className="rounded-2xl border border-border bg-surface p-5 lg:p-7">
            <Text className="mb-6 text-2xl font-extrabold text-white">Profile Information</Text>
            <View className="gap-8 lg:flex-row">
              <View className="items-center lg:w-[300px]">
                <View className="h-40 w-40 overflow-hidden rounded-full border border-border bg-panel">
                  {profileForm.profileImage ? (
                    <Image source={{ uri: profileForm.profileImage }} className="h-full w-full" resizeMode="cover" />
                  ) : (
                    <View className="h-full w-full items-center justify-center">
                      <Text className="text-5xl font-black text-primary">{initials || 'N'}</Text>
                    </View>
                  )}
                </View>
                {Platform.OS === 'web' ? (
                  <input
                    ref={profileImageInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    type="file"
                    onChange={(event) => {
                      selectProfileImage(event.target.files?.[0] || null);
                      event.target.value = '';
                    }}
                  />
                ) : null}
                <Pressable
                  onPress={openProfileImagePicker}
                  className="-mt-9 ml-28 h-12 w-12 items-center justify-center rounded-full bg-primary"
                >
                  <Camera size={19} color="#05130d" />
                </Pressable>
                {editingProfile ? (
                  <View className="mt-4 flex-row flex-wrap justify-center gap-3">
                    <Pressable onPress={openProfileImagePicker} className="rounded-lg border border-primary px-4 py-2">
                      <Text className="text-xs font-bold text-primary">{profileForm.profileImage ? 'Change Photo' : 'Add Photo'}</Text>
                    </Pressable>
                    {profileForm.profileImage ? (
                      <Pressable onPress={removeProfileImage} className="rounded-lg bg-danger/10 px-4 py-2">
                        <Text className="text-xs font-bold text-danger">Remove Photo</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
                <Text className="mt-6 text-xl font-extrabold text-white">{profileForm.name || 'NovaFXM User'}</Text>
                <View className="mt-3 rounded-lg px-3 py-2" style={{ backgroundColor: user?.verificationStatus === 'approved' ? '#12cf7a26' : '#D4AF3726' }}>
                  <Text className="font-bold" style={{ color: user?.verificationStatus === 'approved' ? '#12cf7a' : '#D4AF37' }}>
                    {user?.verificationStatus === 'approved' ? 'Verified' : 'Not Verified'}
                  </Text>
                </View>
                <View className="mt-4 flex-row items-center">
                  <CalendarDays size={15} color="#8fa0bb" />
                  <Text className="ml-2 text-muted">Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'NovaFXM'}</Text>
                </View>
              </View>

              <View className="flex-1">
                <SettingsInput label="Full Name" value={profileForm.name} editable={editingProfile} error={profileErrors.name} onChangeText={(name) => setProfileForm((current) => ({ ...current, name }))} placeholder="Your full name" />
                <SettingsInput label="Email Address" value={profileForm.email} editable={editingProfile} error={profileErrors.email} keyboardType="email-address" onChangeText={(email) => setProfileForm((current) => ({ ...current, email }))} placeholder="email@example.com" />
                <SettingsInput label="Phone Number" value={profileForm.phone} editable={editingProfile} error={profileErrors.phone} keyboardType="phone-pad" onChangeText={(phone) => setProfileForm((current) => ({ ...current, phone }))} placeholder="+94 77 123 4567" />
                <CountrySelect value={profileForm.country} editable={editingProfile} error={profileErrors.country} onChange={updateCountry} />
                <SettingsInput label="Date of Birth" value={profileForm.dateOfBirth} editable={editingProfile} error={profileErrors.dateOfBirth} onChangeText={(dateOfBirth) => setProfileForm((current) => ({ ...current, dateOfBirth }))} placeholder="DD / MM / YYYY" />
              </View>
            </View>
          </View>

          <View className="mt-5 rounded-2xl border border-border bg-surface p-5 lg:p-7">
            <View className="mb-6 flex-row items-center">
              <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                <LockKeyhole size={20} color="#D4AF37" />
              </View>
              <View>
                <Text className="text-2xl font-extrabold text-white">Change Password</Text>
                <Text className="mt-1 text-muted">Ensure your account is using a long, random password to stay secure.</Text>
              </View>
            </View>
            <View className="gap-5 lg:flex-row">
              <View className="flex-1">
                <PasswordInput label="Current Password" placeholder="Enter your current password" />
                <PasswordInput label="New Password" placeholder="Enter your new password" />
                <PasswordInput label="Confirm New Password" placeholder="Confirm your new password" />
                <Pressable className="mt-2 flex-row self-start rounded-xl bg-primary px-6 py-4">
                  <LockKeyhole size={16} color="#05130d" />
                  <Text className="ml-2 font-extrabold text-black">Update Password</Text>
                </Pressable>
              </View>
              <View className="rounded-2xl border border-border bg-panel p-5 lg:w-[300px]">
                <Text className="mb-5 font-bold text-success">Password Requirements</Text>
                <Requirement>Minimum 8 characters</Requirement>
                <Requirement>At least 1 uppercase letter</Requirement>
                <Requirement>At least 1 lowercase letter</Requirement>
                <Requirement>At least 1 number</Requirement>
                <Requirement>At least 1 special character</Requirement>
              </View>
            </View>
          </View>

          <View className="mt-5 rounded-2xl border border-border bg-surface p-5 lg:p-7">
            <View className="mb-6 flex-row items-center">
              <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                <Info size={20} color="#D4AF37" />
              </View>
              <Text className="text-2xl font-extrabold text-white">Account Information</Text>
            </View>
            <View className="flex-row flex-wrap gap-5">
              <View className="min-w-[180px] flex-1">
                <Text className="mb-2 text-sm text-muted">Account ID</Text>
                <View className="flex-row self-start items-center rounded-xl border border-border bg-panel px-4 py-3">
                  <Text className="font-bold text-white">#TRD{String(user?.id || '000000').padStart(6, '0')}</Text>
                  <Copy size={15} color="#8fa0bb" style={{ marginLeft: 8 }} />
                </View>
              </View>
              <AccountInfoTile label="Account Type" value={user?.accountType || 'Standard'} />
              <AccountInfoTile label="Account Status" value={user?.tradingStatus === 'frozen' ? 'Frozen' : 'Active'} badge tone={user?.tradingStatus === 'frozen' ? 'danger' : 'success'} />
              <AccountInfoTile label="KYC Status" value={user?.verificationStatus === 'approved' ? 'Verified' : 'Pending'} badge tone={user?.verificationStatus === 'approved' ? 'success' : 'warning'} />
            </View>
          </View>

          <View className="mt-5 flex-row items-center justify-between rounded-2xl border border-border bg-surface p-5">
            <View className="flex-row items-center">
              <View className="mr-4 h-11 w-11 items-center justify-center rounded-xl bg-panel">
                <Settings2 size={19} color="#D4AF37" />
              </View>
              <View>
                <Text className="font-bold text-white">Appearance Mode</Text>
                <Text className="mt-1 text-muted">{darkMode ? 'Dark mode enabled' : 'Light mode enabled'}</Text>
              </View>
            </View>
            <CustomButton title={darkMode ? 'Switch Light' : 'Switch Dark'} onPress={toggleTheme} className="min-w-[150px]" />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
