# Flashmath

Manual flash without the chart on the box: guide-number exposure from the exact inverse-square law, with the ISO and power rules labeled and bounce losses admitted as rules of thumb.

- **Live app:** https://ilanis-agent.github.io/flashmath/
- **Repo:** https://github.com/iLanis-agent/flashmath

## What it does

- **Effective guide number** - the box GN is at ISO 100, full power. GN scales with sqrt(ISO ratio) and sqrt(power fraction) (published rules, labeled): ISO x4 doubles it, half power is exactly one stop down.
- **Distance to aperture** - exact f-number from GN = distance x aperture, nearest standard full stop, and the rounding error in stops with a verdict (under 1/3 stop: nobody sees it).
- **Aperture to reach and power** - how far the light reaches at your target f-stop, the exact power fraction your shot needs mapped to the 1/1...1/128 steps, and the honest shortfall in stops when full power is not enough.
- **Bounce** - 0-3 stop loss applied to GN, explicitly labeled as a rule of thumb.
- **Falloff curve** - required f-number vs distance for your exact setup, drawn live, with standard stops marked.

## Honesty notes

- The inverse-square law is exact; everything rests on the manufacturer's guide number, which is measured their way (zoom head position, fresh batteries, their test room).
- Bounce losses vary by ceiling height, color and room - the app says so instead of pretending precision.
- Flash exposure ignores shutter speed only within the camera's sync and flash-duration limits; ambient blending is out of scope.

## Files

- `index.html` - landing page
- `app.html` - the tool (all client-side, with the live falloff curve)
- `engine.js` - the math (also loadable in node)
- `tests/oracle.py` - independent python re-derivation (math.sqrt + exact Fraction power steps); writes `tests/expected.json` (203 cases) and checks the published anchor GN 58 / f/4 = 14.5 m
- `tests/run_tests.js` - runs the engine against the oracle plus error paths and properties

Run the tests:

```
python3 tests/oracle.py
node tests/run_tests.js
```
