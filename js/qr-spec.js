import { overlayOrder, overlayPalette } from "./config.js";

export async function loadQrSpecification() {
  const response = await fetch(
    new URL("./qr-specification.json", import.meta.url),
  );

  if (!response.ok) {
    throw new Error(`Could not load QR specification (${response.status})`);
  }

  return response.json();
}

export function getVersions(specification) {
  return specification.versions.map((versionSpec) => ({
    version: versionSpec.version,
    moduleCount: versionSpec.module_count,
  }));
}

export function getVersionSpec(specification, version) {
  return specification.versions.find(
    (versionSpec) => versionSpec.version === version,
  );
}

export function getLegendItems(versionSpec) {
  return overlayOrder
    .filter((zoneKey) => getZoneEntries(versionSpec, zoneKey).length > 0)
    .map((zoneKey) => ({
      key: zoneKey,
      ...overlayPalette[zoneKey],
    }));
}

export function getOverlayRects(versionSpec) {
  const overlays = [];

  for (const zoneKey of overlayOrder) {
    for (const entry of getZoneEntries(versionSpec, zoneKey)) {
      if (isRectangle(entry)) {
        overlays.push(createOverlay(zoneKey, entry));
        continue;
      }

      if (Array.isArray(entry.instances)) {
        for (const instance of entry.instances) {
          if (isRectangle(instance)) {
            overlays.push(createOverlay(zoneKey, instance));
          }
        }
      }
    }
  }

  return overlays;
}

function getZoneEntries(versionSpec, zoneKey) {
  const entries = versionSpec.zones[zoneKey];
  if (!entries) {
    return [];
  }

  return Array.isArray(entries) ? entries : [entries];
}

function isRectangle(value) {
  return (
    Number.isFinite(value?.x) &&
    Number.isFinite(value?.y) &&
    Number.isFinite(value?.width) &&
    Number.isFinite(value?.height)
  );
}

function createOverlay(kind, rectangle) {
  return {
    kind,
    x: rectangle.x,
    y: rectangle.y,
    width: rectangle.width,
    height: rectangle.height,
  };
}
