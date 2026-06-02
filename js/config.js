export const baseCellSize = 24;
export const minZoom = 0.2;
export const maxZoom = 8;
export const zoomStep = 0.25;

export const overlayPalette = {
  finder_patterns: {
    label: "Finder patterns",
    color: "rgba(76, 154, 255, 0.28)",
  },
  separators: {
    label: "Separators",
    color: "rgba(137, 204, 255, 0.35)",
  },
  timing_patterns: {
    label: "Timing patterns",
    color: "rgba(255, 151, 82, 0.32)",
  },
  alignment_patterns: {
    label: "Alignment patterns",
    color: "rgba(190, 128, 255, 0.3)",
  },
  dark_module: {
    label: "Dark module",
    color: "rgba(255, 87, 87, 0.35)",
  },
  error_correction_level_indicator: {
    label: "Error correction level",
    color: "rgba(83, 197, 164, 0.35)",
  },
  masking_pattern_indicator: {
    label: "Masking pattern indicator",
    color: "rgba(126, 222, 129, 0.42)",
  },
  format_bch_error_correction: {
    label: "Format error correction",
    color: "rgba(255, 105, 180, 0.36)",
  },
  version_number_indicator: {
    label: "Version number",
    color: "rgba(255, 180, 85, 0.36)",
  },
  version_bch_error_correction: {
    label: "Version error correction",
    color: "rgba(168, 142, 255, 0.34)",
  },
};

export const overlayOrder = Object.keys(overlayPalette);
