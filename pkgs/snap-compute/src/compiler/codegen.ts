import { Op } from "../opcodes";
import { SYSCALL } from "../syscalls";
import { encodeBytecode, type SnapBytecodeModule } from "../bytecode";
import type { Program, Expr, Stmt, FnDecl } from "./ast";

const SYSCALL_MAP: Record<string, number> = {
  self_fid: SYSCALL.SELF_FID,
  get_user_data: SYSCALL.GET_USER_DATA,
  get_cast: SYSCALL.GET_CAST,
  get_casts_by_fid: SYSCALL.GET_CASTS_BY_FID,
  get_followers: SYSCALL.GET_FOLLOWERS,
  get_following: SYSCALL.GET_FOLLOWING,
  get_reactions: SYSCALL.GET_REACTIONS,
  is_following: SYSCALL.IS_FOLLOWING,
  timestamp: SYSCALL.FARCASTER_TIMESTAMP,
  get_channel: SYSCALL.GET_CHANNEL,
  get_verifications: SYSCALL.GET_VERIFICATIONS,
  state_get: SYSCALL.STATE_GET,
  state_set: SYSCALL.STATE_SET,
  state_del: SYSCALL.STATE_DEL,
  state_keys: SYSCALL.STATE_KEYS,
  render: SYSCALL.UI_RENDER,
  effect: SYSCALL.UI_EFFECT,
  snap_call: SYSCALL.SNAP_CALL,
  snap_exists: SYSCALL.SNAP_EXISTS,
  sha256: SYSCALL.CRYPTO_SHA256,
  keccak256: SYSCALL.CRYPTO_KECCAK256,
  verify_ed25519: SYSCALL.CRYPTO_VERIFY_ED25519,
  http_get: SYSCALL.HTTP_GET,
  http_post: SYSCALL.HTTP_POST,
  // Message emission
  emit_cast: SYSCALL.EMIT_CAST,
  emit_react: SYSCALL.EMIT_REACT,
  emit_unreact: SYSCALL.EMIT_UNREACT,
  emit_follow: SYSCALL.EMIT_FOLLOW,
  emit_unfollow: SYSCALL.EMIT_UNFOLLOW,
  emit_user_data: SYSCALL.EMIT_USER_DATA,
  shared_get: SYSCALL.SHARED_GET,
  shared_set: SYSCALL.SHARED_SET,
  shared_del: SYSCALL.SHARED_DEL,
  shared_keys: SYSCALL.SHARED_KEYS,
  shared_get_by_fid: SYSCALL.SHARED_GET_BY_FID,
  shared_get_all: SYSCALL.SHARED_GET_ALL,
  shared_count: SYSCALL.SHARED_COUNT,
  // Convenience aliases
  map_keys: -1, // handled specially as MAP_KEYS opcode
  to_str: -2,
  to_i64: -3,
  to_f64: -4,
};

interface Local {
  name: string;
  index: number;
  mutable: boolean;
}

interface FuncScope {
  name: string;
  locals: Local[];
  localCount: number;
  code: number[];
  labels: Map<string, number>;
  patchList: Array<{ offset: number; label: string }>;
  labelCounter: number;
}

export class CodeGenerator {
  private constants: Array<{ type: "string" | "bytes"; data: Uint8Array }> = [];
  private constCache = new Map<string, number>();
  private functions: Array<{
    name: string;
    arity: number;
    locals: number;
    code: Uint8Array;
  }> = [];
  private funcIndex = new Map<string, number>();
  private currentFunc: FuncScope | null = null;

  generate(program: Program): Uint8Array {
    // First pass: register all function names
    for (let i = 0; i < program.functions.length; i++) {
      const fn = program.functions[i]!;
      this.funcIndex.set(fn.name, i);
      this.addConstant(fn.name);
    }

    // Second pass: compile each function
    for (const fn of program.functions) {
      this.compileFunction(fn);
    }

    return encodeBytecode({
      version: 1,
      constants: this.constants,
      functions: this.functions,
    });
  }

  private addConstant(value: string): number {
    const cacheKey = `s:${value}`;
    const existing = this.constCache.get(cacheKey);
    if (existing !== undefined) return existing;
    const idx = this.constants.length;
    this.constants.push({ type: "string", data: new TextEncoder().encode(value) });
    this.constCache.set(cacheKey, idx);
    return idx;
  }

  private emit(op: number) {
    this.currentFunc!.code.push(op);
  }

  private emitU16(v: number) {
    const buf = new ArrayBuffer(2);
    new DataView(buf).setUint16(0, v, true);
    const bytes = new Uint8Array(buf);
    this.currentFunc!.code.push(bytes[0]!, bytes[1]!);
  }

  private emitU32(v: number) {
    const buf = new ArrayBuffer(4);
    new DataView(buf).setUint32(0, v, true);
    const bytes = new Uint8Array(buf);
    for (const b of bytes) this.currentFunc!.code.push(b);
  }

  private emitI32(v: number) {
    const buf = new ArrayBuffer(4);
    new DataView(buf).setInt32(0, v, true);
    const bytes = new Uint8Array(buf);
    for (const b of bytes) this.currentFunc!.code.push(b);
  }

  private emitI64(v: bigint) {
    const buf = new ArrayBuffer(8);
    new DataView(buf).setBigInt64(0, v, true);
    const bytes = new Uint8Array(buf);
    for (const b of bytes) this.currentFunc!.code.push(b);
  }

  private emitF64(v: number) {
    const buf = new ArrayBuffer(8);
    new DataView(buf).setFloat64(0, v, true);
    const bytes = new Uint8Array(buf);
    for (const b of bytes) this.currentFunc!.code.push(b);
  }

  private codePos(): number {
    return this.currentFunc!.code.length;
  }

  private newLabel(): string {
    return `L${this.currentFunc!.labelCounter++}`;
  }

  private placeLabel(label: string) {
    this.currentFunc!.labels.set(label, this.codePos());
  }

  private emitJump(op: number, label: string) {
    this.emit(op);
    this.currentFunc!.patchList.push({ offset: this.codePos(), label });
    this.emitI32(0); // placeholder
  }

  private resolveLocal(name: string): Local | undefined {
    return this.currentFunc!.locals.find((l) => l.name === name);
  }

  private addLocal(name: string, mutable: boolean): number {
    const idx = this.currentFunc!.localCount++;
    this.currentFunc!.locals.push({ name, index: idx, mutable });
    return idx;
  }

  private compileFunction(fn: FnDecl) {
    this.currentFunc = {
      name: fn.name,
      locals: [],
      localCount: 0,
      code: [],
      labels: new Map(),
      patchList: [],
      labelCounter: 0,
    };

    // Register parameters as locals
    for (const param of fn.params) {
      this.addLocal(param.name, false);
    }

    // Compile body
    for (const stmt of fn.body) {
      this.compileStmt(stmt);
    }

    // Implicit return null
    this.emit(Op.PUSH_NULL);
    this.emit(Op.RET);

    // Patch jumps
    for (const patch of this.currentFunc.patchList) {
      const target = this.currentFunc.labels.get(patch.label);
      if (target === undefined) {
        throw new Error(`Unresolved label ${patch.label} in function ${fn.name}`);
      }
      // Offset is relative to the position after the i32 operand
      const relative = target - (patch.offset + 4);
      const buf = new ArrayBuffer(4);
      new DataView(buf).setInt32(0, relative, true);
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < 4; i++) {
        this.currentFunc.code[patch.offset + i] = bytes[i]!;
      }
    }

    const code = new Uint8Array(this.currentFunc.code);
    this.functions.push({
      name: fn.name,
      arity: fn.params.length,
      locals: this.currentFunc.localCount - fn.params.length,
      code,
    });
  }

  private compileStmt(stmt: Stmt) {
    switch (stmt.kind) {
      case "let": {
        this.compileExpr(stmt.value);
        const idx = this.addLocal(stmt.name, stmt.mutable);
        this.emit(Op.STORE);
        this.emitU16(idx);
        break;
      }
      case "assign": {
        this.compileExpr(stmt.value);
        if (stmt.target.kind === "ident") {
          const local = this.resolveLocal(stmt.target.name);
          if (!local) throw new Error(`Undefined variable: ${stmt.target.name}`);
          if (!local.mutable) throw new Error(`Cannot assign to immutable variable: ${stmt.target.name}`);
          this.emit(Op.STORE);
          this.emitU16(local.index);
        } else if (stmt.target.kind === "index") {
          // map[key] = value -> map_set
          // Stack has: value. We need: map, key, value -> map_set -> store back
          // This is complex for mutable containers. For now, support map[key] = val via MAP_SET.
          const valueLocal = this.addLocal("__tmp_val", false);
          this.emit(Op.STORE);
          this.emitU16(valueLocal);
          this.compileExpr(stmt.target.object);
          this.compileExpr(stmt.target.index);
          this.emit(Op.LOAD);
          this.emitU16(valueLocal);
          this.emit(Op.MAP_SET);
          // Now store back if the object is a local
          if (stmt.target.object.kind === "ident") {
            const objLocal = this.resolveLocal(stmt.target.object.name);
            if (objLocal) {
              this.emit(Op.STORE);
              this.emitU16(objLocal.index);
            } else {
              this.emit(Op.POP);
            }
          } else {
            this.emit(Op.POP);
          }
        } else {
          throw new Error("Cannot assign to this expression");
        }
        break;
      }
      case "expr":
        this.compileExpr(stmt.expr);
        this.emit(Op.POP); // discard result
        break;
      case "return":
        if (stmt.value) {
          this.compileExpr(stmt.value);
        } else {
          this.emit(Op.PUSH_NULL);
        }
        this.emit(Op.RET);
        break;
      case "if": {
        const endLabel = this.newLabel();
        const elseLabel = this.newLabel();

        this.compileExpr(stmt.cond);
        this.emitJump(Op.JMP_UNLESS, stmt.elseIfs.length > 0 || stmt.else_ ? elseLabel : endLabel);

        for (const s of stmt.then) this.compileStmt(s);
        this.emitJump(Op.JMP, endLabel);

        // else-if chains
        for (let i = 0; i < stmt.elseIfs.length; i++) {
          this.placeLabel(i === 0 ? elseLabel : `elif_${i}`);
          const nextLabel = i < stmt.elseIfs.length - 1 ? `elif_${i + 1}` : (stmt.else_ ? this.newLabel() : endLabel);
          const eif = stmt.elseIfs[i]!;
          this.compileExpr(eif.cond);
          this.emitJump(Op.JMP_UNLESS, nextLabel);
          for (const s of eif.body) this.compileStmt(s);
          this.emitJump(Op.JMP, endLabel);
          if (i === stmt.elseIfs.length - 1 && stmt.else_) {
            this.placeLabel(nextLabel);
          }
        }

        if (stmt.else_) {
          if (stmt.elseIfs.length === 0) this.placeLabel(elseLabel);
          for (const s of stmt.else_) this.compileStmt(s);
        }

        this.placeLabel(endLabel);
        break;
      }
      case "while": {
        const loopStart = this.newLabel();
        const loopEnd = this.newLabel();
        this.placeLabel(loopStart);
        this.compileExpr(stmt.cond);
        this.emitJump(Op.JMP_UNLESS, loopEnd);
        for (const s of stmt.body) this.compileStmt(s);
        this.emitJump(Op.JMP, loopStart);
        this.placeLabel(loopEnd);
        break;
      }
      case "for": {
        // for x in iterable { body }
        // Compile as: let __arr = iterable; let __i = 0; while __i < len(__arr) { let x = __arr[__i]; body; __i = __i + 1 }
        this.compileExpr(stmt.iterable);
        const arrLocal = this.addLocal("__for_arr", false);
        this.emit(Op.STORE);
        this.emitU16(arrLocal);

        this.emit(Op.PUSH_I64);
        this.emitI64(0n);
        const iLocal = this.addLocal("__for_i", true);
        this.emit(Op.STORE);
        this.emitU16(iLocal);

        const loopStart = this.newLabel();
        const loopEnd = this.newLabel();

        this.placeLabel(loopStart);
        // __i < len(__arr)
        this.emit(Op.LOAD);
        this.emitU16(iLocal);
        this.emit(Op.LOAD);
        this.emitU16(arrLocal);
        this.emit(Op.ARRAY_LEN);
        this.emit(Op.LT);
        this.emitJump(Op.JMP_UNLESS, loopEnd);

        // let x = __arr[__i]
        this.emit(Op.LOAD);
        this.emitU16(arrLocal);
        this.emit(Op.LOAD);
        this.emitU16(iLocal);
        this.emit(Op.ARRAY_GET);
        const elemLocal = this.addLocal(stmt.variable, false);
        this.emit(Op.STORE);
        this.emitU16(elemLocal);

        for (const s of stmt.body) this.compileStmt(s);

        // __i = __i + 1
        this.emit(Op.LOAD);
        this.emitU16(iLocal);
        this.emit(Op.PUSH_I64);
        this.emitI64(1n);
        this.emit(Op.ADD);
        this.emit(Op.STORE);
        this.emitU16(iLocal);

        this.emitJump(Op.JMP, loopStart);
        this.placeLabel(loopEnd);
        break;
      }
      case "match": {
        const endLabel = this.newLabel();
        this.compileExpr(stmt.expr);
        const matchLocal = this.addLocal("__match_val", false);
        this.emit(Op.STORE);
        this.emitU16(matchLocal);

        for (let i = 0; i < stmt.arms.length; i++) {
          const arm = stmt.arms[i]!;
          const nextArm = this.newLabel();

          if (arm.pattern.kind === "wildcard") {
            // Always matches
            for (const s of arm.body) this.compileStmt(s);
            this.emitJump(Op.JMP, endLabel);
          } else {
            this.emit(Op.LOAD);
            this.emitU16(matchLocal);
            this.compileExpr(arm.pattern.value);
            this.emit(Op.EQ);
            this.emitJump(Op.JMP_UNLESS, nextArm);
            for (const s of arm.body) this.compileStmt(s);
            this.emitJump(Op.JMP, endLabel);
          }
          this.placeLabel(nextArm);
        }

        this.placeLabel(endLabel);
        break;
      }
      case "block":
        for (const s of stmt.stmts) this.compileStmt(s);
        break;
    }
  }

  private compileExpr(expr: Expr) {
    switch (expr.kind) {
      case "number":
        if (expr.isFloat) {
          this.emit(Op.PUSH_F64);
          this.emitF64(expr.value);
        } else {
          this.emit(Op.PUSH_I64);
          this.emitI64(BigInt(expr.value));
        }
        break;
      case "string": {
        const idx = this.addConstant(expr.value);
        this.emit(Op.PUSH_STR);
        this.emitU32(idx);
        break;
      }
      case "bool":
        this.emit(expr.value ? Op.PUSH_TRUE : Op.PUSH_FALSE);
        break;
      case "null":
        this.emit(Op.PUSH_NULL);
        break;
      case "ident": {
        const local = this.resolveLocal(expr.name);
        if (local) {
          this.emit(Op.LOAD);
          this.emitU16(local.index);
        } else {
          throw new Error(`Undefined variable: ${expr.name}`);
        }
        break;
      }
      case "binary": {
        // Handle ?? separately
        if (expr.op === "??") {
          this.compileExpr(expr.left);
          this.emit(Op.DUP);
          this.emit(Op.PUSH_NULL);
          this.emit(Op.NEQ);
          const endLabel = this.newLabel();
          this.emitJump(Op.JMP_IF, endLabel);
          this.emit(Op.POP);
          this.compileExpr(expr.right);
          this.placeLabel(endLabel);
          break;
        }

        // Short-circuit && and || using jumps
        if (expr.op === "&&") {
          this.compileExpr(expr.left);
          this.emit(Op.DUP);
          const skipLabel = this.newLabel();
          this.emitJump(Op.JMP_UNLESS, skipLabel); // if falsy, skip right side
          this.emit(Op.POP); // discard left (it was truthy)
          this.compileExpr(expr.right);
          this.placeLabel(skipLabel);
          break;
        }
        if (expr.op === "||") {
          this.compileExpr(expr.left);
          this.emit(Op.DUP);
          const skipLabel = this.newLabel();
          this.emitJump(Op.JMP_IF, skipLabel); // if truthy, skip right side
          this.emit(Op.POP); // discard left (it was falsy)
          this.compileExpr(expr.right);
          this.placeLabel(skipLabel);
          break;
        }

        this.compileExpr(expr.left);
        this.compileExpr(expr.right);
        switch (expr.op) {
          case "+": this.emit(Op.ADD); break;
          case "-": this.emit(Op.SUB); break;
          case "*": this.emit(Op.MUL); break;
          case "/": this.emit(Op.DIV); break;
          case "%": this.emit(Op.MOD); break;
          case "==": this.emit(Op.EQ); break;
          case "!=": this.emit(Op.NEQ); break;
          case "<": this.emit(Op.LT); break;
          case ">": this.emit(Op.GT); break;
          case "<=": this.emit(Op.LE); break;
          case ">=": this.emit(Op.GE); break;
          default: throw new Error(`Unknown binary op: ${expr.op}`);
        }
        break;
      }
      case "unary":
        this.compileExpr(expr.operand);
        if (expr.op === "!") this.emit(Op.NOT);
        else if (expr.op === "-") this.emit(Op.NEG);
        else throw new Error(`Unknown unary op: ${expr.op}`);
        break;
      case "call": {
        if (expr.callee.kind === "ident") {
          const name = expr.callee.name;
          // Built-in conversions
          if (name === "to_str") {
            this.compileExpr(expr.args[0]!);
            this.emit(Op.TO_STR);
            break;
          }
          if (name === "to_i64") {
            this.compileExpr(expr.args[0]!);
            this.emit(Op.TO_I64);
            break;
          }
          if (name === "to_f64") {
            this.compileExpr(expr.args[0]!);
            this.emit(Op.TO_F64);
            break;
          }
          // Function call
          const funcIdx = this.funcIndex.get(name);
          if (funcIdx !== undefined) {
            for (const arg of expr.args) this.compileExpr(arg);
            this.emit(Op.CALL);
            this.emitU32(funcIdx);
            break;
          }
          throw new Error(`Undefined function: ${name}`);
        }
        throw new Error("Cannot call non-identifier expressions");
      }
      case "syscall": {
        const syscallIdx = SYSCALL_MAP[expr.name];
        if (syscallIdx === undefined) {
          throw new Error(`Unknown syscall: @${expr.name}`);
        }
        // Special builtins that map to opcodes
        if (syscallIdx === -1) {
          // map_keys
          this.compileExpr(expr.args[0]!);
          this.emit(Op.MAP_KEYS);
          break;
        }
        if (syscallIdx === -2) {
          this.compileExpr(expr.args[0]!);
          this.emit(Op.TO_STR);
          break;
        }
        if (syscallIdx === -3) {
          this.compileExpr(expr.args[0]!);
          this.emit(Op.TO_I64);
          break;
        }
        if (syscallIdx === -4) {
          this.compileExpr(expr.args[0]!);
          this.emit(Op.TO_F64);
          break;
        }
        for (const arg of expr.args) this.compileExpr(arg);
        this.emit(Op.SYSCALL);
        this.emitU16(syscallIdx);
        break;
      }
      case "index":
        this.compileExpr(expr.object);
        this.compileExpr(expr.index);
        // Use ARRAY_GET for numeric literal indices, MAP_GET for everything else
        // (string literals, variables, expressions — maps are the common case for dynamic access)
        this.emit(expr.index.kind === "number" ? Op.ARRAY_GET : Op.MAP_GET);
        break;
      case "field":
        this.compileExpr(expr.object);
        this.emit(Op.PUSH_STR);
        this.emitU32(this.addConstant(expr.field));
        this.emit(Op.MAP_GET);
        break;
      case "array":
        for (const elem of expr.elements) this.compileExpr(elem);
        this.emit(Op.ARRAY_NEW);
        this.emitU16(expr.elements.length);
        break;
      case "map":
        for (const entry of expr.entries) {
          this.compileExpr(entry.key);
          this.compileExpr(entry.value);
        }
        this.emit(Op.MAP_NEW);
        this.emitU16(expr.entries.length);
        break;
      case "coalesce": {
        this.compileExpr(expr.left);
        this.emit(Op.DUP);
        this.emit(Op.PUSH_NULL);
        this.emit(Op.NEQ);
        const endLabel = this.newLabel();
        this.emitJump(Op.JMP_IF, endLabel);
        this.emit(Op.POP);
        this.compileExpr(expr.right);
        this.placeLabel(endLabel);
        break;
      }
      case "ternary":
        this.compileExpr(expr.cond);
        const elseLabel = this.newLabel();
        const endLabel = this.newLabel();
        this.emitJump(Op.JMP_UNLESS, elseLabel);
        this.compileExpr(expr.then);
        this.emitJump(Op.JMP, endLabel);
        this.placeLabel(elseLabel);
        this.compileExpr(expr.else_);
        this.placeLabel(endLabel);
        break;
    }
  }
}
