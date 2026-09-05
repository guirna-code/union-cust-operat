import { spawn } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const chromePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const baseUrl = process.argv[2] ?? process.env.QA_BASE_URL ?? "http://localhost:3100";
const outputDir = process.env.QA_OUTPUT_DIR ?? join(tmpdir(), "uc-language-qa");
const profileDir = await mkdtemp(join(tmpdir(), "uc-qa-chrome-"));
const port = 9335;



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
  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
    browserErrors.push(message.params.args.map(arg => arg.value ?? arg.description ?? "").join(" "));
  }
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
const dictionaries = Object.fromEntries(await Promise.all(['ar','fr','en'].map(async locale => [locale,(await import(`../src/lib/i18n/${locale}.ts`))[locale]])));
function keys(value, prefix='') {
  return Object.entries(value).flatMap(([key,item]) => {
    const name=prefix ? prefix+'.'+key : key;
    return item && typeof item==='object' ? keys(item,name) : [name];
  }).sort();
}
for(const locale of ['fr','en']) {
  if(JSON.stringify(keys(dictionaries[locale]))!==JSON.stringify(keys(dictionaries.ar))) throw new Error('Missing translation keys: '+locale);
}
async function evaluate(expression) {
  const response = await command('Runtime.evaluate', {expression, returnByValue:true});
  if(response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
  return response.result.value;
}
async function until(expression) {
  for(let i=0;i<100;i++) { if(await evaluate('Boolean('+expression+')')) return; await delay(100); }
  throw new Error('Timed out: '+expression);
}
async function click(selector) {
  const point=await evaluate(`(()=>{const nodes=[...document.querySelectorAll(${JSON.stringify(selector)})]; for(const n of nodes){const r=n.getBoundingClientRect(); const x=r.x+r.width/2,y=r.y+r.height/2; if(r.width&&r.height&&x>=0&&x<innerWidth&&y>=0&&y<innerHeight&&n.contains(document.elementFromPoint(x,y)))return {x,y};} return null})()`);
  if(!point) throw new Error('No visible, clickable control: '+selector);
  await command('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});
  await command('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});
}
async function switchLocale(locale,width) {
  if(width<1024 && await evaluate(`document.querySelector('header button[aria-expanded]')?.getAttribute('aria-expanded')==='false'`)) {
    await click('header button[aria-expanded]'); await delay(400);
  }
  await click(`header button[lang=${locale}]`);
  await until('document.documentElement?.dataset.locale === '+JSON.stringify(locale));
}
try {
  await command('Page.enable'); await command('Runtime.enable'); await command('Log.enable');
  const failures=[];
  for(const width of [1440,390]) {
    await command('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===390});
    for(const route of ['/','/programme-electoral','/programme-electoral/axes/tashghil-chabab','/programme-electoral/engagements/social-equity']) {
      await command('Page.navigate',{url:baseUrl+route+'?test=locale#keep'});
      await until("document.documentElement?.dataset.locale && document.querySelector('main h1')");
      for(const locale of ['ar','fr','en','ar','en','fr','ar']) {
        await switchLocale(locale,width);
        await delay(200);
        const state=await evaluate(`({path:location.pathname+location.search+location.hash, title:document.querySelector('main h1').textContent.trim(), text:document.querySelector('main').innerText, header:document.querySelector('header').innerText, footer:document.querySelector('footer').innerText, lang:document.documentElement.lang, dir:document.documentElement.dir, stored:localStorage.getItem('uc-locale'), active:[...document.querySelectorAll('header button[aria-pressed=true]')].map(n=>n.lang), width:innerWidth, scroll:document.documentElement.scrollWidth, meta:document.title, description:document.querySelector('meta[name=description]')?.content})`);
        const t=dictionaries[locale];
        const expectedMeta=route==='/'?t.meta.homeTitle:t.meta.programmeTitle;
        const expectedDescription=route==='/'?t.meta.homeDescription:t.meta.programmeDescription;
        if(state.meta!==expectedMeta||state.description!==expectedDescription) failures.push('Metadata mismatch '+route+' '+locale);
        const texts=route==='/' ? [t.home.subtitle,t.home.ctaDiscover,t.home.aboutTitle] : route==='/programme-electoral' ? [t.hero.subtitle,t.hero.cta,t.categoriesSection.title,...Object.values(t.categoriesSection.items).flatMap(item=>[item.title,item.description]),...t.commitmentsSection.items.flatMap(item=>[item.title,item.description])] : route.endsWith('social-equity') ? locale==='ar' ? [t.detailPage.backToCommitments] : [t.commitmentsSection.items[1].description,t.detailPage.backToCommitments,...['taalim-takwin','sante','adala-ijtimaiya'].flatMap(slug=>[t.categoriesSection.items[slug].description,...t.categoriesSection.items[slug].points])] : [t.detailPage.backToAxes,...(locale==='ar'?[]:[t.categoriesSection.items['tashghil-chabab'].description,...t.categoriesSection.items['tashghil-chabab'].points])];
        if(texts.some(text=>!state.text.includes(text))) failures.push('Missing translated content '+route+' '+locale);
        const title=route==='/'?t.home.title:route.endsWith('tashghil-chabab')?t.categoriesSection.items['tashghil-chabab'].title:route.endsWith('social-equity')?t.commitmentsSection.items[1].title:t.hero.title;
        if(state.path!==route+'?test=locale#keep'||state.title!==title||state.lang!==locale||state.dir!==t.dir||state.stored!==locale||state.active.length!==2||state.active.some(v=>v!==locale)||!state.footer.includes(t.footer.tagline)||!state.header.includes(t.header.nav[0].label)||state.scroll>state.width) throw new Error('Switch failed '+JSON.stringify(state));
        if(route.endsWith('tashghil-chabab') && locale!=='ar' && !state.text.includes(t.categoriesSection.items['tashghil-chabab'].points[0])) failures.push(`Axis body has no existing ${locale} translation at ${width}px`);
        await command('Page.reload');
        await until('document.documentElement?.dataset.locale === '+JSON.stringify(locale)+" && document.querySelector('main h1')?.textContent.trim() === "+JSON.stringify(title));
        if(await evaluate('document.title')!==expectedMeta || await evaluate("document.querySelector('meta[name=description]')?.content")!==expectedDescription) failures.push('Refresh metadata '+route+' '+locale);
        if(route.endsWith('tashghil-chabab')) {
          const shot=await command('Page.captureScreenshot',{format:'png'});
          await writeFile(join(outputDir,`axis-${locale}-${width}.png`),Buffer.from(shot.data,'base64'));
        }
      }
      console.log('PASS: real pointer clicks, same URL, translated titles/header/footer, RTL/LTR, active state, refresh: '+route+' '+width+'px');
    }
  }
  await command('Page.navigate',{url:baseUrl+'/'});
  await until("document.documentElement?.dataset.locale && document.querySelector('main h1')");
  await switchLocale('fr',390);
  await click('header a[href="/programme-electoral"]');
  await until("location.pathname === '/programme-electoral' && document.querySelector('main h1')?.textContent === "+JSON.stringify(dictionaries.fr.hero.title));
  await delay(400);
  const title=await evaluate('document.title');
  if(title!==dictionaries.fr.meta.programmeTitle) failures.push('French navigation resets metadata: '+title);
  for(const locale of ['fr','en','ar']) {
    await switchLocale(locale,390);
    for(const [selector,path] of [
      ['#axis-tashghil-chabab a','/programme-electoral/axes/tashghil-chabab'],
      ['main article a','/programme-electoral'],
      ['#commitment-social-equity a','/programme-electoral/engagements/social-equity'],
      ['main article a','/programme-electoral'],
    ]) {
      // Close the mobile menu before scrolling to page links.
      if(await evaluate("document.querySelector('header button[aria-expanded]')?.getAttribute('aria-expanded')==='true'")) {await click('header button[aria-expanded]'); await delay(350);}
      await evaluate('document.querySelector('+JSON.stringify(selector)+').scrollIntoView({block:"center",behavior:"instant"})');
      await delay(200);
      await click(selector);
      await until('location.pathname === '+JSON.stringify(path));
      await delay(300);
      if(await evaluate('document.documentElement.lang')!==locale) throw new Error('Locale lost navigating to '+path);
      if(await evaluate('document.title')!==dictionaries[locale].meta.programmeTitle) failures.push('Navigation metadata '+locale+' '+path);
    }
  }
  console.log('PASS: locale retained across programme, axis and commitment navigation in all three languages');
  console.log(JSON.stringify({failures:[...new Set(failures)],browserErrors},null,2));
  if(failures.length||browserErrors.length) throw new Error('Locale regression');
  const screenshot=await command('Page.captureScreenshot',{format:'png'});
  await writeFile(join(outputDir,'language-mobile.png'),Buffer.from(screenshot.data,'base64'));
} finally { socket.close(); chrome.kill(); }
