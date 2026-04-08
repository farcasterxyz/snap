const MAGIC = [0x53, 0x4e, 0x41, 0x50]; // "SNAP"

export interface SnapBytecodeModule {
  version: number;
  constants: Array<{ type: "string" | "bytes"; data: Uint8Array }>;
  functions: Array<{
    name: string;
    arity: number;
    locals: number;
    code: Uint8Array;
  }>;
}

class Reader {
  private view: DataView;
  public pos: number;
  constructor(private buf: Uint8Array) {
    this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    this.pos = 0;
  }
  u8(): number {
    return this.buf[this.pos++]!;
  }
  u16(): number {
    const v = this.view.getUint16(this.pos, true);
    this.pos += 2;
    return v;
  }
  u32(): number {
    const v = this.view.getUint32(this.pos, true);
    this.pos += 4;
    return v;
  }
  bytes(n: number): Uint8Array {
    const slice = this.buf.slice(this.pos, this.pos + n);
    this.pos += n;
    return slice;
  }
}

class Writer {
  private chunks: Uint8Array[] = [];
  private len = 0;
  u8(v: number) {
    this.chunks.push(new Uint8Array([v & 0xff]));
    this.len += 1;
  }
  u16(v: number) {
    const b = new Uint8Array(2);
    new DataView(b.buffer).setUint16(0, v, true);
    this.chunks.push(b);
    this.len += 2;
  }
  u32(v: number) {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, v, true);
    this.chunks.push(b);
    this.len += 4;
  }
  bytes(data: Uint8Array) {
    this.chunks.push(data);
    this.len += data.length;
  }
  size(): number {
    return this.len;
  }
  build(): Uint8Array {
    const out = new Uint8Array(this.len);
    let off = 0;
    for (const c of this.chunks) {
      out.set(c, off);
      off += c.length;
    }
    return out;
  }
}

const MAX_BYTECODE_SIZE = 256 * 1024;
const MAX_CONST_POOL_SIZE = 64 * 1024;

export function decodeBytecode(data: Uint8Array): SnapBytecodeModule {
  if (data.length > MAX_BYTECODE_SIZE) {
    throw new Error(`Bytecode exceeds max size (${data.length} > ${MAX_BYTECODE_SIZE})`);
  }

  const r = new Reader(data);

  // Header
  for (let i = 0; i < 4; i++) {
    if (r.u8() !== MAGIC[i]) throw new Error("Invalid magic bytes");
  }
  const version = r.u16();
  if (version !== 1) throw new Error(`Unsupported bytecode version: ${version}`);
  r.u16(); // flags (reserved)
  const constOffset = r.u32();
  const funcOffset = r.u32();

  if (constOffset > data.length || funcOffset > data.length) {
    throw new Error("Invalid section offsets");
  }

  // Constant pool
  r.pos = constOffset;
  const constCount = r.u32();
  const constants: SnapBytecodeModule["constants"] = [];
  for (let i = 0; i < constCount; i++) {
    const type = r.u8() === 0 ? ("string" as const) : ("bytes" as const);
    const len = r.u32();
    const d = r.bytes(len);
    constants.push({ type, data: d });
  }

  // Validate constant pool size
  const constPoolSize = r.pos - constOffset;
  if (constPoolSize > MAX_CONST_POOL_SIZE) {
    throw new Error(`Constant pool exceeds max size (${constPoolSize} > ${MAX_CONST_POOL_SIZE})`);
  }

  // Function table
  r.pos = funcOffset;
  const funcCount = r.u32();
  const functions: SnapBytecodeModule["functions"] = [];
  for (let i = 0; i < funcCount; i++) {
    const nameIdx = r.u32();
    if (nameIdx >= constants.length) {
      throw new Error(`Function ${i} references out-of-bounds constant ${nameIdx}`);
    }
    const arity = r.u16();
    const locals = r.u16();
    const codeLen = r.u32();
    const code = r.bytes(codeLen);
    const nameConst = constants[nameIdx];
    if (!nameConst || nameConst.type !== "string") {
      throw new Error(`Function ${i} references invalid constant ${nameIdx}`);
    }
    const name = new TextDecoder().decode(nameConst.data);
    functions.push({ name, arity, locals, code });
  }

  return { version, constants, functions };
}

export function encodeBytecode(mod: SnapBytecodeModule): Uint8Array {
  const constWriter = new Writer();
  constWriter.u32(mod.constants.length);
  for (const c of mod.constants) {
    constWriter.u8(c.type === "string" ? 0 : 1);
    constWriter.u32(c.data.length);
    constWriter.bytes(c.data);
  }
  const constBytes = constWriter.build();

  const funcWriter = new Writer();
  funcWriter.u32(mod.functions.length);
  for (const f of mod.functions) {
    // Find the constant index for this function's name
    const nameIdx = mod.constants.findIndex(
      (c) =>
        c.type === "string" &&
        new TextDecoder().decode(c.data) === f.name,
    );
    if (nameIdx < 0) throw new Error(`Function name "${f.name}" not in constant pool`);
    funcWriter.u32(nameIdx);
    funcWriter.u16(f.arity);
    funcWriter.u16(f.locals);
    funcWriter.u32(f.code.length);
    funcWriter.bytes(f.code);
  }
  const funcBytes = funcWriter.build();

  const headerSize = 16;
  const constOffset = headerSize;
  const funcOffset = constOffset + constBytes.length;

  const header = new Writer();
  for (const b of MAGIC) header.u8(b);
  header.u16(mod.version);
  header.u16(0); // flags
  header.u32(constOffset);
  header.u32(funcOffset);

  const out = new Uint8Array(headerSize + constBytes.length + funcBytes.length);
  out.set(header.build(), 0);
  out.set(constBytes, constOffset);
  out.set(funcBytes, funcOffset);
  return out;
}
