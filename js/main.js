import { createGridView } from "./grid-view.js";
import { createDataControls } from "./data-controls.js";
import { encodeData, encodeDataErrorCorrection } from "./data-encoding.js";
import {
  getDataResetModules,
  getErrorCorrectionLevelModules,
  getFormatErrorCorrectionModules,
  getFinderPatternModules,
  getMaskingPatternIndicatorModules,
  getMaskingPatternModules,
  getTimingPatternModules,
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
const areaToggle = document.getElementById("area-toggle");
const dataFieldContainer = document.getElementById("data-field-container");
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

clearGrid.addEventListener("click", () => {
  gridView.clearPixels();
  currentEncodedData = null;
  setDataStatus("");
});

resetData.addEventListener("click", () => {
  if (currentVersionSpec) {
    gridView.setModules(getDataResetModules(currentVersionSpec));
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
    const encodedData = currentEncodedData ?? addCurrentData();
    const encodedErrorCorrection = encodeDataErrorCorrection({
      dataBlocks: encodedData.blocks,
      errorCorrectionLevel: errorCorrectionSelect.value,
      versionSpec: currentVersionSpec,
    });

    gridView.setModules(encodedErrorCorrection.modules);
    gridView.setModules(encodedErrorCorrection.remainderModules);
    setDataStatus(
      `Added ${encodedErrorCorrection.codewords.length} error-correction codewords.`
    );
  } catch (error) {
    setDataStatus(error.message);
  }
});

areaToggle.addEventListener("change", () => {
  gridView.setAreasVisible(areaToggle.checked);
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
});

fillFinderPatterns.addEventListener("click", () => {
  if (currentVersionSpec) {
    gridView.setModules(getFinderPatternModules(currentVersionSpec));
  }
});

fillTimingPatterns.addEventListener("click", () => {
  if (currentVersionSpec) {
    gridView.setModules(getTimingPatternModules(currentVersionSpec));
  }
});

fillErrorCorrection.addEventListener("click", () => {
  if (currentVersionSpec) {
    gridView.setModules(
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
    gridView.invertModules(getMaskingPatternModules(currentVersionSpec, maskPatternSelect.value));
    gridView.setModules(
      getMaskingPatternIndicatorModules(
        currentVersionSpec,
        errorCorrectionSelect.value,
        maskPatternSelect.value
      )
    );
  }
});

fillMaskIndicator.addEventListener("click", () => {
  if (currentVersionSpec) {
    gridView.setModules(
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
    gridView.setModules(
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
  setDataStatus("");
  sidebar.setSelectedVersion(version);
  sidebar.renderSummary(versionSpec);
  sidebar.renderLegend(getLegendItems(versionSpec));
  gridView.setGridSize(versionSpec.module_count);
  gridView.renderOverlays(getOverlayRects(versionSpec));
  zoomPan.fitToView();
}

function addCurrentData() {
  if (!currentVersionSpec) {
    return [];
  }

  const encodedData = encodeData({
    ...dataControls.getData(),
    errorCorrectionLevel: errorCorrectionSelect.value,
    versionSpec: currentVersionSpec,
  });

  if (encodedData.bits.length > encodedData.dataCapacityBits) {
    throw new Error("Data does not fit in the selected version and error-correction level.");
  }

  gridView.setModules(encodedData.modules);
  currentEncodedData = encodedData;
  setDataStatus(`Added ${encodedData.codewords.length} padded data codewords.`);

  return currentEncodedData;
}

function setDataStatus(message) {
  dataStatus.textContent = message;
}
