// Lightweight structural validator for the Node -> Python intermediate
// contract (specs/005-pptx-export-script/contracts/slide-layout-data.schema.json).
// Deliberately hand-rolled instead of pulling in a JSON Schema library: the
// contract is small and stable, and this keeps the extraction step
// dependency-free.

const ELEMENT_ROLES = new Set([
  "title",
  "subtitle",
  "body",
  "caption",
  "meta",
  "image",
  "chart",
  "other",
]);

const FRAME_KINDS = new Set(["classification", "copyright", "page_number"]);

function fail(errors, path, message) {
  errors.push(`${path}: ${message}`);
}

function isBBox(value) {
  return (
    value &&
    typeof value === "object" &&
    ["x", "y", "w", "h"].every((k) => typeof value[k] === "number")
  );
}

function validateComputedStyle(style, path, errors) {
  if (!style || typeof style !== "object") {
    fail(errors, path, "computed_style is required");
    return;
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(style.color_hex ?? "")) {
    fail(errors, path, "color_hex must be a #RRGGBB string");
  }
  if (typeof style.font_family !== "string" || style.font_family.length === 0) {
    fail(errors, path, "font_family is required");
  }
  if (typeof style.font_size_px !== "number") {
    fail(errors, path, "font_size_px must be a number");
  }
  if (![400, 700].includes(style.font_weight)) {
    fail(errors, path, "font_weight must be 400 or 700");
  }
  if (typeof style.line_height_px !== "number") {
    fail(errors, path, "line_height_px must be a number");
  }
  if (typeof style.token_role !== "string" || !style.token_role.startsWith("--")) {
    fail(errors, path, "token_role must start with '--'");
  }
}

function validateElement(el, path, errors) {
  if (!ELEMENT_ROLES.has(el.role)) {
    fail(errors, path, `role '${el.role}' is not a known SlideElement role`);
  }
  if (!isBBox(el.bbox_px)) fail(errors, path, "bbox_px must have numeric x/y/w/h");
  if (!isBBox(el.bbox_ratio)) fail(errors, path, "bbox_ratio must have numeric x/y/w/h");
  validateComputedStyle(el.computed_style, `${path}.computed_style`, errors);
  if (typeof el.reading_order_index !== "number") {
    fail(errors, path, "reading_order_index must be a number");
  }
  if (el.fallback && typeof el.fallback.is_fallback !== "boolean") {
    fail(errors, path, "fallback.is_fallback must be a boolean when present");
  }
}

function validateFrameElement(fe, path, errors) {
  if (!FRAME_KINDS.has(fe.kind)) {
    fail(errors, path, `kind '${fe.kind}' is not a known FrameElement kind`);
  }
  if (typeof fe.text_template !== "string") {
    fail(errors, path, "text_template must be a string");
  }
  if (!isBBox(fe.position)) {
    fail(errors, path, "position must have numeric x/y/w/h");
  }
}

/**
 * Validate a SlideLayoutData object against the intermediate JSON contract.
 * Returns { valid: boolean, errors: string[] }.
 */
export function validateSlideLayoutData(data) {
  const errors = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["root: input must be an object"] };
  }
  if (!Array.isArray(data.layouts) || data.layouts.length === 0) {
    fail(errors, "root", "layouts must be a non-empty array");
    return { valid: false, errors };
  }
  if (data.layouts.length > 16) {
    fail(errors, "root", "layouts must contain at most 16 entries");
  }

  data.layouts.forEach((layout, i) => {
    const path = `layouts[${i}]`;
    if (!/^[0-9]{2}-[a-z-]+$/.test(layout.layout_id ?? "")) {
      fail(errors, path, "layout_id must match NN-name");
    }
    if (!layout.layout_name_ja) {
      fail(errors, path, "layout_name_ja is required");
    }
    if (!layout.source_path) {
      fail(errors, path, "source_path is required");
    }
    (layout.elements ?? []).forEach((el, j) =>
      validateElement(el, `${path}.elements[${j}]`, errors)
    );
    (layout.frame_elements ?? []).forEach((fe, j) =>
      validateFrameElement(fe, `${path}.frame_elements[${j}]`, errors)
    );
  });

  if (data.tokens !== undefined) {
    if (typeof data.tokens !== "object") {
      fail(errors, "root.tokens", "tokens must be an object of role -> string");
    } else {
      for (const [role, value] of Object.entries(data.tokens)) {
        if (typeof value !== "string") {
          fail(errors, `root.tokens.${role}`, "token value must be a string");
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
