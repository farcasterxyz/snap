export const Op = {
  // Stack operations
  NOP: 0x00,
  PUSH_NULL: 0x01,
  PUSH_TRUE: 0x02,
  PUSH_FALSE: 0x03,
  PUSH_I64: 0x04,
  PUSH_F64: 0x05,
  PUSH_STR: 0x06,
  PUSH_BYTES: 0x07,
  POP: 0x08,
  DUP: 0x09,
  SWAP: 0x0a,

  // Arithmetic
  ADD: 0x10,
  SUB: 0x11,
  MUL: 0x12,
  DIV: 0x13,
  MOD: 0x14,
  NEG: 0x15,
  SHL: 0x16,
  SHR: 0x17,
  BAND: 0x18,
  BOR: 0x19,
  BXOR: 0x1a,

  // Comparison
  EQ: 0x20,
  NEQ: 0x21,
  LT: 0x22,
  GT: 0x23,
  LE: 0x24,
  GE: 0x25,
  NOT: 0x26,
  AND: 0x27,
  OR: 0x28,

  // Control flow
  JMP: 0x30,
  JMP_IF: 0x31,
  JMP_UNLESS: 0x32,
  CALL: 0x33,
  RET: 0x34,
  TRAP: 0x35,

  // Local variables
  LOAD: 0x40,
  STORE: 0x41,

  // Collections
  ARRAY_NEW: 0x50,
  ARRAY_GET: 0x51,
  ARRAY_LEN: 0x52,
  ARRAY_PUSH: 0x53,
  ARRAY_SLICE: 0x54,
  MAP_NEW: 0x55,
  MAP_GET: 0x56,
  MAP_SET: 0x57,
  MAP_HAS: 0x58,
  MAP_KEYS: 0x59,
  MAP_DEL: 0x5a,

  // Type conversion
  TO_I64: 0x60,
  TO_F64: 0x61,
  TO_STR: 0x62,
  TO_BOOL: 0x63,
  TYPEOF: 0x64,

  // String operations
  STR_LEN: 0x70,
  STR_SLICE: 0x71,
  STR_FIND: 0x72,
  STR_UPPER: 0x73,
  STR_LOWER: 0x74,
  STR_SPLIT: 0x75,
  STR_JOIN: 0x76,
  STR_TRIM: 0x77,

  // Syscalls
  SYSCALL: 0x80,
} as const;

export type Opcode = (typeof Op)[keyof typeof Op];

/** Map opcode byte to mnemonic name. */
export const OP_NAME: Record<number, string> = {};
for (const [name, code] of Object.entries(Op)) {
  OP_NAME[code] = name.toLowerCase();
}
