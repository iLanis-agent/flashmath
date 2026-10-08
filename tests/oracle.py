#!/usr/bin/env python3
# Independent oracle for Flashmath. Re-derives the inverse-square guide-number
# math with math.sqrt / fractions.Fraction, then checks the classic published
# anchor: a GN 58 flash at ISO 100, full power, f/4 reaches exactly 14.5 m.
import json, math
from fractions import Fraction

FULL = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22]
POWERS = [Fraction(1, 2**k) for k in range(8)]

def gn_eff(gn, iso, power):
    return gn * math.sqrt(iso / 100.0) * math.sqrt(float(power))

def nearest(f):
    return min(FULL, key=lambda s: abs(2 * math.log2(s / f)))

cases = []

# effective GN grid
for gn in (12, 28, 35, 43, 58, 60):
    for iso in (100, 200, 400, 800, 1600, 6400):
        for pw in (Fraction(1), Fraction(1, 2), Fraction(1, 4), Fraction(1, 16), Fraction(1, 128)):
            cases.append({'kind': 'gn', 'gn': gn, 'iso': iso, 'pw': float(pw),
                          'eff': gn_eff(gn, iso, pw)})

# aperture for distance
for gn, iso, pw, d in [(58, 100, 1, 4), (58, 100, 1, 14.5), (43, 400, 0.5, 7), (12, 100, 1, 2.5),
                       (60, 800, 0.25, 12), (35, 1600, 1, 9.9), (28, 200, 0.0625, 1.2)]:
    eff = gn_eff(gn, iso, Fraction(pw).limit_denominator(1000))
    f = eff / d
    cases.append({'kind': 'ap', 'gn': gn, 'iso': iso, 'pw': pw, 'd': d, 'f': f,
                  'stop': nearest(f), 'gnEff': eff})

# distance for aperture
for gn, iso, pw, ap in [(58, 100, 1, 4.0), (58, 100, 1, 2.8), (43, 200, 0.5, 5.6),
                        (60, 6400, 1, 8.0), (12, 400, 0.125, 2.0)]:
    eff = gn_eff(gn, iso, Fraction(pw).limit_denominator(1000))
    cases.append({'kind': 'dist', 'gn': gn, 'iso': iso, 'pw': pw, 'ap': ap,
                  'd': eff / ap, 'gnEff': eff})

# power needed
for gn, iso, ap, d in [(58, 100, 4.0, 7.25), (58, 100, 4.0, 14.5), (43, 400, 2.8, 10),
                       (60, 100, 11, 3), (35, 800, 5.6, 30), (12, 100, 2.0, 1.5)]:
    gn_iso = gn * math.sqrt(iso / 100.0)
    need = ap * d
    p = (need / gn_iso) ** 2
    case = {'kind': 'pw', 'gn': gn, 'iso': iso, 'ap': ap, 'd': d,
            'power': p, 'possible': p <= 1}
    if p <= 1:
        step = min(POWERS, key=lambda s: abs(math.log2(float(s) / p)))
        case['step'] = float(step)
        case['stepErr'] = math.log2(float(step) / p)
    else:
        case['shortfall'] = math.log2(p)
    cases.append(case)

# bounce
for gn, stops in [(58, 0), (58, 1), (58, 2), (43, 3), (60, 2.5)]:
    cases.append({'kind': 'bounce', 'gn': gn, 'stops': stops,
                  'eff': gn / (2 ** (stops / 2.0))})

with open('tests/expected.json', 'w') as f:
    json.dump(cases, f, indent=1)

fails = []
# published anchor: GN 58, ISO 100, full power, f/4 -> exactly 14.5 m
if abs(gn_eff(58, 100, Fraction(1)) / 4.0 - 14.5) > 1e-12: fails.append(('GN58 f/4 anchor', gn_eff(58, 100, Fraction(1)) / 4.0))
# ISO x4 doubles GN; half power divides by sqrt(2)
for gn in (12, 43, 60):
    if abs(gn_eff(gn, 400, Fraction(1)) / gn_eff(gn, 100, Fraction(1)) - 2) > 1e-12: fails.append(('ISO x4 != GN x2', gn))
    if abs(gn_eff(gn, 100, Fraction(1, 2)) / gn_eff(gn, 100, Fraction(1)) - 1 / math.sqrt(2)) > 1e-12: fails.append(('half power != /sqrt2', gn))
# monotonicity and bounds
for gn in (12, 58):
    prev = 0
    for k in range(8):
        e = gn_eff(gn, 100, Fraction(1, 2**k))
        if e >= prev and k > 0: fails.append(('power not monotone', gn, k))
        prev = e
        if e > gn: fails.append(('eff above full-power GN', gn, k))

print(f'{len(cases)} cases written, {len(fails)} property failures')
for f in fails: print('FAIL', f)
raise SystemExit(1 if fails else 0)
