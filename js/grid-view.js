import { baseCellSize, overlayPalette } from "./config.js";

export function createGridView(grid) {
  const overlayLayer = document.createElement("div");
  overlayLayer.className = "overlay-layer";
  const dataPositionLayer = document.createElement("div");
  dataPositionLayer.className = "data-position-layer";

  let gridSize = 0;
  let cellSize = baseCellSize;
  let overlays = [];
  let clickSuppressedUntil = 0;
  let cells = [];
  let areasVisible = true;
  let dataPositions = [];
  let dataPositionsVisible = false;
  let animationId = 0;

  function createCell(index) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cell";
    cell.dataset.value = "light";
    cell.setAttribute("aria-label", `Pixel ${index + 1}`);
    cell.addEventListener("click", () => {
      setCellValue(cell, cell.dataset.value !== "dark");
    });
    cell.addEventListener("animationend", () => {
      cell.classList.remove("is-flipping");
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
    animationId += 1;
    gridSize = nextGridSize;
    overlays = [];
    dataPositions = [];
    cells = [];
    grid.replaceChildren();

    for (let index = 0; index < gridSize * gridSize; index += 1) {
      const cell = createCell(index);
      cells.push(cell);
      grid.appendChild(cell);
    }

    grid.appendChild(overlayLayer);
    grid.appendChild(dataPositionLayer);
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
    renderDataPositions();
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

  function animateOperations(operations) {
    const targetValues = new Map();

    for (const operation of operations) {
      for (const gridModule of operation.modules) {
        if (!isValidModule(gridModule.x, gridModule.y)) {
          continue;
        }

        const index = gridModule.y * gridSize + gridModule.x;
        const currentValue =
          targetValues.get(index) ?? (cells[index].dataset.value === "dark");
        const nextValue =
          operation.type === "invert" ? !currentValue : gridModule.isBlack;

        targetValues.set(index, nextValue);
      }
    }

    const changes = [...targetValues.entries()]
      .filter(([index, isBlack]) => (cells[index].dataset.value === "dark") !== isBlack)
      .map(([index, isBlack]) => ({ index, isBlack }));

    return animateChanges(changes);
  }

  function setCellValue(cell, isBlack) {
    const wasBlack = cell.dataset.value === "dark";
    if (wasBlack === isBlack) {
      return;
    }

    cell.style.setProperty("--flip-from-color", wasBlack ? "#000" : "#fff");
    cell.style.setProperty("--flip-to-color", isBlack ? "#000" : "#fff");
    cell.dataset.value = isBlack ? "dark" : "light";
    cell.classList.toggle("is-black", isBlack);
    cell.style.backgroundColor = isBlack ? "#000" : "#fff";
    cell.classList.remove("is-flipping");
    void cell.offsetWidth;
    cell.classList.add("is-flipping");
  }

  function setAreasVisible(isVisible) {
    areasVisible = isVisible;
    grid.classList.toggle("areas-visible", isVisible);
    renderOverlays(overlays);
  }

  function setDataPositions(positions) {
    dataPositions = positions;
    renderDataPositions();
  }

  function setDataPositionsVisible(isVisible) {
    dataPositionsVisible = isVisible;
    renderDataPositions();
  }

  function renderDataPositions() {
    dataPositionLayer.replaceChildren();

    if (!dataPositionsVisible) {
      return;
    }

    for (let index = 0; index < dataPositions.length; index += 1) {
      const position = dataPositions[index];
      const label = document.createElement("span");
      label.className = "data-position-label";
      label.textContent = String((index % 8) + 1);
      label.style.left = `${position.x * cellSize}px`;
      label.style.top = `${position.y * cellSize}px`;
      label.style.width = `${cellSize}px`;
      label.style.height = `${cellSize}px`;
      label.style.fontSize = `${Math.max(8, Math.min(14, cellSize * 0.45))}px`;
      dataPositionLayer.appendChild(label);
    }
  }

  function isValidModule(x, y) {
    return x >= 0 && y >= 0 && x < gridSize && y < gridSize;
  }

  function animateChanges(changes) {
    animationId += 1;
    const currentAnimationId = animationId;

    if (changes.length === 0) {
      return Promise.resolve();
    }

    const startTime = performance.now();
    const version = (gridSize - 17) / 4;
    const millisecondsPerPixel = Math.max(11 - version, 2);
    const animationDuration = changes.length * millisecondsPerPixel;
    let appliedCount = 0;

    return new Promise((resolve) => {
      function applyFrame(timestamp) {
        if (currentAnimationId !== animationId) {
          resolve();
          return;
        }

        const progress = Math.min(1, (timestamp - startTime) / animationDuration);
        const targetCount = Math.min(
          changes.length,
          Math.floor(progress * changes.length),
        );

        while (appliedCount < targetCount) {
          const change = changes[appliedCount];
          setCellValue(cells[change.index], change.isBlack);
          appliedCount += 1;
        }

        if (progress < 1) {
          requestAnimationFrame(applyFrame);
          return;
        }

        while (appliedCount < changes.length) {
          const change = changes[appliedCount];
          setCellValue(cells[change.index], change.isBlack);
          appliedCount += 1;
        }

        resolve();
      }

      requestAnimationFrame(applyFrame);
    });
  }

  function getMatrix() {
    return Array.from({ length: gridSize }, (_, y) =>
      Array.from(
        { length: gridSize },
        (_, x) => cells[y * gridSize + x].dataset.value === "dark",
      ),
    );
  }

  return {
    clearPixels,
    animateOperations,
    getGridSize: () => gridSize,
    getMatrix,
    renderOverlays,
    setAreasVisible,
    setCellSize,
    setDataPositions,
    setDataPositionsVisible,
    setGridSize,
    setModules,
    suppressClicksFor,
  };
}
