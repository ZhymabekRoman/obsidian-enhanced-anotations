document.addEventListener("DOMContentLoaded", () => {
	const containers = document.querySelectorAll(".annotation-container");

	containers.forEach((container) => {
		const annotations = container.getAttribute("data-annotations");
		if (!annotations) return;

		// Create popovers container
		const popoversContainer = document.createElement("div");
		popoversContainer.className = "popovers-container";

		// Create individual popovers (deduplicate references)
		const uniqueAnnotations = [...new Set(annotations.split("|"))];
		uniqueAnnotations.forEach((annotation) => {
			const popover = document.createElement("div");
			popover.className = "popover";

			if (annotation.startsWith("#")) {
				const popoverId = annotation.substring(1);
				const externalPopover = document.getElementById(popoverId);
				if (externalPopover) {
					// Clone the content instead of the entire element
					const content =
						externalPopover.innerHTML || externalPopover.textContent;
					popover.innerHTML = content;
				} else {
					console.warn(`Reference not found: ${popoverId}`);
					popover.textContent = annotation; // Show original annotation text instead of error
				}
			} else {
				popover.textContent = annotation;
			}

			popoversContainer.appendChild(popover);
		});

		// Remove any existing popovers container
		const existingContainer = container.querySelector(".popovers-container");
		if (existingContainer) {
			existingContainer.remove();
		}

		container.appendChild(popoversContainer);

		// Add visual indicator
		container.style.borderBottom = "1px dotted #999";
	});

	// Handle click events for mobile devices
	containers.forEach((container) => {
		container.addEventListener("click", (e) => {
			// Close all other popovers
			document.querySelectorAll(".annotation-container").forEach((c) => {
				if (c !== container) {
					c.classList.remove("active");
				}
			});

			container.classList.toggle("active");
			e.stopPropagation();
		});
	});

	// Close popovers when clicking outside
	document.addEventListener("click", () => {
		document.querySelectorAll(".annotation-container").forEach((c) => {
			c.classList.remove("active");
		});
	});

	// Handle theme changes
	const observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			if (mutation.attributeName === "data-md-color-scheme") {
				updatePopoversPosition();
			}
		});
	});

	// Start observing theme changes
	const htmlElement = document.documentElement;
	observer.observe(htmlElement, {
		attributes: true,
		attributeFilter: ["data-md-color-scheme"],
	});

	function updatePopoversPosition() {
		document.querySelectorAll(".annotation-container").forEach((container) => {
			const popover = container.querySelector(".popover, .popovers-container");
			if (!popover) return;

			// Check if popover would go off screen
			const rect = popover.getBoundingClientRect();
			const viewportHeight = window.innerHeight;

			if (rect.bottom > viewportHeight) {
				popover.classList.add("above");
			} else {
				popover.classList.remove("above");
			}
		});
	}

	// Initial position update
	updatePopoversPosition();

	// Update positions on scroll and resize
	window.addEventListener("scroll", updatePopoversPosition);
	window.addEventListener("resize", updatePopoversPosition);
});
