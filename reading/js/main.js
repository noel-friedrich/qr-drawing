"use strict";

const ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
const ALIGNMENT_CENTERS = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
};
const REMAINDER_BITS = {
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

// Each entry is [number of blocks, total bytes per block, data bytes per block].
const RS_BLOCKS = {
  1: { L: [[1, 26, 19]], M: [[1, 26, 16]], Q: [[1, 26, 13]], H: [[1, 26, 9]] },
  2: { L: [[1, 44, 34]], M: [[1, 44, 28]], Q: [[1, 44, 22]], H: [[1, 44, 16]] },
  3: { L: [[1, 70, 55]], M: [[1, 70, 44]], Q: [[2, 35, 17]], H: [[2, 35, 13]] },
  4: { L: [[1, 100, 80]], M: [[2, 50, 32]], Q: [[2, 50, 24]], H: [[4, 25, 9]] },
  5: {
    L: [[1, 134, 108]],
    M: [[2, 67, 43]],
    Q: [
      [2, 33, 15],
      [2, 34, 16],
    ],
    H: [
      [2, 33, 11],
      [2, 34, 12],
    ],
  },
  6: { L: [[2, 86, 68]], M: [[4, 43, 27]], Q: [[4, 43, 19]], H: [[4, 43, 15]] },
  7: {
    L: [[2, 98, 78]],
    M: [[4, 49, 31]],
    Q: [
      [2, 32, 14],
      [4, 33, 15],
    ],
    H: [
      [4, 39, 13],
      [1, 40, 14],
    ],
  },
  8: {
    L: [[2, 121, 97]],
    M: [
      [2, 60, 38],
      [2, 61, 39],
    ],
    Q: [
      [4, 40, 18],
      [2, 41, 19],
    ],
    H: [
      [4, 40, 14],
      [2, 41, 15],
    ],
  },
  9: {
    L: [[2, 146, 116]],
    M: [
      [3, 58, 36],
      [2, 59, 37],
    ],
    Q: [
      [4, 36, 16],
      [4, 37, 17],
    ],
    H: [
      [4, 36, 12],
      [4, 37, 13],
    ],
  },
  10: {
    L: [
      [2, 86, 68],
      [2, 87, 69],
    ],
    M: [
      [4, 69, 43],
      [1, 70, 44],
    ],
    Q: [
      [6, 43, 19],
      [2, 44, 20],
    ],
    H: [
      [6, 43, 15],
      [2, 44, 16],
    ],
  },
};

const MASK_FORMULAS = [
  "(row + column) mod 2 = 0",
  "row mod 2 = 0",
  "column mod 3 = 0",
  "(row + column) mod 3 = 0",
  "(floor(row / 2) + floor(column / 3)) mod 2 = 0",
  "(row × column mod 2) + (row × column mod 3) = 0",
  "((row × column mod 2) + (row × column mod 3)) mod 2 = 0",
  "((row + column) mod 2 + (row × column) mod 3) mod 2 = 0",
];

const STRUCTURE_COLORS = {
  finder: "#74a9d8",
  separator: "#d9e8f5",
  timing: "#70b785",
  alignment: "#e7a15d",
  format: "#df7fa0",
  version: "#8e7ac1",
  dark: "#777",
};
const DECODE_COLORS = {
  mode: "#3276b1",
  length: "#e88b36",
  payload: "#7967ae",
};
const PATH_COLORS = {
  data: "#4f9d69",
  ecc: "#d7698b",
};

const elements = {
  version: document.querySelector("#version-select"),
  clear: document.querySelector("#clear-grid"),
  example: document.querySelector("#load-example"),
  imageInput: document.querySelector("#image-input"),
  canvas: document.querySelector("#image-canvas"),
  grid: document.querySelector("#qr-grid"),
  legend: document.querySelector("#grid-legend"),
  status: document.querySelector("#reader-status"),
  previewUnmasked: document.querySelector("#preview-unmasked"),
  measuredSize: document.querySelector("#measured-size"),
  versionCalculation: document.querySelector("#version-calculation"),
  detectedVersion: document.querySelector("#detected-version"),
  structureStrip: document.querySelector("#structure-strip"),
  versionNote: document.querySelector("#version-information-note"),
  formatA: document.querySelector("#format-copy-a"),
  formatUnmaskedBits: document.querySelector("#format-unmasked-bits"),
  maskPattern: document.querySelector("#mask-pattern"),
  maskFormula: document.querySelector("#mask-formula"),
  rawCodewords: document.querySelector("#raw-codewords"),
  remainderNote: document.querySelector("#remainder-note"),
  dataBlocks: document.querySelector("#data-blocks"),
  dataCodewords: document.querySelector("#data-codewords"),
  segments: document.querySelector("#segments"),
  decodedMessage: document.querySelector("#decoded-message"),
  alphanumericReference: document.querySelector(
    "#alphanumeric-reference-body",
  ),
  byteReferenceHead: document.querySelector("#byte-reference-head"),
  byteReferenceBody: document.querySelector("#byte-reference-body"),
};

const state = {
  version: 1,
  modules: [],
  stage: "input",
  analysis: null,
};

function sizeForVersion(version) {
  return 17 + 4 * version;
}

function moduleKey(row, column) {
  return `${row},${column}`;
}

function toHex(value) {
  return value.toString(16).toUpperCase().padStart(2, "0");
}

function toBits(value, width) {
  return value.toString(2).padStart(width, "0");
}

function byteTitle(value) {
  const bits = toBits(value, 8);
  return `${bits.slice(0, 4)} ${bits.slice(4)}`;
}

function byteListTitle(values) {
  return values.map(byteTitle).join(" | ");
}

function makeMatrix(size, value = false) {
  return Array.from({ length: size }, () => Array(size).fill(value));
}

function setFunction(map, row, column, type) {
  if (row >= 0 && row < map.length && column >= 0 && column < map.length) {
    map[row][column] = type;
  }
}

function drawFinderOnMap(map, startRow, startColumn) {
  for (let row = -1; row <= 7; row += 1) {
    for (let column = -1; column <= 7; column += 1) {
      const targetRow = startRow + row;
      const targetColumn = startColumn + column;
      const inside = row >= 0 && row <= 6 && column >= 0 && column <= 6;
      setFunction(
        map,
        targetRow,
        targetColumn,
        inside ? "finder" : "separator",
      );
    }
  }
}

function buildFunctionMap(version) {
  const size = sizeForVersion(version);
  const map = Array.from({ length: size }, () => Array(size).fill(""));

  drawFinderOnMap(map, 0, 0);
  drawFinderOnMap(map, 0, size - 7);
  drawFinderOnMap(map, size - 7, 0);

  for (let index = 8; index < size - 8; index += 1) {
    setFunction(map, 6, index, "timing");
    setFunction(map, index, 6, "timing");
  }

  for (const centerRow of ALIGNMENT_CENTERS[version]) {
    for (const centerColumn of ALIGNMENT_CENTERS[version]) {
      const existingType = map[centerRow][centerColumn];
      if (existingType && existingType !== "timing") {
        continue;
      }
      for (let row = -2; row <= 2; row += 1) {
        for (let column = -2; column <= 2; column += 1) {
          setFunction(map, centerRow + row, centerColumn + column, "alignment");
        }
      }
    }
  }

  for (const [row, column] of [...formatCopyA(size), ...formatCopyB(size)]) {
    setFunction(map, row, column, "format");
  }
  setFunction(map, size - 8, 8, "dark");

  if (version >= 7) {
    for (let index = 0; index < 18; index += 1) {
      const a = size - 11 + (index % 3);
      const b = Math.floor(index / 3);
      setFunction(map, b, a, "version");
      setFunction(map, a, b, "version");
    }
  }

  return map;
}

// Coordinates are listed in integer bit order: index 0 is the LSB.
function formatCopyA() {
  const coordinates = [];
  for (let index = 0; index <= 5; index += 1) coordinates.push([index, 8]);
  coordinates.push([7, 8], [8, 8], [8, 7]);
  for (let index = 9; index < 15; index += 1) coordinates.push([8, 14 - index]);
  return coordinates;
}

function formatCopyB(size) {
  const coordinates = [];
  for (let index = 0; index < 8; index += 1)
    coordinates.push([8, size - 1 - index]);
  for (let index = 8; index < 15; index += 1)
    coordinates.push([size - 15 + index, 8]);
  return coordinates;
}

function getDataPath(functionMap) {
  const path = [];
  const size = functionMap.length;
  let upward = true;

  for (let rightColumn = size - 1; rightColumn > 0; rightColumn -= 2) {
    if (rightColumn === 6) rightColumn -= 1;

    for (let offset = 0; offset < size; offset += 1) {
      const row = upward ? size - 1 - offset : offset;
      for (const column of [rightColumn, rightColumn - 1]) {
        if (!functionMap[row][column]) path.push({ row, column });
      }
    }
    upward = !upward;
  }
  return path;
}

function validateVersionGeometry() {
  for (let version = 1; version <= 10; version += 1) {
    const totals = ["L", "M", "Q", "H"].map((level) =>
      expandBlockDefinitions(version, level).reduce(
        (sum, block) => sum + block.totalCount,
        0,
      ),
    );
    if (!totals.every((total) => total === totals[0])) {
      throw new Error(
        `Version ${version} block definitions disagree on total codewords.`,
      );
    }

    const actualBits = getDataPath(buildFunctionMap(version)).length;
    const expectedBits = totals[0] * 8 + REMAINDER_BITS[version];
    if (actualBits !== expectedBits) {
      throw new Error(
        `Version ${version} has ${actualBits} data cells; expected ${expectedBits}.`,
      );
    }
  }
}

function getFormatCode(level, mask) {
  const levelBits = { L: 1, M: 0, Q: 3, H: 2 }[level];
  const data = (levelBits << 3) | mask;
  let remainder = data << 10;

  for (let bit = 14; bit >= 10; bit -= 1) {
    if (remainder & (1 << bit)) {
      remainder ^= 0x537 << (bit - 10);
    }
  }
  return ((data << 10) | (remainder & 0x3ff)) ^ 0x5412;
}

function readFormatInteger(coordinates) {
  return coordinates.reduce(
    (value, [row, column], index) =>
      value | (Number(state.modules[row][column]) << index),
    0,
  );
}

function decodeFormat() {
  const size = state.modules.length;
  const copyA = readFormatInteger(formatCopyA(size));
  const unmasked = copyA ^ 0x5412;
  const data = (unmasked >>> 10) & 0x1f;
  const levelBits = (data >>> 3) & 0b11;
  const mask = data & 0b111;
  const level = { 0b01: "L", 0b00: "M", 0b11: "Q", 0b10: "H" }[
    levelBits
  ];

  return {
    level,
    mask,
    copyA,
    copyABits: toBits(copyA, 15),
    unmaskedBits: toBits(unmasked, 15),
    dataBits: toBits(data, 5),
    levelBits: toBits(levelBits, 2),
    maskBits: toBits(mask, 3),
  };
}

function highlightMaskBits(bits) {
  return `${bits.slice(0, 2)}<span class="mask-bit-group">${bits.slice(2, 5)}</span>${bits.slice(5)}`;
}

function isMaskActive(pattern, row, column) {
  switch (pattern) {
    case 0:
      return (row + column) % 2 === 0;
    case 1:
      return row % 2 === 0;
    case 2:
      return column % 3 === 0;
    case 3:
      return (row + column) % 3 === 0;
    case 4:
      return (Math.floor(row / 2) + Math.floor(column / 3)) % 2 === 0;
    case 5:
      return ((row * column) % 2) + ((row * column) % 3) === 0;
    case 6:
      return (((row * column) % 2) + ((row * column) % 3)) % 2 === 0;
    case 7:
      return (((row + column) % 2) + ((row * column) % 3)) % 2 === 0;
    default:
      return false;
  }
}

function expandBlockDefinitions(version, level) {
  return RS_BLOCKS[version][level].flatMap(([count, total, data]) =>
    Array.from({ length: count }, () => ({
      totalCount: total,
      dataCount: data,
      eccCount: total - data,
      data: [],
      dataSourceIndices: [],
      ecc: [],
    })),
  );
}

function deinterleave(codewords, version, level) {
  const blocks = expandBlockDefinitions(version, level);
  const maxData = Math.max(...blocks.map((block) => block.dataCount));
  const maxEcc = Math.max(...blocks.map((block) => block.eccCount));
  let cursor = 0;

  for (let index = 0; index < maxData; index += 1) {
    for (const block of blocks) {
      if (index < block.dataCount) {
        block.data.push(codewords[cursor]);
        block.dataSourceIndices.push(cursor);
        cursor += 1;
      }
    }
  }
  for (let index = 0; index < maxEcc; index += 1) {
    for (const block of blocks) {
      if (index < block.eccCount) block.ecc.push(codewords[cursor++]);
    }
  }

  return {
    blocks,
    dataBytes: blocks.flatMap((block) => block.data),
    dataSourceIndices: blocks.flatMap((block) => block.dataSourceIndices),
    consumedCodewords: cursor,
  };
}

function extractCodewords(functionMap, format) {
  const path = getDataPath(functionMap);
  const rawBits = path.map(({ row, column }) => {
    const drawn = Number(state.modules[row][column]);
    return isMaskActive(format.mask, row, column) ? drawn ^ 1 : drawn;
  });
  const blockDefinitions = expandBlockDefinitions(state.version, format.level);
  const totalCodewords = blockDefinitions.reduce(
    (sum, block) => sum + block.totalCount,
    0,
  );
  const codewordBits = rawBits.slice(0, totalCodewords * 8);
  const codewords = [];

  for (let index = 0; index < codewordBits.length; index += 8) {
    codewords.push(
      Number.parseInt(codewordBits.slice(index, index + 8).join(""), 2),
    );
  }

  return {
    path,
    rawBits,
    codewords,
    totalCodewords,
    remainderBits: rawBits.slice(totalCodewords * 8),
  };
}

class BitReader {
  constructor(bytes) {
    this.bits = bytes.map((byte) => toBits(byte, 8)).join("");
    this.position = 0;
  }

  get remaining() {
    return this.bits.length - this.position;
  }

  read(width) {
    if (this.remaining < width)
      throw new Error(`Need ${width} bits, but only ${this.remaining} remain.`);
    const start = this.position;
    this.position += width;
    return {
      value: Number.parseInt(this.bits.slice(start, this.position), 2),
      bits: this.bits.slice(start, this.position),
      start,
      end: this.position,
    };
  }
}

function countWidth(mode, version) {
  const small = version <= 9;
  return {
    numeric: small ? 10 : 12,
    alphanumeric: small ? 9 : 11,
    byte: small ? 8 : 16,
    kanji: small ? 8 : 10,
  }[mode];
}

function decodeBytePayload(bytes, eci) {
  if (eci === 3)
    return new TextDecoder("iso-8859-1").decode(new Uint8Array(bytes));
  if (eci === 20)
    return new TextDecoder("shift_jis").decode(new Uint8Array(bytes));
  if (eci === 26) return new TextDecoder("utf-8").decode(new Uint8Array(bytes));

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(
      new Uint8Array(bytes),
    );
  } catch {
    return new TextDecoder("iso-8859-1").decode(new Uint8Array(bytes));
  }
}

function displayDecodedCharacter(character) {
  if (character === " ") return "space";
  if (character === "\n") return "\\n";
  if (character === "\r") return "\\r";
  if (character === "\t") return "\\t";
  if (
    !character ||
    character.codePointAt(0) < 32 ||
    character.codePointAt(0) === 127
  ) {
    return "control";
  }
  return character;
}

function makeByteBreakdown(bytes, eci) {
  let isUtf8 = eci === 26;
  if (eci !== 3 && eci !== 20 && eci !== 26) {
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes));
      isUtf8 = true;
    } catch {
      isUtf8 = false;
    }
  }

  return bytes.map((byte, index) => {
    let output;
    if (!isUtf8 || byte < 0x80) {
      output = displayDecodedCharacter(decodeBytePayload([byte], eci));
    } else if ((byte & 0xc0) === 0x80) {
      output = "continuation byte";
    } else {
      const width =
        (byte & 0xe0) === 0xc0 ? 2 : (byte & 0xf0) === 0xe0 ? 3 : 4;
      const sequence = bytes.slice(index, index + width);
      output = `${displayDecodedCharacter(
        new TextDecoder("utf-8").decode(new Uint8Array(sequence)),
      )} (${width}-byte UTF-8 sequence)`;
    }
    return {
      bits: toBits(byte, 8),
      value: toHex(byte),
      calculation: `Byte ${index + 1}`,
      output,
    };
  });
}

function decodeSegments(dataBytes, version) {
  const reader = new BitReader(dataBytes);
  const segments = [];
  const output = [];
  let activeEci = null;
  let error = "";

  try {
    while (reader.remaining >= 4) {
      const segmentStart = reader.position;
      const modeField = reader.read(4);
      if (modeField.value === 0) break;

      if (modeField.value === 7) {
        const first = reader.read(8);
        let assignment;
        let assignmentBits = first.bits;
        if ((first.value & 0x80) === 0) {
          assignment = first.value & 0x7f;
        } else if ((first.value & 0xc0) === 0x80) {
          const second = reader.read(8);
          assignment = ((first.value & 0x3f) << 8) | second.value;
          assignmentBits += second.bits;
        } else {
          const rest = reader.read(16);
          assignment = ((first.value & 0x1f) << 16) | rest.value;
          assignmentBits += rest.bits;
        }
        activeEci = assignment;
        segments.push({
          mode: "ECI",
          count: 1,
          text: `Assignment ${assignment}`,
          bits: modeField.bits + assignmentBits,
          start: segmentStart,
          modeStart: segmentStart,
          modeEnd: modeField.end,
          lengthStart: null,
          lengthEnd: null,
          payloadStart: modeField.end,
          payloadEnd: reader.position,
          breakdown: [],
          end: reader.position,
        });
        continue;
      }

      const mode = { 1: "numeric", 2: "alphanumeric", 4: "byte", 8: "kanji" }[
        modeField.value
      ];
      if (!mode)
        throw new Error(`Unsupported mode indicator ${modeField.bits}.`);
      const length = reader.read(countWidth(mode, version));
      let text = "";
      let payloadBits = "";
      const breakdown = [];

      if (mode === "numeric") {
        let remaining = length.value;
        while (remaining >= 3) {
          const group = reader.read(10);
          const decodedGroup = String(group.value).padStart(3, "0");
          payloadBits += group.bits;
          text += decodedGroup;
          breakdown.push({
            bits: group.bits,
            value: group.value,
            calculation: "10 bits to 3 digits",
            output: decodedGroup,
          });
          remaining -= 3;
        }
        if (remaining === 2) {
          const group = reader.read(7);
          const decodedGroup = String(group.value).padStart(2, "0");
          payloadBits += group.bits;
          text += decodedGroup;
          breakdown.push({
            bits: group.bits,
            value: group.value,
            calculation: "7 bits to 2 digits",
            output: decodedGroup,
          });
        } else if (remaining === 1) {
          const group = reader.read(4);
          payloadBits += group.bits;
          text += String(group.value);
          breakdown.push({
            bits: group.bits,
            value: group.value,
            calculation: "4 bits to 1 digit",
            output: String(group.value),
          });
        }
      } else if (mode === "alphanumeric") {
        let remaining = length.value;
        while (remaining >= 2) {
          const group = reader.read(11);
          payloadBits += group.bits;
          text += ALPHANUMERIC[Math.floor(group.value / 45)] ?? "�";
          text += ALPHANUMERIC[group.value % 45] ?? "�";
          const firstValue = Math.floor(group.value / 45);
          const secondValue = group.value % 45;
          breakdown.push({
            bits: group.bits,
            value: group.value,
            calculation: `${group.value} = 45 x ${firstValue} + ${secondValue}`,
            output:
              (ALPHANUMERIC[firstValue] ?? "?") +
              (ALPHANUMERIC[secondValue] ?? "?"),
          });
          remaining -= 2;
        }
        if (remaining === 1) {
          const group = reader.read(6);
          payloadBits += group.bits;
          text += ALPHANUMERIC[group.value] ?? "�";
          breakdown.push({
            bits: group.bits,
            value: group.value,
            calculation: "6-bit character value",
            output: ALPHANUMERIC[group.value] ?? "?",
          });
        }
      } else if (mode === "byte") {
        const bytes = [];
        for (let index = 0; index < length.value; index += 1) {
          const byte = reader.read(8);
          bytes.push(byte.value);
          payloadBits += byte.bits;
        }
        text = decodeBytePayload(bytes, activeEci);
        breakdown.push(...makeByteBreakdown(bytes, activeEci));
      } else {
        const bytes = [];
        for (let index = 0; index < length.value; index += 1) {
          const group = reader.read(13);
          payloadBits += group.bits;
          const intermediate =
            Math.floor(group.value / 0xc0) * 0x100 + (group.value % 0xc0);
          const shiftJis =
            intermediate + (intermediate < 0x1f00 ? 0x8140 : 0xc140);
          bytes.push(shiftJis >> 8, shiftJis & 0xff);
        }
        text = new TextDecoder("shift_jis").decode(new Uint8Array(bytes));
        breakdown.push({
          bits: payloadBits,
          value: "Shift JIS",
          calculation: `${length.value} x 13-bit Kanji values`,
          output: text,
        });
      }

      segments.push({
        mode,
        count: length.value,
        text,
        bits: modeField.bits + length.bits + payloadBits,
        start: segmentStart,
        modeStart: segmentStart,
        modeEnd: modeField.end,
        lengthStart: modeField.end,
        lengthEnd: length.end,
        payloadStart: length.end,
        payloadEnd: reader.position,
        breakdown,
        end: reader.position,
      });
      output.push(text);
    }
  } catch (caught) {
    error = caught.message;
  }

  return {
    segments,
    message: output.join(""),
    consumedBits: reader.position,
    error,
  };
}

function analyze() {
  const functionMap = buildFunctionMap(state.version);
  const format = decodeFormat();
  const extraction = extractCodewords(functionMap, format);
  const deinterleaved = deinterleave(
    extraction.codewords,
    state.version,
    format.level,
  );
  const decoded = decodeSegments(deinterleaved.dataBytes, state.version);

  state.analysis = { functionMap, format, extraction, deinterleaved, decoded };
  renderAnalysis();
  renderGrid();
}

function renderAnalysis() {
  const { format, extraction, deinterleaved, decoded } = state.analysis;
  const size = sizeForVersion(state.version);
  elements.measuredSize.textContent = `${size} × ${size}`;
  elements.versionCalculation.textContent = `(${size} - 17) / 4 = ${state.version}`;
  elements.detectedVersion.textContent = state.version;
  elements.versionNote.textContent =
    state.version >= 7
      ? "Versions 7-10 also carry an 18-bit BCH-protected version field in two places."
      : "Versions 1-6 are identified entirely from the matrix dimensions.";

  const structureParts = [
    ["Finders", "finder"],
    ["Timing", "timing"],
    ["Alignment", "alignment"],
    ["Format", "format"],
    [
      state.version >= 7 ? "Version bits" : "Data area",
      state.version >= 7 ? "version" : "dark",
    ],
  ];
  elements.structureStrip.innerHTML = structureParts
    .map(
      ([label, type]) =>
        `<span class="structure-part" style="--part:${STRUCTURE_COLORS[type]}">${label}</span>`,
    )
    .join("");

  elements.formatA.innerHTML = highlightMaskBits(format.copyABits);
  elements.formatUnmaskedBits.innerHTML = highlightMaskBits(
    format.unmaskedBits,
  );
  elements.maskPattern.textContent = `${format.maskBits} · Pattern ${format.mask}`;
  elements.maskFormula.textContent = MASK_FORMULAS[format.mask];

  const totalData = deinterleaved.dataBytes.length;
  elements.rawCodewords.innerHTML = extraction.codewords
    .map(
      (byte, index) =>
        `<span class="byte-chip ${index >= totalData ? "is-ecc" : ""}" title="${byteTitle(byte)}">${toHex(byte)}</span>`,
    )
    .join("");
  elements.remainderNote.textContent = extraction.remainderBits.length
    ? `${extraction.remainderBits.length} remainder bit${extraction.remainderBits.length === 1 ? "" : "s"} follow the final codeword: ${extraction.remainderBits.join("")}.`
    : "This version has no remainder bits after the final codeword.";
  elements.dataBlocks.innerHTML = deinterleaved.blocks
    .map(
      (block, index) => `
            <div class="block-row">
                <strong>Block ${index + 1}: ${block.dataCount} data + ${block.eccCount} ECC bytes</strong>
                <code title="${byteListTitle(block.data)}">Data: ${block.data.map(toHex).join(" ")}</code><br>
                <code title="${byteListTitle(block.ecc)}">ECC: ${block.ecc.map(toHex).join(" ")}</code>
            </div>
        `,
    )
    .join("");
  elements.dataCodewords.innerHTML = deinterleaved.dataBytes
    .map((byte) => `<span class="byte-chip" title="${byteTitle(byte)}">${toHex(byte)}</span>`)
    .join("");

  elements.segments.innerHTML = decoded.segments.length
    ? decoded.segments
        .map(
          (segment, index) => `
            <div class="segment">
                <strong>Segment ${index + 1}: ${segment.mode.toUpperCase()} · ${segment.count} ${segment.count === 1 ? "unit" : "units"}</strong>
                ${renderSegmentBits(segment)}
                ${renderPayloadBreakdown(segment)}
                <div>${escapeHtml(segment.text)}</div>
            </div>
        `,
        )
        .join("")
    : '<div class="segment"><strong>No complete segment found</strong><span>The first four data bits do not currently form a supported mode.</span></div>';
  elements.decodedMessage.textContent =
    decoded.message || "No decodable payload yet.";

  elements.status.className = "status";
  if (decoded.error) {
    elements.status.classList.add("is-warning");
    elements.status.textContent = `Using Format Copy A directly, payload decoding stopped: ${decoded.error}`;
  } else if (decoded.message) {
    elements.status.classList.add("is-success");
    elements.status.textContent = `Decoded ${decoded.segments.length} segment${decoded.segments.length === 1 ? "" : "s"} successfully.`;
  } else {
    elements.status.textContent =
      "Format Copy A has been read directly. Enter more modules to produce a complete payload.";
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderSegmentBits(segment) {
  const modeWidth = segment.modeEnd - segment.modeStart;
  const lengthWidth =
    segment.lengthStart === null ? 0 : segment.lengthEnd - segment.lengthStart;
  const modeBits = segment.bits.slice(0, modeWidth);
  const lengthBits = segment.bits.slice(modeWidth, modeWidth + lengthWidth);
  const payloadBits = segment.bits.slice(modeWidth + lengthWidth);

  return `
    <code class="segment-bits">
      <span class="mode-bits">${modeBits}</span>
      ${lengthBits ? `<span class="length-bits">${lengthBits}</span>` : ""}
      <span class="payload-bits">${payloadBits}</span>
    </code>
  `;
}

function renderPayloadBreakdown(segment) {
  if (!segment.breakdown?.length) return "";
  const valueHeading = segment.mode === "byte" ? "Hex" : "Decimal value";

  return `
    <div class="table-wrap payload-table-wrap">
      <table class="payload-breakdown">
        <thead>
          <tr>
            <th>Payload bits</th>
            <th>${valueHeading}</th>
            <th>Interpretation</th>
            <th>Decoded as</th>
          </tr>
        </thead>
        <tbody>
          ${segment.breakdown
            .map(
              (row) => `
                <tr>
                  <td><code>${escapeHtml(row.bits)}</code></td>
                  <td><code${
                    segment.mode === "byte"
                      ? ` title="${byteTitle(Number.parseInt(row.value, 16))}"`
                      : ""
                  }>${escapeHtml(row.value)}</code></td>
                  <td>${escapeHtml(row.calculation)}</td>
                  <td>${escapeHtml(row.output)}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderConversionReferences() {
  const columns = 3;
  const rows = Math.ceil(ALPHANUMERIC.length / columns);
  elements.alphanumericReference.innerHTML = Array.from(
    { length: rows },
    (_, row) => {
      const cells = [];
      for (let column = 0; column < columns; column += 1) {
        const value = row + column * rows;
        if (value < ALPHANUMERIC.length) {
          cells.push(
            `<td><code>${value}</code></td><td>${escapeHtml(
              displayDecodedCharacter(ALPHANUMERIC[value]),
            )}</td>`,
          );
        } else {
          cells.push("<td></td><td></td>");
        }
      }
      return `<tr>${cells.join("")}</tr>`;
    },
  ).join("");

  elements.byteReferenceHead.innerHTML = `
    <tr>
      <th>High</th>
      ${Array.from(
        { length: 16 },
        (_, value) =>
          `<th title="${toBits(value, 4)}">${value.toString(16).toUpperCase()}</th>`,
      ).join("")}
    </tr>
  `;
  elements.byteReferenceBody.innerHTML = Array.from(
    { length: 16 },
    (_, high) => `
      <tr>
        <th title="${toBits(high, 4)}">${high.toString(16).toUpperCase()}x</th>
        ${Array.from({ length: 16 }, (_, low) => {
          const value = high * 16 + low;
          const label =
            value >= 0x20 && value <= 0x7e
              ? displayDecodedCharacter(String.fromCharCode(value))
              : value < 0x80
                ? "control"
                : "UTF-8";
          return `<td><code title="${byteTitle(value)}">${toHex(value)}</code><br><small>${escapeHtml(label)}</small></td>`;
        }).join("")}
      </tr>
    `,
  ).join("");
}

function renderLegend(items) {
  elements.legend.innerHTML = items
    .map(
      ({ label, color }) => `
            <span class="legend-item">
                <span class="legend-swatch" style="--swatch:${color}"></span>
                ${label}
            </span>
        `,
    )
    .join("");
}

function stagePresentation() {
  switch (state.stage) {
    case "version":
      return {
        label: "Step 1 · Function structure",
        legend: Object.entries(STRUCTURE_COLORS).map(([label, color]) => ({
          label,
          color,
        })),
      };
    case "format":
      return {
        label: "Step 2 · Copy A mask indicator and unmasking",
        legend: [
          { label: "Copy A mask indicator", color: STRUCTURE_COLORS.format },
          {
            label: "Masked data cell",
            color: STRUCTURE_COLORS.orange ?? "#e88b36",
          },
        ],
      };
    case "path":
      return {
        label: "Step 3 · Zigzag bit and byte order",
        legend: [
          { label: "Data codeword", color: PATH_COLORS.data },
          { label: "Error-correction codeword", color: PATH_COLORS.ecc },
          { label: "Function modules skipped", color: "#aaa" },
        ],
      };
    case "decode":
      return {
        label: "Step 4 · Data bytes used by the decoder",
        legend: [
          { label: "4-bit mode indicator", color: DECODE_COLORS.mode },
          { label: "Character count field", color: DECODE_COLORS.length },
          { label: "Encoded payload", color: DECODE_COLORS.payload },
          { label: "Padding, ECC, and remainder", color: "#aaa" },
        ],
      };
    default:
      return { label: "Input modules", legend: [] };
  }
}

function renderGrid() {
  const { functionMap, format, extraction, deinterleaved } = state.analysis;
  const pathIndex = new Map(
    extraction.path.map(({ row, column }, index) => [
      moduleKey(row, column),
      index,
    ]),
  );
  const dataOrderByCodeword = new Map(
    deinterleaved.dataSourceIndices.map((sourceIndex, dataIndex) => [
      sourceIndex,
      dataIndex,
    ]),
  );
  const maskIndicatorKeys = new Set(
    formatCopyA(state.modules.length)
      .slice(10, 13)
      .map(([row, column]) => moduleKey(row, column)),
  );
  const fragment = document.createDocumentFragment();
  elements.grid.replaceChildren();
  elements.grid.style.setProperty("--size", state.modules.length);

  for (let row = 0; row < state.modules.length; row += 1) {
    for (let column = 0; column < state.modules.length; column += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "qr-cell";
      button.setAttribute("role", "gridcell");
      button.setAttribute(
        "aria-label",
        `Row ${row}, column ${column}, ${state.modules[row][column] ? "black" : "white"}`,
      );
      if (state.modules[row][column]) button.classList.add("is-black");

      const functionType = functionMap[row][column];
      const index = pathIndex.get(moduleKey(row, column));

      if (state.stage === "version") {
        if (functionType) {
          button.classList.add("is-highlighted");
          button.style.setProperty(
            "--highlight",
            STRUCTURE_COLORS[functionType],
          );
        } else {
          button.classList.add("is-dimmed");
        }
      } else if (state.stage === "format") {
        if (maskIndicatorKeys.has(moduleKey(row, column))) {
          button.classList.add("is-highlighted");
          button.style.setProperty("--highlight", STRUCTURE_COLORS.format);
        } else if (!functionType && elements.previewUnmasked.checked) {
          button.classList.add("is-unmasked-preview");
          const raw =
            Number(state.modules[row][column]) ^
            Number(isMaskActive(format.mask, row, column));
          if (raw) button.classList.add("is-preview-black");
          if (isMaskActive(format.mask, row, column)) {
            button.classList.add("is-highlighted");
            button.style.setProperty("--highlight", "#e88b36");
          }
        } else if (functionType) {
          button.classList.add("is-dimmed");
        }
      } else if (state.stage === "path") {
        if (index !== undefined) {
          const sourceCodeword = Math.floor(index / 8);
          const isDataCodeword = dataOrderByCodeword.has(sourceCodeword);
          const pathColor = isDataCodeword ? PATH_COLORS.data : PATH_COLORS.ecc;
          button.classList.add("is-unmasked-preview");
          const raw =
            Number(state.modules[row][column]) ^
            Number(isMaskActive(format.mask, row, column));
          if (raw) button.classList.add("is-preview-black");
          button.classList.add("is-highlighted");
          button.style.setProperty("--highlight", pathColor);
          button.style.setProperty("--label-color", pathColor);
          button.dataset.label = String((index % 8) + 1);
        } else {
          button.classList.add("is-dimmed");
        }
      } else if (state.stage === "decode") {
        const sourceCodeword =
          index === undefined ? null : Math.floor(index / 8);
        const dataOrder = dataOrderByCodeword.get(sourceCodeword);
        const decodedBitIndex =
          dataOrder === undefined ? null : dataOrder * 8 + (index % 8);
        const segment = state.analysis.decoded.segments.find(
          (entry) =>
            decodedBitIndex !== null &&
            decodedBitIndex >= entry.start &&
            decodedBitIndex < entry.end,
        );
        let bitKind = "";

        if (
          segment &&
          decodedBitIndex >= segment.modeStart &&
          decodedBitIndex < segment.modeEnd
        ) {
          bitKind = "mode";
        } else if (
          segment &&
          segment.lengthStart !== null &&
          decodedBitIndex >= segment.lengthStart &&
          decodedBitIndex < segment.lengthEnd
        ) {
          bitKind = "length";
        } else if (
          segment &&
          decodedBitIndex >= segment.payloadStart &&
          decodedBitIndex < segment.payloadEnd
        ) {
          bitKind = "payload";
        }

        if (!bitKind) {
          button.classList.add("is-dimmed");
        } else {
          button.classList.add("is-unmasked-preview", "is-highlighted");
          const raw =
            Number(state.modules[row][column]) ^
            Number(isMaskActive(format.mask, row, column));
          if (raw) button.classList.add("is-preview-black");
          button.style.setProperty("--highlight", DECODE_COLORS[bitKind]);
        }
      }

      button.addEventListener("click", () => {
        state.modules[row][column] = !state.modules[row][column];
        analyze();
      });
      fragment.appendChild(button);
    }
  }
  elements.grid.appendChild(fragment);

  const presentation = stagePresentation();
  renderLegend(presentation.legend);
  document.querySelectorAll(".show-step").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.stage === state.stage);
  });
}

function setVersion(version, preserve = false) {
  state.version = version;
  const size = sizeForVersion(version);
  if (!preserve || state.modules.length !== size)
    state.modules = makeMatrix(size);
  elements.version.value = String(version);
  analyze();
}

function setFunctionValue(values, row, column, value) {
  if (
    row >= 0 &&
    row < values.length &&
    column >= 0 &&
    column < values.length
  ) {
    values[row][column] = Boolean(value);
  }
}

function drawFinderValues(values, startRow, startColumn) {
  for (let row = -1; row <= 7; row += 1) {
    for (let column = -1; column <= 7; column += 1) {
      const inside = row >= 0 && row <= 6 && column >= 0 && column <= 6;
      const dark =
        inside &&
        (row === 0 ||
          row === 6 ||
          column === 0 ||
          column === 6 ||
          (row >= 2 && row <= 4 && column >= 2 && column <= 4));
      setFunctionValue(values, startRow + row, startColumn + column, dark);
    }
  }
}

function drawAlignmentValues(values, centerRow, centerColumn) {
  for (let row = -2; row <= 2; row += 1) {
    for (let column = -2; column <= 2; column += 1) {
      const distance = Math.max(Math.abs(row), Math.abs(column));
      setFunctionValue(
        values,
        centerRow + row,
        centerColumn + column,
        distance === 2 || distance === 0,
      );
    }
  }
}

function getVersionCode(version) {
  let remainder = version << 12;
  for (let bit = 17; bit >= 12; bit -= 1) {
    if (remainder & (1 << bit)) {
      remainder ^= 0x1f25 << (bit - 12);
    }
  }
  return (version << 12) | (remainder & 0xfff);
}

function gfMultiply(left, right) {
  let result = 0;
  let a = left;
  let b = right;

  while (b > 0) {
    if (b & 1) result ^= a;
    b >>>= 1;
    a <<= 1;
    if (a & 0x100) a ^= 0x11d;
  }
  return result & 0xff;
}

function makeReedSolomonDivisor(degree) {
  const divisor = Array(degree).fill(0);
  divisor[degree - 1] = 1;
  let root = 1;

  for (let index = 0; index < degree; index += 1) {
    for (let coefficient = 0; coefficient < degree; coefficient += 1) {
      divisor[coefficient] = gfMultiply(divisor[coefficient], root);
      if (coefficient + 1 < degree) {
        divisor[coefficient] ^= divisor[coefficient + 1];
      }
    }
    root = gfMultiply(root, 2);
  }
  return divisor;
}

function makeReedSolomonRemainder(data, degree) {
  const divisor = makeReedSolomonDivisor(degree);
  const result = Array(degree).fill(0);

  for (const byte of data) {
    const factor = byte ^ result.shift();
    result.push(0);
    for (let index = 0; index < result.length; index += 1) {
      result[index] ^= gfMultiply(divisor[index], factor);
    }
  }
  return result;
}

function makeHelloDataCodewords(version) {
  const blocks = expandBlockDefinitions(version, "L");
  const capacity = blocks.reduce((sum, block) => sum + block.dataCount, 0);
  const countWidth = version <= 9 ? 8 : 16;
  const bytes = Array.from(new TextEncoder().encode("HELLO"));
  let bits = `0100${toBits(bytes.length, countWidth)}${bytes
    .map((byte) => toBits(byte, 8))
    .join("")}`;
  const capacityBits = capacity * 8;

  bits += "0".repeat(Math.min(4, capacityBits - bits.length));
  bits += "0".repeat((8 - (bits.length % 8)) % 8);

  const dataCodewords = [];
  for (let index = 0; index < bits.length; index += 8) {
    dataCodewords.push(Number.parseInt(bits.slice(index, index + 8), 2));
  }
  for (let pad = 0; dataCodewords.length < capacity; pad += 1) {
    dataCodewords.push(pad % 2 === 0 ? 0xec : 0x11);
  }
  return dataCodewords;
}

function makeInterleavedHelloCodewords(version) {
  const blockDefinitions = expandBlockDefinitions(version, "L");
  const dataCodewords = makeHelloDataCodewords(version);
  const blocks = [];
  let offset = 0;

  for (const definition of blockDefinitions) {
    const data = dataCodewords.slice(offset, offset + definition.dataCount);
    offset += definition.dataCount;
    blocks.push({
      ...definition,
      data,
      ecc: makeReedSolomonRemainder(data, definition.eccCount),
    });
  }

  const interleaved = [];
  const maxData = Math.max(...blocks.map((block) => block.dataCount));
  const maxEcc = Math.max(...blocks.map((block) => block.eccCount));
  for (let index = 0; index < maxData; index += 1) {
    for (const block of blocks) {
      if (index < block.data.length) interleaved.push(block.data[index]);
    }
  }
  for (let index = 0; index < maxEcc; index += 1) {
    for (const block of blocks) {
      if (index < block.ecc.length) interleaved.push(block.ecc[index]);
    }
  }
  return interleaved;
}

function makeHelloExampleModules(version) {
  const size = sizeForVersion(version);
  const values = makeMatrix(size);
  const functionMap = buildFunctionMap(version);
  drawFinderValues(values, 0, 0);
  drawFinderValues(values, 0, size - 7);
  drawFinderValues(values, size - 7, 0);

  for (let index = 8; index < size - 8; index += 1) {
    values[6][index] = index % 2 === 0;
    values[index][6] = index % 2 === 0;
  }

  for (const centerRow of ALIGNMENT_CENTERS[version]) {
    for (const centerColumn of ALIGNMENT_CENTERS[version]) {
      const overlapsFinder =
        (centerRow <= 8 && centerColumn <= 8) ||
        (centerRow <= 8 && centerColumn >= size - 9) ||
        (centerRow >= size - 9 && centerColumn <= 8);
      if (!overlapsFinder) {
        drawAlignmentValues(values, centerRow, centerColumn);
      }
    }
  }
  values[size - 8][8] = true;

  if (version >= 7) {
    const versionCode = getVersionCode(version);
    for (let index = 0; index < 18; index += 1) {
      const a = size - 11 + (index % 3);
      const b = Math.floor(index / 3);
      const value = Boolean((versionCode >>> index) & 1);
      values[b][a] = value;
      values[a][b] = value;
    }
  }

  const formatCode = getFormatCode("L", 1);
  [formatCopyA(size), formatCopyB(size)].forEach((copy) => {
    copy.forEach(([row, column], index) => {
      values[row][column] = Boolean((formatCode >>> index) & 1);
    });
  });

  const codewords = makeInterleavedHelloCodewords(version);
  const bits = codewords.flatMap((byte) => [...toBits(byte, 8)].map(Number));
  getDataPath(functionMap).forEach(({ row, column }, index) => {
    const raw = bits[index] ?? 0;
    values[row][column] = Boolean(raw ^ Number(isMaskActive(1, row, column)));
  });

  return values;
}

function loadHelloExample() {
  const version = Number(elements.version.value);
  state.modules = makeHelloExampleModules(version);
  state.stage = "input";
  state.version = version;
  analyze();
}

function validateHelloExamples() {
  const originalVersion = state.version;
  const originalModules = state.modules;

  for (let version = 1; version <= 10; version += 1) {
    state.version = version;
    state.modules = makeHelloExampleModules(version);
    const functionMap = buildFunctionMap(version);
    const format = decodeFormat();
    const extraction = extractCodewords(functionMap, format);
    const deinterleaved = deinterleave(
      extraction.codewords,
      version,
      format.level,
    );
    const decoded = decodeSegments(deinterleaved.dataBytes, version);

    if (
      format.level !== "L" ||
      format.mask !== 1 ||
      decoded.message !== "HELLO" ||
      decoded.segments[0]?.mode !== "byte"
    ) {
      throw new Error(`Version ${version} HELLO example failed validation.`);
    }
  }

  state.version = originalVersion;
  state.modules = originalModules;
}

async function importImage(file) {
  if (!file) return;
  const bitmap = await createImageBitmap(file);
  const canvas = elements.canvas;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const side = Math.min(bitmap.width, bitmap.height);
  canvas.width = side;
  canvas.height = side;
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    side,
    side,
  );
  bitmap.close();

  const image = context.getImageData(0, 0, side, side);
  const isDark = (x, y) => {
    const offset = (Math.floor(y) * side + Math.floor(x)) * 4;
    const luminance =
      image.data[offset] * 0.299 +
      image.data[offset + 1] * 0.587 +
      image.data[offset + 2] * 0.114;
    return image.data[offset + 3] > 80 && luminance < 150;
  };

  let minX = side;
  let minY = side;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < side; y += 1) {
    for (let x = 0; x < side; x += 1) {
      if (!isDark(x, y)) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY)
    throw new Error("No dark QR modules were found in the image.");

  const cropSize = Math.max(maxX - minX + 1, maxY - minY + 1);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const cropLeft = centerX - cropSize / 2;
  const cropTop = centerY - cropSize / 2;
  const size = sizeForVersion(state.version);
  const modules = makeMatrix(size);
  const sampleRadius = Math.max(0, Math.floor(cropSize / size / 6));

  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const x = cropLeft + ((column + 0.5) * cropSize) / size;
      const y = cropTop + ((row + 0.5) * cropSize) / size;
      let darkSamples = 0;
      let samples = 0;
      for (let dy = -sampleRadius; dy <= sampleRadius; dy += 1) {
        for (let dx = -sampleRadius; dx <= sampleRadius; dx += 1) {
          const sx = Math.max(0, Math.min(side - 1, x + dx));
          const sy = Math.max(0, Math.min(side - 1, y + dy));
          darkSamples += Number(isDark(sx, sy));
          samples += 1;
        }
      }
      modules[row][column] = darkSamples > samples / 2;
    }
  }

  state.modules = modules;
  state.stage = "input";
  analyze();
}

for (let version = 1; version <= 10; version += 1) {
  const option = document.createElement("option");
  option.value = String(version);
  option.textContent = `Version ${version} (${sizeForVersion(version)} × ${sizeForVersion(version)})`;
  elements.version.appendChild(option);
}

validateVersionGeometry();
validateHelloExamples();
renderConversionReferences();

elements.version.addEventListener("change", () => {
  setVersion(Number(elements.version.value));
});
elements.clear.addEventListener("click", () => {
  state.modules = makeMatrix(sizeForVersion(state.version));
  state.stage = "input";
  analyze();
});
elements.example.addEventListener("click", loadHelloExample);
elements.imageInput.addEventListener("change", async () => {
  try {
    await importImage(elements.imageInput.files[0]);
  } catch (error) {
    elements.status.className = "status is-warning";
    elements.status.textContent = error.message;
  } finally {
    elements.imageInput.value = "";
  }
});
elements.previewUnmasked.addEventListener("change", renderGrid);
document.querySelectorAll(".reference-links a").forEach((link) => {
  link.addEventListener("click", () => {
    const details = document.querySelector(link.getAttribute("href"));
    if (details instanceof HTMLDetailsElement) details.open = true;
  });
});
document.querySelectorAll(".show-step").forEach((button) => {
  button.addEventListener("click", () => {
    state.stage =
      state.stage === button.dataset.stage ? "input" : button.dataset.stage;
    renderGrid();
  });
});

loadHelloExample();
