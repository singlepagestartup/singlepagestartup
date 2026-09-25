(() => {
  function toggleTarget(button) {
    const selector = button.getAttribute("data-ds-target");
    if (!selector) {
      return;
    }

    const target = document.querySelector(selector);
    if (!target) {
      return;
    }

    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    target.toggleAttribute("hidden", expanded);
  }

  function activateTab(tab) {
    const group = tab.closest("[data-ds-tabs]");
    const panelId = tab.getAttribute("aria-controls");
    if (!group || !panelId) {
      return;
    }

    group.querySelectorAll("[role='tab']").forEach((item) => {
      item.setAttribute("aria-selected", String(item === tab));
      item.tabIndex = item === tab ? 0 : -1;
    });

    group.querySelectorAll("[role='tabpanel']").forEach((panel) => {
      panel.toggleAttribute("hidden", panel.id !== panelId);
    });
  }

  document.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-ds-toggle]");
    if (toggle) {
      toggleTarget(toggle);
      return;
    }

    const tab = event.target.closest("[data-ds-tabs] [role='tab']");
    if (tab) {
      activateTab(tab);
    }
  });
})();
