import { useCallback, useState } from 'react';
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
    <View className="h-full w-[260px] gap-2">
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
  const [chartFullscreen, setChartFullscreen] = useState(false);
  const desktop = width >= 1100;
  const tablet = width >= 760;
  const mobile = width < 760;
  const handleChartFullscreenChange = useCallback((value) => setChartFullscreen(Boolean(value)), []);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <TopAccountBar />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: mobile ? 6 : desktop ? 8 : 12, paddingBottom: mobile ? 16 : 18 }}
      >
        <View className={desktop ? 'h-[560px] flex-row gap-2' : mobile ? 'gap-1.5' : 'gap-3'}>
          {desktop ? (
            <>
              <TradingChart onFullscreenChange={handleChartFullscreenChange} />
              <OrderRail summary={summary} user={user} showSummary={false} showAvailableMargin={false} />
            </>
          ) : (
            <>
              {mobile ? <AccountSummary summary={summary} user={user} compact /> : null}
              <TradingChart onFullscreenChange={handleChartFullscreenChange} />
              <View className={tablet ? 'flex-row gap-3' : 'gap-1.5'}>
                {!mobile ? <OrderRail summary={summary} user={user} /> : null}
              </View>
            </>
          )}
        </View>
        {!chartFullscreen ? <OpenPositions /> : null}
      </ScrollView>
      {mobile ? <OrderPanel /> : null}
    </View>
  );
}
