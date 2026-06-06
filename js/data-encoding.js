const alphanumericCharacters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
const modeIndicators = {
  numeric: "0001",
  alphanumeric: "0010",
  byte: "0100",
  binary: "0100",
};
const blockInfo = {
  1: {
    L: {
      dataCodewords: 19,
      ecCodewordsPerBlock: 7,
      groups: [{ blocks: 1, dataCodewords: 19 }],
    },
    M: {
      dataCodewords: 16,
      ecCodewordsPerBlock: 10,
      groups: [{ blocks: 1, dataCodewords: 16 }],
    },
    Q: {
      dataCodewords: 13,
      ecCodewordsPerBlock: 13,
      groups: [{ blocks: 1, dataCodewords: 13 }],
    },
    H: {
      dataCodewords: 9,
      ecCodewordsPerBlock: 17,
      groups: [{ blocks: 1, dataCodewords: 9 }],
    },
  },
  2: {
    L: {
      dataCodewords: 34,
      ecCodewordsPerBlock: 10,
      groups: [{ blocks: 1, dataCodewords: 34 }],
    },
    M: {
      dataCodewords: 28,
      ecCodewordsPerBlock: 16,
      groups: [{ blocks: 1, dataCodewords: 28 }],
    },
    Q: {
      dataCodewords: 22,
      ecCodewordsPerBlock: 22,
      groups: [{ blocks: 1, dataCodewords: 22 }],
    },
    H: {
      dataCodewords: 16,
      ecCodewordsPerBlock: 28,
      groups: [{ blocks: 1, dataCodewords: 16 }],
    },
  },
  3: {
    L: {
      dataCodewords: 55,
      ecCodewordsPerBlock: 15,
      groups: [{ blocks: 1, dataCodewords: 55 }],
    },
    M: {
      dataCodewords: 44,
      ecCodewordsPerBlock: 26,
      groups: [{ blocks: 1, dataCodewords: 44 }],
    },
    Q: {
      dataCodewords: 34,
      ecCodewordsPerBlock: 18,
      groups: [{ blocks: 2, dataCodewords: 17 }],
    },
    H: {
      dataCodewords: 26,
      ecCodewordsPerBlock: 22,
      groups: [{ blocks: 2, dataCodewords: 13 }],
    },
  },
  4: {
    L: {
      dataCodewords: 80,
      ecCodewordsPerBlock: 20,
      groups: [{ blocks: 1, dataCodewords: 80 }],
    },
    M: {
      dataCodewords: 64,
      ecCodewordsPerBlock: 18,
      groups: [{ blocks: 2, dataCodewords: 32 }],
    },
    Q: {
      dataCodewords: 48,
      ecCodewordsPerBlock: 26,
      groups: [{ blocks: 2, dataCodewords: 24 }],
    },
    H: {
      dataCodewords: 36,
      ecCodewordsPerBlock: 16,
      groups: [{ blocks: 4, dataCodewords: 9 }],
    },
  },
  5: {
    L: {
      dataCodewords: 108,
      ecCodewordsPerBlock: 26,
      groups: [{ blocks: 1, dataCodewords: 108 }],
    },
    M: {
      dataCodewords: 86,
      ecCodewordsPerBlock: 24,
      groups: [{ blocks: 2, dataCodewords: 43 }],
    },
    Q: {
      dataCodewords: 62,
      ecCodewordsPerBlock: 18,
      groups: [
        { blocks: 2, dataCodewords: 15 },
        { blocks: 2, dataCodewords: 16 },
      ],
    },
    H: {
      dataCodewords: 46,
      ecCodewordsPerBlock: 22,
      groups: [
        { blocks: 2, dataCodewords: 11 },
        { blocks: 2, dataCodewords: 12 },
      ],
    },
  },
  6: {
    L: {
      dataCodewords: 136,
      ecCodewordsPerBlock: 18,
      groups: [{ blocks: 2, dataCodewords: 68 }],
    },
    M: {
      dataCodewords: 108,
      ecCodewordsPerBlock: 16,
      groups: [{ blocks: 4, dataCodewords: 27 }],
    },
    Q: {
      dataCodewords: 76,
      ecCodewordsPerBlock: 24,
      groups: [{ blocks: 4, dataCodewords: 19 }],
    },
    H: {
      dataCodewords: 60,
      ecCodewordsPerBlock: 28,
      groups: [{ blocks: 4, dataCodewords: 15 }],
    },
  },
  7: {
    L: {
      dataCodewords: 156,
      ecCodewordsPerBlock: 20,
      groups: [{ blocks: 2, dataCodewords: 78 }],
    },
    M: {
      dataCodewords: 124,
      ecCodewordsPerBlock: 18,
      groups: [{ blocks: 4, dataCodewords: 31 }],
    },
    Q: {
      dataCodewords: 88,
      ecCodewordsPerBlock: 18,
      groups: [
        { blocks: 2, dataCodewords: 14 },
        { blocks: 4, dataCodewords: 15 },
      ],
    },
    H: {
      dataCodewords: 66,
      ecCodewordsPerBlock: 26,
      groups: [
        { blocks: 4, dataCodewords: 13 },
        { blocks: 1, dataCodewords: 14 },
      ],
    },
  },
  8: {
    L: {
      dataCodewords: 194,
      ecCodewordsPerBlock: 24,
      groups: [{ blocks: 2, dataCodewords: 97 }],
    },
    M: {
      dataCodewords: 154,
      ecCodewordsPerBlock: 22,
      groups: [
        { blocks: 2, dataCodewords: 38 },
        { blocks: 2, dataCodewords: 39 },
      ],
    },
    Q: {
      dataCodewords: 110,
      ecCodewordsPerBlock: 22,
      groups: [
        { blocks: 4, dataCodewords: 18 },
        { blocks: 2, dataCodewords: 19 },
      ],
    },
    H: {
      dataCodewords: 86,
      ecCodewordsPerBlock: 26,
      groups: [
        { blocks: 4, dataCodewords: 14 },
        { blocks: 2, dataCodewords: 15 },
      ],
    },
  },
  9: {
    L: {
      dataCodewords: 232,
      ecCodewordsPerBlock: 30,
      groups: [{ blocks: 2, dataCodewords: 116 }],
    },
    M: {
      dataCodewords: 182,
      ecCodewordsPerBlock: 22,
      groups: [
        { blocks: 3, dataCodewords: 36 },
        { blocks: 2, dataCodewords: 37 },
      ],
    },
    Q: {
      dataCodewords: 132,
      ecCodewordsPerBlock: 20,
      groups: [
        { blocks: 4, dataCodewords: 16 },
        { blocks: 4, dataCodewords: 17 },
      ],
    },
    H: {
      dataCodewords: 100,
      ecCodewordsPerBlock: 24,
      groups: [
        { blocks: 4, dataCodewords: 12 },
        { blocks: 4, dataCodewords: 13 },
      ],
    },
  },
  10: {
    L: {
      dataCodewords: 274,
      ecCodewordsPerBlock: 18,
      groups: [
        { blocks: 2, dataCodewords: 68 },
        { blocks: 2, dataCodewords: 69 },
      ],
    },
    M: {
      dataCodewords: 216,
      ecCodewordsPerBlock: 26,
      groups: [
        { blocks: 4, dataCodewords: 43 },
        { blocks: 1, dataCodewords: 44 },
      ],
    },
    Q: {
      dataCodewords: 154,
      ecCodewordsPerBlock: 24,
      groups: [
        { blocks: 6, dataCodewords: 19 },
        { blocks: 2, dataCodewords: 20 },
      ],
    },
    H: {
      dataCodewords: 122,
      ecCodewordsPerBlock: 28,
      groups: [
        { blocks: 6, dataCodewords: 15 },
        { blocks: 2, dataCodewords: 16 },
      ],
    },
  },
};
const remainderBitsByVersion = {
  1: 0,
  2: 7,
  3: 7,
  4: 7,
  5: 7,
  6: 7,
  7: 0,
  8: 0,
  9: 0,
  10: 0,
};

export function getDataInputLimit(type, version, errorCorrectionLevel) {
  const capacityBits =
    getBlockInfo(version, errorCorrectionLevel).dataCodewords * 8;
  const characterCountBits =
    version <= 9
      ? { numeric: 10, alphanumeric: 9, byte: 8, binary: 8 }
      : { numeric: 12, alphanumeric: 11, byte: 16, binary: 16 };
  const payloadCapacity = capacityBits - 4 - characterCountBits[type];

  if (type === "numeric") {
    return getMaximumUnits(payloadCapacity, (count) => {
      const groups = Math.floor(count / 3);
      const remainder = count % 3;
      return groups * 10 + (remainder === 2 ? 7 : remainder === 1 ? 4 : 0);
    });
  }

  if (type === "alphanumeric") {
    return getMaximumUnits(
      payloadCapacity,
      (count) => Math.floor(count / 2) * 11 + (count % 2) * 6,
    );
  }

  return Math.floor(payloadCapacity / 8);
}

export function getDataModulePositions(versionSpec) {
  return getDataModulePath(versionSpec);
}

export function encodeData({ type, value, versionSpec, errorCorrectionLevel }) {
  const rawBits = [
    ...modeIndicators[type],
    ...getCharacterCountBits(type, value, versionSpec.version),
    ...getPayloadBits(type, value),
  ];
  const info = getBlockInfo(versionSpec.version, errorCorrectionLevel);
  const dataCodewords = finalizeDataCodewords(rawBits, info.dataCodewords);
  const dataBlocks = splitIntoBlocks(dataCodewords, info);
  const interleavedDataCodewords = interleaveBlocks(dataBlocks);
  const interleavedDataBits = codewordsToBits(interleavedDataCodewords);
  const path = getDataModulePath(versionSpec);

  return {
    bits: interleavedDataBits,
    codewords: dataCodewords,
    blocks: dataBlocks,
    dataCapacityBits: info.dataCodewords * 8,
    modules: bitsToModules(interleavedDataBits, path),
    path,
  };
}

function getMaximumUnits(capacityBits, getRequiredBits) {
  let count = 0;

  while (getRequiredBits(count + 1) <= capacityBits) {
    count += 1;
  }

  return count;
}

export function encodeDataErrorCorrection({
  dataBlocks,
  versionSpec,
  errorCorrectionLevel,
}) {
  const info = getBlockInfo(versionSpec.version, errorCorrectionLevel);
  const errorCorrectionBlocks = dataBlocks.map((block) =>
    getReedSolomonRemainder(block, info.ecCodewordsPerBlock),
  );
  const errorCorrectionCodewords = interleaveBlocks(errorCorrectionBlocks);
  const errorCorrectionBits = codewordsToBits(errorCorrectionCodewords);
  const path = getDataModulePath(versionSpec);
  const remainderBits = Array(remainderBitsByVersion[versionSpec.version]).fill(
    "0",
  );

  return {
    bits: errorCorrectionBits,
    codewords: errorCorrectionCodewords,
    modules: bitsToModules(errorCorrectionBits, path, info.dataCodewords * 8),
    remainderModules: bitsToModules(
      remainderBits,
      path,
      (info.dataCodewords + errorCorrectionCodewords.length) * 8,
    ),
  };
}

function getBlockInfo(version, errorCorrectionLevel) {
  return blockInfo[version][errorCorrectionLevel];
}

function finalizeDataCodewords(rawBits, dataCodewordCapacity) {
  const capacityBits = dataCodewordCapacity * 8;
  const bits = [...rawBits];

  if (bits.length > capacityBits) {
    throw new Error(
      "Data does not fit in the selected version and error-correction level.",
    );
  }

  const terminatorLength = Math.min(4, capacityBits - bits.length);
  bits.push(...Array(terminatorLength).fill("0"));

  while (bits.length % 8 !== 0) {
    bits.push("0");
  }

  const codewords = bitsToCodewords(bits);
  const padBytes = [0xec, 0x11];
  let padIndex = 0;

  while (codewords.length < dataCodewordCapacity) {
    codewords.push(padBytes[padIndex % padBytes.length]);
    padIndex += 1;
  }

  return codewords;
}

function splitIntoBlocks(codewords, info) {
  const blocks = [];
  let offset = 0;

  for (const group of info.groups) {
    for (let blockIndex = 0; blockIndex < group.blocks; blockIndex += 1) {
      blocks.push(codewords.slice(offset, offset + group.dataCodewords));
      offset += group.dataCodewords;
    }
  }

  return blocks;
}

function interleaveBlocks(blocks) {
  const interleavedCodewords = [];
  const maxLength = Math.max(...blocks.map((block) => block.length));

  for (let codewordIndex = 0; codewordIndex < maxLength; codewordIndex += 1) {
    for (const block of blocks) {
      if (codewordIndex < block.length) {
        interleavedCodewords.push(block[codewordIndex]);
      }
    }
  }

  return interleavedCodewords;
}

function getCharacterCountBits(type, value, version) {
  const count = getCharacterCount(type, value);
  const bitLengthByType =
    version <= 9
      ? { numeric: 10, alphanumeric: 9, byte: 8, binary: 8 }
      : { numeric: 12, alphanumeric: 11, byte: 16, binary: 16 };

  return toBits(count, bitLengthByType[type]);
}

function getCharacterCount(type, value) {
  if (type === "binary") {
    return parseBinaryBytes(value).length;
  }

  if (type === "byte") {
    return new TextEncoder().encode(value).length;
  }

  return value.length;
}

function getPayloadBits(type, value) {
  if (type === "numeric") {
    return getNumericBits(value);
  }

  if (type === "alphanumeric") {
    return getAlphanumericBits(value);
  }

  if (type === "binary") {
    return codewordsToBits(parseBinaryBytes(value));
  }

  return codewordsToBits([...new TextEncoder().encode(value)]);
}

function getNumericBits(value) {
  if (!/^\d*$/.test(value)) {
    throw new Error("Numeric data can only contain digits.");
  }

  const bits = [];

  for (let index = 0; index < value.length; index += 3) {
    const chunk = value.slice(index, index + 3);
    const bitLength = chunk.length === 3 ? 10 : chunk.length === 2 ? 7 : 4;
    bits.push(...toBits(Number(chunk), bitLength));
  }

  return bits;
}

function getAlphanumericBits(value) {
  const normalizedValue = value.toUpperCase();
  const bits = [];

  for (const character of normalizedValue) {
    if (!alphanumericCharacters.includes(character)) {
      throw new Error(`Unsupported alphanumeric character: ${character}`);
    }
  }

  for (let index = 0; index < normalizedValue.length; index += 2) {
    const first = alphanumericCharacters.indexOf(normalizedValue[index]);
    const second = alphanumericCharacters.indexOf(normalizedValue[index + 1]);

    if (Number.isInteger(second) && second >= 0) {
      bits.push(...toBits(first * 45 + second, 11));
    } else {
      bits.push(...toBits(first, 6));
    }
  }

  return bits;
}

function parseBinaryBytes(value) {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return [];
  }

  return normalizedValue.split(/\s+/).map((byte) => {
    if (!/^[01]{8}$/.test(byte)) {
      throw new Error("Binary data must use 8-bit groups separated by spaces.");
    }

    return Number.parseInt(byte, 2);
  });
}

function getDataModulePath(versionSpec) {
  const reservedModules = getReservedModules(versionSpec);
  const path = [];
  let upward = true;

  for (
    let rightColumn = versionSpec.module_count - 1;
    rightColumn > 0;
    rightColumn -= 2
  ) {
    if (rightColumn === 6) {
      rightColumn -= 1;
    }

    for (
      let rowOffset = 0;
      rowOffset < versionSpec.module_count;
      rowOffset += 1
    ) {
      const y = upward ? versionSpec.module_count - 1 - rowOffset : rowOffset;

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

function bitsToModules(bits, path, start = 0) {
  return bits
    .map((bit, index) => {
      const position = path[start + index];
      if (!position) {
        return null;
      }

      return {
        ...position,
        isBlack: bit === "1",
      };
    })
    .filter(Boolean);
}

function bitsToCodewords(bits) {
  const codewords = [];

  for (let index = 0; index < bits.length; index += 8) {
    codewords.push(
      Number.parseInt(
        bits
          .slice(index, index + 8)
          .join("")
          .padEnd(8, "0"),
        2,
      ),
    );
  }

  return codewords;
}

function codewordsToBits(codewords) {
  return codewords.flatMap((codeword) => toBits(codeword, 8));
}

function toBits(value, bitLength) {
  return value.toString(2).padStart(bitLength, "0").slice(-bitLength).split("");
}

function getReedSolomonRemainder(dataCodewords, errorCorrectionCodewordCount) {
  const generator = getGeneratorPolynomial(errorCorrectionCodewordCount);
  const message = [
    ...dataCodewords,
    ...Array(errorCorrectionCodewordCount).fill(0),
  ];

  for (let index = 0; index < dataCodewords.length; index += 1) {
    const factor = message[index];
    if (factor === 0) {
      continue;
    }

    for (
      let generatorIndex = 0;
      generatorIndex < generator.length;
      generatorIndex += 1
    ) {
      message[index + generatorIndex] ^= gfMultiply(
        generator[generatorIndex],
        factor,
      );
    }
  }

  return message.slice(-errorCorrectionCodewordCount);
}

function getGeneratorPolynomial(degree) {
  let polynomial = [1];

  for (let degreeIndex = 0; degreeIndex < degree; degreeIndex += 1) {
    polynomial = multiplyPolynomials(polynomial, [1, gfPow(2, degreeIndex)]);
  }

  return polynomial;
}

function multiplyPolynomials(first, second) {
  const result = Array(first.length + second.length - 1).fill(0);

  for (let firstIndex = 0; firstIndex < first.length; firstIndex += 1) {
    for (let secondIndex = 0; secondIndex < second.length; secondIndex += 1) {
      result[firstIndex + secondIndex] ^= gfMultiply(
        first[firstIndex],
        second[secondIndex],
      );
    }
  }

  return result;
}

function gfPow(value, exponent) {
  let result = 1;

  for (let index = 0; index < exponent; index += 1) {
    result = gfMultiply(result, value);
  }

  return result;
}

function gfMultiply(first, second) {
  let product = 0;
  let left = first;
  let right = second;

  while (right > 0) {
    if ((right & 1) !== 0) {
      product ^= left;
    }

    left <<= 1;
    if ((left & 0x100) !== 0) {
      left ^= 0x11d;
    }
    right >>= 1;
  }

  return product;
}

function getReservedModules(versionSpec) {
  const reservedModules = new Set();
  const rectangleZoneKeys = [
    "finder_patterns",
    "separators",
    "timing_patterns",
    "alignment_patterns",
    "dark_module",
    "format_information_areas",
    "version_information_areas",
  ];
  const bitZoneKeys = [
    "error_correction_level_indicator",
    "masking_pattern_indicator",
    "format_bch_error_correction",
    "version_number_indicator",
    "version_bch_error_correction",
  ];

  for (const zoneKey of rectangleZoneKeys) {
    for (const rectangle of getZoneEntries(versionSpec, zoneKey)) {
      addRectangleModules(reservedModules, rectangle);
    }
  }

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
