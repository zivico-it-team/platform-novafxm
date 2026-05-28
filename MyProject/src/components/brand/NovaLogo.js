import Svg, { Defs, LinearGradient, Path, Polygon, Stop, Text as SvgText } from 'react-native-svg';

export default function NovaLogo({ dark = true, width = 190, height = 46 }) {
  const green = dark ? '#f7f7f4' : '#005336';
  const text = dark ? '#ffffff' : '#005336';
  const tagline = dark ? '#ffffff' : '#005336';
  const greenMid = dark ? '#fefefe' : '#006b3c';
  const greenEnd = dark ? '#d9d9d4' : '#003519';

  return (
    <Svg width={width} height={height} viewBox="0 0 1600 420">
      <Defs>
        <LinearGradient id="logoGold" x1="0" x2="1" y1="0" y2="1">
          <Stop offset="0" stopColor="#fff176" />
          <Stop offset="0.46" stopColor="#d9b833" />
          <Stop offset="1" stopColor="#a87b09" />
        </LinearGradient>
        <LinearGradient id="logoGoldDark" x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0" stopColor="#050505" />
          <Stop offset="0.53" stopColor="#141414" />
          <Stop offset="1" stopColor="#d7b335" />
        </LinearGradient>
        <LinearGradient id="logoGreen" x1="0" x2="1" y1="0" y2="1">
          <Stop offset="0" stopColor={green} />
          <Stop offset="0.52" stopColor={greenMid} />
          <Stop offset="1" stopColor={greenEnd} />
        </LinearGradient>
      </Defs>

      <Path d="M8 370V139h62l112 135 76-135h70L203 370h-38L70 255v115H8z" fill="url(#logoGreen)" />
      <Path d="M180 274 302 25l90 36-179 309h-48l15-96z" fill="url(#logoGreen)" />
      <Polygon points="282,51 377,9 389,109" fill="url(#logoGreen)" />

      <Path d="M232 369 346 139h80L325 370z" fill="url(#logoGoldDark)" />
      <Path d="M341 334 503 226 418 370z" fill="url(#logoGold)" />
      <Path d="M392 139 510 369h-86L350 210z" fill="url(#logoGoldDark)" />
      <Path d="M347 290 470 176 413 278 270 370z" fill="url(#logoGold)" />

      <SvgText x="540" y="238" fill={text} fontSize="132" fontWeight="900" letterSpacing="27">
        NOVAFXM
      </SvgText>
      <SvgText x="542" y="360" fill={tagline} fontSize="58" fontWeight="800" letterSpacing="25">
        GLOBAL FOREX TRADING
      </SvgText>
    </Svg>
  );
}
