// Apply conservative settings on ChromeOS, where low-end Chromebooks benefit
// from a smaller canvas and a 30 FPS render cap. This does not bypass network or
// administrator restrictions; it only adjusts this game's performance.
(() => {
  if (!/\bCrOS\b/.test(navigator.userAgent)) return;

  graphics = 'very low';
  settings = { ...presets['very low'], particles: 0, glow: false };
  $('graphicsSelect').value = 'very low';
  $('particleToggle').checked = false;
  $('trailToggle').checked = false;
  resize();

  const nativeRequestAnimationFrame = window.requestAnimationFrame.bind(window);
  let lastFrame = 0;
  window.requestAnimationFrame = callback => nativeRequestAnimationFrame(timestamp => {
    if (timestamp - lastFrame >= 33) {
      lastFrame = timestamp;
      callback(timestamp);
    } else {
      window.requestAnimationFrame(callback);
    }
  });
})();
