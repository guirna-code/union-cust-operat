import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const chromePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3100";
const outputDir = process.env.QA_OUTPUT_DIR ?? join(tmpdir(), "uc-visual-qa");
const profileDir = await mkdtemp(join(tmpdir(), "uc-qa-chrome-"));
const port = 9333;
const axisSlugs = [
  "economie", "tashghil-chabab", "taalim-takwin", "sante", "adala-ijtimaiya",
  "tanmia-majaliya", "raqmana-ibtikar", "bia-tanmia-moustadama", "hakama-idara", "thaqafa-riyada",
];
const commitmentSlugs = ["productive-economy", "social-equity", "regional-justice", "trust-and-influence"];

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

try {
  await command("Page.enable");
  await command("Runtime.enable");
  await command("Log.enable");
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const ready = await command("Runtime.evaluate", {
      expression: `document.documentElement.dataset.locale ?? ''`,
      returnByValue: true,
    });
    if (ready.result.value) break;
    await delay(250);
  }
  if (!process.env.QA_DETAILS_ONLY) {
  for (const locale of ["ar", "fr", "en", "ar"]) {
    await command("Runtime.evaluate", {
      expression: `document.querySelector('button[lang=${JSON.stringify(locale)}]')?.click()`,
    });
    await delay(400);
    await command("Page.reload");
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const restored = await command("Runtime.evaluate", {
        expression: `document.readyState === 'complete' && document.documentElement.dataset.locale === ${JSON.stringify(locale)}`,
        returnByValue: true,
      });
      if (restored.result.value) break;
      await delay(250);
    }
    const persisted = await command("Runtime.evaluate", {
      expression: `JSON.stringify({
        lang: document.documentElement.lang,
        dir: document.documentElement.dir,
        stored: localStorage.getItem('uc-locale'),
        active: document.querySelector('button[aria-pressed=true]')?.getAttribute('lang'),
        labels: [...document.querySelectorAll('[role=group] button')].map((button) => button.textContent.trim())
      })`,
      returnByValue: true,
    });
    const persistedState = JSON.parse(persisted.result.value);
    if (
      persistedState.lang !== locale ||
      persistedState.dir !== (locale === "ar" ? "rtl" : "ltr") ||
      persistedState.stored !== locale ||
      persistedState.active !== locale ||
      JSON.stringify([...new Set(persistedState.labels)]) !== JSON.stringify(["العربية", "FR", "EN"])
    ) {
      throw new Error(`Language did not persist correctly for ${locale}: ${persisted.result.value}`);
    }

    for (const [name, path] of [["home", "/"], ["programme", "/programme-electoral"]]) {
      await command("Page.navigate", { url: `${baseUrl}${path}` });
      await delay(1400);
      const state = await command("Runtime.evaluate", {
        expression: `JSON.stringify({ lang: document.documentElement.lang, dir: document.documentElement.dir, title: document.title, text: document.body.innerText })`,
        returnByValue: true,
      });
      const parsed = JSON.parse(state.result.value);
      if (parsed.lang !== locale || parsed.dir !== (locale === "ar" ? "rtl" : "ltr")) {
        throw new Error(`Incorrect document locale for ${locale}/${name}: ${state.result.value}`);
      }
      if (name === "programme" && (!parsed.text.includes(locale === "ar" ? "عشرة محاور" : locale === "fr" ? "Dix axes" : "Ten Axes"))) {
        throw new Error(`Missing localized ten-axis heading for ${locale}.`);
      }
      const expectedFooter = locale === "ar" ? "روابط سريعة" : locale === "fr" ? "Liens rapides" : "Quick Links";
      if (!parsed.text.includes(expectedFooter)) {
        throw new Error(`Footer did not localize for ${locale}.`);
      }
      if (name === "programme") {
        await command("Runtime.evaluate", {
          expression: `document.querySelector('#commitments')?.scrollIntoView({ block: 'center' })`,
        });
        await delay(800);
        const sections = await command("Runtime.evaluate", {
          expression: `JSON.stringify({
            commitments: document.querySelectorAll('#commitments h3').length,
            visibleCommitments: [...document.querySelectorAll('#commitments h3')].filter((node) => getComputedStyle(node.closest('[style]') ?? node).opacity !== '0').length,
            axes: document.querySelectorAll('#categories h3').length
          })`,
          returnByValue: true,
        });
        const sectionState = JSON.parse(sections.result.value);
        if (sectionState.commitments !== 4 || sectionState.visibleCommitments !== 4 || sectionState.axes !== 10) {
          throw new Error(`Incorrect or hidden program sections for ${locale}: ${sections.result.value}`);
        }
        await command("Runtime.evaluate", {
          expression: `document.querySelector('div.fixed.bottom-5 > button')?.click()`,
        });
        await delay(300);
        const chatbot = await command("Runtime.evaluate", {
          expression: `JSON.stringify({
            open: Boolean(document.querySelector('[role=dialog]')),
            languageText: document.querySelector('[role=dialog]')?.innerText ?? ''
          })`,
          returnByValue: true,
        });
        const chatbotState = JSON.parse(chatbot.result.value);
        const expectedChatTitle = locale === "ar" ? "المساعد الذكي" : locale === "fr" ? "Assistant Intelligent" : "Intelligent Assistant";
        if (!chatbotState.open || !chatbotState.languageText.includes(expectedChatTitle)) {
          throw new Error(`Chatbot did not localize for ${locale}: ${chatbot.result.value}`);
        }
        await command("Runtime.evaluate", {
          expression: `document.querySelector('div.fixed.bottom-5 > button')?.click()`,
        });
      }
      const screenshot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      await writeFile(join(outputDir, `${locale}-${name}.png`), Buffer.from(screenshot.data, "base64"));
      if (name === "programme") {
        await command("Runtime.evaluate", {
          expression: `document.querySelector('#categories')?.scrollIntoView({ block: 'start' })`,
        });
        await delay(300);
        const axisVisibility = await command("Runtime.evaluate", {
          expression: `[...document.querySelectorAll('#categories h3')].filter((node) => getComputedStyle(node.closest('[style]') ?? node).opacity !== '0').length`,
          returnByValue: true,
        });
        if (axisVisibility.result.value !== 10) {
          throw new Error(`Hidden program axes for ${locale}: ${axisVisibility.result.value}/10 visible`);
        }
        const axesScreenshot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
        await writeFile(join(outputDir, `${locale}-axes.png`), Buffer.from(axesScreenshot.data, "base64"));
        await command("Emulation.setDeviceMetricsOverride", {
          width: 390,
          height: 844,
          deviceScaleFactor: 1,
          mobile: true,
        });
        await command("Runtime.evaluate", {
          expression: `document.querySelector('#categories')?.scrollIntoView({ block: 'start' })`,
        });
        await delay(300);
        const mobileScreenshot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
        await writeFile(join(outputDir, `${locale}-${name}-mobile.png`), Buffer.from(mobileScreenshot.data, "base64"));
        await command("Emulation.clearDeviceMetricsOverride");
      }
    }
  }
  }

  for (const [kind, slugs] of [["axis", axisSlugs], ["commitment", commitmentSlugs]]) {
    for (const slug of slugs) {
      await command("Page.navigate", { url: `${baseUrl}/programme-electoral` });
      await delay(500);
      const selector = kind === "axis" ? `#axis-${slug} a` : `#commitment-${slug} a`;
      const source = await command("Runtime.evaluate", {
        expression: `JSON.stringify({
          title: document.querySelector(${JSON.stringify(selector)})?.closest('[id]')?.querySelector('h3')?.textContent.trim(),
          clicked: Boolean(document.querySelector(${JSON.stringify(selector)}))
        })`,
        returnByValue: true,
      });
      const sourceState = JSON.parse(source.result.value);
      if (!sourceState.clicked) throw new Error(`Missing detail link for ${kind} ${slug}.`);
      await command("Runtime.evaluate", { expression: `document.querySelector(${JSON.stringify(selector)}).click()` });
      const expectedPath = kind === "axis" ? `/programme-electoral/axes/${slug}` : `/programme-electoral/engagements/${slug}`;
      for (let attempt = 0; attempt < 40; attempt += 1) {
        const destinationReady = await command("Runtime.evaluate", {
          expression: `location.pathname === ${JSON.stringify(expectedPath)} && Boolean(document.querySelector('main article h1'))`,
          returnByValue: true,
        });
        if (destinationReady.result.value) break;
        await delay(200);
      }
      const destination = await command("Runtime.evaluate", {
        expression: `JSON.stringify({
          path: location.pathname,
          title: document.querySelector('main article h1')?.textContent.trim(),
          points: document.querySelectorAll('main article li').length,
          back: document.querySelector('main article a')?.getAttribute('href')
        })`,
        returnByValue: true,
      });
      const destinationState = JSON.parse(destination.result.value);
      if (
        destinationState.path !== expectedPath ||
        destinationState.title !== sourceState.title ||
        destinationState.points === 0 ||
        !destinationState.back?.includes(slug)
      ) {
        throw new Error(`Incorrect detail destination for ${kind} ${slug}: ${destination.result.value}`);
      }
      if (kind === "commitment" && slug === commitmentSlugs[0]) {
        const commitmentScreenshot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
        await writeFile(join(outputDir, "ar-commitment-1-detail.png"), Buffer.from(commitmentScreenshot.data, "base64"));
      }
    }
  }

  await command("Page.navigate", { url: `${baseUrl}/programme-electoral/axes/taalim-takwin` });
  await delay(600);
  const translatedAxisTitles = {
    fr: "Réforme de l'éducation, de l'université et recherche scientifique",
    en: "Education Reform, University & Scientific Research",
    ar: "إصلاح التعليم والجامعة والبحث العلمي",
  };
  for (const locale of ["fr", "en", "ar"]) {
    await command("Runtime.evaluate", { expression: `document.querySelector('button[lang=${JSON.stringify(locale)}]')?.click()` });
    await delay(350);
    const detailLocale = await command("Runtime.evaluate", {
      expression: `JSON.stringify({
        lang: document.documentElement.lang,
        dir: document.documentElement.dir,
        title: document.querySelector('main article h1')?.textContent.trim(),
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        scrollX: window.scrollX
      })`,
      returnByValue: true,
    });
    const detailLocaleState = JSON.parse(detailLocale.result.value);
    if (
      detailLocaleState.lang !== locale ||
      detailLocaleState.dir !== (locale === "ar" ? "rtl" : "ltr") ||
      detailLocaleState.title !== translatedAxisTitles[locale] ||
      detailLocaleState.scrollWidth > detailLocaleState.innerWidth
    ) {
      throw new Error(`Detail page did not localize for ${locale}: ${detailLocale.result.value}`);
    }
    const detailScreenshot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(join(outputDir, `${locale}-axis-3-detail.png`), Buffer.from(detailScreenshot.data, "base64"));
    await command("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await delay(200);
    const mobileWidth = await command("Runtime.evaluate", {
      expression: `JSON.stringify({ innerWidth: window.innerWidth, scrollWidth: document.documentElement.scrollWidth })`,
      returnByValue: true,
    });
    const mobileWidthState = JSON.parse(mobileWidth.result.value);
    if (mobileWidthState.scrollWidth > mobileWidthState.innerWidth) {
      throw new Error(`Mobile detail overflow for ${locale}: ${mobileWidth.result.value}`);
    }
    const mobileDetailScreenshot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(join(outputDir, `${locale}-axis-3-detail-mobile.png`), Buffer.from(mobileDetailScreenshot.data, "base64"));
    await command("Emulation.clearDeviceMetricsOverride");
  }
  if (browserErrors.length > 0) {
    throw new Error(`Browser console errors:\n${browserErrors.join("\n")}`);
  }
  console.log(outputDir);
} finally {
  socket.close();
  chrome.kill();
  await new Promise((resolve) => chrome.once("exit", resolve));
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
