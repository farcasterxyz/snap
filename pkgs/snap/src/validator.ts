import { z } from "zod";
import { snapResponseSchema } from "./schemas";
import { MAX_CHILDREN, MAX_DEPTH, MAX_ELEMENTS, MAX_ROOT_CHILDREN, SPEC_VERSION_1 } from "./constants";
import { snapJsonRenderCatalog } from "./ui/catalog.js";

export type ValidationResult = {
  valid: boolean;
  issues: z.core.$ZodIssue[];
};

// ─── Helpers ──────────────────────────────────────────

/** Actions whose `params.target` must be a valid URL. */
const URL_TARGET_ACTIONS = new Set(["submit", "open_url", "open_mini_app"]);

/** Image file extensions allowed in image URLs. */
const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);

/**
 * Returns true if the URL is a loopback address (localhost dev exception).
 */
function isLoopback(url: URL): boolean {
  const host = url.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
}

/**
 * Validate a URL string: must be HTTPS (or HTTP on loopback for dev).
 * Returns an error message or null if valid.
 */
function validateUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return `Invalid URL: "${raw}"`;
  }

  if (url.protocol === "https:") return null;
  if (url.protocol === "http:" && isLoopback(url)) return null;
  if (url.protocol === "javascript:") return `javascript: URIs are not allowed`;

  return `URL must use HTTPS (got ${url.protocol.replace(":", "")}): "${raw}"`;
}

/**
 * Validate an image URL: must pass URL validation + have an allowed extension.
 */
function validateImageUrl(raw: string): string | null {
  const urlError = validateUrl(raw);
  if (urlError) return urlError;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null; // already caught above
  }

  const pathname = url.pathname;
  const lastDot = pathname.lastIndexOf(".");
  if (lastDot === -1) {
    return `Image URL must end with a supported extension (${[...ALLOWED_IMAGE_EXTENSIONS].join(", ")}): "${raw}"`;
  }

  const ext = pathname.slice(lastDot + 1).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    return `Image URL has unsupported extension ".${ext}" (allowed: ${[...ALLOWED_IMAGE_EXTENSIONS].join(", ")}): "${raw}"`;
  }

  return null;
}

// ─── Depth measurement ────────────────────────────────

/**
 * Walk the element tree from `root` and return the max depth reached.
 * Avoids infinite loops by tracking visited element ids.
 */
function measureDepth(
  elements: Record<string, { children?: string[] }>,
  id: string,
  visited: Set<string> = new Set(),
): number {
  if (visited.has(id)) return 0;
  visited.add(id);

  const el = elements[id];
  if (!el?.children?.length) return 1;

  let max = 0;
  for (const childId of el.children) {
    max = Math.max(max, measureDepth(elements, childId, visited));
  }
  return 1 + max;
}

// ─── Element types for traversal ──────────────────────

type ElementShape = {
  type?: string;
  children?: string[];
  props?: Record<string, unknown>;
  on?: Record<string, { action?: string; params?: Record<string, unknown> }>;
};

// ─── Structural validation ────────────────────────────

/**
 * Validate structural constraints on the snap UI tree:
 * - root must reference an existing element
 * - Total element count ≤ MAX_ELEMENTS
 * - Children per element ≤ MAX_CHILDREN
 * - Nesting depth ≤ MAX_DEPTH
 */
function validateStructure(
  ui: { root: string; elements: Record<string, unknown> },
): z.core.$ZodIssue[] {
  const issues: z.core.$ZodIssue[] = [];
  const elements = ui.elements as Record<string, ElementShape>;

  const elementCount = Object.keys(elements).length;
  if (elementCount > MAX_ELEMENTS) {
    issues.push({
      code: "custom",
      message: `Snap exceeds maximum of ${MAX_ELEMENTS} elements (found ${elementCount})`,
      path: ["ui", "elements"],
    });
  }

  // Root element has a stricter children limit
  const rootEl = elements[ui.root];
  if (rootEl?.children && rootEl.children.length > MAX_ROOT_CHILDREN) {
    issues.push({
      code: "custom",
      message: `Root element "${ui.root}" exceeds maximum of ${MAX_ROOT_CHILDREN} children (found ${rootEl.children.length})`,
      path: ["ui", "elements", ui.root, "children"],
    });
  }

  for (const [id, el] of Object.entries(elements)) {
    if (id === ui.root) continue; // already checked above
    if (el.children && el.children.length > MAX_CHILDREN) {
      issues.push({
        code: "custom",
        message: `Element "${id}" exceeds maximum of ${MAX_CHILDREN} children (found ${el.children.length})`,
        path: ["ui", "elements", id, "children"],
      });
    }
  }

  const depth = measureDepth(
    elements as Record<string, { children?: string[] }>,
    ui.root,
  );
  if (depth > MAX_DEPTH) {
    issues.push({
      code: "custom",
      message: `Snap exceeds maximum nesting depth of ${MAX_DEPTH} (found ${depth})`,
      path: ["ui", "root"],
    });
  }

  return issues;
}

// ─── URL validation ───────────────────────────────────

/**
 * Validate all URLs in the snap:
 * - image.url: must be HTTPS with allowed extension
 * - action target URLs (submit, open_url, open_mini_app): must be HTTPS
 */
function validateUrls(
  elements: Record<string, unknown>,
): z.core.$ZodIssue[] {
  const issues: z.core.$ZodIssue[] = [];
  const els = elements as Record<string, ElementShape>;

  for (const [id, el] of Object.entries(els)) {
    // Validate image URLs
    if (el.type === "image" && typeof el.props?.url === "string") {
      const error = validateImageUrl(el.props.url);
      if (error) {
        issues.push({
          code: "custom",
          message: error,
          path: ["ui", "elements", id, "props", "url"],
        });
      }
    }

    // Validate action target URLs
    if (el.on) {
      for (const [event, binding] of Object.entries(el.on)) {
        if (
          binding &&
          URL_TARGET_ACTIONS.has(binding.action ?? "") &&
          typeof binding.params?.target === "string"
        ) {
          const error = validateUrl(binding.params.target);
          if (error) {
            issues.push({
              code: "custom",
              message: error,
              path: ["ui", "elements", id, "on", event, "params", "target"],
            });
          }
        }
      }
    }
  }

  return issues;
}

// ─── Public API ───────────────────────────────────────

/**
 * Validates a snap response against the schema, structural constraints, and URL rules.
 * Element-level prop validation is handled by the json-render catalog.
 * This validates the snap envelope (version, theme, effects, spec shape)
 * and enforces structural limits (element count, children, depth) and URL validation.
 */
export function validateSnapResponse(json: unknown): ValidationResult {
  const parsed = snapResponseSchema.safeParse(json);
  if (!parsed.success) {
    return {
      valid: false,
      issues: parsed.error.issues,
    };
  }

  const ui = parsed.data.ui;

  // Root reference check applies to all versions
  if (!(ui.root in ui.elements)) {
    return {
      valid: false,
      issues: [{
        code: "custom",
        message: `ui.root "${ui.root}" does not exist in ui.elements`,
        path: ["ui", "root"],
      }],
    };
  }

  // Structural limits and URL validation only apply to v2+ snaps
  if (parsed.data.version !== SPEC_VERSION_1) {
    const structuralIssues = validateStructure(ui);
    if (structuralIssues.length > 0) {
      return { valid: false, issues: structuralIssues };
    }

    const urlIssues = validateUrls(ui.elements);
    if (urlIssues.length > 0) {
      return { valid: false, issues: urlIssues };
    }

    const catalogResult = snapJsonRenderCatalog.validate(ui);
    if (!catalogResult.success) {
      return { valid: false, issues: catalogResult.error?.issues ?? [] };
    }
  }

  return { valid: true, issues: [] };
}
