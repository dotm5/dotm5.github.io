// biome-ignore format: playwright-cli requires a bare function without a trailing semicolon.
async (page) => {
	const base = "http://127.0.0.1:4321";
	const consoleProblems = [];
	const pageErrors = [];
	page.on("console", (message) => {
		if (["error", "warning"].includes(message.type())) {
			consoleProblems.push(`${message.type()}: ${message.text()}`);
		}
	});
	page.on("pageerror", (error) =>
		pageErrors.push(error.stack || error.message),
	);

	async function inspect(path, width, height, screenshot) {
		await page.setViewportSize({ width, height });
		const response = await page.goto(`${base}${path}`, {
			waitUntil: "networkidle",
		});
		await page.waitForTimeout(250);
		const metrics = await page.evaluate(() => ({
			title: document.title,
			scrollWidth: document.documentElement.scrollWidth,
			clientWidth: document.documentElement.clientWidth,
			emptyImageSources: [...document.images].filter(
				(image) => !image.getAttribute("src"),
			).length,
			brokenImages: [...document.images].filter(
				(image) => !image.complete || image.naturalWidth === 0,
			).length,
		}));
		await page.screenshot({ path: screenshot, fullPage: true });
		return {
			status: response?.status(),
			...metrics,
			overflow: metrics.scrollWidth > metrics.clientWidth,
		};
	}

	const home = await inspect(
		"/",
		1440,
		900,
		"artifacts/qa/home-final-1440x900.png",
	);
	const externalResources = await page.evaluate(() =>
		[...performance.getEntriesByType("resource")]
			.map((entry) => entry.name)
			.filter((name) => new URL(name).origin !== location.origin),
	);

	await page.evaluate(() => localStorage.clear());
	await page.reload({ waitUntil: "networkidle" });
	await page.getByRole("menuitem", { name: "Light/Dark Mode" }).click();
	const firstTheme = await page.evaluate(() => ({
		stored: localStorage.getItem("theme"),
		darkClass: document.documentElement.classList.contains("dark"),
	}));
	await page.getByRole("menuitem", { name: "Light/Dark Mode" }).click();
	const secondTheme = await page.evaluate(() => ({
		stored: localStorage.getItem("theme"),
		darkClass: document.documentElement.classList.contains("dark"),
	}));

	await page.waitForFunction(
		() => typeof window.pagefind?.search === "function",
	);
	await page.getByRole("textbox", { name: "搜索" }).fill("Blender");
	await page.waitForFunction(
		() => document.querySelectorAll("#search-panel a").length > 0,
	);
	const search = await page.evaluate(() => ({
		results: document.querySelectorAll("#search-panel a").length,
		panelOpen: !document
			.querySelector("#search-panel")
			?.classList.contains("float-panel-closed"),
		firstTitle:
			document
				.querySelector("#search-panel a")
				?.textContent?.trim()
				.replace(/\s+/g, " ") ?? null,
	}));

	const mobileHome = await inspect(
		"/",
		390,
		844,
		"artifacts/qa/home-final-390x844.png",
	);
	await page.getByRole("button", { name: "打开导航菜单" }).click();
	const mobileMenu = await page.evaluate(() => ({
		open: !document
			.querySelector("#nav-menu-panel")
			?.classList.contains("float-panel-closed"),
		links: [...document.querySelectorAll("#nav-menu-panel a")]
			.map((link) => link.textContent?.trim())
			.filter(Boolean),
	}));
	await page.screenshot({
		path: "artifacts/qa/mobile-menu-final-390x844.png",
		fullPage: true,
	});

	const projects = await inspect(
		"/projects/",
		390,
		844,
		"artifacts/qa/projects-final-390x844.png",
	);
	const projectCards = await page.locator("main article").count();
	const article = await inspect(
		"/posts/site-launch/",
		768,
		1024,
		"artifacts/qa/article-final-768x1024.png",
	);

	const endpointPaths = [
		"/",
		"/archive/",
		"/about/",
		"/projects/",
		"/posts/site-launch/",
		"/rss.xml",
		"/robots.txt",
		"/sitemap-index.xml",
		"/pagefind/pagefind.js",
	];
	const endpointStatuses = {};
	for (const path of endpointPaths) {
		const response = await page.request.get(`${base}${path}`);
		endpointStatuses[path] = response.status();
	}
	const missingResponse = await page.request.get(`${base}/does-not-exist/`);
	const missingBody = await missingResponse.text();

	return {
		home,
		mobileHome,
		projects,
		article,
		projectCards,
		mobileMenu,
		search,
		theme: { firstTheme, secondTheme },
		externalResources,
		endpointStatuses,
		notFound: {
			status: missingResponse.status(),
			customCopy: missingBody.includes("这里暂时没有内容"),
		},
		consoleProblems,
		pageErrors,
	};
}
