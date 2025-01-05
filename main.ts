import { Plugin, MarkdownView } from "obsidian";

interface AnnotationPluginSettings {
	defaultColor: string;
}

const DEFAULT_SETTINGS: AnnotationPluginSettings = {
	defaultColor: "hsla(60, 75%, 90%, 0.5)",
};

export default class AnnotationPlugin extends Plugin {
	settings: AnnotationPluginSettings;
	externalPopovers: Map<string, HTMLElement>;

	async onload() {
		this.externalPopovers = new Map();
		await this.loadSettings();

		this.registerMarkdownPostProcessor((element, context) => {
			const popoverDefs = element.querySelectorAll('[id^="pop-"]');
			popoverDefs.forEach((def) => {
				const id = def.id;
				this.externalPopovers.set(id, def.cloneNode(true) as HTMLElement);
				def.remove();
			});

			const walker = document.createTreeWalker(
				element,
				NodeFilter.SHOW_TEXT,
				null,
			);

			const nodesToProcess: Text[] = [];
			while (walker.nextNode()) {
				nodesToProcess.push(walker.currentNode as Text);
			}

			nodesToProcess.forEach((node) => {
				const text = node.textContent || "";
				const regex = /\[\[(.*?)\]\{(.*?)\}\]/g;
				let match;
				let lastIndex = 0;
				const fragments = [];

				while ((match = regex.exec(text)) !== null) {
					if (match.index > lastIndex) {
						fragments.push(
							document.createTextNode(text.slice(lastIndex, match.index)),
						);
					}

					const [highlightedText, annotations] = [match[1], match[2]];
					const container = this.createAnnotationContainer(
						highlightedText,
						annotations.split("|"),
					);
					fragments.push(container);

					lastIndex = regex.lastIndex;
				}

				if (lastIndex < text.length) {
					fragments.push(document.createTextNode(text.slice(lastIndex)));
				}

				if (fragments.length > 0) {
					const parent = node.parentNode;
					fragments.forEach((fragment) => {
						parent?.insertBefore(fragment, node);
					});
					parent?.removeChild(node);
				}
			});

			const annotations = element.querySelectorAll(".annotation");
			annotations.forEach((annotation) => {
				const container = this.createAnnotationContainer(
					annotation.textContent || "",
					[annotation.getAttribute("data-annotation") || ""],
				);
				annotation.replaceWith(container);
			});
		});
	}

	private getRandomPastelColor(): string {
		const hue = Math.random() * 360;
		const saturation = 75 + Math.random() * 15;
		const lightness = 80 + Math.random() * 10;
		const alpha = 0.3;
		return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
	}

	private convertLinksToAnchors(text: string): string {
		const urlRegex = /(https?:\/\/[^\s]+)/g;
		return text.replace(
			urlRegex,
			(url) =>
				`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
		);
	}

	private createAnnotationContainer(
		text: string,
		annotations: string[],
	): HTMLElement {
		const container = document.createElement("span");
		container.className = "annotation-container";
		container.style.backgroundColor =
			annotations.length > 1
				? this.getRandomPastelColor()
				: this.settings.defaultColor;
		container.textContent = text;

		const popoversContainer = document.createElement("div");
		popoversContainer.className = "popovers-container";
		popoversContainer.style.display = "none";

		annotations.forEach((annotation) => {
			const popover = document.createElement("div");
			popover.className = "popover";

			if (annotation.startsWith("#")) {
				const popoverId = annotation.substring(1);
				const externalPopover =
					this.externalPopovers.get(popoverId) ||
					document.getElementById(popoverId);
				if (externalPopover) {
					popover.innerHTML = this.convertLinksToAnchors(
						externalPopover.innerHTML,
					);
				} else {
					popover.innerHTML = this.convertLinksToAnchors(annotation);
				}
			} else {
				popover.innerHTML = this.convertLinksToAnchors(annotation);
			}

			popoversContainer.appendChild(popover);
		});

		container.addEventListener("click", (e) => {
			e.stopPropagation();
			const isOpen = popoversContainer.style.display === "block";

			document.querySelectorAll(".popovers-container").forEach((el) => {
				(el as HTMLElement).style.display = "none";
			});

			popoversContainer.style.display = isOpen ? "none" : "block";
		});

		document.addEventListener("click", () => {
			popoversContainer.style.display = "none";
		});

		container.appendChild(popoversContainer);
		return container;
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
