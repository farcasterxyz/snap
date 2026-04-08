export { Op, OP_NAME } from "./opcodes";
export type { Opcode } from "./opcodes";
export {
  type SnapValue,
  type SnapStateWrite,
  type SnapCapability,
  type SnapCapabilityApproval,
  type SnapExecutionBundle,
  type EmittedMessage,
  snapNull,
  snapBool,
  snapI64,
  snapF64,
  snapString,
  snapBytes,
  snapArray,
  snapMap,
  isTruthy,
  snapValuesEqual,
  snapValueToJSON,
  jsonToSnapValue,
  compareSnapValues,
} from "./types";
export {
  type SnapBytecodeModule,
  decodeBytecode,
  encodeBytecode,
} from "./bytecode";
export {
  SnapVM,
  type SyscallHandler,
  type VMConfig,
  type VMResult,
} from "./vm";
export { assemble } from "./assembler";
export { SYSCALL, SYSCALL_GAS, SYSCALL_ARITY } from "./syscalls";
export { compile } from "./compiler/index";
export { lex, Parser, CodeGenerator, type Program } from "./compiler/index";
