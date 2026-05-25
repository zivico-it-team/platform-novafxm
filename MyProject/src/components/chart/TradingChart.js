import { useMemo, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useDemoTrading } from '../../hooks/useDemoTrading';
import { percent, quote } from '../../utils/formatters';

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1H', '4H', '1D'];

function chartHtml(symbol, basePrice, timeframe) {
  const escapedSymbol = symbol.replace(/</g, '&lt;');
  return `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>*{box-sizing:border-box}body{margin:0;background:#080f20;color:#9baac1;font-family:Arial,sans-serif}#chart{position:absolute;inset:0 0 25px 0}.credit{position:absolute;bottom:6px;left:12px;font-size:11px;color:#71829f}.credit a{color:#27a8e9;text-decoration:none}</style>
<script src="https://unpkg.com/lightweight-charts@5.0.8/dist/lightweight-charts.standalone.production.js"></script></head>
<body><div id="chart"></div><div class="credit">${escapedSymbol} ${timeframe} | Charts by <a href="https://www.tradingview.com/" target="_blank">TradingView</a></div>
<script>
const container=document.getElementById('chart');
const chart=LightweightCharts.createChart(container,{layout:{background:{type:'solid',color:'#080f20'},textColor:'#9baac1',attributionLogo:true},grid:{vertLines:{color:'#18243b'},horzLines:{color:'#18243b'}},rightPriceScale:{borderColor:'#283652'},timeScale:{borderColor:'#283652',timeVisible:true},crosshair:{mode:0}});
const candles=chart.addSeries(LightweightCharts.CandlestickSeries,{upColor:'#19b8ab',downColor:'#f24d58',wickUpColor:'#19b8ab',wickDownColor:'#f24d58',borderVisible:false});
let current=${Number(basePrice) || 1}; let points=[]; const now=Math.floor(Date.now()/1000); const interval=${timeframe === '1m' ? 60 : timeframe === '5m' ? 300 : timeframe === '15m' ? 900 : timeframe === '30m' ? 1800 : timeframe === '1H' ? 3600 : timeframe === '4H' ? 14400 : 86400};
for(let i=88;i>=0;i--){let open=current; let shift=(Math.random()-.49)*current*.002; let close=Math.max(.00001,open+shift); let range=Math.abs(shift)+current*.0008*Math.random(); points.push({time:now-i*interval,open,high:Math.max(open,close)+range,low:Math.max(.00001,Math.min(open,close)-range),close}); current=close;}
candles.setData(points); chart.timeScale().fitContent();
setInterval(()=>{const last=points[points.length-1]; const open=last.close; const close=Math.max(.00001,open+(Math.random()-.5)*open*.001); const next={time:Math.floor(Date.now()/1000),open,high:Math.max(open,close)+Math.random()*open*.0003,low:Math.max(.00001,Math.min(open,close)-Math.random()*open*.0003),close}; candles.update(next); points.push(next);},2000);
new ResizeObserver(entries=>{if(entries[0]) chart.applyOptions({width:entries[0].contentRect.width,height:entries[0].contentRect.height-25});}).observe(document.body);
</script></body></html>`;
}

export default function TradingChart() {
  const { currentSymbol } = useDemoTrading();
  const [timeframe, setTimeframe] = useState('15m');
  const html = useMemo(() => chartHtml(currentSymbol.symbol, currentSymbol.price, timeframe), [currentSymbol.symbol, timeframe]);
  const positive = currentSymbol.change >= 0;

  return (
    <View className="min-h-[430px] flex-1 overflow-hidden rounded-2xl border border-border bg-[#080f20]">
      <View className="flex-row flex-wrap items-center border-b border-border px-4 py-3">
        <Text className="mr-5 text-lg font-bold text-white">{currentSymbol.symbol}</Text>
        <Text className={positive ? 'text-success' : 'text-danger'}>{quote(currentSymbol.price, currentSymbol.decimals)}  {percent(currentSymbol.change)}</Text>
        <Text className="ml-3 text-xs text-muted">Spread {quote(currentSymbol.spread, currentSymbol.decimals)}</Text>
        <View className="ml-auto flex-row">
          {TIMEFRAMES.map((entry) => (
            <Pressable key={entry} onPress={() => setTimeframe(entry)} className={`ml-1 rounded-md px-3 py-2 ${entry === timeframe ? 'bg-primary' : ''}`}>
              <Text className={entry === timeframe ? 'font-bold text-white' : 'text-muted'}>{entry}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View className="flex-1">
        {Platform.OS === 'web' ? (
          <iframe key={`${currentSymbol.symbol}-${timeframe}`} title="Trading chart" srcDoc={html} style={{ width: '100%', height: '100%', border: 0 }} />
        ) : (
          <WebView
            key={`${currentSymbol.symbol}-${timeframe}`}
            originWhitelist={['*']}
            javaScriptEnabled
            source={{ html }}
            style={{ backgroundColor: '#080f20' }}
          />
        )}
      </View>
    </View>
  );
}
