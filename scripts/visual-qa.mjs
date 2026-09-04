import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const chromePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3100";
const outputDir = process.env.QA_OUTPUT_DIR ?? join(tmpdir(), "uc-visual-qa");
const profileDir = await mkdtemp(join(tmpdir(), "uc-qa-chrome-"));
const port = 9333;

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
socket.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
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
  for (const locale of ["ar", "fr", "en", "ar"]) {
    await command("Runtime.evaluate", {
      expression: `document.querySelector('button[lang=${JSON.stringify(locale)}]')?.click()`,
    });
    await delay(400);

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
  console.log(outputDir);
} finally {
  socket.close();
  chrome.kill();
  await new Promise((resolve) => chrome.once("exit", resolve));
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
