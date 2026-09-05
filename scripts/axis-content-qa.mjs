import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const chromePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const baseUrl = process.argv[2] ?? process.env.QA_BASE_URL ?? "http://localhost:3100";
const outputDir = process.env.QA_OUTPUT_DIR ?? join(tmpdir(), "uc-visual-qa");
const profileDir = await mkdtemp(join(tmpdir(), "uc-qa-chrome-"));
const port = 9334;
const axisSlugs = [
  "economie", "tashghil-chabab", "taalim-takwin", "sante", "adala-ijtimaiya",
  "tanmia-majaliya", "raqmana-ibtikar", "bia-tanmia-moustadama", "hakama-idara", "thaqafa-riyada",
];

const commitmentSlugs = ['productive-economy','social-equity','regional-justice','trust-and-influence'];
const routes = [
  ...axisSlugs.map(slug => ({slug,kind:'axis',path:'/programme-electoral/axes/'+slug})),
  ...commitmentSlugs.map(slug => ({slug,kind:'commitment',path:'/programme-electoral/engagements/'+slug})),
];

await mkdir(outputDir, { recursive: true });

const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profileDir}`,
  "--window-size=1440,1200",
  `${baseUrl}/`,
], { stdio: "ignore" });

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getPage() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const pages = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json());
      const page = pages.find((entry) => entry.type === "page");
      if (page) return page;
    } catch {}
    await delay(250);
  }
  throw new Error("Chrome DevTools did not become ready.");
}

const page = await getPage();
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let commandId = 0;
const pending = new Map();
const browserErrors = [];
socket.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
  if(message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') browserErrors.push(message.params.args.map(arg => arg.value ?? arg.description ?? '').join(' '));
  if (message.method === "Runtime.exceptionThrown") {
    browserErrors.push(message.params.exceptionDetails.text);
  }
  if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
    browserErrors.push(`${message.params.entry.text}${message.params.entry.url ? ` — ${message.params.entry.url}` : ""}`);
  }
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

function command(method, params = {}) {
  commandId += 1;
  return new Promise((resolve, reject) => {
    pending.set(commandId, { resolve, reject });
    socket.send(JSON.stringify({ id: commandId, method, params }));
  });
}
const { axisSourceRanges, extractAxisSource, commitmentSourceRanges, extractCommitmentSource } = await import('../src/lib/programme-source.ts');
const source = await readFile(new URL('../chat.md', import.meta.url), 'utf8');
const normalize = text => text.replace(/\s+/g, ' ').trim();
const expected = {};
for (const {slug,kind} of routes) {
  const pieces = (kind==='axis'?axisSourceRanges:commitmentSourceRanges)[slug].map(([start,end]) => {
    const from = source.indexOf('**' + start + '**');
    const to = source.indexOf('**' + end + '**',from+1);
    if (from < 0 || to <= from) throw new Error('Invalid source range ' + slug);
    return source.slice(from,to);
  });
  expected[slug] = normalize(pieces.join('\n').split(/\r?\n/).map(line => line.trim().replace(/\\$/, '').replace(/^\*\*(.*?)\*\*$/, '$1').replace(/^•\s*/, '').replace(/^\d+\.\s*/, '')).join(' '));
  const blocks = (kind==='axis'?extractAxisSource:extractCommitmentSource)(source,slug).blocks;
  const extracted = normalize(blocks.flatMap(block => block.kind === 'list' ? block.items : [block.text, ...(block.items ?? [])]).join(' '));
  if (extracted !== expected[slug]) throw new Error('Source text changed or omitted: ' + slug);
}
async function evaluate(expression) {
  const response = await command('Runtime.evaluate', {expression, returnByValue:true});
  if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
  return response.result.value;
}
async function until(expression) {
  for(let i=0;i<100;i++) { if(await evaluate('Boolean('+expression+')')) return; await delay(100); }
  throw new Error('Timed out: '+expression);
}
const renderedText = `[...document.querySelector('[data-programme-source]').querySelectorAll('h2,p,li')].filter(n=>n.tagName!=='LI'||!n.querySelector('p,ul')).map(n=>n.textContent).join(' ')`;
try {
  await command('Page.enable'); await command('Runtime.enable'); await command('Log.enable');
  for (const width of [1440,390]) {
    await command('Emulation.setDeviceMetricsOverride', {width,height:900,deviceScaleFactor:1,mobile:width===390});
    for (const locale of ['ar','fr','en']) {
      await command('Page.navigate', {url:baseUrl+'/programme-electoral'});
      await until("document.documentElement?.dataset.locale && document.querySelector('#axis-tashghil-chabab a')");
      await evaluate('document.querySelector('+JSON.stringify('button[lang='+locale+']')+').click()');
      await until('document.documentElement?.dataset.locale === '+JSON.stringify(locale));
      const links=await evaluate("[...document.querySelectorAll('#categories a, #commitments a')].map(a=>a.getAttribute('href'))");
      if(new Set(links).size!==14 || routes.some(route=>!links.includes(route.path))) throw new Error('Wrong card slugs');
      for(const {slug,kind,path} of routes) {
        if(slug !== axisSlugs[0]) {
          await command('Page.navigate',{url:baseUrl+'/programme-electoral'});
          await until('document.documentElement?.dataset.locale === '+JSON.stringify(locale)+" && document.querySelector('#"+kind+"-"+slug+" a')");
        }
        const selector='#'+kind+'-'+slug+' a';
        const title=await evaluate('document.querySelector('+JSON.stringify(selector)+').closest("[id]").querySelector("h3").textContent.trim()');
        await evaluate('document.querySelector('+JSON.stringify(selector)+').click()');
        await until('location.pathname === '+JSON.stringify(path)+" && Boolean(document.querySelector('[data-programme-source]'))");
        const state=await evaluate(`(()=>{const s=document.querySelector('[data-programme-source]'); return {lang:s.lang,dir:getComputedStyle(s).direction,htmlLang:document.documentElement.lang,htmlDir:document.documentElement.dir,title:document.querySelector('main h1').textContent.trim(),width:innerWidth,scroll:document.documentElement.scrollWidth,back:document.querySelector('main article a').getAttribute('href')}})()`);
        const content=await evaluate(renderedText);
        if(normalize(content)!==expected[slug]) throw new Error('Rendered content mismatch '+slug);
        if(state.title!==title || state.lang!=='ar' || state.dir!=='rtl' || state.htmlLang!==locale || state.htmlDir!==(locale==='ar'?'rtl':'ltr') || state.scroll>state.width || !state.back.includes(slug)) throw new Error('Layout/locale failure '+JSON.stringify(state));
        if(locale!=='ar' && !await evaluate("document.querySelector('main article').textContent.includes("+JSON.stringify(locale==='fr'?'disponible uniquement en arabe':'available only in Arabic')+")")) throw new Error('Missing fallback notice');
        if(slug==='tashghil-chabab'||slug==='social-equity') {
          await evaluate("document.querySelector('[data-programme-source]').scrollIntoView()");
          await delay(250);
          const shot=await command('Page.captureScreenshot',{format:'png'});
          await writeFile(join(outputDir,locale+'-'+slug+'-'+width+'.png'),Buffer.from(shot.data,'base64'));
        }
      }
      console.log('PASS: 10 axes + 4 commitments, card links, complete source text, '+locale+', '+width+'px');
    }
  }
  await command('Page.navigate',{url:baseUrl+'/programme-electoral/axes/tashghil-chabab'});
  await until("document.documentElement?.dataset.locale === 'en' && document.querySelector('[data-programme-source]')");
  for(const locale of ['ar','fr','en']) {
    await evaluate('document.querySelector('+JSON.stringify('button[lang='+locale+']')+').click()');
    await until('document.documentElement.lang === '+JSON.stringify(locale));
    if(normalize(await evaluate(renderedText))!==expected['tashghil-chabab']) throw new Error('Language switching changed source text');
  }
  if(browserErrors.length) throw new Error(browserErrors.join('\n'));
  for(const path of ['/programme-electoral/axes/invalid-axis','/programme-electoral/engagements/invalid-commitment']) {
    const missing=await fetch(baseUrl+path);
    if(missing.status!==404 || !(await missing.text()).includes('404')) throw new Error('Missing 404: '+path);
  }
  console.log('PASS: direct employment URL, in-page language switches, source integrity, no console errors, invalid slug 404');
  console.log(outputDir);
} finally {
  socket.close(); chrome.kill();
}
