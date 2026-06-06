import { baseCellSize, maxZoom, minZoom, zoomStep } from "./config.js";

export function createZoomPan({
  grid,
  gridView,
  resetView,
  workspace,
  zoomIn,
  zoomOut,
}) {
  let zoom = 1;
  let panStart = null;

  function getWorkspaceInsets() {
    const style = getComputedStyle(workspace);

    return {
      top: Number.parseFloat(style.paddingTop) || 0,
      right: Number.parseFloat(style.paddingRight) || 0,
      bottom: Number.parseFloat(style.paddingBottom) || 0,
      left: Number.parseFloat(style.paddingLeft) || 0,
    };
  }

  function getWorkspaceInnerSize() {
    const insets = getWorkspaceInsets();

    return {
      insets,
      width: workspace.clientWidth - insets.left - insets.right,
      height: workspace.clientHeight - insets.top - insets.bottom,
    };
  }

  function getFitZoom() {
    const baseGridPixels = gridView.getGridSize() * baseCellSize + 1;
    const { width, height } = getWorkspaceInnerSize();
    const availableWidth = width * 0.7;
    const availableHeight = height * 0.7;

    return Math.min(1, availableWidth / baseGridPixels, availableHeight / baseGridPixels);
  }

  function applyZoom() {
    const nextCellSize = baseCellSize * zoom;
    const gridPixels = gridView.getGridSize() * nextCellSize + 1;
    const { width, height } = getWorkspaceInnerSize();
    const horizontalPadding = Math.min(50, width * 0.15);
    const verticalPadding = Math.min(50, height * 0.15);
    const horizontalMargin = Math.max(horizontalPadding, (width - gridPixels) / 2);
    const verticalMargin = Math.max(verticalPadding, (height - gridPixels) / 2);

    gridView.setCellSize(nextCellSize);
    grid.style.margin = `${verticalMargin}px ${horizontalMargin}px`;
  }

  function clampZoom(nextZoom) {
    return Math.min(maxZoom, Math.max(minZoom, nextZoom));
  }

  function getWorkspaceAnchor() {
    const rect = workspace.getBoundingClientRect();

    return {
      x: rect.left + workspace.clientWidth / 2,
      y: rect.top + workspace.clientHeight / 2,
    };
  }

  function zoomTo(nextZoom, anchor = getWorkspaceAnchor()) {
    const previousZoom = zoom;
    const previousCellSize = baseCellSize * previousZoom;
    const nextClampedZoom = clampZoom(nextZoom);

    if (nextClampedZoom === previousZoom) {
      return;
    }

    const rect = workspace.getBoundingClientRect();
    const anchorX = anchor.x - rect.left;
    const anchorY = anchor.y - rect.top;
    const contentX = (workspace.scrollLeft + anchorX) / previousCellSize;
    const contentY = (workspace.scrollTop + anchorY) / previousCellSize;

    zoom = nextClampedZoom;
    applyZoom();

    const nextCellSize = baseCellSize * zoom;
    workspace.scrollLeft = contentX * nextCellSize - anchorX;
    workspace.scrollTop = contentY * nextCellSize - anchorY;
  }

  function fitToView() {
    zoom = getFitZoom();
    workspace.scrollTo(0, 0);
    applyZoom();
  }

  zoomIn.addEventListener("click", () => {
    zoomTo(zoom + zoomStep);
  });

  zoomOut.addEventListener("click", () => {
    zoomTo(zoom - zoomStep);
  });

  resetView.addEventListener("click", () => {
    fitToView();
  });

  workspace.addEventListener(
    "wheel",
    (event) => {
      if (!event.ctrlKey) {
        return;
      }

      event.preventDefault();

      zoomTo(zoom * Math.exp(-event.deltaY * 0.002), {
        x: event.clientX,
        y: event.clientY,
      });
    },
    { passive: false }
  );

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

    if (!panStart.isDragging && deltaX === 0 && deltaY === 0) {
      return;
    }

    panStart.isDragging = true;
    gridView.suppressClicksFor(250);
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
      gridView.suppressClicksFor(250);
    }

    workspace.classList.remove("is-panning");
    panStart = null;
  });

  workspace.addEventListener("pointercancel", () => {
    if (panStart?.isDragging) {
      gridView.suppressClicksFor(250);
    }

    workspace.classList.remove("is-panning");
    panStart = null;
  });

  window.addEventListener("resize", () => {
    applyZoom();
  });

  return {
    fitToView,
  };
}
