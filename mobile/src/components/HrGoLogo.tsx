import React from 'react';
import Svg, { Rect, Path, Ellipse } from 'react-native-svg';

interface Props {
  width?: number;
  height?: number;
}

export const HrGoLogo: React.FC<Props> = ({ width = 34, height = 34 }) => {
  return (
    <Svg width={width} height={height} viewBox="1.5 -1.5 54 54" fill="none">
      <Rect x="8.5332" y="15.8621" width="13.3294" height="33.3236" rx="6.6647" fill="#0f2b71" />
      <Rect x="35.1924" y="15.8621" width="13.3294" height="33.3236" rx="6.6647" fill="#1787f5" />
      <Path
        d="M27.1843 24.5262C14.4635 26.7793 9.58283 38.0204 8.66602 43.5109C10.0649 51.571 22.3882 51.3046 21.7694 41.1684V36.3038C21.7694 34.9383 23.4884 34.1417 24.3479 33.9141H27.1843V24.5262Z"
        fill="#1787f5"
      />
      <Path
        d="M29.9936 24.5262C42.721 26.7805 47.6042 38.0274 48.5215 43.5207C47.1219 51.585 34.7922 51.3184 35.4114 41.177V36.3098C35.4114 34.9436 33.6915 34.1467 32.8315 33.919H29.9936V24.5262Z"
        fill="#1787f5"
      />
      <Rect x="27.1943" y="24.5262" width="2.79917" height="9.39724" fill="#1787f5" />
      <Ellipse cx="15.2645" cy="7.26453" rx="7.26452" ry="7.26453" fill="#0f2b71" />
      <Ellipse cx="41.7899" cy="7.26453" rx="7.26452" ry="7.26453" fill="#1787f5" />
    </Svg>
  );
};
