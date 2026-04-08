import { Op, OP_NAME } from "./opcodes";
import { encodeBytecode, type SnapBytecodeModule } from "./bytecode";

const MNEMONIC_TO_OP: Record<string, number> = {};
for (const [name, code] of Object.entries(Op)) {
  MNEMONIC_TO_OP[name.toLowerCase()] = code;
}

interface ParsedFunc {
  name: string;
  arity: number;
  locals: number;
  instructions: Array<{ op: number; operand?: number | bigint }>;
  labels: Map<string, number>; // label -> instruction index
  labelRefs: Array<{ instrIndex: number; label: string }>; // unresolved references
}

export function assemble(source: string): Uint8Array {
  const lines = source.split("\n");
  const constants: Array<{ type: "string" | "bytes"; data: Uint8Array }> = [];
  const functions: ParsedFunc[] = [];
  let currentFunc: ParsedFunc | null = null;

  for (let lineNo = 0; lineNo < lines.length; lineNo++) {
    let line = lines[lineNo]!.trim();

    // Strip comments
    const commentIdx = line.indexOf(";");
    if (commentIdx >= 0) line = line.substring(0, commentIdx).trim();
    if (line === "") continue;

    // Directives
    if (line.startsWith(".const ")) {
      const rest = line.substring(7).trim();
      if (rest.startsWith('"') && rest.endsWith('"')) {
        const str = rest.slice(1, -1).replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\\\/g, "\\");
        constants.push({ type: "string", data: new TextEncoder().encode(str) });
      } else if (rest.startsWith("0x")) {
        const hex = rest.substring(2);
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < bytes.length; i++) {
          bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
        }
        constants.push({ type: "bytes", data: bytes });
      } else {
        throw new Error(`Line ${lineNo + 1}: invalid .const value: ${rest}`);
      }
      continue;
    }

    if (line.startsWith(".func ")) {
      const parts = line.substring(6).trim().split(/\s+/);
      if (parts.length < 3) {
        throw new Error(`Line ${lineNo + 1}: .func requires name arity locals`);
      }
      const name = parts[0]!;
      // Ensure the function name is in the constant pool
      const nameBytes = new TextEncoder().encode(name);
      let nameIdx = constants.findIndex(
        (c) =>
          c.type === "string" &&
          c.data.length === nameBytes.length &&
          c.data.every((b, i) => b === nameBytes[i]),
      );
      if (nameIdx < 0) {
        nameIdx = constants.length;
        constants.push({ type: "string", data: nameBytes });
      }
      currentFunc = {
        name,
        arity: parseInt(parts[1]!, 10),
        locals: parseInt(parts[2]!, 10),
        instructions: [],
        labels: new Map(),
        labelRefs: [],
      };
      functions.push(currentFunc);
      continue;
    }

    if (line === ".end") {
      currentFunc = null;
      continue;
    }

    // Labels
    if (line.endsWith(":")) {
      if (!currentFunc) throw new Error(`Line ${lineNo + 1}: label outside function`);
      const label = line.slice(0, -1).trim();
      currentFunc.labels.set(label, currentFunc.instructions.length);
      continue;
    }

    // Instructions
    if (!currentFunc) {
      throw new Error(`Line ${lineNo + 1}: instruction outside function: ${line}`);
    }

    const parts = line.split(/\s+/);
    const mnemonic = parts[0]!.toLowerCase();
    const opcode = MNEMONIC_TO_OP[mnemonic];
    if (opcode === undefined) {
      throw new Error(`Line ${lineNo + 1}: unknown mnemonic: ${mnemonic}`);
    }

    let operand: number | bigint | undefined;

    // Parse operand based on opcode
    if (parts.length > 1) {
      const arg = parts[1]!;

      if (
        opcode === Op.JMP ||
        opcode === Op.JMP_IF ||
        opcode === Op.JMP_UNLESS
      ) {
        // Could be a label or numeric offset
        if (/^-?\d+$/.test(arg)) {
          operand = parseInt(arg, 10);
        } else {
          // Label reference — resolve later
          currentFunc.labelRefs.push({
            instrIndex: currentFunc.instructions.length,
            label: arg,
          });
          operand = 0; // placeholder
        }
      } else if (opcode === Op.PUSH_I64) {
        operand = BigInt(arg);
      } else if (opcode === Op.PUSH_F64) {
        operand = parseFloat(arg);
      } else if (arg.startsWith("0x")) {
        operand = parseInt(arg, 16);
      } else {
        operand = parseInt(arg, 10);
      }
    }

    currentFunc.instructions.push({ op: opcode, operand });
  }

  // Build bytecode for each function
  const moduleFunctions: SnapBytecodeModule["functions"] = [];

  for (const func of functions) {
    // First pass: compute byte offsets for each instruction
    const instrOffsets: number[] = [];
    let offset = 0;
    for (const instr of func.instructions) {
      instrOffsets.push(offset);
      offset += instructionSize(instr.op);
    }
    const totalSize = offset;

    // Resolve label references
    for (const ref of func.labelRefs) {
      const targetInstrIdx = func.labels.get(ref.label);
      if (targetInstrIdx === undefined) {
        throw new Error(`Unresolved label: ${ref.label} in function ${func.name}`);
      }
      const refOffset = instrOffsets[ref.instrIndex]!;
      const targetOffset = instrOffsets[targetInstrIdx] ?? totalSize;
      // JMP operands are relative to the position AFTER the full instruction
      const instrSize = instructionSize(func.instructions[ref.instrIndex]!.op);
      func.instructions[ref.instrIndex]!.operand = targetOffset - (refOffset + instrSize);
    }

    // Second pass: emit bytes
    const code = new Uint8Array(totalSize);
    const view = new DataView(code.buffer);
    let pos = 0;

    for (const instr of func.instructions) {
      code[pos++] = instr.op;

      switch (instr.op) {
        case Op.PUSH_I64: {
          view.setBigInt64(pos, BigInt(instr.operand ?? 0n), true);
          pos += 8;
          break;
        }
        case Op.PUSH_F64: {
          view.setFloat64(pos, Number(instr.operand ?? 0), true);
          pos += 8;
          break;
        }
        case Op.PUSH_STR:
        case Op.PUSH_BYTES:
        case Op.CALL: {
          view.setUint32(pos, Number(instr.operand ?? 0), true);
          pos += 4;
          break;
        }
        case Op.JMP:
        case Op.JMP_IF:
        case Op.JMP_UNLESS: {
          view.setInt32(pos, Number(instr.operand ?? 0), true);
          pos += 4;
          break;
        }
        case Op.LOAD:
        case Op.STORE:
        case Op.ARRAY_NEW:
        case Op.MAP_NEW: {
          view.setUint16(pos, Number(instr.operand ?? 0), true);
          pos += 2;
          break;
        }
        case Op.SYSCALL: {
          view.setUint16(pos, Number(instr.operand ?? 0), true);
          pos += 2;
          break;
        }
        // All other opcodes have no operand
      }
    }

    moduleFunctions.push({
      name: func.name,
      arity: func.arity,
      locals: func.locals,
      code,
    });
  }

  return encodeBytecode({
    version: 1,
    constants,
    functions: moduleFunctions,
  });
}

function instructionSize(op: number): number {
  switch (op) {
    case Op.PUSH_I64:
    case Op.PUSH_F64:
      return 1 + 8;
    case Op.PUSH_STR:
    case Op.PUSH_BYTES:
    case Op.CALL:
    case Op.JMP:
    case Op.JMP_IF:
    case Op.JMP_UNLESS:
      return 1 + 4;
    case Op.LOAD:
    case Op.STORE:
    case Op.ARRAY_NEW:
    case Op.MAP_NEW:
    case Op.SYSCALL:
      return 1 + 2;
    default:
      return 1;
  }
}
