export type Expr =
  | { kind: "number"; value: number; isFloat: boolean }
  | { kind: "string"; value: string }
  | { kind: "bool"; value: boolean }
  | { kind: "null" }
  | { kind: "ident"; name: string }
  | { kind: "binary"; op: string; left: Expr; right: Expr }
  | { kind: "unary"; op: string; operand: Expr }
  | { kind: "call"; callee: Expr; args: Expr[] }
  | { kind: "syscall"; name: string; args: Expr[] }
  | { kind: "index"; object: Expr; index: Expr }
  | { kind: "field"; object: Expr; field: string }
  | { kind: "array"; elements: Expr[] }
  | { kind: "map"; entries: Array<{ key: Expr; value: Expr }> }
  | { kind: "coalesce"; left: Expr; right: Expr } // ??
  | { kind: "ternary"; cond: Expr; then: Expr; else_: Expr };

export type Stmt =
  | { kind: "let"; name: string; mutable: boolean; value: Expr }
  | { kind: "assign"; target: Expr; value: Expr }
  | { kind: "expr"; expr: Expr }
  | { kind: "return"; value: Expr | null }
  | { kind: "if"; cond: Expr; then: Stmt[]; elseIfs: Array<{ cond: Expr; body: Stmt[] }>; else_: Stmt[] | null }
  | { kind: "while"; cond: Expr; body: Stmt[] }
  | { kind: "for"; variable: string; iterable: Expr; body: Stmt[] }
  | { kind: "match"; expr: Expr; arms: Array<{ pattern: MatchPattern; body: Stmt[] }> }
  | { kind: "block"; stmts: Stmt[] };

export type MatchPattern =
  | { kind: "literal"; value: Expr }
  | { kind: "wildcard" };

export interface FnParam {
  name: string;
  type?: string;
}

export interface FnDecl {
  name: string;
  exported: boolean;
  params: FnParam[];
  returnType?: string;
  body: Stmt[];
}

export interface Program {
  functions: FnDecl[];
}
