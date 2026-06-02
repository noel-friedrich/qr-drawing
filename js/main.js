const grid = document.getElementById("grid");
const workspace = document.getElementById("workspace");
const zoomIn = document.getElementById("zoom-in");
const zoomOut = document.getElementById("zoom-out");
const resetView = document.getElementById("reset-view");

const gridSize = 21;
const baseCellSize = 24;
const minZoom = 0.2;
const maxZoom = 8;
const zoomStep = 0.25;
let zoom = 1;
let panStart = null;
let suppressClickUntil = 0;

for (let index = 0; index < gridSize * gridSize; index += 1) {
  const cell = document.createElement("button");
  cell.type = "button";
  cell.className = "cell";
  cell.setAttribute("aria-label", `Pixel ${index + 1}`);
  cell.addEventListener("click", () => {
    cell.classList.toggle("is-black");
  });
  grid.appendChild(cell);
}

grid.addEventListener(
  "click",
  (event) => {
    if (Date.now() >= suppressClickUntil) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
  },
  true
);

function getFitZoom() {
  const baseGridPixels = gridSize * baseCellSize + 1;
  const availableWidth = workspace.clientWidth * 0.7;
  const availableHeight = workspace.clientHeight * 0.7;

  return Math.min(1, availableWidth / baseGridPixels, availableHeight / baseGridPixels);
}

function getDragThreshold() {
  return baseCellSize * zoom;
}

function applyZoom() {
  const cellSize = `${baseCellSize * zoom}px`;
  const gridPixels = gridSize * baseCellSize * zoom + 1;
  const horizontalPadding = workspace.clientWidth * 0.15;
  const verticalPadding = workspace.clientHeight * 0.15;
  const horizontalMargin = Math.max(horizontalPadding, (workspace.clientWidth - gridPixels) / 2);
  const verticalMargin = Math.max(verticalPadding, (workspace.clientHeight - gridPixels) / 2);

  grid.style.gridTemplateColumns = `repeat(${gridSize}, ${cellSize})`;
  grid.style.gridTemplateRows = `repeat(${gridSize}, ${cellSize})`;
  grid.style.margin = `${verticalMargin}px ${horizontalMargin}px`;

  for (const cell of grid.children) {
    cell.style.width = cellSize;
    cell.style.height = cellSize;
  }
}

zoomIn.addEventListener("click", () => {
  zoom = Math.min(maxZoom, zoom + zoomStep);
  applyZoom();
});

zoomOut.addEventListener("click", () => {
  zoom = Math.max(minZoom, zoom - zoomStep);
  applyZoom();
});

resetView.addEventListener("click", () => {
  zoom = getFitZoom();
  workspace.scrollTo(0, 0);
  applyZoom();
});

workspace.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "mouse" || event.button !== 0) {
    return;
  }

  panStart = {
    x: event.clientX,
    y: event.clientY,
    pointerId: event.pointerId,
    scrollLeft: workspace.scrollLeft,
    scrollTop: workspace.scrollTop,
    isDragging: false,
  };
});

workspace.addEventListener("pointermove", (event) => {
  if (!panStart) {
    return;
  }

  const deltaX = event.clientX - panStart.x;
  const deltaY = event.clientY - panStart.y;

  if (!panStart.isDragging && Math.hypot(deltaX, deltaY) < getDragThreshold()) {
    return;
  }

  panStart.isDragging = true;
  suppressClickUntil = Date.now() + 250;
  workspace.classList.add("is-panning");
  if (!workspace.hasPointerCapture(panStart.pointerId)) {
    workspace.setPointerCapture(panStart.pointerId);
  }
  workspace.scrollLeft = panStart.scrollLeft - deltaX;
  workspace.scrollTop = panStart.scrollTop - deltaY;
  event.preventDefault();
});

workspace.addEventListener("pointerup", () => {
  if (!panStart) {
    return;
  }

  if (panStart.isDragging) {
    suppressClickUntil = Date.now() + 250;
  }

  workspace.classList.remove("is-panning");
  panStart = null;
});

workspace.addEventListener("pointercancel", () => {
  if (panStart?.isDragging) {
    suppressClickUntil = Date.now() + 250;
  }

  workspace.classList.remove("is-panning");
  panStart = null;
});

window.addEventListener("resize", () => {
  applyZoom();
});

zoom = getFitZoom();
applyZoom();
