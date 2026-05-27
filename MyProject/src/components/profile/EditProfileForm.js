import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';
import { Camera } from 'lucide-react-native';
import CustomButton from '../common/CustomButton';
import CustomInput from '../common/CustomInput';

export default function EditProfileForm({ user, onSubmit }) {
  const [form, setForm] = useState({ name: '', phone: '', profileImage: '' });
  const [message, setMessage] = useState('');
  useEffect(() => setForm({ name: user?.name || '', phone: user?.phone || '', profileImage: user?.profileImage || '' }), [user]);

  const chooseProfileImage = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      setMessage('Profile picture upload is available on web.');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 4 * 1024 * 1024) {
        setMessage('Choose an image smaller than 4 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setForm((value) => ({ ...value, profileImage: String(reader.result || '') }));
      reader.onerror = () => setMessage('Could not load selected image.');
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const save = async () => {
    try {
      await onSubmit(form);
      setMessage('Profile updated.');
    } catch (error) {
      setMessage(error.message);
    }
  };
  return (
    <View className="flex-1 rounded-2xl border border-border bg-panel p-5">
      <Text className="mb-5 text-xl font-bold text-white">Edit Profile</Text>
      <View className="mb-5 flex-row items-center gap-4">
        {form.profileImage ? (
          <Image source={{ uri: form.profileImage }} resizeMode="cover" className="h-20 w-20 rounded-full border border-border" />
        ) : (
          <View className="h-20 w-20 items-center justify-center rounded-full border border-border bg-surface">
            <Camera size={24} color="#8fa0bb" />
          </View>
        )}
        <View className="flex-1">
          <Text className="mb-2 text-sm font-semibold text-white">Profile Picture</Text>
          <Pressable onPress={chooseProfileImage} disabled={!user} className="self-start rounded-xl border border-border px-4 py-3">
            <Text className={user ? 'font-semibold text-primary' : 'font-semibold text-muted'}>{form.profileImage ? 'Change Photo' : 'Upload Photo'}</Text>
          </Pressable>
        </View>
      </View>
      <CustomInput label="Name" value={form.name} onChangeText={(name) => setForm((value) => ({ ...value, name }))} />
      <CustomInput label="Phone" value={form.phone} keyboardType="phone-pad" onChangeText={(phone) => setForm((value) => ({ ...value, phone }))} />
      <CustomButton title="Save Changes" onPress={save} disabled={!user} />
      {!user ? <Text className="mt-3 text-sm text-muted">Log in to edit a server-backed profile.</Text> : null}
      {message ? <Text className="mt-3 text-sm text-muted">{message}</Text> : null}
    </View>
  );
}
