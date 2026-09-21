/* Pure calculation module: shared by the browser and the Node.js tests. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BMI = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const factors = { height: 2.54, weight: 0.45359237 };
  const units = ['metric', 'imperial'];
  const tolerance = 1e-6; // Accommodate floating-point noise during unit conversion.

  function parse(value) {
    const text = String(value).trim();
    if (!text) throw new Error('required');
    if (!/^\d+(?:[.,]\d+)?$/.test(text)) throw new Error('number');
    const n = Number(text.replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) throw new Error('positive');
    return n;
  }

  function category(bmi) {
    if (!Number.isFinite(bmi) || bmi <= 0) throw new Error('positive');
    return bmi < 18.5 ? 'under' : bmi < 25 ? 'normal' : bmi < 30 ? 'over' : 'obesity';
  }

  function calculate(height, weight, unit = 'metric') {
    if (!units.includes(unit)) throw new Error('unit');
    const errors = {};
    let h, w;
    try {
      h = parse(height) * (unit === 'imperial' ? factors.height : 1);
      if (h < 50 - tolerance || h > 260 + tolerance) errors.height = 'heightRange';
    } catch (error) { errors.height = error.message; }
    try {
      w = parse(weight) * (unit === 'imperial' ? factors.weight : 1);
      if (w < 10 - tolerance || w > 500 + tolerance) errors.weight = 'weightRange';
    } catch (error) { errors.weight = error.message; }

    if (Object.keys(errors).length) return { ok: false, errors };
    const bmi = w / (h / 100) ** 2;
    return {
      ok: true, bmi, category: category(bmi), height: h, weight: w,
      marker: Math.max(0, Math.min(100, (bmi - 12) / 28 * 100))
    };
  }

  function convert(value, kind, from, to) {
    if (!units.includes(from) || !units.includes(to)) throw new Error('unit');
    if (!Object.hasOwn(factors, kind)) throw new Error('kind');
    const n = parse(value);
    if (from === to) return n;
    return from === 'metric' ? n / factors[kind] : n * factors[kind];
  }

  return Object.freeze({ parse, category, calculate, convert });
});
