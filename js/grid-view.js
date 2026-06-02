import { baseCellSize, overlayPalette } from "./config.js";

export function createGridView(grid) {
  const overlayLayer = document.createElement("div");
  overlayLayer.className = "overlay-layer";

  let gridSize = 0;
  let cellSize = baseCellSize;
  let overlays = [];
  let clickSuppressedUntil = 0;
  let cells = [];
  let areasVisible = true;

  function createCell(index) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cell";
    cell.dataset.value = "light";
    cell.setAttribute("aria-label", `Pixel ${index + 1}`);
    cell.addEventListener("click", () => {
      setCellValue(cell, cell.dataset.value !== "dark");
    });
    return cell;
  }

  grid.addEventListener(
    "click",
    (event) => {
      if (Date.now() >= clickSuppressedUntil) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true,
  );

  function setGridSize(nextGridSize) {
    gridSize = nextGridSize;
    overlays = [];
    cells = [];
    grid.replaceChildren();

    for (let index = 0; index < gridSize * gridSize; index += 1) {
      const cell = createCell(index);
      cells.push(cell);
      grid.appendChild(cell);
    }

    grid.appendChild(overlayLayer);
    grid.setAttribute("aria-label", `${gridSize} by ${gridSize} pixel grid`);
    setCellSize(cellSize);
  }

  function setCellSize(nextCellSize) {
    cellSize = nextCellSize;
    const cellSizeCss = `${cellSize}px`;

    grid.style.gridTemplateColumns = `repeat(${gridSize}, ${cellSizeCss})`;
    grid.style.gridTemplateRows = `repeat(${gridSize}, ${cellSizeCss})`;

    for (const cell of cells) {
      cell.style.width = cellSizeCss;
      cell.style.height = cellSizeCss;
    }

    renderOverlays(overlays);
  }

  function renderOverlays(nextOverlays) {
    overlays = nextOverlays;
    overlayLayer.replaceChildren();

    if (!areasVisible) {
      return;
    }

    for (const overlay of overlays) {
      const paletteEntry = overlayPalette[overlay.kind];
      if (!paletteEntry) {
        continue;
      }

      const zone = document.createElement("div");
      zone.className = "overlay-zone";
      zone.style.left = `${overlay.x * cellSize}px`;
      zone.style.top = `${overlay.y * cellSize}px`;
      zone.style.width = `${overlay.width * cellSize}px`;
      zone.style.height = `${overlay.height * cellSize}px`;
      zone.style.backgroundColor = paletteEntry.color;
      zone.title = paletteEntry.label;
      overlayLayer.appendChild(zone);
    }
  }

  function suppressClicksFor(milliseconds) {
    clickSuppressedUntil = Date.now() + milliseconds;
  }

  function clearPixels() {
    for (const cell of cells) {
      setCellValue(cell, false);
    }
  }

  function setModule(x, y, isBlack) {
    if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) {
      return;
    }

    setCellValue(cells[y * gridSize + x], isBlack);
  }

  function setModules(modules) {
    for (const gridModule of modules) {
      setModule(gridModule.x, gridModule.y, gridModule.isBlack);
    }
  }

  function invertModules(modules) {
    for (const gridModule of modules) {
      if (gridModule.x < 0 || gridModule.y < 0 || gridModule.x >= gridSize || gridModule.y >= gridSize) {
        continue;
      }

      const cell = cells[gridModule.y * gridSize + gridModule.x];
      setCellValue(cell, cell.dataset.value !== "dark");
    }
  }

  function setCellValue(cell, isBlack) {
    cell.dataset.value = isBlack ? "dark" : "light";
    cell.classList.toggle("is-black", isBlack);
    cell.style.backgroundColor = isBlack ? "#000" : "#fff";
  }

  function setAreasVisible(isVisible) {
    areasVisible = isVisible;
    renderOverlays(overlays);
  }

  return {
    clearPixels,
    getGridSize: () => gridSize,
    invertModules,
    renderOverlays,
    setAreasVisible,
    setCellSize,
    setGridSize,
    setModules,
    suppressClicksFor,
  };
}
