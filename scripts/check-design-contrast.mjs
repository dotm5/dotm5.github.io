const palettes = {
	light: {
		"paper-canvas": "#f4eddc",
		"paper-surface": "#fffaf0",
		"ink-strong": "#2f2925",
		ink: "#4a423a",
		"ink-muted": "#6b625a",
		"rose-wash": "#f5dae3",
		"rose-ink": "#994862",
		"leaf-wash": "#ddebda",
		"leaf-ink": "#46644b",
		"sky-wash": "#d8eef2",
		"sky-ink": "#3e646b",
		"sun-wash": "#f3e4b5",
		"sun-ink": "#80612b",
		"danger-wash": "#f1d1cc",
		"danger-ink": "#8c4945",
		"accent-solid": "#9c4c68",
		"accent-on-solid": "#fffaf0",
	},
	dark: {
		"paper-canvas": "#1e191a",
		"paper-surface": "#282123",
		"ink-strong": "#f4ebdd",
		ink: "#ded3c7",
		"ink-muted": "#b9aca2",
		"rose-wash": "#4b303a",
		"rose-ink": "#f0b8ca",
		"leaf-wash": "#304035",
		"leaf-ink": "#b9d6b3",
		"sky-wash": "#2b3f44",
		"sky-ink": "#aad7de",
		"sun-wash": "#443a27",
		"sun-ink": "#e2c87f",
		"danger-wash": "#49302f",
		"danger-ink": "#e3aaa4",
		"accent-solid": "#d99aae",
		"accent-on-solid": "#21191c",
	},
};

const checks = [
	["ink-strong", "paper-canvas", 7],
	["ink", "paper-surface", 7],
	["ink-muted", "paper-surface", 4.5],
	["rose-ink", "rose-wash", 4.5],
	["leaf-ink", "leaf-wash", 4.5],
	["sky-ink", "sky-wash", 4.5],
	["sun-ink", "sun-wash", 4.5],
	["danger-ink", "danger-wash", 4.5],
	["accent-on-solid", "accent-solid", 4.5],
];

function channelToLinear(channel) {
	const normalized = channel / 255;
	return normalized <= 0.04045
		? normalized / 12.92
		: ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
	const channels = hex
		.slice(1)
		.match(/.{2}/gu)
		.map((channel) => channelToLinear(Number.parseInt(channel, 16)));
	return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first, second) {
	const light = Math.max(luminance(first), luminance(second));
	const dark = Math.min(luminance(first), luminance(second));
	return (light + 0.05) / (dark + 0.05);
}

let failed = false;

for (const [mode, palette] of Object.entries(palettes)) {
	console.log(`\n${mode.toUpperCase()}`);
	for (const [foreground, background, minimum] of checks) {
		const ratio = contrast(palette[foreground], palette[background]);
		const passed = ratio >= minimum;
		failed ||= !passed;
		console.log(
			`${passed ? "PASS" : "FAIL"} ${foreground}/${background}: ${ratio.toFixed(2)}:1 (min ${minimum}:1)`,
		);
	}
}

if (failed) {
	console.error("\nSpring Folio contrast check failed.");
	process.exitCode = 1;
} else {
	console.log("\nSpring Folio contrast check passed.");
}
