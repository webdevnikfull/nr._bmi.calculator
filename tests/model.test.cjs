// Run directly: node tests/model.test.cjs (Node.js 18+).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const BMI = require('../model.js');
const close = (actual, expected, epsilon = 1e-10) => assert.ok(Math.abs(actual - expected) < epsilon, `${actual} ≠ ${expected}`);

test('Reference example: 180 cm / 72.5 kg', () => {
  const result = BMI.calculate('180', '72,5');
  assert.equal(result.ok, true);
  close(result.bmi, 22.37654320987654);
  assert.equal(result.bmi.toFixed(1), '22.4');
  assert.equal(result.category, 'normal');
});

test('All classification boundaries use the unrounded BMI', () => {
  for (const [weight, category] of [[73.999, 'under'], [74, 'normal'], [99.999, 'normal'], [100, 'over'], [119.999, 'over'], [120, 'obesity']]) {
    assert.equal(BMI.calculate(200, weight).category, category);
  }
  const nearBoundary = BMI.calculate(200, 99.999);
  assert.equal(nearBoundary.bmi.toFixed(1), '25.0');
  assert.equal(nearBoundary.category, 'normal');
});

test('Metric and imperial measurements produce the same BMI', () => {
  const metric = BMI.calculate(180, 72.5);
  const imperial = BMI.calculate(180 / 2.54, 72.5 / 0.45359237, 'imperial');
  close(imperial.bmi, metric.bmi);
  assert.equal(imperial.category, metric.category);
  // 160 lb = 72.5747792 kg; 70 in = 1.778 m (exact definitions).
  close(BMI.calculate(70, 160, 'imperial').bmi, 22.957374029033772, 1e-10);
});

test('Decimal commas, decimal dots and outer whitespace are supported', () => {
  for (const text of ['72.5', '72,5', ' 72,5 ', '072.50']) assert.equal(BMI.parse(text), 72.5);
});

test('Empty, zero and malformed input never produce a result', () => {
  for (const text of ['', ' ', '0', '-1', 'NaN', 'Infinity', '1e2', '0x20', '72kg', '72,5.2', '1 000', '72.', '<script>']) {
    const result = BMI.calculate(text, text);
    assert.equal(result.ok, false, text);
    assert.ok(result.errors.height, text);
    assert.ok(result.errors.weight, text);
    assert.equal(result.bmi, undefined);
  }
});

test('Both field errors are returned together, with specific error codes', () => {
  assert.deepEqual(BMI.calculate('', '0'), { ok: false, errors: { height: 'required', weight: 'positive' } });
  assert.deepEqual(BMI.calculate('abc', ''), { ok: false, errors: { height: 'number', weight: 'required' } });
});

test('Technical input boundaries are inclusive in both systems', () => {
  for (const height of [50, 260]) for (const weight of [10, 500]) {
    assert.equal(BMI.calculate(height, weight).ok, true);
    assert.equal(BMI.calculate(height / 2.54, weight / 0.45359237, 'imperial').ok, true);
  }
  for (const height of [49.99, 260.01]) assert.equal(BMI.calculate(height, 72.5).errors.height, 'heightRange');
  for (const weight of [9.99, 500.01]) assert.equal(BMI.calculate(180, weight).errors.weight, 'weightRange');
});

test('Scale marker is clamped; extreme results remain numerically accurate', () => {
  const low = BMI.calculate(260, 10);
  const high = BMI.calculate(50, 500);
  assert.equal(low.marker, 0);
  assert.equal(high.marker, 100);
  assert.equal(high.bmi, 2000);
  assert.equal(high.category, 'obesity');
  close(BMI.calculate(200, 74).marker, (18.5 - 12) / 28 * 100);
});

test('Unit conversion is reversible and validates its arguments', () => {
  for (const [kind, value] of [['height', 180], ['weight', 72.5]]) {
    const converted = BMI.convert(value, kind, 'metric', 'imperial');
    close(BMI.convert(converted, kind, 'imperial', 'metric'), value);
  }
  assert.equal(BMI.convert('72,5', 'weight', 'metric', 'metric'), 72.5);
  assert.throws(() => BMI.convert('', 'weight', 'metric', 'imperial'), /required/);
  assert.throws(() => BMI.convert(180, 'width', 'metric', 'imperial'), /kind/);
  assert.throws(() => BMI.calculate(180, 72.5, 'other'), /unit/);
  assert.throws(() => BMI.convert(180, 'height', 'other', 'metric'), /unit/);
});

test('Classification rejects non-positive and non-finite values', () => {
  for (const value of [0, -1, NaN, Infinity]) assert.throws(() => BMI.category(value), /positive/);
});

const root = path.join(__dirname, '..');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'translations.js'), 'utf8'), context);
const dictionaries = context.window.BMITranslations;

test('Seven complete dictionaries have matching keys and placeholders', () => {
  assert.deepEqual(Object.keys(dictionaries).sort(), ['de', 'en', 'es', 'fr', 'pl', 'ru', 'uk']);
  const keys = Object.keys(dictionaries.pl).sort();
  for (const [lang, dict] of Object.entries(dictionaries)) {
    assert.deepEqual(Object.keys(dict).sort(), keys, lang);
    for (const key of keys) {
      assert.ok(dict[key].trim(), `${lang}.${key}`);
      assert.deepEqual((dict[key].match(/\{\w+\}/g) || []).sort(), (dictionaries.pl[key].match(/\{\w+\}/g) || []).sort(), `${lang}.${key}`);
    }
  }
});

test('Every translated HTML element has a dictionary entry', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const [, key] of html.matchAll(/data-i="([^"]+)"/g)) assert.ok(dictionaries.pl[key], key);
});
