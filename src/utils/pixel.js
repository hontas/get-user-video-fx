import * as colorUtils from './color';

export function red(r) {
  return r;
}

export function green(r, g) {
  return g;
}

export function blue(r, g, b) {
  return b;
}

export function mix(r, g, b, sliders) {
  return (r * sliders[0] + g * sliders[1] + b * sliders[2]) / 3;
}

const strategies = { mix, red, green, blue };

export function grayScale(frame, strategy, sliders) {
  const allData = frame.data.length;
  for (let i = 0; i < allData; i += 4) {
    const [r, g, b] = frame.data.slice(i, i + 4);
    const output = strategies[strategy](r, g, b, sliders);
    frame.data[i] = output;
    frame.data[i + 1] = output;
    frame.data[i + 2] = output;
    frame.data[i + 3] = sliders[3] * 255;
  }
  return frame;
}

export function mixColors(frame, sliders) {
  const allData = frame.data.length;
  for (let i = 0; i < allData; i += 4) {
    const [r, g, b] = frame.data.slice(i, i + 4);
    frame.data[i] = r * sliders[0];
    frame.data[i + 1] = g * sliders[1];
    frame.data[i + 2] = b * sliders[2];
    frame.data[i + 3] = sliders[3] * 255;
  }
  return frame;
}

const similar = 1 / 6;
export function chromaColors(frame, chromaKeyHSL, HSLThreshold) {
  const allData = frame.data.length;
  const [hKey, sKey, lKey] = chromaKeyHSL;
  const [hThresh, sThresh, lThresh] = HSLThreshold;

  for (let i = 0; i < allData; i += 4) {
    const [r, g, b] = frame.data.slice(i, i + 4);
    const [h, s, l] = colorUtils.rgbToHsl(r, g, b);
    const hDiff = Math.abs(h - hKey);
    const sDiff = Math.abs(s - sKey);
    const lDiff = Math.abs(l - lKey);
    if (hDiff < hThresh && sDiff < sThresh && lDiff < lThresh) {
      frame.data[i + 3] = (hDiff / similar) * 255;
    }
  }
  return frame;
}
