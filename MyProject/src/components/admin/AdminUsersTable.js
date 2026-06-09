import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { money } from '../../utils/formatters';

function ask(message, onConfirm) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (window.confirm(message)) onConfirm();
    return;
  }
  Alert.alert('Confirm action', message, [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', style: 'destructive', onPress: onConfirm }]);
}

function Button({ title, icon: Icon, onPress, danger, disabled }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} className={`mb-2 mr-2 rounded-lg border px-3 py-2 ${danger ? 'border-danger/60 bg-danger/10' : 'border-border bg-surface'} ${disabled ? 'opacity-40' : ''}`}>
      {Icon ? <Icon size={15} color={danger ? '#f24d58' : '#f3f7ff'} /> : <Text className={`text-xs font-semibold ${danger ? 'text-danger' : 'text-white'}`}>{title}</Text>}
    </Pressable>
  );
}

function TextCell({ width, children, className = '' }) {
  return <Text style={{ width }} className={`px-3 py-4 text-sm text-white ${className}`}>{children}</Text>;
}

function Header({ width, children }) {
  return <Text style={{ width }} className="px-3 py-3 text-xs font-bold uppercase text-muted">{children}</Text>;
}

function AccountsDropdown({ count, expanded, onPress }) {
  return (
    <Pressable onPress={onPress} className="mt-2 flex-row items-center self-start rounded-full border border-border bg-surface px-3 py-1">
      <Text className="mr-2 text-xs font-bold text-primary">{count} account{count === 1 ? '' : 's'}</Text>
      <ChevronDown size={13} color="#D4AF37" style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }} />
    </Pressable>
  );
}

function AccountDetails({ accounts }) {
  if (!accounts.length) return null;

  return (
    <View className="mt-3 gap-2">
      {accounts.map((account) => (
        <View key={account.id} className="rounded-lg border border-border bg-surface p-2">
          <Text className="text-xs font-bold text-white">{account.name || `${account.type || 'Trading'} account`}</Text>
          <Text className="mt-1 text-[11px] text-muted">{account.type || '-'} | {account.status || 'active'} | ${money(account.balance)}</Text>
        </View>
      ))}
    </View>
  );
}

function BrokerReferralCell({ user }) {
  const summary = user.referralSummary || {};
  const broker = summary.broker;

  return (
    <View style={{ width: 260 }} className="px-3 py-4">
      <Text className="text-xs font-bold uppercase text-muted">Broker Code</Text>
      <Text className="mt-1 font-semibold text-primary">{summary.code || user.referralCode || '-'}</Text>
      <Text className="mt-2 text-xs text-muted">Linked clients: {summary.linkedClients || 0}</Text>
      <View className="mt-3 rounded-lg border border-border bg-surface p-2">
        <Text className="text-[10px] font-bold uppercase text-muted">Registered under</Text>
        {broker ? (
          <>
            <Text className="mt-1 text-xs font-semibold text-white">{broker.name || broker.email}</Text>
            <Text className="mt-1 text-[11px] text-muted">{broker.code || '-'}</Text>
          </>
        ) : (
          <Text className="mt-1 text-xs text-muted">Direct / no broker</Text>
        )}
      </View>
    </View>
  );
}

export default function AdminUsersTable({ users, busyId, onBalance, onStatus, onReset, onWallet, onTransactions, onSettings }) {
  const [expandedUsers, setExpandedUsers] = useState({});
  const toggleAccounts = (userId) => {
    setExpandedUsers((current) => ({ ...current, [userId]: !current[userId] }));
  };

  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-panel">
      <ScrollView horizontal>
        <View style={{ minWidth: 1960 }}>
          <View className="flex-row border-b border-border bg-surface">
            <Header width={220}>Client Account</Header>
            <Header width={260}>Broker Referral</Header>
            <Header width={130}>Wallet Balance</Header>
            <Header width={120}>Equity</Header>
            <Header width={110}>Margin</Header>
            <Header width={125}>Free Funds</Header>
            <Header width={90}>Leverage</Header>
            <Header width={115}>Status</Header>
            <Header width={250}>Verification</Header>
            <Header width={220}>Admin Notes</Header>
            <Header width={570}>Actions</Header>
          </View>
          {users.map((user) => {
            const blocked = busyId === user.id;
            const accounts = user.tradingAccounts?.length
              ? user.tradingAccounts
              : [{ id: `user-${user.id}`, name: `${user.accountType || 'Demo'} account`, type: user.accountType || 'Demo', balance: user.wallet?.balance, status: user.tradingStatus }];
            const expanded = Boolean(expandedUsers[user.id]);
            const visibleAccounts = expanded ? accounts : [];

            return (
              <View key={user.id} className="flex-row border-b border-border/60">
                <View style={{ width: 220 }} className="px-3 py-4">
                  <Text className="font-semibold text-white">{user.name}</Text>
                  <Text className="mt-1 text-xs text-muted">{user.email}</Text>
                  <AccountsDropdown count={accounts.length} expanded={expanded} onPress={() => toggleAccounts(user.id)} />
                  <AccountDetails accounts={visibleAccounts} />
                </View>
                <BrokerReferralCell user={user} />
                <TextCell width={130}>${money(user.wallet?.balance)}</TextCell>
                <TextCell width={120}>${money(user.wallet?.equity)}</TextCell>
                <TextCell width={110}>${money(user.wallet?.margin)}</TextCell>
                <TextCell width={125}>${money(user.wallet?.freeFunds)}</TextCell>
                <TextCell width={90}>1:{user.leverage || 100}</TextCell>
                <TextCell width={115} className={user.tradingStatus === 'frozen' ? 'text-danger' : 'text-success'}>{user.tradingStatus === 'frozen' ? 'Frozen' : 'Active'}</TextCell>
                <TextCell width={250} className={user.verificationStatus === 'approved' ? 'text-success' : user.verificationStatus === 'rejected' ? 'text-danger' : 'text-primary'}>
                  {user.verificationStatus || 'unverified'}
                </TextCell>
                <TextCell width={220} className="text-muted">{user.adminNotes || '-'}</TextCell>
                <View style={{ width: 570 }} className="flex-row flex-wrap px-3 py-3">
                  <Button title="Add Balance" disabled={blocked} onPress={() => onBalance(user, 'add_balance')} />
                  <Button title="Deduct Balance" danger disabled={blocked} onPress={() => onBalance(user, 'deduct_balance')} />
                  <Button title={user.tradingStatus === 'frozen' ? 'Unfreeze Trading' : 'Freeze Trading'} danger={user.tradingStatus !== 'frozen'} disabled={blocked} onPress={() => ask(`${user.tradingStatus === 'frozen' ? 'Unfreeze' : 'Freeze'} trading for ${user.name}?`, () => onStatus(user))} />
                  <Button title="Reset Demo" disabled={blocked || user.accountType !== 'Demo'} onPress={() => ask(`Reset ${user.name}'s demo account to $5,000 and clear open positions?`, () => onReset(user))} />
                  <Button title="View Wallet" disabled={blocked} onPress={() => onWallet(user)} />
                  <Button title="View Transactions" disabled={blocked} onPress={() => onTransactions(user)} />
                  <Button title="Settings" disabled={blocked} onPress={() => onSettings(user)} />
                </View>
              </View>
            );
          })}
          {!users.length ? <Text className="p-8 text-center text-muted">No user accounts found.</Text> : null}
        </View>
      </ScrollView>
    </View>
  );
}
