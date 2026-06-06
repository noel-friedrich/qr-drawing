import { createGridView } from "./grid-view.js";
import { createDataControls } from "./data-controls.js";
import {
  encodeData,
  encodeDataErrorCorrection,
  getDataModulePositions,
} from "./data-encoding.js";
import {
  getDataResetModules,
  getErrorCorrectionLevelModules,
  getFormatErrorCorrectionModules,
  getFinderPatternModules,
  getMaskingPatternIndicatorModules,
  getMaskingPatternModules,
  getTimingPatternModules,
  getVersionInformationModules,
} from "./fill-patterns.js";
import { getLegendItems, getOverlayRects, getVersions, getVersionSpec, loadQrSpecification } from "./qr-spec.js";
import { downloadQrPng } from "./png-export.js";
import { createSidebar } from "./sidebar.js";
import { createZoomPan } from "./zoom-pan.js";

const grid = document.getElementById("grid");
const workspace = document.getElementById("workspace");
const zoomIn = document.getElementById("zoom-in");
const zoomOut = document.getElementById("zoom-out");
const resetView = document.getElementById("reset-view");
const openSidebar = document.getElementById("open-sidebar");
const closeSidebar = document.getElementById("close-sidebar");
const addData = document.getElementById("add-data");
const addDataErrorCorrection = document.getElementById("add-data-error-correction");
const clearGrid = document.getElementById("clear-grid");
const downloadPng = document.getElementById("download-png");
const resetData = document.getElementById("reset-data");
const fillErrorCorrection = document.getElementById("fill-error-correction");
const fillFormatErrorCorrection = document.getElementById("fill-format-error-correction");
const fillFinderPatterns = document.getElementById("fill-finder-patterns");
const fillMaskIndicator = document.getElementById("fill-mask-indicator");
const fillMaskPattern = document.getElementById("fill-mask-pattern");
const fillTimingPatterns = document.getElementById("fill-timing-patterns");
const fillVersionInformation = document.getElementById("fill-version-information");
const areaToggle = document.getElementById("area-toggle");
const dataFieldContainer = document.getElementById("data-field-container");
const dataPositionsToggle = document.getElementById("data-positions-toggle");
const dataStatus = document.getElementById("data-status");
const dataTypeSelect = document.getElementById("data-type-select");
const errorCorrectionSelect = document.getElementById("error-correction-select");
const maskPatternSelect = document.getElementById("mask-pattern-select");
const versionSelect = document.getElementById("version-select");
const versionSummary = document.getElementById("version-summary");
const overlayLegend = document.getElementById("overlay-legend");

let currentVersionSpec = null;
let currentEncodedData = null;

const gridView = createGridView(grid);
const dataControls = createDataControls({
  container: dataFieldContainer,
  typeSelect: dataTypeSelect,
});
const zoomPan = createZoomPan({
  grid,
  gridView,
  resetView,
  workspace,
  zoomIn,
  zoomOut,
});
const sidebar = createSidebar({
  closeButton: closeSidebar,
  legendList: overlayLegend,
  openButton: openSidebar,
  summary: versionSummary,
  versionSelect,
});

gridView.setAreasVisible(areaToggle.checked);
overlayLegend.hidden = !areaToggle.checked;

clearGrid.addEventListener("click", () => {
  animateGridOperations([
    {
      type: "set",
      modules: getAllGridModules(false),
    },
  ]);
  currentEncodedData = null;
  setDataStatus("");
});

resetData.addEventListener("click", () => {
  if (currentVersionSpec) {
    animateSetModules(getDataResetModules(currentVersionSpec));
    currentEncodedData = null;
    setDataStatus("Data modules reset.");
  }
});

downloadPng.addEventListener("click", () => {
  const version = currentVersionSpec?.version ?? 1;
  downloadQrPng(gridView.getMatrix(), `qr-code-v${version}.png`);
});

addData.addEventListener("click", () => {
  addCurrentData();
});

addDataErrorCorrection.addEventListener("click", () => {
  if (!currentVersionSpec) {
    return;
  }

  try {
    const shouldAddData = currentEncodedData === null;
    const encodedData = currentEncodedData ?? encodeCurrentData();
    const encodedErrorCorrection = encodeDataErrorCorrection({
      dataBlocks: encodedData.blocks,
      errorCorrectionLevel: errorCorrectionSelect.value,
      versionSpec: currentVersionSpec,
    });

    animateSetModules([
      ...(shouldAddData ? encodedData.modules : []),
      ...encodedErrorCorrection.modules,
      ...encodedErrorCorrection.remainderModules,
    ]);
    currentEncodedData = encodedData;
    setDataStatus(
      `Added ${encodedErrorCorrection.codewords.length} error-correction codewords.`
    );
  } catch (error) {
    setDataStatus(error.message);
  }
});

areaToggle.addEventListener("change", () => {
  gridView.setAreasVisible(areaToggle.checked);
  overlayLegend.hidden = !areaToggle.checked;
});

dataPositionsToggle.addEventListener("change", () => {
  gridView.setDataPositionsVisible(dataPositionsToggle.checked);
});

dataTypeSelect.addEventListener("change", () => {
  currentEncodedData = null;
  setDataStatus("");
});

dataFieldContainer.addEventListener("input", () => {
  currentEncodedData = null;
  setDataStatus("");
});

errorCorrectionSelect.addEventListener("change", () => {
  currentEncodedData = null;
  setDataStatus("");
  updateDataCapacity();
});

fillFinderPatterns.addEventListener("click", () => {
  if (currentVersionSpec) {
    animateSetModules(getFinderPatternModules(currentVersionSpec));
  }
});

fillVersionInformation.addEventListener("click", () => {
  if (currentVersionSpec) {
    animateSetModules(getVersionInformationModules(currentVersionSpec));
  }
});

fillTimingPatterns.addEventListener("click", () => {
  if (currentVersionSpec) {
    animateSetModules(getTimingPatternModules(currentVersionSpec));
  }
});

fillErrorCorrection.addEventListener("click", () => {
  if (currentVersionSpec) {
    animateSetModules(
      getErrorCorrectionLevelModules(
        currentVersionSpec,
        errorCorrectionSelect.value,
        maskPatternSelect.value
      )
    );
  }
});

fillMaskPattern.addEventListener("click", () => {
  if (currentVersionSpec) {
    animateGridOperations([
      {
        type: "invert",
        modules: getMaskingPatternModules(currentVersionSpec, maskPatternSelect.value),
      },
      {
        type: "set",
        modules: getMaskingPatternIndicatorModules(
          currentVersionSpec,
          errorCorrectionSelect.value,
          maskPatternSelect.value
        ),
      },
    ]);
  }
});

fillMaskIndicator.addEventListener("click", () => {
  if (currentVersionSpec) {
    animateSetModules(
      getMaskingPatternIndicatorModules(
        currentVersionSpec,
        errorCorrectionSelect.value,
        maskPatternSelect.value
      )
    );
  }
});

fillFormatErrorCorrection.addEventListener("click", () => {
  if (currentVersionSpec) {
    animateSetModules(
      getFormatErrorCorrectionModules(
        currentVersionSpec,
        errorCorrectionSelect.value,
        maskPatternSelect.value
      )
    );
  }
});

try {
  const specification = await loadQrSpecification();
  const versions = getVersions(specification);

  sidebar.populateVersions(versions);
  sidebar.onVersionChange((version) => {
    applyVersion(specification, version);
  });

  applyVersion(specification, versions[0].version);
} catch (error) {
  sidebar.renderError(error.message);
}

function applyVersion(specification, version) {
  const versionSpec = getVersionSpec(specification, version);
  if (!versionSpec) {
    return;
  }

  currentVersionSpec = versionSpec;
  currentEncodedData = null;
  fillVersionInformation.hidden = versionSpec.version < 7;
  setDataStatus("");
  updateDataCapacity();
  sidebar.setSelectedVersion(version);
  sidebar.renderSummary(versionSpec);
  sidebar.renderLegend(getLegendItems(versionSpec));
  gridView.setGridSize(versionSpec.module_count);
  gridView.setDataPositions(getDataModulePositions(versionSpec));
  gridView.renderOverlays(getOverlayRects(versionSpec));
  zoomPan.fitToView();
}

function addCurrentData() {
  if (!currentVersionSpec) {
    return [];
  }

  const encodedData = encodeCurrentData();

  animateSetModules(encodedData.modules);
  currentEncodedData = encodedData;
  setDataStatus(`Added ${encodedData.codewords.length} padded data codewords.`);

  return currentEncodedData;
}

function encodeCurrentData() {
  const encodedData = encodeData({
    ...dataControls.getData(),
    errorCorrectionLevel: errorCorrectionSelect.value,
    versionSpec: currentVersionSpec,
  });

  if (encodedData.bits.length > encodedData.dataCapacityBits) {
    throw new Error("Data does not fit in the selected version and error-correction level.");
  }

  return encodedData;
}

function setDataStatus(message) {
  dataStatus.textContent = message;
}

function updateDataCapacity() {
  if (!currentVersionSpec) {
    return;
  }

  dataControls.setCapacity({
    errorCorrectionLevel: errorCorrectionSelect.value,
    version: currentVersionSpec.version,
  });
}

function animateSetModules(modules) {
  return animateGridOperations([
    {
      type: "set",
      modules,
    },
  ]);
}

async function animateGridOperations(operations) {
  if (window.matchMedia("(max-width: 767px)").matches) {
    document.body.classList.remove("sidebar-is-open");
    openSidebar.setAttribute("aria-expanded", "false");
  }

  const buttons = [...document.querySelectorAll("button:not(.cell)")];
  const previousDisabledStates = buttons.map((button) => button.disabled);

  buttons.forEach((button) => {
    button.disabled = true;
  });

  try {
    await gridView.animateOperations(operations);
  } finally {
    buttons.forEach((button, index) => {
      button.disabled = previousDisabledStates[index];
    });
  }
}

function getAllGridModules(isBlack) {
  const modules = [];
  const gridSize = gridView.getGridSize();

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      modules.push({ x, y, isBlack });
    }
  }

  return modules;
}
