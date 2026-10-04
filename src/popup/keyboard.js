// src/popup/keyboard.js

/**
 * Setup keyboard navigation for the Spotlight popup.
 * @param {HTMLInputElement} inputEl
 * @param {import('./list-view.js').ListView} listView
 * @param {(item: import('../core/ranker.js').RankedItem, modifiers: any) => void} onExecute
 * @param {() => void} onClose
 */
export function setupKeyboardNav(inputEl, listView, onExecute, onClose) {
  inputEl.addEventListener("keydown", (event) => {
    // Arrow Down or Ctrl+N
    if (event.key === "ArrowDown" || (event.ctrlKey && event.key === "n")) {
      event.preventDefault();
      listView.moveSelection(1);
      return;
    }

    // Arrow Up or Ctrl+P
    if (event.key === "ArrowUp" || (event.ctrlKey && event.key === "p")) {
      event.preventDefault();
      listView.moveSelection(-1);
      return;
    }

    // Page Down
    if (event.key === "PageDown") {
      event.preventDefault();
      listView.moveSelection(5);
      return;
    }

    // Page Up
    if (event.key === "PageUp") {
      event.preventDefault();
      listView.moveSelection(-5);
      return;
    }

    // Enter
    if (event.key === "Enter") {
      event.preventDefault();
      const selected = listView.getSelectedItem();
      const forceSearch = event.shiftKey;
      const backgroundTab = event.ctrlKey || event.metaKey;

      if (selected) {
        onExecute(selected, { forceSearch, backgroundTab });
      } else if (inputEl.value.trim()) {
        // Fallback search
        onExecute(
          {
            id: "fallback-search",
            provider: "search",
            title: inputEl.value.trim(),
            rawScore: 1,
            finalScore: 1,
            data: { query: inputEl.value.trim() }
          },
          { forceSearch: true, backgroundTab }
        );
      }
      return;
    }

    // Escape
    if (event.key === "Escape") {
      event.preventDefault();
      if (inputEl.value.length > 0) {
        inputEl.value = "";
        inputEl.dispatchEvent(new Event("input"));
      } else {
        onClose();
      }
      return;
    }

    // Tab autocomplete
    if (event.key === "Tab") {
      const selected = listView.getSelectedItem();
      if (selected && selected.provider === "actions") {
        event.preventDefault();
        inputEl.value = `@${selected.id} `;
        inputEl.dispatchEvent(new Event("input"));
      }
    }
  });
}
