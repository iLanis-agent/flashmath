const E = require('../engine.js');
const cases = require('./expected.json');
let pass = 0, fail = 0;
const TOL = 1e-9;
function chk(ok, label, got, want) {
  if (ok) pass++;
  else { fail++; console.error('FAIL', label, 'got', got, 'want', want); }
}
for (const c of cases) {
  if (c.kind === 'gn') {
    const r = E.effectiveGN(c.gn, c.iso, c.pw);
    chk(!r.error && Math.abs(r.gn - c.eff) < TOL, `gn ${c.gn}@${c.iso}x${c.pw}`, r.gn, c.eff);
  } else if (c.kind === 'ap') {
    const r = E.apertureFor(c.gn, c.iso, c.pw, c.d);
    chk(!r.error && Math.abs(r.exactF - c.f) < TOL && Math.abs(r.stop - c.stop) < 1e-6 && Math.abs(r.gn - c.gnEff) < TOL,
        `ap ${c.gn}/${c.iso}/${c.pw}/${c.d}`, [r.exactF, r.stop], [c.f, c.stop]);
  } else if (c.kind === 'dist') {
    const r = E.distanceFor(c.gn, c.iso, c.pw, c.ap);
    chk(!r.error && Math.abs(r.distanceM - c.d) < TOL && Math.abs(r.gn - c.gnEff) < TOL,
        `dist ${c.gn}/${c.iso}/${c.pw}/f${c.ap}`, r.distanceM, c.d);
  } else if (c.kind === 'pw') {
    const r = E.powerFor(c.gn, c.iso, c.ap, c.d);
    if (c.possible) {
      chk(!r.error && r.possible === true && Math.abs(r.power - c.power) < TOL && Math.abs(r.step - c.step) < TOL &&
          Math.abs(r.stepErrStops - c.stepErr) < TOL, `pw ${c.gn}/${c.iso}/f${c.ap}@${c.d}`, r, c);
    } else {
      chk(!r.error && r.possible === false && Math.abs(r.power - c.power) < TOL && Math.abs(r.shortfallStops - c.shortfall) < TOL,
          `pw-short ${c.gn}/${c.iso}/f${c.ap}@${c.d}`, r, c);
    }
  } else if (c.kind === 'bounce') {
    const r = E.bounceGN(c.gn, c.stops);
    chk(!r.error && Math.abs(r.gn - c.eff) < TOL, `bounce ${c.gn}-${c.stops}`, r.gn, c.eff);
  }
}
// error paths
const errs = [
  E.effectiveGN(0, 100, 1).error, E.effectiveGN(58, 10, 1).error, E.effectiveGN(58, 100, 0).error,
  E.effectiveGN(58, 100, 1.5).error, E.effectiveGN(500, 100, 1).error,
  E.apertureFor(58, 100, 1, 0).error, E.apertureFor(58, 100, 1, 200).error,
  E.distanceFor(58, 100, 1, 0).error, E.distanceFor(58, 100, 1, 100).error,
  E.powerFor(0, 100, 4, 5).error, E.powerFor(58, 100, 0.1, 5).error, E.powerFor(58, 100, 4, 0).error,
  E.bounceGN(0, 2).error, E.bounceGN(58, -1).error, E.bounceGN(58, 6).error
];
errs.forEach((e, i) => chk(typeof e === 'string' && e.length > 5, 'error path ' + i, e, 'error string'));
// properties
// ISO x4 doubles GN; half power is exactly one stop (sqrt2)
for (const gn of [12, 43, 60]) {
  chk(Math.abs(E.effectiveGN(gn, 400, 1).gn / E.effectiveGN(gn, 100, 1).gn - 2) < TOL, `ISO x4 ${gn}`, E.effectiveGN(gn, 400, 1).gn, 2 * E.effectiveGN(gn, 100, 1).gn);
  chk(Math.abs(E.effectiveGN(gn, 100, 0.5).gn - gn / Math.SQRT2) < TOL, `half power ${gn}`, E.effectiveGN(gn, 100, 0.5).gn, gn / Math.SQRT2);
}
// aperture/distance round trip
for (const [gn, d] of [[58, 5], [43, 8]]) {
  const a = E.apertureFor(gn, 100, 1, d);
  const back = E.distanceFor(gn, 100, 1, a.exactF);
  chk(Math.abs(back.distanceM - d) < 1e-9, `round trip ${gn}@${d}`, back.distanceM, d);
}
// more power never shortens reach
let prevD = 0;
for (const p of [0.03125, 0.125, 0.5, 1]) {
  const d = E.distanceFor(58, 100, p, 4).distanceM;
  chk(d > prevD, `reach grows ${p}`, d, prevD);
  prevD = d;
}
console.log(`${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
