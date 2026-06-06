import { getDataInputLimit } from "./data-encoding.js";

const dataTypeConfig = {
  numeric: {
    label: "Numeric data",
    hint: "Digits 0-9.",
    defaultValue: "67",
    render: () =>
      createInput({
        inputMode: "numeric",
        pattern: "[0-9]*",
      }),
  },
  alphanumeric: {
    label: "Alphanumeric data",
    hint: "Uppercase QR alphanumeric characters: 0-9, A-Z, space, $, %, *, +, -, ., /, :.",
    defaultValue: "HELLO WORLD",
    render: () =>
      createInput({
        autocapitalize: "characters",
      }),
  },
  byte: {
    label: "Byte text",
    hint: "Text encoded as UTF-8 bytes.",
    defaultValue: "Hello, World!",
    render: () => createTextarea(),
  },
  binary: {
    label: "Binary bytes",
    hint: "Write bytes as 8-bit groups separated by spaces.",
    defaultValue: "00001111 00110011 01010101",
    render: () => createTextarea(),
  },
};

export function createDataControls({ container, typeSelect }) {
  let capacity = {
    errorCorrectionLevel: "L",
    version: 1,
  };

  typeSelect.addEventListener("change", () => {
    renderField(typeSelect.value);
  });

  renderField(typeSelect.value);

  function renderField(type) {
    const config = dataTypeConfig[type];
    const field = document.createElement("label");
    field.className = "field sidebar-field";

    const label = document.createElement("span");
    label.textContent = config.label;

    const control = config.render();
    control.id = "data-value";
    control.name = "data-value";
    control.value = config.defaultValue;
    control.addEventListener("input", () => {
      control.value = sanitizeValue(type, control.value);
      updateHint(type, control, hint);
    });

    const hint = document.createElement("span");
    hint.className = "field-hint";

    field.append(label, control, hint);
    container.replaceChildren(field);
    updateHint(type, control, hint);
  }

  function getData() {
    return {
      type: typeSelect.value,
      value: container.querySelector("#data-value")?.value ?? "",
    };
  }

  function setCapacity(nextCapacity) {
    capacity = nextCapacity;
    const control = container.querySelector("#data-value");
    const hint = container.querySelector(".field-hint");

    if (control && hint) {
      control.value = sanitizeValue(typeSelect.value, control.value);
      updateHint(typeSelect.value, control, hint);
    }
  }

  function sanitizeValue(type, value) {
    const limit = getDataInputLimit(
      type,
      capacity.version,
      capacity.errorCorrectionLevel,
    );

    if (type === "numeric") {
      return value.replace(/\D/g, "").slice(0, limit);
    }

    if (type === "alphanumeric") {
      return [...value]
        .filter((character) =>
          "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:".includes(character),
        )
        .join("")
        .slice(0, limit);
    }

    if (type === "binary") {
      const bits = value.replace(/[^01]/g, "").slice(0, limit * 8);
      return bits.match(/.{1,8}/g)?.join(" ") ?? "";
    }

    return truncateUtf8(value, limit);
  }

  function updateHint(type, control, hint) {
    const config = dataTypeConfig[type];
    const limit = getDataInputLimit(
      type,
      capacity.version,
      capacity.errorCorrectionLevel,
    );
    const current = getValueUnits(type, control.value);

    hint.textContent = `${config.hint} ${current}/${limit}`;
    control.setAttribute("aria-describedby", "data-field-hint");
    hint.id = "data-field-hint";
  }

  return {
    getData,
    setCapacity,
  };
}

function createInput(attributes) {
  const input = document.createElement("input");
  input.type = "text";

  for (const [name, value] of Object.entries(attributes)) {
    input.setAttribute(name, value);
  }

  return input;
}

function createTextarea() {
  const textarea = document.createElement("textarea");

  return textarea;
}

function truncateUtf8(value, maximumBytes) {
  const encoder = new TextEncoder();
  let result = "";

  for (const character of value) {
    if (encoder.encode(result + character).length > maximumBytes) {
      break;
    }

    result += character;
  }

  return result;
}

function getValueUnits(type, value) {
  if (type === "byte") {
    return new TextEncoder().encode(value).length;
  }

  if (type === "binary") {
    return Math.ceil(value.replace(/[^01]/g, "").length / 8);
  }

  return value.length;
}
