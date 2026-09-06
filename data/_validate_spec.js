const spec = require("./specs/deathknight_blood.json");
const schema = require("./schema.json");

function typeOf(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

function validate(node, defs, value, path) {
  const errors = [];
  if (node.$ref) {
    const name = node.$ref.split("/").pop();
    return validate(defs[name], defs, value, path);
  }
  if (node.type) {
    const types = Array.isArray(node.type) ? node.type : [node.type];
    const t = typeOf(value);
    const ok =
      types.includes(t) ||
      (types.includes("integer") && t === "number" && Number.isInteger(value));
    if (!ok) {
      errors.push(`${path} expected ${types.join("|")} got ${t}`);
      return errors;
    }
  }
  if (node.enum && !node.enum.includes(value)) errors.push(`${path} not in enum`);
  if (node.minimum != null && value < node.minimum) errors.push(`${path} below min`);
  if (node.type === "array") {
    if (node.minItems != null && value.length < node.minItems) errors.push(`${path} minItems`);
    if (node.maxItems != null && value.length > node.maxItems) errors.push(`${path} maxItems`);
    if (node.items) {
      value.forEach((item, i) => errors.push(...validate(node.items, defs, item, `${path}[${i}]`)));
    }
  }
  if (node.type === "object" || node.properties) {
    const extra = Object.keys(value).filter((k) => !(node.properties && node.properties[k]));
    if (node.additionalProperties === false && extra.length) {
      errors.push(`${path} extra ${extra.join(",")}`);
    }
    (node.required || []).forEach((k) => {
      if (!(k in value)) errors.push(`${path} missing ${k}`);
    });
    for (const [k, child] of Object.entries(node.properties || {})) {
      if (k in value) errors.push(...validate(child, defs, value[k], `${path}.${k}`));
    }
  }
  return errors;
}

const errors = validate(schema, schema.$defs, spec, "$");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("schema ok");
