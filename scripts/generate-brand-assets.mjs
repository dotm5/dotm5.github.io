import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brandingDir = path.join(root, "public", "branding");
const faviconDir = path.join(root, "public", "favicon");
const launchDir = path.join(root, "src", "content", "posts", "site-launch");
const sandboxImageDir = path.join(
	root,
	"src",
	"content",
	"posts",
	"style-sandbox",
	"images",
);

await Promise.all(
	[brandingDir, faviconDir, launchDir, sandboxImageDir].map((directory) =>
		mkdir(directory, { recursive: true }),
	),
);

const avatarSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#18223b"/>
      <stop offset="1" stop-color="#29365b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#75c7d9"/>
      <stop offset="1" stop-color="#9e8fe6"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="142" fill="none" stroke="#ffffff" stroke-opacity=".16" stroke-width="2"/>
  <circle cx="256" cy="256" r="96" fill="none" stroke="url(#accent)" stroke-width="24"/>
  <path d="M150 300c58-12 86-67 108-148 18 74 48 125 104 150" fill="none" stroke="#d9f5f5" stroke-width="14" stroke-linecap="round"/>
  <circle cx="150" cy="300" r="16" fill="#75c7d9"/>
  <circle cx="362" cy="302" r="16" fill="#9e8fe6"/>
</svg>`;

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="g" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#68c3d5"/>
      <stop offset="1" stop-color="#9385dc"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="56" fill="#19233c"/>
  <circle cx="128" cy="128" r="67" fill="none" stroke="url(#g)" stroke-width="23"/>
  <circle cx="67" cy="156" r="12" fill="#d8f4f5"/>
  <circle cx="189" cy="100" r="12" fill="#d8f4f5"/>
</svg>`;

const bannerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 760">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#edf2f8"/>
      <stop offset=".5" stop-color="#e5ebf4"/>
      <stop offset="1" stop-color="#dfe8ef"/>
    </linearGradient>
    <linearGradient id="line" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#63b8c9"/>
      <stop offset="1" stop-color="#897bd2"/>
    </linearGradient>
    <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
      <path d="M64 0H0V64" fill="none" stroke="#334155" stroke-opacity=".055"/>
    </pattern>
  </defs>
  <rect width="1920" height="760" fill="url(#bg)"/>
  <rect width="1920" height="760" fill="url(#grid)"/>
  <ellipse cx="410" cy="360" rx="270" ry="270" fill="none" stroke="#60739a" stroke-opacity=".18" stroke-width="2"/>
  <ellipse cx="1510" cy="335" rx="330" ry="215" fill="none" stroke="#60739a" stroke-opacity=".16" stroke-width="2"/>
  <path d="M120 540C410 140 680 655 940 320s540 140 860-165" fill="none" stroke="url(#line)" stroke-opacity=".75" stroke-width="7"/>
  <g fill="#f8fbff" stroke="url(#line)" stroke-width="7">
    <circle cx="260" cy="392" r="18"/>
    <circle cx="650" cy="484" r="15"/>
    <circle cx="940" cy="320" r="21"/>
    <circle cx="1322" cy="293" r="16"/>
    <circle cx="1660" cy="222" r="19"/>
  </g>
</svg>`;

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#18213a"/>
      <stop offset=".55" stop-color="#233152"/>
      <stop offset="1" stop-color="#152b38"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#70c9d8"/>
      <stop offset="1" stop-color="#a08ee6"/>
    </linearGradient>
    <pattern id="grid" width="54" height="54" patternUnits="userSpaceOnUse">
      <path d="M54 0H0V54" fill="none" stroke="#fff" stroke-opacity=".045"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" rx="36" fill="url(#bg)"/>
  <rect width="1200" height="630" rx="36" fill="url(#grid)"/>
  <circle cx="955" cy="315" r="190" fill="none" stroke="#fff" stroke-opacity=".1" stroke-width="2"/>
  <circle cx="955" cy="315" r="116" fill="none" stroke="url(#accent)" stroke-width="22"/>
  <path d="M820 390c98-18 126-106 153-217 26 103 70 182 160 208" fill="none" stroke="#d9f5f5" stroke-width="10" stroke-linecap="round"/>
  <circle cx="820" cy="390" r="13" fill="#70c9d8"/>
  <circle cx="1133" cy="381" r="13" fill="#a08ee6"/>
  <text x="86" y="245" fill="#f7fbff" font-family="Microsoft YaHei, Noto Sans SC, sans-serif" font-size="64" font-weight="700">图形与创作笔记</text>
  <text x="90" y="322" fill="#b9c8df" font-family="Inter, Microsoft YaHei, sans-serif" font-size="30">Blender · Rendering · Shader · AI</text>
  <rect x="90" y="374" width="118" height="7" rx="3.5" fill="url(#accent)"/>
</svg>`;

const coverSvg = ogSvg
	.replace(
		'width="1200" height="630" viewBox="0 0 1200 630"',
		'width="1600" height="900" viewBox="0 0 1200 630"',
	)
	.replace("图形与创作笔记</text>", "从这里开始</text>");

const diagramSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <rect width="1200" height="675" rx="32" fill="#172138"/>
  <g stroke="#88a0c8" stroke-opacity=".24" stroke-width="2">
    <path d="M120 160H1080M120 337H1080M120 514H1080"/>
    <path d="M220 90V585M600 90V585M980 90V585"/>
  </g>
  <path d="M190 455C340 190 470 520 610 310S885 180 1020 260" fill="none" stroke="#76c7d7" stroke-width="12" stroke-linecap="round"/>
  <g fill="#f4fbff" stroke="#9388dc" stroke-width="9">
    <circle cx="190" cy="455" r="22"/>
    <circle cx="430" cy="360" r="22"/>
    <circle cx="610" cy="310" r="22"/>
    <circle cx="820" cy="222" r="22"/>
    <circle cx="1020" cy="260" r="22"/>
  </g>
</svg>`;

await Promise.all([
	writeFile(path.join(brandingDir, "avatar.svg"), avatarSvg, "utf8"),
	writeFile(path.join(brandingDir, "banner.svg"), bannerSvg, "utf8"),
	writeFile(path.join(faviconDir, "favicon.svg"), faviconSvg, "utf8"),
	sharp(Buffer.from(ogSvg))
		.png({ compressionLevel: 9 })
		.toFile(path.join(brandingDir, "og-default.png")),
	sharp(Buffer.from(faviconSvg))
		.resize(32, 32)
		.png()
		.toFile(path.join(faviconDir, "favicon-32x32.png")),
	sharp(Buffer.from(faviconSvg))
		.resize(180, 180)
		.png()
		.toFile(path.join(faviconDir, "apple-touch-icon.png")),
	sharp(Buffer.from(coverSvg))
		.resize(1600, 900)
		.webp({ quality: 88 })
		.toFile(path.join(launchDir, "cover.webp")),
	sharp(Buffer.from(diagramSvg))
		.resize(1200, 675)
		.webp({ quality: 86 })
		.toFile(path.join(sandboxImageDir, "diagram.webp")),
]);

console.log("品牌资源与文章占位图已生成。");
