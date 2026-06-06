const errorCorrectionLevelBits = {
  L: "01",
  M: "00",
  Q: "11",
  H: "10",
};
const formatGenerator = 0b10100110111;
const formatMask = 0b101010000010010;
const versionGenerator = 0b1111100100101;

export function getFinderPatternModules(versionSpec) {
  const modules = [];

  for (const pattern of versionSpec.zones.finder_patterns) {
    const centerSpiral = getSpiralCoordinates(2, 2, 3, 3);
    const innerRing = getRingCoordinates(1, 1, 5, 5);
    const outerRing = getRingCoordinates(0, 0, 7, 7);

    for (const coordinate of [...centerSpiral, ...innerRing, ...outerRing]) {
      modules.push({
        x: pattern.x + coordinate.x,
        y: pattern.y + coordinate.y,
        isBlack: isFinderPatternDark(coordinate.x, coordinate.y),
      });
    }
  }

  for (const pattern of versionSpec.zones.alignment_patterns) {
    const center = [{ x: 2, y: 2 }];
    const innerRing = getRingCoordinates(1, 1, 3, 3);
    const outerRing = getRingCoordinates(0, 0, 5, 5);

    for (const coordinate of [...center, ...innerRing, ...outerRing]) {
      modules.push({
        x: pattern.x + coordinate.x,
        y: pattern.y + coordinate.y,
        isBlack: isAlignmentPatternDark(coordinate.x, coordinate.y),
      });
    }
  }

  for (const darkModule of versionSpec.zones.dark_module) {
    modules.push({
      x: darkModule.x,
      y: darkModule.y,
      isBlack: true,
    });
  }

  return modules;
}

export function getVersionInformationModules(versionSpec) {
  if (versionSpec.version < 7) {
    return [];
  }

  const bits = getVersionBits(versionSpec.version);

  return [...versionSpec.zones.version_information_bits]
    .sort((first, second) => first.version_string_msb_index - second.version_string_msb_index)
    .flatMap((entry) =>
      entry.instances.map((instance) => ({
        x: instance.x,
        y: instance.y,
        isBlack: bits[entry.version_string_msb_index] === "1",
      })),
    );
}

export function getTimingPatternModules(versionSpec) {
  const modules = [];

  for (const pattern of versionSpec.zones.timing_patterns) {
    const length = Math.max(pattern.width, pattern.height);

    for (let offset = 0; offset < length; offset += 1) {
      modules.push({
        x: pattern.x + (pattern.width > 1 ? offset : 0),
        y: pattern.y + (pattern.height > 1 ? offset : 0),
        isBlack: offset % 2 === 0,
      });
    }
  }

  return modules;
}

export function getErrorCorrectionLevelModules(versionSpec, level, pattern) {
  return getFormatFieldModules(
    versionSpec.zones.error_correction_level_indicator,
    getFormatBits(level, pattern)
  );
}

export function getMaskingPatternIndicatorModules(versionSpec, level, pattern) {
  return getFormatFieldModules(
    versionSpec.zones.masking_pattern_indicator,
    getFormatBits(level, pattern)
  );
}

export function getFormatErrorCorrectionModules(versionSpec, level, pattern) {
  return getFormatFieldModules(
    versionSpec.zones.format_bch_error_correction,
    getFormatBits(level, pattern)
  );
}

export function getMaskingPatternModules(versionSpec, pattern) {
  const reservedModules = getReservedModules(versionSpec);
  const modules = [];
  const patternIndex = Number(pattern);

  for (const { x, y } of getDataPath(versionSpec.module_count, reservedModules)) {
    if (isMaskModuleDark(patternIndex, x, y)) {
      modules.push({ x, y });
    }
  }

  return modules;
}

export function getDataResetModules(versionSpec) {
  const reservedModules = getReservedModules(versionSpec);

  return getDataPath(versionSpec.module_count, reservedModules).map(({ x, y }) => ({
    x,
    y,
    isBlack: false,
  }));
}

function isFinderPatternDark(x, y) {
  const isOuterRing = x === 0 || y === 0 || x === 6 || y === 6;
  const isCenter = x >= 2 && x <= 4 && y >= 2 && y <= 4;

  return isOuterRing || isCenter;
}

function isAlignmentPatternDark(x, y) {
  const isOuterRing = x === 0 || y === 0 || x === 4 || y === 4;
  const isCenter = x === 2 && y === 2;

  return isOuterRing || isCenter;
}

function getSpiralCoordinates(startX, startY, width, height) {
  const coordinates = [];
  let left = startX;
  let right = startX + width - 1;
  let top = startY;
  let bottom = startY + height - 1;

  while (left <= right && top <= bottom) {
    for (let x = left; x <= right; x += 1) {
      coordinates.push({ x, y: top });
    }
    top += 1;

    for (let y = top; y <= bottom; y += 1) {
      coordinates.push({ x: right, y });
    }
    right -= 1;

    if (top <= bottom) {
      for (let x = right; x >= left; x -= 1) {
        coordinates.push({ x, y: bottom });
      }
      bottom -= 1;
    }

    if (left <= right) {
      for (let y = bottom; y >= top; y -= 1) {
        coordinates.push({ x: left, y });
      }
      left += 1;
    }
  }

  return coordinates;
}

function getRingCoordinates(x, y, width, height) {
  return getSpiralCoordinates(x, y, width, height).filter(
    (coordinate) =>
      coordinate.x === x ||
      coordinate.y === y ||
      coordinate.x === x + width - 1 ||
      coordinate.y === y + height - 1,
  );
}

function getFormatFieldModules(entries, bits) {
  return [...entries]
    .sort((first, second) => first.format_string_msb_index - second.format_string_msb_index)
    .flatMap((entry) =>
      entry.instances.map((instance) => ({
        x: instance.x,
        y: instance.y,
        isBlack: bits[entry.format_string_msb_index] === "1",
      }))
    );
}

function getFormatBits(level, pattern) {
  const dataBits = `${errorCorrectionLevelBits[level]}${Number(pattern).toString(2).padStart(3, "0")}`;
  const dataValue = Number.parseInt(dataBits, 2);
  const unmaskedValue = (dataValue << 10) | getFormatRemainder(dataValue);
  const maskedValue = unmaskedValue ^ formatMask;

  return maskedValue.toString(2).padStart(15, "0");
}

function getFormatRemainder(dataValue) {
  let value = dataValue << 10;

  for (let bit = 14; bit >= 10; bit -= 1) {
    if ((value & (1 << bit)) !== 0) {
      value ^= formatGenerator << (bit - 10);
    }
  }

  return value & 0b1111111111;
}

function getVersionBits(version) {
  const unprotectedValue = version << 12;
  let remainder = unprotectedValue;

  for (let bit = 17; bit >= 12; bit -= 1) {
    if ((remainder & (1 << bit)) !== 0) {
      remainder ^= versionGenerator << (bit - 12);
    }
  }

  return (unprotectedValue | (remainder & 0xfff))
    .toString(2)
    .padStart(18, "0");
}

function getReservedModules(versionSpec) {
  const reservedModules = new Set();
  const reservedZoneKeys = [
    "finder_patterns",
    "separators",
    "timing_patterns",
    "alignment_patterns",
    "dark_module",
    "format_information_areas",
    "version_information_areas",
  ];

  for (const zoneKey of reservedZoneKeys) {
    for (const rectangle of getZoneEntries(versionSpec, zoneKey)) {
      addRectangleModules(reservedModules, rectangle);
    }
  }

  const bitZoneKeys = [
    "error_correction_level_indicator",
    "masking_pattern_indicator",
    "format_bch_error_correction",
    "version_number_indicator",
    "version_bch_error_correction",
  ];

  for (const zoneKey of bitZoneKeys) {
    for (const entry of getZoneEntries(versionSpec, zoneKey)) {
      for (const instance of entry.instances ?? []) {
        addRectangleModules(reservedModules, instance);
      }
    }
  }

  return reservedModules;
}

function getZoneEntries(versionSpec, zoneKey) {
  const entries = versionSpec.zones[zoneKey];
  if (!entries) {
    return [];
  }

  return Array.isArray(entries) ? entries : [entries];
}

function addRectangleModules(modules, rectangle) {
  if (!Number.isFinite(rectangle?.x)) {
    return;
  }

  for (let y = rectangle.y; y < rectangle.y + rectangle.height; y += 1) {
    for (let x = rectangle.x; x < rectangle.x + rectangle.width; x += 1) {
      modules.add(getModuleKey(x, y));
    }
  }
}

function getModuleKey(x, y) {
  return `${x},${y}`;
}

function getDataPath(moduleCount, reservedModules) {
  const path = [];
  let upward = true;

  for (let rightColumn = moduleCount - 1; rightColumn > 0; rightColumn -= 2) {
    if (rightColumn === 6) {
      rightColumn -= 1;
    }

    for (let rowOffset = 0; rowOffset < moduleCount; rowOffset += 1) {
      const y = upward ? moduleCount - 1 - rowOffset : rowOffset;

      for (const x of [rightColumn, rightColumn - 1]) {
        if (!reservedModules.has(getModuleKey(x, y))) {
          path.push({ x, y });
        }
      }
    }

    upward = !upward;
  }

  return path;
}

function isMaskModuleDark(pattern, x, y) {
  if (pattern === 0) {
    return (x + y) % 2 === 0;
  }

  if (pattern === 1) {
    return y % 2 === 0;
  }

  if (pattern === 2) {
    return x % 3 === 0;
  }

  if (pattern === 3) {
    return (x + y) % 3 === 0;
  }

  if (pattern === 4) {
    return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
  }

  if (pattern === 5) {
    return ((x * y) % 2) + ((x * y) % 3) === 0;
  }

  if (pattern === 6) {
    return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
  }

  return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
}
