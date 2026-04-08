import { Op } from "./opcodes";
import type { SnapBytecodeModule } from "./bytecode";
import {
  type SnapValue,
  type SnapStateWrite,
  type EmittedMessage,
  snapNull,
  snapBool,
  snapI64,
  snapF64,
  snapString,
  snapArray,
  snapMap,
  isTruthy,
  snapValuesEqual,
  compareSnapValues,
  snapValueToJSON,
} from "./types";
import { SYSCALL, SYSCALL_GAS, SYSCALL_ARITY } from "./syscalls";

const MAX_GAS_LIMIT = 2_000_000;
const MAX_STRING_LENGTH = 64 * 1024;
const MAX_COLLECTION_ELEMENTS = 10_000;

export type SyscallHandler = (
  index: number,
  args: SnapValue[],
) => SnapValue | Promise<SnapValue>;

export interface VMConfig {
  gasLimit: number;
  maxStackDepth?: number;
  maxCallDepth?: number;
  syscallHandler?: SyscallHandler;
}

export interface VMResult {
  success: boolean;
  gasUsed: number;
  error?: string;
  renderedUi?: unknown;
  userStateWrites: SnapStateWrite[];
  sharedStateWrites: SnapStateWrite[];
  emittedMessages: EmittedMessage[];
}

interface CallFrame {
  funcIndex: number;
  ip: number;
  locals: SnapValue[];
  returnStackDepth: number;
}

const EMIT_SYSCALLS: Record<number, EmittedMessage["type"]> = {
  [SYSCALL.EMIT_CAST]: "cast",
  [SYSCALL.EMIT_REACT]: "react",
  [SYSCALL.EMIT_UNREACT]: "unreact",
  [SYSCALL.EMIT_FOLLOW]: "follow",
  [SYSCALL.EMIT_UNFOLLOW]: "unfollow",
  [SYSCALL.EMIT_USER_DATA]: "user_data",
};

export class SnapVM {
  private module: SnapBytecodeModule;
  private config: { gasLimit: number; maxStackDepth: number; maxCallDepth: number; syscallHandler: SyscallHandler };
  private stack: SnapValue[] = [];
  private callStack: CallFrame[] = [];
  private gas: number;

  // Output log
  private renderCalled = false;
  private renderedUi: unknown = null;
  private httpCallCount = 0;
  private userStateWrites: SnapStateWrite[] = [];
  private sharedStateWrites: SnapStateWrite[] = [];
  private emittedMessages: EmittedMessage[] = [];

  constructor(module: SnapBytecodeModule, config: VMConfig) {
    const gasLimit = Math.min(config.gasLimit, MAX_GAS_LIMIT);
    this.module = module;
    this.config = {
      gasLimit,
      maxStackDepth: config.maxStackDepth ?? 1024,
      maxCallDepth: config.maxCallDepth ?? 64,
      syscallHandler: config.syscallHandler ?? (() => snapNull()),
    };
    this.gas = gasLimit;
  }

  async execute(functionName: string, args: SnapValue[]): Promise<VMResult> {
    const totalGas = this.config.gasLimit;
    this.gas = totalGas;
    this.stack = [];
    this.callStack = [];
    this.renderCalled = false;
    this.renderedUi = null;
    this.httpCallCount = 0;
    this.userStateWrites = [];
    this.sharedStateWrites = [];
    this.emittedMessages = [];

    try {
      const funcIndex = this.module.functions.findIndex((f) => f.name === functionName);
      if (funcIndex < 0) {
        return { success: false, gasUsed: 0, error: `Function "${functionName}" not found`, userStateWrites: [], sharedStateWrites: [], emittedMessages: [] };
      }
      await this.callFunction(funcIndex, args);
      return {
        success: true,
        gasUsed: totalGas - this.gas,
        renderedUi: this.renderedUi,
        userStateWrites: this.userStateWrites,
        sharedStateWrites: this.sharedStateWrites,
        emittedMessages: this.emittedMessages,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, gasUsed: totalGas - this.gas, error: msg, userStateWrites: [], sharedStateWrites: [], emittedMessages: [] };
    }
  }

  private async callFunction(funcIndex: number, args: SnapValue[]): Promise<void> {
    const func = this.module.functions[funcIndex];
    if (!func) throw new Error(`Invalid function index ${funcIndex}`);
    if (this.callStack.length >= this.config.maxCallDepth) throw new Error("Call stack overflow");
    const locals: SnapValue[] = new Array(func.arity + func.locals).fill(snapNull());
    for (let i = 0; i < Math.min(args.length, func.arity); i++) locals[i] = args[i]!;
    this.callStack.push({ funcIndex, ip: 0, locals, returnStackDepth: this.stack.length });
    await this.run();
  }

  private consume(n: number) { this.gas -= n; if (this.gas < 0) throw new Error("Gas exhausted"); }

  private push(v: SnapValue) { if (this.stack.length >= this.config.maxStackDepth) throw new Error("Stack overflow"); this.stack.push(v); }

  private pushF64(v: number) { const c = Number.isNaN(v) ? Number.NaN : v; this.push(snapF64(c)); }

  private pushString(v: string) { if (v.length > MAX_STRING_LENGTH) throw new Error(`String exceeds max length`); this.push(snapString(v)); }

  private pushArray(v: SnapValue[]) { if (v.length > MAX_COLLECTION_ELEMENTS) throw new Error(`Array exceeds max elements`); this.push(snapArray(v)); }

  private pushMap(v: Map<string, SnapValue>) { if (v.size > MAX_COLLECTION_ELEMENTS) throw new Error(`Map exceeds max elements`); this.push({ type: "map", value: v }); }

  private pop(): SnapValue {
    if (this.stack.length === 0) {
      const f = this.callStack[this.callStack.length - 1];
      const funcName = f ? this.module.functions[f.funcIndex]?.name : "?";
      const ip = f?.ip ?? -1;
      throw new Error(`Stack underflow in ${funcName} at ip=${ip}`);
    }
    return this.stack.pop()!;
  }

  private peek(): SnapValue { if (this.stack.length === 0) throw new Error("Stack underflow"); return this.stack[this.stack.length - 1]!; }

  private frame(): CallFrame { return this.callStack[this.callStack.length - 1]!; }

  private readU8(): number {
    const f = this.frame(); const code = this.module.functions[f.funcIndex]!.code;
    if (f.ip >= code.length) throw new Error("Unexpected end of bytecode");
    return code[f.ip++]!;
  }

  private readU16(): number {
    const f = this.frame(); const func = this.module.functions[f.funcIndex]!;
    const view = new DataView(func.code.buffer, func.code.byteOffset, func.code.byteLength);
    const v = view.getUint16(f.ip, true); f.ip += 2; return v;
  }

  private readU32(): number {
    const f = this.frame(); const func = this.module.functions[f.funcIndex]!;
    const view = new DataView(func.code.buffer, func.code.byteOffset, func.code.byteLength);
    const v = view.getUint32(f.ip, true); f.ip += 4; return v;
  }

  private readI32(): number {
    const f = this.frame(); const func = this.module.functions[f.funcIndex]!;
    const view = new DataView(func.code.buffer, func.code.byteOffset, func.code.byteLength);
    const v = view.getInt32(f.ip, true); f.ip += 4; return v;
  }

  private readI64(): bigint {
    const f = this.frame(); const func = this.module.functions[f.funcIndex]!;
    const view = new DataView(func.code.buffer, func.code.byteOffset, func.code.byteLength);
    const v = view.getBigInt64(f.ip, true); f.ip += 8; return v;
  }

  private readF64(): number {
    const f = this.frame(); const func = this.module.functions[f.funcIndex]!;
    const view = new DataView(func.code.buffer, func.code.byteOffset, func.code.byteLength);
    const v = view.getFloat64(f.ip, true); f.ip += 8; return v;
  }

  private getConst(idx: number): SnapValue {
    const c = this.module.constants[idx];
    if (!c) throw new Error(`Invalid constant index ${idx}`);
    return c.type === "string" ? snapString(new TextDecoder().decode(c.data)) : { type: "bytes", value: c.data };
  }

  private async run(): Promise<void> {
    while (this.callStack.length > 0) {
      const f = this.frame();
      const func = this.module.functions[f.funcIndex]!;
      if (f.ip >= func.code.length) { this.callStack.pop(); continue; }
      await this.step(this.readU8());
    }
  }

  private async step(op: number): Promise<void> {
    if (op === undefined || op === null) throw new Error("Unexpected end of bytecode");
    switch (op) {
      // Stack (gas: 1)
      case Op.NOP: this.consume(1); break;
      case Op.PUSH_NULL: this.consume(1); this.push(snapNull()); break;
      case Op.PUSH_TRUE: this.consume(1); this.push(snapBool(true)); break;
      case Op.PUSH_FALSE: this.consume(1); this.push(snapBool(false)); break;
      case Op.PUSH_I64: { this.consume(1); this.push(snapI64(this.readI64())); break; }
      case Op.PUSH_F64: { this.consume(1); this.pushF64(this.readF64()); break; }
      case Op.PUSH_STR: { this.consume(1); this.push(this.getConst(this.readU32())); break; }
      case Op.PUSH_BYTES: { this.consume(1); this.push(this.getConst(this.readU32())); break; }
      case Op.POP: this.consume(1); this.pop(); break;
      case Op.DUP: this.consume(1); this.push(this.peek()); break;
      case Op.SWAP: { this.consume(1); const a = this.pop(); const b = this.pop(); this.push(a); this.push(b); break; }

      // Arithmetic (gas: 1)
      case Op.ADD: {
        this.consume(1); const b = this.pop(); const a = this.pop();
        if (a.type === "string" || b.type === "string") {
          const as_ = a.type === "string" ? a.value : String(a.type === "i64" ? a.value : a.type === "f64" ? a.value : snapValueToJSON(a));
          const bs = b.type === "string" ? b.value : String(b.type === "i64" ? b.value : b.type === "f64" ? b.value : snapValueToJSON(b));
          this.pushString(as_ + bs);
        } else if (a.type === "i64" && b.type === "i64") { this.push(snapI64(a.value + b.value));
        } else if ((a.type === "i64" || a.type === "f64") && (b.type === "i64" || b.type === "f64")) {
          this.pushF64((a.type === "i64" ? Number(a.value) : a.value) + (b.type === "i64" ? Number(b.value) : b.value));
        } else { throw new Error(`Cannot add ${a.type} and ${b.type}`); }
        break;
      }
      case Op.SUB: { this.consume(1); const b = this.pop(); const a = this.pop(); if (a.type === "i64" && b.type === "i64") this.push(snapI64(a.value - b.value)); else this.pushF64((a.type === "i64" ? Number(a.value) : a.type === "f64" ? a.value : 0) - (b.type === "i64" ? Number(b.value) : b.type === "f64" ? b.value : 0)); break; }
      case Op.MUL: { this.consume(1); const b = this.pop(); const a = this.pop(); if (a.type === "i64" && b.type === "i64") this.push(snapI64(a.value * b.value)); else this.pushF64((a.type === "i64" ? Number(a.value) : a.type === "f64" ? a.value : 0) * (b.type === "i64" ? Number(b.value) : b.type === "f64" ? b.value : 0)); break; }
      case Op.DIV: { this.consume(1); const b = this.pop(); const a = this.pop(); if (a.type === "i64" && b.type === "i64") { if (b.value === 0n) throw new Error("Division by zero"); this.push(snapI64(a.value / b.value)); } else { const bf = b.type === "i64" ? Number(b.value) : b.type === "f64" ? b.value : 0; if (bf === 0) throw new Error("Division by zero"); this.pushF64((a.type === "i64" ? Number(a.value) : a.type === "f64" ? a.value : 0) / bf); } break; }
      case Op.MOD: { this.consume(1); const b = this.pop(); const a = this.pop(); if (a.type === "i64" && b.type === "i64") { if (b.value === 0n) throw new Error("Division by zero"); this.push(snapI64(a.value % b.value)); } else this.pushF64((a.type === "i64" ? Number(a.value) : a.type === "f64" ? a.value : 0) % (b.type === "i64" ? Number(b.value) : b.type === "f64" ? b.value : 0)); break; }
      case Op.NEG: { this.consume(1); const a = this.pop(); if (a.type === "i64") this.push(snapI64(-a.value)); else if (a.type === "f64") this.pushF64(-a.value); else throw new Error(`Cannot negate ${a.type}`); break; }
      case Op.SHL: { this.consume(1); const b = this.pop(); const a = this.pop(); if (a.type !== "i64" || b.type !== "i64") throw new Error("SHL requires i64"); this.push(snapI64(a.value << b.value)); break; }
      case Op.SHR: { this.consume(1); const b = this.pop(); const a = this.pop(); if (a.type !== "i64" || b.type !== "i64") throw new Error("SHR requires i64"); this.push(snapI64(a.value >> b.value)); break; }
      case Op.BAND: { this.consume(1); const b = this.pop(); const a = this.pop(); if (a.type !== "i64" || b.type !== "i64") throw new Error("BAND requires i64"); this.push(snapI64(a.value & b.value)); break; }
      case Op.BOR: { this.consume(1); const b = this.pop(); const a = this.pop(); if (a.type !== "i64" || b.type !== "i64") throw new Error("BOR requires i64"); this.push(snapI64(a.value | b.value)); break; }
      case Op.BXOR: { this.consume(1); const b = this.pop(); const a = this.pop(); if (a.type !== "i64" || b.type !== "i64") throw new Error("BXOR requires i64"); this.push(snapI64(a.value ^ b.value)); break; }

      // Comparison (gas: 1)
      case Op.EQ: { this.consume(1); const b = this.pop(); const a = this.pop(); this.push(snapBool(snapValuesEqual(a, b))); break; }
      case Op.NEQ: { this.consume(1); const b = this.pop(); const a = this.pop(); this.push(snapBool(!snapValuesEqual(a, b))); break; }
      case Op.LT: { this.consume(1); const b = this.pop(); const a = this.pop(); this.push(snapBool(compareSnapValues(a, b) < 0)); break; }
      case Op.GT: { this.consume(1); const b = this.pop(); const a = this.pop(); this.push(snapBool(compareSnapValues(a, b) > 0)); break; }
      case Op.LE: { this.consume(1); const b = this.pop(); const a = this.pop(); this.push(snapBool(compareSnapValues(a, b) <= 0)); break; }
      case Op.GE: { this.consume(1); const b = this.pop(); const a = this.pop(); this.push(snapBool(compareSnapValues(a, b) >= 0)); break; }
      case Op.NOT: { this.consume(1); this.push(snapBool(!isTruthy(this.pop()))); break; }
      case Op.AND: { this.consume(1); const b = this.pop(); const a = this.pop(); this.push(snapBool(isTruthy(a) && isTruthy(b))); break; }
      case Op.OR: { this.consume(1); const b = this.pop(); const a = this.pop(); this.push(snapBool(isTruthy(a) || isTruthy(b))); break; }

      // Control flow (gas: 1)
      case Op.JMP: { this.consume(1); const off = this.readI32(); this.frame().ip += off; break; }
      case Op.JMP_IF: { this.consume(1); const offset = this.readI32(); if (isTruthy(this.pop())) this.frame().ip += offset; break; }
      case Op.JMP_UNLESS: { this.consume(1); const offset = this.readI32(); if (!isTruthy(this.pop())) this.frame().ip += offset; break; }
      case Op.CALL: {
        this.consume(1); const funcIdx = this.readU32();
        const targetFunc = this.module.functions[funcIdx]; if (!targetFunc) throw new Error(`Invalid function ${funcIdx}`);
        const callArgs: SnapValue[] = []; for (let i = 0; i < targetFunc.arity; i++) callArgs.unshift(this.pop());
        await this.callFunction(funcIdx, callArgs); break;
      }
      case Op.RET: {
        this.consume(1); const f = this.callStack.pop(); if (!f) throw new Error("Return outside function");
        const retVal = this.stack.length > f.returnStackDepth ? this.pop() : snapNull();
        this.stack.length = f.returnStackDepth; this.push(retVal); break;
      }
      case Op.TRAP: { this.consume(1); throw new Error("Trap"); }

      // Locals (gas: 1)
      case Op.LOAD: { this.consume(1); const idx = this.readU16(); const f = this.frame(); if (idx >= f.locals.length) throw new Error(`Invalid local ${idx}`); this.push(f.locals[idx]!); break; }
      case Op.STORE: { this.consume(1); const idx = this.readU16(); const f = this.frame(); if (idx >= f.locals.length) throw new Error(`Invalid local ${idx}`); f.locals[idx] = this.pop(); break; }

      // Collections (gas: 2)
      case Op.ARRAY_NEW: { this.consume(2); const count = this.readU16(); const items: SnapValue[] = []; for (let i = 0; i < count; i++) items.unshift(this.pop()); this.pushArray(items); break; }
      case Op.ARRAY_GET: { this.consume(2); const idx = this.pop(); const arr = this.pop(); if (arr.type !== "array") throw new Error("ARRAY_GET on non-array"); const i = idx.type === "i64" ? Number(idx.value) : idx.type === "f64" ? idx.value : -1; this.push(i >= 0 && i < arr.value.length ? arr.value[i]! : snapNull()); break; }
      case Op.ARRAY_LEN: { this.consume(2); const arr = this.pop(); if (arr.type !== "array") throw new Error("ARRAY_LEN on non-array"); this.push(snapI64(BigInt(arr.value.length))); break; }
      case Op.ARRAY_PUSH: { this.consume(2); const val = this.pop(); const arr = this.pop(); if (arr.type !== "array") throw new Error("ARRAY_PUSH on non-array"); this.pushArray([...arr.value, val]); break; }
      case Op.ARRAY_SLICE: { this.consume(2); const end = this.pop(); const start = this.pop(); const arr = this.pop(); if (arr.type !== "array") throw new Error("ARRAY_SLICE on non-array"); this.pushArray(arr.value.slice(start.type === "i64" ? Number(start.value) : 0, end.type === "i64" ? Number(end.value) : arr.value.length)); break; }
      case Op.MAP_NEW: { this.consume(2); const count = this.readU16(); const entries: Array<[string, SnapValue]> = []; for (let i = 0; i < count; i++) { const val = this.pop(); const key = this.pop(); if (key.type !== "string") throw new Error("Map key must be string"); entries.unshift([key.value, val]); } this.pushMap(new Map(entries)); break; }
      case Op.MAP_GET: { this.consume(2); const key = this.pop(); const m = this.pop(); if (m.type !== "map") throw new Error("MAP_GET on non-map"); if (key.type !== "string") throw new Error("Map key must be string"); this.push(m.value.get(key.value) ?? snapNull()); break; }
      case Op.MAP_SET: { this.consume(2); const val = this.pop(); const key = this.pop(); const m = this.pop(); if (m.type !== "map") throw new Error("MAP_SET on non-map"); if (key.type !== "string") throw new Error("Map key must be string"); const nm = new Map(m.value); nm.set(key.value, val); this.pushMap(nm); break; }
      case Op.MAP_HAS: { this.consume(2); const key = this.pop(); const m = this.pop(); if (m.type !== "map") throw new Error("MAP_HAS on non-map"); if (key.type !== "string") throw new Error("Map key must be string"); this.push(snapBool(m.value.has(key.value))); break; }
      case Op.MAP_KEYS: { this.consume(2); const m = this.pop(); if (m.type !== "map") throw new Error("MAP_KEYS on non-map"); this.pushArray(Array.from(m.value.keys()).map(snapString)); break; }
      case Op.MAP_DEL: { this.consume(2); const key = this.pop(); const m = this.pop(); if (m.type !== "map") throw new Error("MAP_DEL on non-map"); if (key.type !== "string") throw new Error("Map key must be string"); const nm = new Map(m.value); nm.delete(key.value); this.pushMap(nm); break; }

      // Type conversion (gas: 1)
      case Op.TO_I64: { this.consume(1); const v = this.pop(); if (v.type === "i64") this.push(v); else if (v.type === "f64") this.push(snapI64(BigInt(Math.trunc(v.value)))); else if (v.type === "string") { try { this.push(snapI64(BigInt(v.value))); } catch { this.push(snapI64(0n)); } } else if (v.type === "bool") this.push(snapI64(v.value ? 1n : 0n)); else this.push(snapI64(0n)); break; }
      case Op.TO_F64: { this.consume(1); const v = this.pop(); if (v.type === "f64") this.push(v); else if (v.type === "i64") this.pushF64(Number(v.value)); else if (v.type === "string") this.pushF64(Number(v.value) || 0); else if (v.type === "bool") this.pushF64(v.value ? 1 : 0); else this.pushF64(0); break; }
      case Op.TO_STR: { this.consume(1); const v = this.pop(); if (v.type === "string") this.push(v); else if (v.type === "i64") this.pushString(v.value.toString()); else if (v.type === "f64") this.pushString(v.value.toString()); else if (v.type === "bool") this.pushString(v.value ? "true" : "false"); else if (v.type === "null") this.pushString("null"); else this.pushString(JSON.stringify(snapValueToJSON(v))); break; }
      case Op.TO_BOOL: { this.consume(1); this.push(snapBool(isTruthy(this.pop()))); break; }
      case Op.TYPEOF: { this.consume(1); this.push(snapString(this.pop().type)); break; }

      // String operations (gas: 2)
      case Op.STR_LEN: { this.consume(2); const s = this.pop(); if (s.type !== "string") throw new Error("STR_LEN on non-string"); this.push(snapI64(BigInt(s.value.length))); break; }
      case Op.STR_SLICE: { this.consume(2); const end = this.pop(); const start = this.pop(); const s = this.pop(); if (s.type !== "string") throw new Error("STR_SLICE on non-string"); this.pushString(s.value.slice(start.type === "i64" ? Number(start.value) : 0, end.type === "i64" ? Number(end.value) : s.value.length)); break; }
      case Op.STR_FIND: { this.consume(2); const needle = this.pop(); const h = this.pop(); if (h.type !== "string" || needle.type !== "string") throw new Error("STR_FIND requires strings"); this.push(snapI64(BigInt(h.value.indexOf(needle.value)))); break; }
      case Op.STR_UPPER: { this.consume(2); const s = this.pop(); if (s.type !== "string") throw new Error("STR_UPPER on non-string"); this.pushString(s.value.toUpperCase()); break; }
      case Op.STR_LOWER: { this.consume(2); const s = this.pop(); if (s.type !== "string") throw new Error("STR_LOWER on non-string"); this.pushString(s.value.toLowerCase()); break; }
      case Op.STR_SPLIT: { this.consume(2); const d = this.pop(); const s = this.pop(); if (s.type !== "string" || d.type !== "string") throw new Error("STR_SPLIT requires strings"); this.pushArray(s.value.split(d.value).map(snapString)); break; }
      case Op.STR_JOIN: { this.consume(2); const d = this.pop(); const arr = this.pop(); if (arr.type !== "array" || d.type !== "string") throw new Error("STR_JOIN requires array and string"); this.pushString(arr.value.map((v) => v.type === "string" ? v.value : String(snapValueToJSON(v))).join(d.value)); break; }
      case Op.STR_TRIM: { this.consume(2); const s = this.pop(); if (s.type !== "string") throw new Error("STR_TRIM on non-string"); this.pushString(s.value.trim()); break; }

      // Syscall
      case Op.SYSCALL: {
        const idx = this.readU16();
        const gasCost = SYSCALL_GAS[idx] ?? 1000;
        this.consume(gasCost);

        // ui.render — at most once
        if (idx === SYSCALL.UI_RENDER) {
          if (this.renderCalled) throw new Error("ui.render called more than once");
          this.renderCalled = true;
        }
        // HTTP limit
        if (idx === SYSCALL.HTTP_GET || idx === SYSCALL.HTTP_POST) {
          this.httpCallCount++;
          if (this.httpCallCount > 5) throw new Error("Max HTTP syscalls exceeded (5)");
        }

        const arity = SYSCALL_ARITY[idx] ?? 0;
        const args: SnapValue[] = [];
        for (let i = 0; i < arity; i++) args.unshift(this.pop());

        // Track state writes in the output log
        if (idx === SYSCALL.STATE_SET && args.length >= 2 && args[0]?.type === "string") {
          this.userStateWrites.push({ key: args[0].value, value: new TextEncoder().encode(JSON.stringify(snapValueToJSON(args[1]!))) });
        }
        if (idx === SYSCALL.SHARED_SET && args.length >= 2 && args[0]?.type === "string") {
          this.sharedStateWrites.push({ key: args[0].value, value: new TextEncoder().encode(JSON.stringify(snapValueToJSON(args[1]!))) });
        }

        // Track message emissions in the output log
        const emitType = EMIT_SYSCALLS[idx];
        if (emitType) {
          this.emittedMessages.push({ type: emitType, args: [...args] });
        }

        // Call external handler (for reads, ui.render, etc.)
        const result = await this.config.syscallHandler(idx, args);

        // Capture rendered UI
        if (idx === SYSCALL.UI_RENDER && args.length > 0) {
          this.renderedUi = snapValueToJSON(args[0]!);
        }

        this.push(result);
        break;
      }

      default:
        throw new Error(`Unknown opcode 0x${(op ?? 0).toString(16)}`);
    }
  }
}
