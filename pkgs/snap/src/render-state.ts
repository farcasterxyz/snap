export type SnapRenderState = Record<string, unknown>;

export type SnapRenderStateChanges =
  | { path: string; value: unknown }[]
  | Record<string, unknown>
  | null
  | undefined;

const SNAP_RENDER_STATE_META_KEY = "__snapRender";
const ACTION_ACTIVITY_KEY_MAX_LENGTH = 64;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeEffects(effects: readonly string[] | undefined): string[] {
  if (!effects) return [];

  return Array.from(
    new Set(
      effects.filter(
        (effect): effect is string =>
          typeof effect === "string" && effect.length > 0,
      ),
    ),
  );
}

function getRenderStateMeta(
  model: SnapRenderState,
): Record<string, unknown> | undefined {
  const meta = model[SNAP_RENDER_STATE_META_KEY];
  return isRecord(meta) ? meta : undefined;
}

function getPresentedSnapEffects(model: SnapRenderState): Set<string> {
  const presentedEffects = getRenderStateMeta(model)?.presentedEffects;
  if (!Array.isArray(presentedEffects)) return new Set();

  return new Set(
    presentedEffects.filter(
      (effect): effect is string =>
        typeof effect === "string" && effect.length > 0,
    ),
  );
}

export function cloneSnapRenderState<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneSnapRenderState(item)) as T;
  }

  if (isRecord(value)) {
    const next: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      next[key] = cloneSnapRenderState(nestedValue);
    }
    return next as T;
  }

  return value;
}

function mergeRenderState(
  base: Record<string, unknown>,
  override: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!override) return cloneSnapRenderState(base);

  const next = cloneSnapRenderState(base);
  for (const [key, value] of Object.entries(override)) {
    const existing = next[key];
    next[key] =
      isRecord(existing) && isRecord(value)
        ? mergeRenderState(existing, value)
        : cloneSnapRenderState(value);
  }

  return next;
}

function normalizeStatePath(path: string): string[] {
  const trimmed = path.startsWith("/") ? path.slice(1) : path;
  return trimmed.split("/").filter(Boolean);
}

function setStateValue(
  model: Record<string, unknown>,
  parts: string[],
  value: unknown,
) {
  let cursor = model;
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index]!;
    if (index === parts.length - 1) {
      cursor[part] = cloneSnapRenderState(value);
      return;
    }

    const next = cursor[part];
    if (!isRecord(next)) {
      cursor[part] = {};
    }
    cursor = cursor[part] as Record<string, unknown>;
  }
}

export function applyStatePaths(
  model: Record<string, unknown>,
  changes: SnapRenderStateChanges,
): void {
  if (!changes) return;

  const entries = Array.isArray(changes)
    ? changes.map((change) => [change.path, change.value] as const)
    : Object.entries(changes);

  for (const [path, value] of entries) {
    const parts = normalizeStatePath(path);
    if (parts.length === 0) continue;
    setStateValue(model, parts, value);
  }
}

function sanitizeActionActivityKey(value: string): string {
  const sanitized = value
    .trim()
    .slice(0, ACTION_ACTIVITY_KEY_MAX_LENGTH)
    .replace(/[^A-Za-z0-9_.-]/g, "_");
  return sanitized || "action";
}

function getActionActivityKey(
  actionName: unknown,
  params: Record<string, unknown>,
): string {
  const explicitKey = params.activityKey;
  return sanitizeActionActivityKey(
    typeof explicitKey === "string" && explicitKey.trim()
      ? explicitKey
      : String(actionName || "action"),
  );
}

export function buildActionActivityStateChanges({
  actionName,
  params,
  pending,
}: {
  actionName: unknown;
  params: Record<string, unknown>;
  pending: boolean;
}): { path: string; value: unknown }[] {
  const key = getActionActivityKey(actionName, params);
  return [
    { path: `/actions/${key}/name`, value: String(actionName || "action") },
    { path: `/actions/${key}/pending`, value: pending },
  ];
}

export function hasPendingSnapAction(model: SnapRenderState): boolean {
  const actions = model.actions;
  if (!isRecord(actions)) return false;

  return Object.values(actions).some(
    (action) => isRecord(action) && action.pending === true,
  );
}

export function getUnpresentedSnapEffects(
  model: SnapRenderState,
  effects: readonly string[] | undefined,
): string[] {
  const presentedEffects = getPresentedSnapEffects(model);
  return normalizeEffects(effects).filter(
    (effect) => !presentedEffects.has(effect),
  );
}

export function markSnapEffectsPresented(
  model: SnapRenderState,
  effects: readonly string[] | undefined,
): boolean {
  const nextEffects = normalizeEffects(effects);
  if (nextEffects.length === 0) return false;

  const presentedEffects = getPresentedSnapEffects(model);
  let changed = false;
  for (const effect of nextEffects) {
    if (!presentedEffects.has(effect)) {
      presentedEffects.add(effect);
      changed = true;
    }
  }
  if (!changed) return false;

  let meta = getRenderStateMeta(model);
  if (!meta) {
    meta = {};
    model[SNAP_RENDER_STATE_META_KEY] = meta;
  }

  meta.presentedEffects = Array.from(presentedEffects);
  return true;
}

export function buildInitialRenderState({
  specState,
  initialRenderState,
  themeAccent,
}: {
  specState: unknown;
  initialRenderState?: SnapRenderState;
  themeAccent?: string;
}): SnapRenderState {
  const authoredState = isRecord(specState) ? specState : {};
  const restoredState = initialRenderState
    ? mergeRenderState(authoredState, initialRenderState)
    : cloneSnapRenderState(authoredState);

  if (!isRecord(restoredState.inputs)) {
    restoredState.inputs = {};
  }

  const theme = isRecord(restoredState.theme) ? restoredState.theme : {};
  restoredState.theme =
    themeAccent === undefined ? theme : { ...theme, accent: themeAccent };

  return restoredState;
}
