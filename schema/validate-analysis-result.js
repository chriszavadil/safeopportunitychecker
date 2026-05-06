import { readFileSync } from "node:fs";

export const analysisResultSchema = JSON.parse(
  readFileSync(new URL("./analysis-result.schema.json", import.meta.url), "utf8")
);

export function validateAnalysisResult(result) {
  return validateJsonSchema(result, analysisResultSchema);
}

export function assertValidAnalysisResult(result) {
  const validation = validateAnalysisResult(result);
  if (!validation.valid) {
    const details = validation.errors.slice(0, 5).join("; ");
    throw new Error(`Analysis result failed schema validation: ${details}`);
  }
}

export function validateJsonSchema(value, schema, path = "$") {
  const errors = [];
  validateValue(value, schema, path, errors);
  return {
    valid: errors.length === 0,
    errors
  };
}

function validateValue(value, schema, path, errors) {
  if (Object.hasOwn(schema, "const") && value !== schema.const) {
    errors.push(`${path} must equal ${JSON.stringify(schema.const)}`);
    return;
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path} must be one of ${schema.enum.join(", ")}`);
    return;
  }

  if (schema.type && !matchesType(value, schema.type)) {
    errors.push(`${path} must be ${schema.type}`);
    return;
  }

  if ((schema.type === "integer" || schema.type === "number") && typeof value === "number") {
    if (Number.isFinite(schema.minimum) && value < schema.minimum) {
      errors.push(`${path} must be >= ${schema.minimum}`);
    }
    if (Number.isFinite(schema.maximum) && value > schema.maximum) {
      errors.push(`${path} must be <= ${schema.maximum}`);
    }
  }

  if (schema.type === "object" && value && typeof value === "object" && !Array.isArray(value)) {
    validateObject(value, schema, path, errors);
  }

  if (schema.type === "array" && Array.isArray(value)) {
    validateArray(value, schema, path, errors);
  }
}

function validateObject(value, schema, path, errors) {
  const properties = schema.properties ?? {};
  const required = schema.required ?? [];

  for (const property of required) {
    if (!Object.hasOwn(value, property)) {
      errors.push(`${path}.${property} is required`);
    }
  }

  if (schema.additionalProperties === false) {
    for (const property of Object.keys(value)) {
      if (!Object.hasOwn(properties, property)) {
        errors.push(`${path}.${property} is not allowed`);
      }
    }
  }

  for (const [property, propertySchema] of Object.entries(properties)) {
    if (Object.hasOwn(value, property)) {
      validateValue(value[property], propertySchema, `${path}.${property}`, errors);
    }
  }
}

function validateArray(value, schema, path, errors) {
  if (Number.isInteger(schema.minItems) && value.length < schema.minItems) {
    errors.push(`${path} must contain at least ${schema.minItems} items`);
  }

  if (Number.isInteger(schema.maxItems) && value.length > schema.maxItems) {
    errors.push(`${path} must contain at most ${schema.maxItems} items`);
  }

  if (schema.items) {
    value.forEach((item, index) => validateValue(item, schema.items, `${path}[${index}]`, errors));
  }
}

function matchesType(value, type) {
  switch (type) {
    case "object":
      return Boolean(value) && typeof value === "object" && !Array.isArray(value);
    case "array":
      return Array.isArray(value);
    case "integer":
      return Number.isInteger(value);
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "string":
      return typeof value === "string";
    case "boolean":
      return typeof value === "boolean";
    default:
      return true;
  }
}
