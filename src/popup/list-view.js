// src/popup/list-view.js

/**
 * Helper to build highlighted HTML for a matched text.
 * @param {string} text
 * @param {number[]} [indices=[]]
 * @returns {DocumentFragment}
 */
export function createHighlightedTextNode(text, indices = []) {
  const fragment = document.createDocumentFragment();
  if (!indices || indices.length === 0) {
    fragment.appendChild(document.createTextNode(text));
    return fragment;
  }

  const indexSet = new Set(indices);
  let currentSpan = null;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const isHighlight = indexSet.has(i);

    if (isHighlight) {
      if (!currentSpan) {
        currentSpan = document.createElement("span");
        currentSpan.className = "item-match-highlight";
      }
      currentSpan.appendChild(document.createTextNode(char));
    } else {
      if (currentSpan) {
        fragment.appendChild(currentSpan);
        currentSpan = null;
      }
      fragment.appendChild(document.createTextNode(char));
    }
  }

  if (currentSpan) {
    fragment.appendChild(currentSpan);
  }

  return fragment;
}

/**
 * Create SVG node without using innerHTML
 * @param {string} tag
 * @param {Record<string, string>} [attrs={}]
 * @returns {SVGElement}
 */
function createSvgElement(tag, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

/**
 * Create clean fallback SVG icon for given provider.
 * @param {string} provider
 * @returns {SVGElement}
 */
export function createFallbackIcon(provider) {
  const svg = createSvgElement("svg", {
    class: "item-icon-fallback",
    viewBox: "0 0 24 24",
    width: "18",
    height: "18",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  });

  if (provider === "search") {
    svg.appendChild(createSvgElement("circle", { cx: "11", cy: "11", r: "8" }));
    svg.appendChild(createSvgElement("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" }));
  } else if (provider === "actions") {
    svg.appendChild(createSvgElement("polygon", { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2" }));
  } else {
    svg.appendChild(createSvgElement("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }));
    svg.appendChild(createSvgElement("line", { x1: "3", y1: "9", x2: "21", y2: "9" }));
  }

  return svg;
}

export class ListView {
  /**
   * @param {HTMLElement} container
   * @param {HTMLElement} listEl
   * @param {HTMLElement} emptyEl
   * @param {(item: import('../core/ranker.js').RankedItem, modifiers: any) => void} onSelect
   */
  constructor(container, listEl, emptyEl, onSelect) {
    this.container = container;
    this.listEl = listEl;
    this.emptyEl = emptyEl;
    this.onSelect = onSelect;

    /** @type {import('../core/ranker.js').RankedItem[]} */
    this.items = [];
    this.selectedIndex = -1;
  }

  /**
   * Render ranked items with optional domain grouping.
   * @param {import('../core/ranker.js').RankedItem[]} items
   * @param {boolean} [groupByDomain=false]
   */
  render(items, groupByDomain = false) {
    this.items = items;
    this.listEl.textContent = "";

    if (items.length === 0) {
      this.emptyEl.style.display = "flex";
      this.selectedIndex = -1;
      return;
    }

    this.emptyEl.style.display = "none";
    const fragment = document.createDocumentFragment();

    let currentGroup = null;

    items.forEach((item, index) => {
      // Group header if domain grouping is active and item is a tab
      if (groupByDomain && item.provider === "tabs") {
        const domain = item.data?.domain || "Other";
        if (domain !== currentGroup) {
          currentGroup = domain;
          const header = document.createElement("li");
          header.className = "group-header";
          header.setAttribute("role", "presentation");
          header.textContent = domain;
          fragment.appendChild(header);
        }
      }

      const li = document.createElement("li");
      li.className = "result-item";
      li.setAttribute("role", "option");
      li.id = `result-${index}`;
      li.setAttribute("data-index", String(index));

      if (item.provider === "search") {
        li.classList.add("search-row");
      }

      // Icon element
      const iconWrapper = document.createElement("div");
      iconWrapper.className = "item-icon-wrapper";

      if (item.favIconUrl) {
        const img = document.createElement("img");
        img.className = "item-favicon";
        img.src = item.favIconUrl;
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        img.onerror = () => {
          img.remove();
          iconWrapper.appendChild(createFallbackIcon(item.provider));
        };
        iconWrapper.appendChild(img);
      } else {
        iconWrapper.appendChild(createFallbackIcon(item.provider));
      }
      li.appendChild(iconWrapper);

      // Content element (title + subtext)
      const content = document.createElement("div");
      content.className = "item-content";

      const titleRow = document.createElement("div");
      titleRow.className = "item-title-row";

      const title = document.createElement("span");
      title.className = "item-title";
      const titleHighlights = item.highlights?.title || [];
      title.appendChild(createHighlightedTextNode(item.title, titleHighlights));
      titleRow.appendChild(title);
      content.appendChild(titleRow);

      if (item.subtext) {
        const subtext = document.createElement("span");
        subtext.className = "item-subtext";
        const subHighlights = item.highlights?.hostname || item.highlights?.url || [];
        subtext.appendChild(createHighlightedTextNode(item.subtext, subHighlights));
        content.appendChild(subtext);
      }
      li.appendChild(content);

      // Badges
      const badges = document.createElement("div");
      badges.className = "item-badges";

      if (item.data?.tab) {
        const tab = item.data.tab;
        if (tab.pinned) {
          const b = document.createElement("span");
          b.className = "badge badge-pinned";
          b.textContent = "Pinned";
          badges.appendChild(b);
        }
        if (tab.audible) {
          const b = document.createElement("span");
          b.className = "badge badge-audible";
          b.textContent = "Audio";
          badges.appendChild(b);
        }
        if (tab.discarded) {
          const b = document.createElement("span");
          b.className = "badge";
          b.textContent = "Sleeping";
          badges.appendChild(b);
        }
        if (!item.isCurrentWindow) {
          const b = document.createElement("span");
          b.className = "badge badge-window";
          b.textContent = `Win ${tab.windowId}`;
          badges.appendChild(b);
        }
      } else if (item.provider === "actions") {
        const b = document.createElement("span");
        b.className = "badge";
        b.textContent = "Action";
        badges.appendChild(b);
      }
      li.appendChild(badges);

      // Click listener
      li.addEventListener("click", (e) => {
        this.selectIndex(index);
        this.onSelect(item, {
          forceSearch: false,
          backgroundTab: e.ctrlKey || e.metaKey
        });
      });

      fragment.appendChild(li);
    });

    this.listEl.appendChild(fragment);

    // Default selection to first item
    this.selectIndex(0);
  }

  /**
   * Select a given item index.
   * @param {number} index
   */
  selectIndex(index) {
    if (this.items.length === 0) {
      this.selectedIndex = -1;
      return;
    }

    const clamped = Math.max(0, Math.min(this.items.length - 1, index));
    if (this.selectedIndex >= 0) {
      const prevEl = this.listEl.querySelector(`.result-item[data-index="${this.selectedIndex}"]`);
      if (prevEl) {
        prevEl.classList.remove("selected");
        prevEl.removeAttribute("aria-selected");
      }
    }

    this.selectedIndex = clamped;
    const currentEl = this.listEl.querySelector(`.result-item[data-index="${this.selectedIndex}"]`);
    if (currentEl) {
      currentEl.classList.add("selected");
      currentEl.setAttribute("aria-selected", "true");
      currentEl.scrollIntoView({ block: "nearest" });

      const input = document.getElementById("search-input");
      if (input) {
        input.setAttribute("aria-activedescendant", currentEl.id);
      }
    }
  }

  moveSelection(delta) {
    if (this.items.length === 0) return;
    this.selectIndex(this.selectedIndex + delta);
  }

  getSelectedItem() {
    if (this.selectedIndex >= 0 && this.selectedIndex < this.items.length) {
      return this.items[this.selectedIndex];
    }
    return null;
  }
}
