export { lex, type Token, TokenType } from "./lexer";
export { Parser } from "./parser";
export { CodeGenerator } from "./codegen";
export type { Program, Expr, Stmt, FnDecl } from "./ast";

import { lex } from "./lexer";
import { Parser } from "./parser";
import { CodeGenerator } from "./codegen";

/**
 * Compile SnapScript source code to SnapVM bytecode.
 *
 * @param source - SnapScript source code
 * @returns Compiled bytecode as Uint8Array
 *
 * @example
 * ```typescript
 * const bytecode = compile(`
 *   export fn main(action: string, inputs: map, button_index: i64) {
 *     @render({
 *       "root": "r",
 *       "elements": {
 *         "r": { "type": "text", "props": { "content": "Hello!" } }
 *       }
 *     })
 *   }
 * `);
 * ```
 */
export function compile(source: string): Uint8Array {
  const tokens = lex(source);
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const codegen = new CodeGenerator();
  return codegen.generate(ast);
}
