import { Image } from 'react-native';

const logoImage = require('../../../assets/novafxm logo cropped.png');
const darkLogoImage = require('../../../assets/novafxm logo dark cropped.png');

export default function NovaLogo({ dark = false, width = 190, height = 46 }) {
  return (
    <Image
      source={dark ? darkLogoImage : logoImage}
      resizeMode="contain"
      style={{ width, height }}
    />
  );
}
