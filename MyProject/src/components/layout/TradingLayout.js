import { ScrollView, useWindowDimensions, View } from 'react-native';
import TopAccountBar from '../header/TopAccountBar';
import SymbolPanel from '../market/SymbolPanel';
import TradingChart from '../chart/TradingChart';
import OrderPanel from '../order/OrderPanel';
import OpenPositions from '../positions/OpenPositions';

export default function TradingLayout() {
  const { width } = useWindowDimensions();
  const desktop = width >= 1100;

  return (
    <View className="flex-1 bg-[#080f20]">
      <TopAccountBar />
      <ScrollView contentContainerClassName="p-3">
        <View className={desktop ? 'h-[600px] flex-row gap-3' : 'gap-3'}>
          <SymbolPanel />
          <TradingChart />
          <OrderPanel />
        </View>
        <OpenPositions />
      </ScrollView>
    </View>
  );
}
