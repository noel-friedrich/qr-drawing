export function createSidebar({
  closeButton,
  legendList,
  openButton,
  summary,
  versionSelect,
}) {
  function setOpen(isOpen) {
    document.body.classList.toggle("sidebar-is-open", isOpen);
    openButton.setAttribute("aria-expanded", String(isOpen));
  }

  openButton.addEventListener("click", () => {
    setOpen(true);
  });

  closeButton.addEventListener("click", () => {
    setOpen(false);
  });

  function populateVersions(versions) {
    versionSelect.replaceChildren();

    for (const version of versions) {
      const option = document.createElement("option");
      option.value = String(version.version);
      option.textContent = `Version ${version.version} (${version.moduleCount} x ${version.moduleCount})`;
      versionSelect.appendChild(option);
    }
  }

  function onVersionChange(callback) {
    versionSelect.addEventListener("change", () => {
      callback(Number(versionSelect.value));
    });
  }

  function setSelectedVersion(version) {
    versionSelect.value = String(version);
  }

  function renderSummary(versionSpec) {
    summary.textContent = `Version ${versionSpec.version}, ${versionSpec.module_count} x ${versionSpec.module_count} modules.`;
  }

  function renderLegend(items) {
    legendList.replaceChildren();

    for (const item of items) {
      const listItem = document.createElement("li");
      listItem.className = "legend-item";

      const swatch = document.createElement("span");
      swatch.className = "legend-swatch";
      swatch.style.backgroundColor = item.color;

      const label = document.createElement("span");
      label.textContent = item.label;

      listItem.append(swatch, label);
      legendList.appendChild(listItem);
    }
  }

  function renderError(message) {
    summary.textContent = message;
    versionSelect.disabled = true;
    legendList.replaceChildren();
  }

  return {
    onVersionChange,
    populateVersions,
    renderError,
    renderLegend,
    renderSummary,
    setSelectedVersion,
  };
}
