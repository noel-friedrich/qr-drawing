const dataTypeConfig = {
  numeric: {
    label: "Numeric data",
    hint: "Digits 0-9.",
    render: () => createInput({
      inputMode: "numeric",
      pattern: "[0-9]*",
      placeholder: "01234567",
    }),
  },
  alphanumeric: {
    label: "Alphanumeric data",
    hint: "Uppercase QR alphanumeric characters: 0-9, A-Z, space, $, %, *, +, -, ., /, :.",
    render: () => createInput({
      autocapitalize: "characters",
      placeholder: "HELLO WORLD",
    }),
  },
  byte: {
    label: "Byte text",
    hint: "Text that will later be encoded as bytes.",
    render: () => createTextarea("Hello, world!"),
  },
  binary: {
    label: "Binary bytes",
    hint: "Write bytes as 8-bit groups separated by spaces.",
    render: () => createTextarea("01001000 01101001"),
  },
};

export function createDataControls({ container, typeSelect }) {
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

    const hint = document.createElement("span");
    hint.className = "field-hint";
    hint.textContent = config.hint;

    field.append(label, control, hint);
    container.replaceChildren(field);
  }

  function getData() {
    return {
      type: typeSelect.value,
      value: container.querySelector("#data-value")?.value ?? "",
    };
  }

  return {
    getData,
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

function createTextarea(placeholder) {
  const textarea = document.createElement("textarea");
  textarea.placeholder = placeholder;

  return textarea;
}
