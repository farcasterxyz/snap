import { describe, it, expect } from "vitest";
import { compile } from "../compiler/index.js";
import { decodeBytecode } from "../bytecode.js";
import { SnapVM } from "../vm.js";
import { assemble } from "../assembler.js";
import { SYSCALL } from "../syscalls.js";
import {
  snapNull,
  snapString,
  snapI64,
  snapBool,
  snapMap,
  snapArray,
  snapValueToJSON,
  type SnapValue,
} from "../types.js";

describe("SnapVM assembler + VM", () => {
  it("runs a simple assembled program", async () => {
    const bytecode = assemble(`
      .const "main"
      .const "hello"

      .func main 0 1
        push_str 1
        store 0
        load 0
        ret
      .end
    `);

    const mod = decodeBytecode(bytecode);
    expect(mod.functions).toHaveLength(1);
    expect(mod.functions[0]!.name).toBe("main");

    const vm = new SnapVM(mod, { gasLimit: 10000 });
    const result = await vm.execute("main", []);
    expect(result.success).toBe(true);
    expect(result.gasUsed).toBeGreaterThan(0);
  });

  it("performs arithmetic", async () => {
    const bytecode = assemble(`
      .const "main"

      .func main 0 0
        push_i64 10
        push_i64 3
        add
        ret
      .end
    `);

    const mod = decodeBytecode(bytecode);
    const vm = new SnapVM(mod, { gasLimit: 10000 });
    const result = await vm.execute("main", []);
    expect(result.success).toBe(true);
  });

  it("handles gas exhaustion", async () => {
    const bytecode = assemble(`
      .const "main"

      .func main 0 0
        loop:
          push_i64 1
          pop
          jmp loop
      .end
    `);

    const mod = decodeBytecode(bytecode);
    const vm = new SnapVM(mod, { gasLimit: 100 });
    const result = await vm.execute("main", []);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("calls syscalls", async () => {
    let renderedSpec: unknown = null;

    const bytecode = assemble(`
      .const "main"
      .const "hello world"

      .func main 0 0
        push_str 1
        syscall 0x0200
        pop
        ret
      .end
    `);

    const mod = decodeBytecode(bytecode);
    const vm = new SnapVM(mod, {
      gasLimit: 100000,
      syscallHandler: (index, args) => {
        if (index === SYSCALL.UI_RENDER) {
          renderedSpec = args[0];
          return snapNull();
        }
        return snapNull();
      },
    });

    const result = await vm.execute("main", []);
    expect(result.success).toBe(true);
    expect(renderedSpec).not.toBeNull();
  });
});

describe("SnapScript compiler + VM", () => {
  it("compiles and runs hello world", async () => {
    let rendered: unknown = null;

    const bytecode = compile(`
      export fn main(action: string, inputs: map, button_index: i64) {
        let msg = "Hello, Farcaster!"
        @render(msg)
      }
    `);

    const mod = decodeBytecode(bytecode);
    const vm = new SnapVM(mod, {
      gasLimit: 500000,
      syscallHandler: (index, args) => {
        if (index === SYSCALL.UI_RENDER) {
          rendered = snapValueToJSON(args[0]!);
          return snapNull();
        }
        return snapNull();
      },
    });

    const result = await vm.execute("main", [
      snapString("get"),
      snapMap([]),
      snapI64(0),
    ]);
    expect(result.success).toBe(true);
    expect(rendered).toBe("Hello, Farcaster!");
  });

  it("compiles and runs conditionals", async () => {
    let rendered: unknown = null;

    const bytecode = compile(`
      export fn main(action: string, inputs: map, button_index: i64) {
        if action == "get" {
          @render("welcome")
        } else {
          @render("submitted")
        }
      }
    `);

    const mod = decodeBytecode(bytecode);

    // Test "get"
    const vm1 = new SnapVM(mod, {
      gasLimit: 500000,
      syscallHandler: (index, args) => {
        if (index === SYSCALL.UI_RENDER) {
          rendered = snapValueToJSON(args[0]!);
          return snapNull();
        }
        return snapNull();
      },
    });
    await vm1.execute("main", [snapString("get"), snapMap([]), snapI64(0)]);
    expect(rendered).toBe("welcome");

    // Test "post"
    rendered = null;
    const vm2 = new SnapVM(mod, {
      gasLimit: 500000,
      syscallHandler: (index, args) => {
        if (index === SYSCALL.UI_RENDER) {
          rendered = snapValueToJSON(args[0]!);
          return snapNull();
        }
        return snapNull();
      },
    });
    await vm2.execute("main", [snapString("post"), snapMap([]), snapI64(0)]);
    expect(rendered).toBe("submitted");
  });

  it("compiles loops and arrays", async () => {
    let rendered: unknown = null;

    const bytecode = compile(`
      fn sum_array(arr: array) -> i64 {
        var total = 0
        for item in arr {
          total = total + item
        }
        return total
      }

      export fn main(action: string, inputs: map, button_index: i64) {
        let nums = [1, 2, 3, 4, 5]
        let total = sum_array(nums)
        @render(total)
      }
    `);

    const mod = decodeBytecode(bytecode);
    const vm = new SnapVM(mod, {
      gasLimit: 500000,
      syscallHandler: (index, args) => {
        if (index === SYSCALL.UI_RENDER) {
          rendered = snapValueToJSON(args[0]!);
          return snapNull();
        }
        return snapNull();
      },
    });

    const result = await vm.execute("main", [
      snapString("get"),
      snapMap([]),
      snapI64(0),
    ]);
    expect(result.success, `VM error: ${result.error}`).toBe(true);
    expect(rendered).toBe(15);
  });

  it("compiles maps and field access", async () => {
    let rendered: unknown = null;

    const bytecode = compile(`
      export fn main(action: string, inputs: map, button_index: i64) {
        let user = { "name": "alice", "score": 42 }
        let name = user["name"]
        @render(name)
      }
    `);

    const mod = decodeBytecode(bytecode);
    const vm = new SnapVM(mod, {
      gasLimit: 500000,
      syscallHandler: (index, args) => {
        if (index === SYSCALL.UI_RENDER) {
          rendered = snapValueToJSON(args[0]!);
          return snapNull();
        }
        return snapNull();
      },
    });

    const result = await vm.execute("main", [
      snapString("get"),
      snapMap([]),
      snapI64(0),
    ]);
    expect(result.success).toBe(true);
    expect(rendered).toBe("alice");
  });

  it("compiles string concatenation", async () => {
    let rendered: unknown = null;

    const bytecode = compile(`
      export fn main(action: string, inputs: map, button_index: i64) {
        let greeting = "Hello, " + "world" + "!"
        @render(greeting)
      }
    `);

    const mod = decodeBytecode(bytecode);
    const vm = new SnapVM(mod, {
      gasLimit: 500000,
      syscallHandler: (index, args) => {
        if (index === SYSCALL.UI_RENDER) {
          rendered = snapValueToJSON(args[0]!);
          return snapNull();
        }
        return snapNull();
      },
    });

    const result = await vm.execute("main", [
      snapString("get"),
      snapMap([]),
      snapI64(0),
    ]);
    expect(result.success).toBe(true);
    expect(rendered).toBe("Hello, world!");
  });

  it("compiles match expressions", async () => {
    let rendered: unknown = null;

    const bytecode = compile(`
      export fn main(action: string, inputs: map, button_index: i64) {
        match action {
          "get" => @render("initial"),
          "post" => @render("updated"),
          _ => @render("unknown"),
        }
      }
    `);

    const mod = decodeBytecode(bytecode);
    const vm = new SnapVM(mod, {
      gasLimit: 500000,
      syscallHandler: (index, args) => {
        if (index === SYSCALL.UI_RENDER) {
          rendered = snapValueToJSON(args[0]!);
          return snapNull();
        }
        return snapNull();
      },
    });

    const result = await vm.execute("main", [
      snapString("get"),
      snapMap([]),
      snapI64(0),
    ]);
    expect(result.success).toBe(true);
    expect(rendered).toBe("initial");
  });

  it("compiles a UI-building snap", async () => {
    let rendered: unknown = null;

    const bytecode = compile(`
      export fn main(action: string, inputs: map, button_index: i64) {
        let title_props = { "content": "Hello from SnapScript!" }
        let title_elem = { "type": "text", "props": title_props }
        let elements = { "root": title_elem }
        let spec = { "root": "root", "elements": elements }
        @render(spec)
      }
    `);

    const mod = decodeBytecode(bytecode);
    const vm = new SnapVM(mod, {
      gasLimit: 500000,
      syscallHandler: (index, args) => {
        if (index === SYSCALL.UI_RENDER) {
          rendered = snapValueToJSON(args[0]!);
          return snapNull();
        }
        return snapNull();
      },
    });

    const result = await vm.execute("main", [
      snapString("get"),
      snapMap([]),
      snapI64(0),
    ]);
    expect(result.success).toBe(true);
    expect(rendered).toEqual({
      root: "root",
      elements: {
        root: {
          type: "text",
          props: { content: "Hello from SnapScript!" },
        },
      },
    });
  });

  it("compiles shared state syscalls", async () => {
    const sharedStore = new Map<string, SnapValue>();
    let rendered: unknown = null;

    const bytecode = compile(`
      export fn main(action: string, inputs: map, button_index: i64) {
        if action == "post" {
          @shared_set("counter", 1)
        }
        let count = @shared_get("counter") ?? 0
        @render(count)
      }
    `);

    const mod = decodeBytecode(bytecode);
    const vm = new SnapVM(mod, {
      gasLimit: 500000,
      syscallHandler: (index, args) => {
        if (index === SYSCALL.UI_RENDER) {
          rendered = snapValueToJSON(args[0]!);
          return snapNull();
        }
        if (index === SYSCALL.SHARED_SET) {
          const key = args[0]!;
          if (key.type === "string") sharedStore.set(key.value, args[1]!);
          return snapNull();
        }
        if (index === SYSCALL.SHARED_GET) {
          const key = args[0]!;
          if (key.type === "string") return sharedStore.get(key.value) ?? snapNull();
          return snapNull();
        }
        return snapNull();
      },
    });

    // Initial get
    await vm.execute("main", [snapString("get"), snapMap([]), snapI64(0)]);
    expect(rendered).toBe(0);

    // Post action
    rendered = null;
    const vm2 = new SnapVM(mod, {
      gasLimit: 500000,
      syscallHandler: (index, args) => {
        if (index === SYSCALL.UI_RENDER) {
          rendered = snapValueToJSON(args[0]!);
          return snapNull();
        }
        if (index === SYSCALL.SHARED_SET) {
          const key = args[0]!;
          if (key.type === "string") sharedStore.set(key.value, args[1]!);
          return snapNull();
        }
        if (index === SYSCALL.SHARED_GET) {
          const key = args[0]!;
          if (key.type === "string") return sharedStore.get(key.value) ?? snapNull();
          return snapNull();
        }
        return snapNull();
      },
    });
    await vm2.execute("main", [snapString("post"), snapMap([]), snapI64(0)]);
    expect(rendered).toBe(1);
  });
});
