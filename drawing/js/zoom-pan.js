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
  const touchPointers = new Map();
  let touchPanStart = null;
  let pinchStart = null;

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
    if (event.pointerType === "touch") {
      touchPointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      if (!workspace.hasPointerCapture(event.pointerId)) {
        workspace.setPointerCapture(event.pointerId);
      }

      if (touchPointers.size === 1) {
        touchPanStart = {
          x: event.clientX,
          y: event.clientY,
          scrollLeft: workspace.scrollLeft,
          scrollTop: workspace.scrollTop,
          isDragging: false,
        };
      } else if (touchPointers.size === 2) {
        const [first, second] = touchPointers.values();
        pinchStart = {
          distance: getPointerDistance(first, second),
          zoom,
        };
        touchPanStart = null;
        gridView.suppressClicksFor(250);
      }

      return;
    }

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
    if (event.pointerType === "touch" && touchPointers.has(event.pointerId)) {
      touchPointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      if (touchPointers.size >= 2 && pinchStart) {
        const [first, second] = touchPointers.values();
        const distance = getPointerDistance(first, second);
        const midpoint = getPointerMidpoint(first, second);

        if (pinchStart.distance > 0) {
          zoomTo(pinchStart.zoom * (distance / pinchStart.distance), midpoint);
        }

        gridView.suppressClicksFor(250);
        event.preventDefault();
        return;
      }

      if (touchPointers.size === 1 && touchPanStart) {
        const deltaX = event.clientX - touchPanStart.x;
        const deltaY = event.clientY - touchPanStart.y;

        if (deltaX !== 0 || deltaY !== 0) {
          touchPanStart.isDragging = true;
          gridView.suppressClicksFor(250);
          workspace.scrollLeft = touchPanStart.scrollLeft - deltaX;
          workspace.scrollTop = touchPanStart.scrollTop - deltaY;
        }

        event.preventDefault();
      }

      return;
    }

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

  workspace.addEventListener("pointerup", (event) => {
    if (event.pointerType === "touch") {
      finishTouchPointer(event.pointerId);
      return;
    }

    if (!panStart) {
      return;
    }

    if (panStart.isDragging) {
      gridView.suppressClicksFor(250);
    }

    workspace.classList.remove("is-panning");
    panStart = null;
  });

  workspace.addEventListener("pointercancel", (event) => {
    if (event.pointerType === "touch") {
      finishTouchPointer(event.pointerId);
      return;
    }

    if (panStart?.isDragging) {
      gridView.suppressClicksFor(250);
    }

    workspace.classList.remove("is-panning");
    panStart = null;
  });

  window.addEventListener("resize", () => {
    applyZoom();
  });

  workspace.addEventListener(
    "gesturestart",
    (event) => {
      event.preventDefault();
    },
    { passive: false },
  );

  function finishTouchPointer(pointerId) {
    const wasPinching = pinchStart !== null;
    const wasDragging = touchPanStart?.isDragging;

    touchPointers.delete(pointerId);

    if (wasPinching || wasDragging) {
      gridView.suppressClicksFor(250);
    }

    pinchStart = null;
    touchPanStart = null;

    if (touchPointers.size === 1) {
      const [remainingPointer] = touchPointers.values();
      touchPanStart = {
        x: remainingPointer.x,
        y: remainingPointer.y,
        scrollLeft: workspace.scrollLeft,
        scrollTop: workspace.scrollTop,
        isDragging: false,
      };
    }
  }

  function getPointerDistance(first, second) {
    return Math.hypot(second.x - first.x, second.y - first.y);
  }

  function getPointerMidpoint(first, second) {
    return {
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
    };
  }

  return {
    fitToView,
  };
}
