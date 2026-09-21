(() => {
  'use strict';

  const dictionaries = window.BMITranslations;
  const $ = (selector) => document.querySelector(selector);
  const fields = { height: $('#height'), weight: $('#weight') };
  const limits = { height: [50, 260], weight: [10, 500] };
  const factors = { height: 2.54, weight: 0.45359237 };
  const storageKey = 'nr-bmi-language';
  let language = 'pl';
  try {
    const saved = localStorage.getItem(storageKey);
    if (Object.hasOwn(dictionaries, saved)) language = saved;
  } catch { /* Language selection still works when storage is unavailable. */ }

  let unit = 'metric';
  let result = BMI.calculate('180', '72.5');
  let sample = true;
  let dirty = false;
  let errors = {};
  let toastTimer;
  // Remember exact values only in memory. Unit toggles must not accumulate rounding.
  const exact = { height: null, weight: null };

  function t(key, values = {}) {
    return dictionaries[language][key].replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
  }

  function number(value, digits = 1, minimum = 0) {
    return new Intl.NumberFormat(dictionaries[language].locale, {
      maximumFractionDigits: digits, minimumFractionDigits: minimum, useGrouping: false
    }).format(value);
  }

  function unitName(kind) {
    return unit === 'metric' ? (kind === 'height' ? 'cm' : 'kg') : (kind === 'height' ? 'in' : 'lb');
  }

  function writeField(kind, metricValue) {
    const displayedValue = unit === 'metric' ? metricValue : metricValue / factors[kind];
    fields[kind].value = number(displayedValue, 6);
    exact[kind] = { text: fields[kind].value, metric: metricValue };
  }

  function modelValue(kind) {
    const raw = fields[kind].value;
    if (exact[kind]?.text === raw) return exact[kind].metric;
    if (unit === 'metric') return raw;
    try { return BMI.convert(raw, kind, 'imperial', 'metric'); }
    catch { return raw; } // Preserve invalid input so the model returns the right error.
  }

  function readResult() {
    return BMI.calculate(modelValue('height'), modelValue('weight'));
  }

  function rangeValues(kind) {
    const factor = unit === 'metric' ? 1 : factors[kind];
    return { min: number(limits[kind][0] / factor, 6), max: number(limits[kind][1] / factor, 6), unit: unitName(kind) };
  }

  function renderFields() {
    document.querySelectorAll('[data-unit]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.unit === unit));
    });
    for (const kind of Object.keys(fields)) {
      $(`#${kind}-unit`).textContent = unitName(kind);
      $(`#${kind}-hint`).textContent = `${unit === 'imperial' ? '≈ ' : ''}${t('rangeHint', rangeValues(kind))}`;
      const error = errors[kind];
      $(`#${kind}-error`).textContent = error ? t(error.endsWith('Range') ? 'rangeError' : error, rangeValues(kind)) : '';
      $(`#${kind}-hint`).hidden = Boolean(error);
      fields[kind].setAttribute('aria-invalid', String(Boolean(error)));
    }
  }

  function renderResult() {
    $('#result').hidden = !result;
    $('#empty-result').hidden = Boolean(result);
    $('#example-label').hidden = !sample || !result;
    $('#copy').disabled = !result;
    $('#result-status').textContent = t(result ? (sample ? 'sampleStatus' : 'readyStatus') : (dirty ? 'dirtyStatus' : 'emptyStatus'));
    document.querySelectorAll('[data-category]').forEach(card => {
      card.dataset.active = String(result?.category === card.dataset.category);
    });
    if (!result) return;

    const formatted = number(result.bmi, 1, 1);
    $('#bmi-value').textContent = formatted;
    $('.result-number').dataset.long = String(formatted.length > 5);
    $('#category').textContent = t(result.category);
    $('#category').style.setProperty('--category-color', `var(--${result.category})`);
    $('#marker').style.left = `${result.marker}%`;
    for (const kind of Object.keys(fields)) {
      const value = unit === 'metric' ? result[kind] : result[kind] / factors[kind];
      const target = $(`#result-${kind}`);
      const suffix = document.createElement('small');
      suffix.textContent = ` ${unitName(kind)}`;
      target.replaceChildren(document.createTextNode(number(value, 2)), suffix);
    }
    $('#precise').textContent = number(result.bmi, 3, 3);
  }

  function announce(message) {
    $('#announcement').textContent = '';
    requestAnimationFrame(() => { $('#announcement').textContent = message; });
  }

  function toast(key) {
    clearTimeout(toastTimer);
    $('#toast').textContent = t(key);
    $('#toast').hidden = false;
    announce(t(key));
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4500);
  }

  function applyLanguage() {
    document.documentElement.lang = language;
    $('#language').value = language;
    $('#language').setAttribute('aria-label', t('language'));
    $('.units').setAttribute('aria-label', t('units'));
    document.querySelector('meta[name="description"]').content = t('meta');
    document.querySelectorAll('[data-i]').forEach(element => { element.textContent = t(element.dataset.i); });
    const scale = $('.scale-values').children;
    [12, 18.5, 25, 30, 40].forEach((value, index) => {
      scale[index].textContent = number(value) + (index === 4 ? '+' : '');
    });
    const ranges = [`< ${number(18.5)}`, `${number(18.5)} – < 25`, '25 – < 30', '≥ 30'];
    document.querySelectorAll('[data-category] p').forEach((element, index) => { element.textContent = ranges[index]; });
    // Reformat valid inputs without touching unfinished or invalid entries.
    for (const kind of Object.keys(fields)) {
      try { writeField(kind, BMI.parse(modelValue(kind))); } catch { /* Keep draft text. */ }
    }
    $('#toast').hidden = true;
    renderFields();
    renderResult();
  }

  $('#bmi-form').addEventListener('submit', event => {
    event.preventDefault();
    const next = readResult();
    errors = next.ok ? {} : next.errors;
    result = next.ok ? next : null;
    sample = false;
    renderFields();
    renderResult();
    if (!next.ok) {
      fields[Object.keys(errors)[0]].focus();
      announce(t('validation'));
      return;
    }
    dirty = false;
    for (const kind of Object.keys(fields)) exact[kind] = { text: fields[kind].value, metric: next[kind] };
    announce(t('calculated', { value: number(next.bmi, 1, 1), category: t(next.category) }));
    // On narrow screens the result appears just below the form.
    if (matchMedia('(max-width: 700px)').matches) {
      $('.result-card').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    }
  });

  for (const [kind, field] of Object.entries(fields)) {
    field.addEventListener('input', () => {
      exact[kind] = null;
      delete errors[kind];
      result = null;
      sample = false;
      dirty = true;
      renderFields();
      renderResult();
    });
  }

  document.querySelectorAll('[data-unit]').forEach(button => {
    button.addEventListener('click', () => {
      const nextUnit = button.dataset.unit;
      if (nextUnit === unit) return;
      const checked = readResult();
      errors = Object.fromEntries(Object.entries(checked.errors || {}).filter(([kind]) => fields[kind].value.trim()));
      if (Object.keys(errors).length) {
        renderFields();
        fields[Object.keys(errors)[0]].focus();
        toast('unitsBlocked');
        return;
      }
      const values = {};
      for (const kind of Object.keys(fields)) {
        if (fields[kind].value.trim()) values[kind] = BMI.parse(modelValue(kind));
      }
      unit = nextUnit;
      for (const [kind, value] of Object.entries(values)) writeField(kind, value);
      renderFields();
      renderResult();
    });
  });

  $('#reset').addEventListener('click', () => {
    for (const kind of Object.keys(fields)) { fields[kind].value = ''; exact[kind] = null; }
    result = null;
    errors = {};
    sample = false;
    dirty = false;
    renderFields();
    renderResult();
    fields.height.focus();
    announce(t('resetDone'));
  });

  $('#example').addEventListener('click', () => {
    unit = 'metric';
    writeField('height', 180);
    writeField('weight', 72.5);
    errors = {};
    dirty = false;
    sample = true;
    result = BMI.calculate('180', '72.5');
    renderFields();
    renderResult();
    announce(t('calculated', { value: number(result.bmi, 1, 1), category: t(result.category) }));
  });

  $('#language').addEventListener('change', event => {
    if (!Object.hasOwn(dictionaries, event.target.value)) return;
    language = event.target.value;
    try { localStorage.setItem(storageKey, language); } catch { /* Optional preference. */ }
    applyLanguage();
  });

  $('#copy').addEventListener('click', async () => {
    if (!result) return;
    const text = `${t('bmiTitle')}: ${number(result.bmi, 1, 1)} kg/m²\n${t(result.category)}\n${t('height')}: ${$('#result-height').textContent}\n${t('weight')}: ${$('#result-weight').textContent}\n${t('adult')}\n${t('medical')}`;
    try { await navigator.clipboard.writeText(text); toast('copied'); }
    catch { toast('copyFailed'); }
  });

  applyLanguage();
})();
