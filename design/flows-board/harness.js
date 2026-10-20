// Headless check: render every step of every flow in both themes, click through each device, fail on undefined/NaN/screen errors.
const { chromium } = require('playwright');
const path = require('path');
const target = process.argv[2]; const file = 'file://' + path.resolve(target);
const shots = process.argv.slice(3);
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.route('**/fonts.googleapis.com/**', r => r.abort());
  await page.goto(file);
  const flows = await page.evaluate(() => window.__FB.FLOWS.map(f => f.id));
  const problems = [];
  const themes = await page.evaluate(() => window.__FB.themes); for (const theme of [themes.length > 1 ? 'both' : themes[0]]) {
    await page.evaluate(t => window.__FB.setTheme(t), theme);
    for (const id of flows) {
      await page.evaluate(id => { location.hash = id; window.__FB.open(id); }, id);
      const res = await page.evaluate(async () => {
        const out = [];
        const bad = t => /undefined|NaN|SCREEN ERROR|\[object Object\]/.test(t);
        if (bad(document.getElementById('fbMain').innerText)) out.push('static: ' + (document.getElementById('fbMain').innerText.match(/.{0,60}(undefined|NaN|SCREEN ERROR|\[object Object\]).{0,40}/) || [''])[0]);
        const devs = [...document.querySelectorAll('[data-dev]')].map(d => d.getAttribute('data-dev'));
        let clicks = 0;
        for (const id of devs) {
          for (let i = 0; i < 25; i++) {
            const d = document.querySelector('[data-dev="' + id + '"]');
            const btns = [...d.querySelectorAll('[data-act]')].filter(b => !b.disabled && b.getAttribute('data-act') !== 'closeScrim');
            if (i >= btns.length) break;
            const b = btns[i]; const label = b.textContent.trim().slice(0, 30);
            b.click(); clicks++;
            const d2 = document.querySelector('[data-dev="' + id + '"]');
            if (bad(d2.innerText)) { out.push(id + ' after "' + label + '": ' + (d2.innerText.match(/.{0,60}(undefined|NaN|SCREEN ERROR|\[object Object\]).{0,40}/) || [''])[0]); break; }
          }
        }
        return { out, clicks, devs: devs.length };
      });
      if (res.out.length) problems.push(id + ' -> ' + res.out.join(' | '));
      process.stdout.write(id + ' ' + res.devs + ' devices, ' + res.clicks + ' clicks\n');
    }
  }
  // guide view
  await page.evaluate(() => window.__FB.setView('guide'));
  const g = await page.evaluate(() => document.getElementById('fbMain').innerText);
  if (/undefined|NaN/.test(g)) problems.push('guide has undefined/NaN');
  // horizontal overflow at phone width
  for (const w of [390, 1440]) {
    await page.setViewportSize({ width: w, height: 900 });
    for (const v of ['flows', 'guide']) {
      await page.evaluate(v => { window.__FB.setView(v); window.__FB.open(window.__FB.FLOWS[1].id); window.__FB.setView(v); }, v);
      await page.waitForTimeout(150);
      const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (ov > 0) problems.push('horizontal overflow ' + ov + 'px at ' + w + ' in ' + v);
    }
  }
  // screenshots
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => window.__FB.setView('flows'));
  for (const s of shots) {
    const [id, theme] = s.split('@');
    await page.goto('about:blank'); await page.goto(file + '#' + id);
    await page.evaluate(t => window.__FB.setTheme(t || (window.__FB.themes.length>1?'both':window.__FB.themes[0])), theme);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(__dirname, path.basename(target,'.html') + '-' + id + '-' + (theme || 'both') + '.png'), fullPage: true });
  }
  await browser.close();
  console.log('\nERRORS:', errors.length ? errors.join('\n') : 'none');
  console.log('PROBLEMS:', problems.length ? '\n' + problems.join('\n') : 'none');
  process.exit(errors.length || problems.length ? 1 : 0);
})();
