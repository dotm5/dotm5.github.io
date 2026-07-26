import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const brandingDir = path.join(root, "public", "branding");
const faviconDir = path.join(root, "public", "favicon");
const uploadsDir = path.join(root, "public", "uploads");
const sandboxImageDir = path.join(
	root,
	"src",
	"content",
	"posts",
	"style-sandbox",
	"images",
);

await Promise.all(
	[brandingDir, faviconDir, uploadsDir, sandboxImageDir].map((directory) =>
		mkdir(directory, { recursive: true }),
	),
);

const avatarSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="88" fill="#fffaf0"/>
  <circle cx="114" cy="112" r="88" fill="#f5dae3"/>
  <circle cx="414" cy="402" r="112" fill="#ddebda"/>
  <circle cx="398" cy="118" r="62" fill="#d8eef2"/>
  <circle cx="256" cy="256" r="142" fill="none" stroke="#5d4d3b" stroke-opacity=".16" stroke-width="2"/>
  <circle cx="256" cy="256" r="96" fill="none" stroke="#9c4c68" stroke-width="22"/>
  <path d="M150 300c58-12 86-67 108-148 18 74 48 125 104 150" fill="none" stroke="#2f2925" stroke-width="14" stroke-linecap="round"/>
  <circle cx="150" cy="300" r="16" fill="#46644b"/>
  <circle cx="362" cy="302" r="16" fill="#9c4c68"/>
</svg>`;

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="52" fill="#fffaf0"/>
  <circle cx="54" cy="57" r="38" fill="#ddebda"/>
  <circle cx="202" cy="199" r="42" fill="#d8eef2"/>
  <circle cx="128" cy="128" r="67" fill="none" stroke="#9c4c68" stroke-width="23"/>
  <circle cx="67" cy="156" r="12" fill="#46644b"/>
  <circle cx="189" cy="100" r="12" fill="#80612b"/>
</svg>`;

const bannerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 760">
  <defs>
    <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
      <path d="M64 0H0V64" fill="none" stroke="#5d4d3b" stroke-opacity=".055"/>
    </pattern>
  </defs>
  <rect width="1920" height="760" fill="#f4eddc"/>
  <circle cx="180" cy="112" r="310" fill="#f5dae3" fill-opacity=".72"/>
  <circle cx="1730" cy="590" r="350" fill="#ddebda" fill-opacity=".7"/>
  <circle cx="1510" cy="24" r="220" fill="#d8eef2" fill-opacity=".52"/>
  <rect width="1920" height="760" fill="url(#grid)"/>
  <ellipse cx="410" cy="360" rx="270" ry="270" fill="none" stroke="#46644b" stroke-opacity=".24" stroke-width="2"/>
  <ellipse cx="1510" cy="335" rx="330" ry="215" fill="none" stroke="#9c4c68" stroke-opacity=".18" stroke-width="2"/>
  <path d="M120 540C410 140 680 655 940 320s540 140 860-165" fill="none" stroke="#9c4c68" stroke-opacity=".82" stroke-width="7"/>
  <g fill="#fffaf0" stroke-width="7">
    <circle cx="260" cy="392" r="18" stroke="#46644b"/>
    <circle cx="650" cy="484" r="15" stroke="#9c4c68"/>
    <circle cx="940" cy="320" r="21" stroke="#3e646b"/>
    <circle cx="1322" cy="293" r="16" stroke="#80612b"/>
    <circle cx="1660" cy="222" r="19" stroke="#9c4c68"/>
  </g>
</svg>`;

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <pattern id="grid" width="54" height="54" patternUnits="userSpaceOnUse">
      <path d="M54 0H0V54" fill="none" stroke="#5d4d3b" stroke-opacity=".05"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" rx="36" fill="#f4eddc"/>
  <circle cx="1115" cy="80" r="230" fill="#d8eef2"/>
  <circle cx="1040" cy="570" r="220" fill="#ddebda"/>
  <circle cx="80" cy="610" r="185" fill="#f5dae3"/>
  <rect width="1200" height="630" rx="36" fill="url(#grid)"/>
  <circle cx="955" cy="315" r="190" fill="#fffaf0" stroke="#e8b8c8" stroke-width="2"/>
  <circle cx="955" cy="315" r="116" fill="none" stroke="#9c4c68" stroke-width="22"/>
  <path d="M820 390c98-18 126-106 153-217 26 103 70 182 160 208" fill="none" stroke="#2f2925" stroke-width="10" stroke-linecap="round"/>
  <circle cx="820" cy="390" r="13" fill="#46644b"/>
  <circle cx="1133" cy="381" r="13" fill="#80612b"/>
  <text x="86" y="245" fill="#2f2925" font-family="Microsoft YaHei, Noto Sans SC, sans-serif" font-size="64" font-weight="700">图形与创作笔记</text>
  <text x="90" y="322" fill="#6b625a" font-family="Inter, Microsoft YaHei, sans-serif" font-size="30">Blender · Rendering · Shader · AI</text>
  <rect x="90" y="374" width="118" height="7" rx="3.5" fill="#9c4c68"/>
</svg>`;

const coverSvg = ogSvg
	.replace(
		'width="1200" height="630" viewBox="0 0 1200 630"',
		'width="1600" height="900" viewBox="0 0 1200 630"',
	)
	.replace("图形与创作笔记</text>", "从这里开始</text>");

const diagramSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <rect width="1200" height="675" rx="28" fill="#282123"/>
  <circle cx="1080" cy="70" r="190" fill="#2b3f44"/>
  <circle cx="90" cy="610" r="180" fill="#4b303a"/>
  <g stroke="#f4ebdd" stroke-opacity=".14" stroke-width="2">
    <path d="M120 160H1080M120 337H1080M120 514H1080"/>
    <path d="M220 90V585M600 90V585M980 90V585"/>
  </g>
  <path d="M190 455C340 190 470 520 610 310S885 180 1020 260" fill="none" stroke="#f0b8ca" stroke-width="12" stroke-linecap="round"/>
  <g fill="#30272a" stroke-width="9">
    <circle cx="190" cy="455" r="22" stroke="#b9d6b3"/>
    <circle cx="430" cy="360" r="22" stroke="#f0b8ca"/>
    <circle cx="610" cy="310" r="22" stroke="#aad7de"/>
    <circle cx="820" cy="222" r="22" stroke="#e2c87f"/>
    <circle cx="1020" cy="260" r="22" stroke="#f0b8ca"/>
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
		.toFile(path.join(uploadsDir, "site-launch-cover.webp")),
	sharp(Buffer.from(diagramSvg))
		.resize(1200, 675)
		.webp({ quality: 86 })
		.toFile(path.join(sandboxImageDir, "diagram.webp")),
]);

console.log("Spring Folio 品牌资源与文章占位图已生成。");
