import * as pixelUtils from './utils/pixel';
import * as colorUtils from './utils/color';

let video;
let context;
let offScreenContext;
let width;
let height;
let colorMixerSliderElements;
let chromaKeySliderElements;
let brightnessAndContrastElements;
let form;
let colorInput;
let chromaColor = colorUtils.rgbToHsl(0, 255, 0);
let colorMixerValues;
let chromaKeyThreshold;
let colorMode = 'color';
let grayScaleStrategy = 'mix';
let effectsEnabled = false;

const aspectRatio = 1280 / 720;

window.addEventListener('DOMContentLoaded', init, false);

function init() {
  width = window.innerWidth;
  height = window.innerWidth / aspectRatio;

  colorMixerSliderElements = [
    ...document.querySelectorAll('[name=color-channels] input[type=range]')
  ];
  chromaKeySliderElements = [...document.querySelectorAll('[name=chroma-key] input[type=range]')];
  brightnessAndContrastElements = [...document.querySelectorAll('[name=adjust] input[type=range]')];
  form = document.getElementById('form');
  colorInput = document.querySelector('input[type=color]');
  video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  context = canvas.getContext('2d');
  const offscreenCanvas = new OffscreenCanvas(width, height);
  offScreenContext = offscreenCanvas.getContext('2d');
  // mirror canvas
  offScreenContext.translate(width, 0);
  offScreenContext.scale(-1, 1);

  document.getElementById('on-off').addEventListener('change', toggleEffects, false);
  form.addEventListener('reset', onReset, false);
  colorInput.addEventListener('change', updateChromaColor, false);
  form['color'].addEventListener('change', updateColorMode, false);
  form['grayscale'].addEventListener('change', updateGrayScaleStrategy, false);
  form['color-channels'].addEventListener('input', updateColorMixerValues, false);
  form['chroma-key'].addEventListener('input', updateChromaKeyThreshold, false);
  form['adjust'].addEventListener('input', updateBrightnessAndContarst, false);

  // get initial vaklues from DOM
  updateColorMixerValues();
  updateChromaKeyThreshold();
  updateBrightnessAndContarst();

  canvas.width = width;
  canvas.height = height;

  video.addEventListener('play', copyToCanvas, false);

  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(attachToVideo)
    .catch((error) => console.log('error', error));
}

function attachToVideo(stream) {
  video.srcObject = stream;
}

function copyToCanvas() {
  if (video.paused || video.ended) return;
  draw();
  window.requestAnimationFrame(copyToCanvas);
}

function draw() {
  offScreenContext.drawImage(video, 0, 0, width, height);
  const srcImage = offScreenContext.getImageData(0, 0, width, height);
  let dstImage;

  if (effectsEnabled === false) {
    dstImage = srcImage;
  } else if (colorMode === 'grayscale') {
    dstImage = pixelUtils.grayScale(srcImage, grayScaleStrategy, colorMixerValues);
  } else if (colorMode === 'chroma-key') {
    dstImage = pixelUtils.chromaColors(srcImage, chromaColor, chromaKeyThreshold);
  } else {
    dstImage = pixelUtils.mixColors(srcImage, colorMixerValues);
  }

  context.putImageData(dstImage, 0, 0);
}

function updateGrayScaleStrategy({ target }) {
  grayScaleStrategy = target.value;
}

function updateColorMode({ target }) {
  colorMode = target.value;
  switch (colorMode) {
    case 'color':
      form['grayscale'].style.display = 'none';
      form['chroma-key'].style.display = 'none';
      form['color-channels'].style.display = 'flex';
      break;
    case 'grayscale':
      form['chroma-key'].style.display = 'none';
      form['grayscale'].style.display = 'flex';
      form['color-channels'].style.display = 'flex';
      break;
    case 'chroma-key':
      form['grayscale'].style.display = 'none';
      form['color-channels'].style.display = 'none';
      form['chroma-key'].style.display = 'flex';
      break;
    default:
      throw Error(`Unhandled choice: "${colorMode}"`);
  }
}

function updateColorMixerValues() {
  colorMixerValues = colorMixerSliderElements.map(({ value }) => parseFloat(value, 10));
}

function onReset() {
  setTimeout(() => {
    updateColorMixerValues();
    updateChromaKeyThreshold();
    updateBrightnessAndContarst();
    updateColorMode({ target: { value: 'color' } });
    updateGrayScaleStrategy({ target: { value: 'mix' } });
  }, 1);
}

function updateChromaColor({ target }) {
  const red = target.value.slice(1, 3);
  const green = target.value.slice(3, 5);
  const blue = target.value.slice(5, 7);

  const rgb = [red, green, blue].map((hex) => parseInt(hex, 16));
  const hsl = colorUtils.rgbToHsl(...rgb);
  chromaColor = hsl;
}

function updateChromaKeyThreshold() {
  chromaKeyThreshold = chromaKeySliderElements.map(({ value }) => parseFloat(value, 10));
}

function updateBrightnessAndContarst() {
  pixelUtils.setBrightnessAndContrast(
    brightnessAndContrastElements.map(({ value }) => parseInt(value, 10))
  );
}

function toggleEffects({ target }) {
  effectsEnabled = target.checked;
}
