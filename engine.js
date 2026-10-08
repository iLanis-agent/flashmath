// Flashmath engine: flash guide-number exposure.
// The physics is the inverse-square law (exact): a flash's guide number is
// GN = distance x f-number, published by convention at ISO 100, full power.
// The rest are published rules photographers use (labeled): GN scales with
// sqrt(ISO/100), and with sqrt(power fraction) - half power is one stop down.
// Bounce losses are pure rules of thumb and labeled as such.
var FULL_STOPS = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22]; // standard full-stop scale
var POWERS = [1, 0.5, 0.25, 0.125, 0.0625, 0.03125, 0.015625, 0.0078125]; // 1/1 .. 1/128

function bad(v) { return !(typeof v === 'number' && isFinite(v)); }

// effective guide number at ISO and power fraction (published rules, labeled)
function effectiveGN(gn100, iso, power) {
  if (bad(gn100) || gn100 <= 0 || gn100 > 400) return { error: 'Guide number must be between 0 and 400 (m, ISO 100).' };
  if (bad(iso) || iso < 25 || iso > 409600) return { error: 'ISO must be between 25 and 409600.' };
  if (bad(power) || power <= 0 || power > 1) return { error: 'Power must be a fraction between 0 and 1.' };
  var gn = gn100 * Math.sqrt(iso / 100) * Math.sqrt(power);
  return { gn: gn,
    note: 'Published rules: GN scales with the square root of the ISO ratio and of the power fraction. 1/2 power is exactly one stop down.' };
}

// stop difference between two apertures (positive = b lets in more light than a)
function stopDiff(a, b) { return 2 * Math.log2(b / a); }

// nearest standard full stop and the error in stops
function nearestStop(f) {
  var best = FULL_STOPS[0], bestErr = Math.abs(stopDiff(f, best));
  for (var i = 1; i < FULL_STOPS.length; i++) {
    var e = Math.abs(stopDiff(f, FULL_STOPS[i]));
    if (e < bestErr) { best = FULL_STOPS[i]; bestErr = e; }
  }
  return { stop: best, errStops: stopDiff(best, f) }; // positive err: exact f is wider than the stop (photo a touch dark)
}

// given distance, what aperture (exact + nearest standard stop)
function apertureFor(gn100, iso, power, distanceM) {
  var g = effectiveGN(gn100, iso, power);
  if (g.error) return { error: g.error };
  if (bad(distanceM) || distanceM < 0.3 || distanceM > 100) return { error: 'Distance must be 0.3-100 m. Under about 0.5 m most flashes overexpose even at minimum power.' };
  var f = g.gn / distanceM;
  var n = nearestStop(f);
  return { exactF: f, stop: n.stop, errStops: n.errStops, gn: g.gn,
    verdict: f > 22 ? 'Even f/22 is not enough - add diffusion, raise ISO is wrong way: lower power or step back' :
      f < 1.4 ? 'Wider than f/1.4 - you have power to spare; drop power or ISO for battery and recycle time' : 'In normal lens range',
    note: 'Exact f-number from GN = distance x aperture. The error tells you how far the nearest full stop is from the truth.' };
}

// given aperture, how far does the flash reach
function distanceFor(gn100, iso, power, aperture) {
  var g = effectiveGN(gn100, iso, power);
  if (g.error) return { error: g.error };
  if (bad(aperture) || aperture < 0.7 || aperture > 64) return { error: 'Aperture must be between f/0.7 and f/64.' };
  return { distanceM: g.gn / aperture, gn: g.gn };
}

// what power fraction is needed for aperture + distance
function powerFor(gn100, iso, aperture, distanceM) {
  if (bad(gn100) || gn100 <= 0 || gn100 > 400) return { error: 'Guide number must be between 0 and 400.' };
  if (bad(iso) || iso < 25 || iso > 409600) return { error: 'ISO must be between 25 and 409600.' };
  if (bad(aperture) || aperture < 0.7 || aperture > 64) return { error: 'Aperture must be between f/0.7 and f/64.' };
  if (bad(distanceM) || distanceM < 0.3 || distanceM > 100) return { error: 'Distance must be 0.3-100 m.' };
  var gnIso = gn100 * Math.sqrt(iso / 100);
  var needGN = aperture * distanceM;
  var power = Math.pow(needGN / gnIso, 2);
  // nearest standard power step
  var best = POWERS[0], bestErr = Math.abs(Math.log2(power / best));
  for (var i = 0; i < POWERS.length; i++) {
    var e = Math.abs(Math.log2(power / POWERS[i]));
    if (e < bestErr) { best = POWERS[i]; bestErr = e; }
  }
  var label = '1/' + Math.round(1 / best);
  if (power > 1) {
    return { power: power, possible: false, shortfallStops: Math.log2(power),
      verdict: 'Full power is ' + Math.log2(power).toFixed(1) + ' stops short - raise ISO, open the aperture, or get closer' };
  }
  return { power: power, possible: true, step: best, stepLabel: label, stepErrStops: Math.log2(best / power),
    verdict: 'Set about ' + label + ' power (' + (bestErr < 0.05 ? 'bang on' : Math.abs(Math.log2(best / power)).toFixed(2) + ' stops from ideal') + ')' };
}

// bounce: subtract stops from the effective GN (pure rule of thumb, labeled)
function bounceGN(gn, stopsLost) {
  if (bad(gn) || gn <= 0) return { error: 'GN must be positive.' };
  if (bad(stopsLost) || stopsLost < 0 || stopsLost > 5) return { error: 'Bounce loss must be 0-5 stops.' };
  return { gn: gn / Math.pow(2, stopsLost / 2),
    note: 'Bounce loss is a pure rule of thumb - ceiling height, color and room size change it by stops either way. Meter or chimp it.' };
}

var engine = {
  effectiveGN: effectiveGN, apertureFor: apertureFor, distanceFor: distanceFor,
  powerFor: powerFor, bounceGN: bounceGN, nearestStop: nearestStop, stopDiff: stopDiff,
  CONST: { FULL_STOPS: FULL_STOPS, POWERS: POWERS }
};
if (typeof module !== 'undefined') module.exports = engine;
