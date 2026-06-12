import { ScrollView, useWindowDimensions, View } from 'react-native';
import TopAccountBar from '../header/TopAccountBar';
import TradingChart from '../chart/TradingChart';
import OrderPanel from '../order/OrderPanel';
import OpenPositions from '../positions/OpenPositions';
import AccountSummary from '../account/AccountSummary';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { useDemoTrading } from '../../hooks/useDemoTrading';

function OrderRail({ summary, user, showSummary = true, showAvailableMargin = true }) {
  return (
    <View className="w-[270px] gap-3">
      <OrderPanel showAvailableMargin={showAvailableMargin} />
      {showSummary ? <AccountSummary summary={summary} user={user} /> : null}
    </View>
  );
}


export default function TradingLayout() {
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const { summary } = useDemoTrading();
  const desktop = width >= 1100;
  const tablet = width >= 760;
  const mobile = width < 760;

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <TopAccountBar />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: mobile ? 6 : 12, paddingBottom: mobile ? 16 : 24 }}
      >
        <View className={desktop ? 'h-[600px] flex-row gap-3' : mobile ? 'gap-1.5' : 'gap-3'}>
          {desktop ? (
            <>
              <TradingChart />
              <OrderRail summary={summary} user={user} showSummary={false} showAvailableMargin={false} />
            </>
          ) : (
            <>
              {mobile ? <AccountSummary summary={summary} user={user} compact /> : null}
              <TradingChart />
              <View className={tablet ? 'flex-row gap-3' : 'gap-1.5'}>
                {!mobile ? <OrderRail summary={summary} user={user} /> : null}
              </View>
            </>
          )}
        </View>
        <OpenPositions />
      </ScrollView>
      {mobile ? <OrderPanel /> : null}
    </View>
  );
}
