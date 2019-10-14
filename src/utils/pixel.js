import * as colorUtils from './color';

let brightness;
let contrast;
let saturation;
let intercept;

export function setBrightnessAndContrast([b, c, sat]) {
  brightness = b;
  saturation = sat / 100;
  contrast = c / 100 + 1;
  intercept = 128 * (1 - contrast);
}

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

function brightnessAndContrast(value) {
  return (value + brightness) * contrast + intercept;
}

function saturate(r, g, b) {
  const [h, s, l] = colorUtils.rgbToHsl(r, g, b);
  return colorUtils.hslToRgb(h, s * saturation, l);
}

const strategies = { mix, red, green, blue };

export function grayScale(frame, strategy, sliders) {
  const imgData = frame.data;
  const allData = imgData.length;
  const alpha = sliders[3] * 255;
  let output;

  for (let i = 0; i < allData; i += 4) {
    output = strategies[strategy](
      brightnessAndContrast(imgData[i]),
      brightnessAndContrast(imgData[i + 1]),
      brightnessAndContrast(imgData[i + 2]),
      sliders
    );

    imgData[i] = output;
    imgData[i + 1] = output;
    imgData[i + 2] = output;
    imgData[i + 3] = alpha;
  }

  return frame;
}

export function mixColors(frame, sliders) {
  const imgData = frame.data;
  const allData = imgData.length;
  const alpha = sliders[3] * 255;

  if (saturation === 1) {
    for (let i = 0; i < allData; i += 4) {
      imgData[i] = brightnessAndContrast(imgData[i]) * sliders[0];
      imgData[i + 1] = brightnessAndContrast(imgData[i + 1]) * sliders[1];
      imgData[i + 2] = brightnessAndContrast(imgData[i + 2]) * sliders[2];
      imgData[i + 3] = alpha;
    }
  } else {
    for (let i = 0; i < allData; i += 4) {
      const [r, g, b] = saturate(
        brightnessAndContrast(imgData[i]) * sliders[0],
        brightnessAndContrast(imgData[i + 1]) * sliders[1],
        brightnessAndContrast(imgData[i + 2]) * sliders[2]
      );
      imgData[i] = r;
      imgData[i + 1] = g;
      imgData[i + 2] = b;
      imgData[i + 3] = alpha;
    }
  }

  return frame;
}

const similar = 1 / 6;
export function chromaColors(frame, chromaKeyHSL, HSLThreshold) {
  const imgData = frame.data;
  const allData = imgData.length;
  const [hKey, sKey, lKey] = chromaKeyHSL;
  const [hThresh, sThresh, lThresh] = HSLThreshold;

  for (let i = 0; i < allData; i += 4) {
    const r = brightnessAndContrast(imgData[i]);
    const g = brightnessAndContrast(imgData[i + 1]);
    const b = brightnessAndContrast(imgData[i + 2]);
    const hsl = colorUtils.rgbToHsl(r, g, b);
    const hDiff = Math.abs(hsl[0] - hKey);
    const sDiff = Math.abs(hsl[1] - sKey);
    const lDiff = Math.abs(hsl[2] - lKey);

    imgData[i] = r;
    imgData[i + 1] = g;
    imgData[i + 2] = b;

    if (hDiff < hThresh && sDiff < sThresh && lDiff < lThresh) {
      imgData[i + 3] = (hDiff / similar) * 255;
    }
  }

  return frame;
}
