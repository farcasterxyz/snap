import { TokenType, type Token } from "./lexer";
import type { Expr, Stmt, MatchPattern, FnDecl, FnParam, Program } from "./ast";

export class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Program {
    const functions: FnDecl[] = [];
    while (!this.isAtEnd()) {
      if (this.check(TokenType.Export) || this.check(TokenType.Fn)) {
        functions.push(this.parseFnDecl());
      } else {
        this.error(`Expected function declaration, got ${this.peek().value}`);
      }
    }
    return { functions };
  }

  private parseFnDecl(): FnDecl {
    const exported = this.match(TokenType.Export);
    this.expect(TokenType.Fn);
    const name = this.expect(TokenType.Ident).value;
    this.expect(TokenType.LParen);
    const params: FnParam[] = [];
    if (!this.check(TokenType.RParen)) {
      do {
        const pName = this.expect(TokenType.Ident).value;
        let pType: string | undefined;
        if (this.match(TokenType.Colon)) {
          pType = this.expect(TokenType.Ident, TokenType.TypeI64, TokenType.TypeF64, TokenType.TypeString, TokenType.TypeBool, TokenType.TypeMap, TokenType.TypeArray).value;
        }
        params.push({ name: pName, type: pType });
      } while (this.match(TokenType.Comma));
    }
    this.expect(TokenType.RParen);
    let returnType: string | undefined;
    if (this.match(TokenType.Arrow)) {
      returnType = this.advance().value;
    }
    const body = this.parseBlock();
    return { name, exported, params, returnType, body };
  }

  private parseBlock(): Stmt[] {
    this.expect(TokenType.LBrace);
    const stmts: Stmt[] = [];
    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      stmts.push(this.parseStmt());
    }
    this.expect(TokenType.RBrace);
    return stmts;
  }

  private parseStmt(): Stmt {
    if (this.check(TokenType.Let) || this.check(TokenType.Var)) {
      return this.parseLetStmt();
    }
    if (this.check(TokenType.If)) return this.parseIfStmt();
    if (this.check(TokenType.While)) return this.parseWhileStmt();
    if (this.check(TokenType.For)) return this.parseForStmt();
    if (this.check(TokenType.Match)) return this.parseMatchStmt();
    if (this.check(TokenType.Return)) return this.parseReturnStmt();

    // Expression statement (or assignment)
    const expr = this.parseExpr();

    // Check for assignment
    if (this.match(TokenType.Assign)) {
      const value = this.parseExpr();
      return { kind: "assign", target: expr, value };
    }

    return { kind: "expr", expr };
  }

  private parseLetStmt(): Stmt {
    const mutable = this.peek().type === TokenType.Var;
    this.advance(); // consume let/var
    const name = this.expect(TokenType.Ident).value;
    this.expect(TokenType.Assign);
    const value = this.parseExpr();
    return { kind: "let", name, mutable, value };
  }

  private parseIfStmt(): Stmt {
    this.expect(TokenType.If);
    const cond = this.parseExpr();
    const then = this.parseBlock();
    const elseIfs: Array<{ cond: Expr; body: Stmt[] }> = [];
    let else_: Stmt[] | null = null;

    while (this.match(TokenType.Else)) {
      if (this.check(TokenType.If)) {
        this.advance();
        const eifCond = this.parseExpr();
        const eifBody = this.parseBlock();
        elseIfs.push({ cond: eifCond, body: eifBody });
      } else {
        else_ = this.parseBlock();
        break;
      }
    }

    return { kind: "if", cond, then, elseIfs, else_ };
  }

  private parseWhileStmt(): Stmt {
    this.expect(TokenType.While);
    const cond = this.parseExpr();
    const body = this.parseBlock();
    return { kind: "while", cond, body };
  }

  private parseForStmt(): Stmt {
    this.expect(TokenType.For);
    const variable = this.expect(TokenType.Ident).value;
    this.expect(TokenType.In);
    const iterable = this.parseExpr();
    const body = this.parseBlock();
    return { kind: "for", variable, iterable, body };
  }

  private parseMatchStmt(): Stmt {
    this.expect(TokenType.Match);
    const expr = this.parseExpr();
    this.expect(TokenType.LBrace);
    const arms: Array<{ pattern: MatchPattern; body: Stmt[] }> = [];
    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      let pattern: MatchPattern;
      if (this.match(TokenType.Underscore)) {
        pattern = { kind: "wildcard" };
      } else {
        pattern = { kind: "literal", value: this.parsePrimary() };
      }
      this.expect(TokenType.Arrow);
      // Arm body: either a block or a single expression followed by comma
      if (this.check(TokenType.LBrace)) {
        const body = this.parseBlock();
        this.match(TokenType.Comma);
        arms.push({ pattern, body });
      } else {
        const expr = this.parseExpr();
        this.match(TokenType.Comma);
        arms.push({ pattern, body: [{ kind: "expr", expr }] });
      }
    }
    this.expect(TokenType.RBrace);
    return { kind: "match", expr, arms };
  }

  private parseReturnStmt(): Stmt {
    this.expect(TokenType.Return);
    if (this.check(TokenType.RBrace) || this.isAtEnd()) {
      return { kind: "return", value: null };
    }
    const value = this.parseExpr();
    return { kind: "return", value };
  }

  // Expression parsing with precedence climbing
  private parseExpr(): Expr {
    return this.parseCoalesce();
  }

  private parseCoalesce(): Expr {
    let left = this.parseOr();
    while (this.match(TokenType.QuestionQuestion)) {
      const right = this.parseOr();
      left = { kind: "coalesce", left, right };
    }
    return left;
  }

  private parseOr(): Expr {
    let left = this.parseAnd();
    while (this.match(TokenType.Or)) {
      const right = this.parseAnd();
      left = { kind: "binary", op: "||", left, right };
    }
    return left;
  }

  private parseAnd(): Expr {
    let left = this.parseEquality();
    while (this.match(TokenType.And)) {
      const right = this.parseEquality();
      left = { kind: "binary", op: "&&", left, right };
    }
    return left;
  }

  private parseEquality(): Expr {
    let left = this.parseComparison();
    while (this.check(TokenType.Eq) || this.check(TokenType.Neq)) {
      const op = this.advance().value;
      const right = this.parseComparison();
      left = { kind: "binary", op, left, right };
    }
    return left;
  }

  private parseComparison(): Expr {
    let left = this.parseAddSub();
    while (
      this.check(TokenType.Lt) ||
      this.check(TokenType.Gt) ||
      this.check(TokenType.Le) ||
      this.check(TokenType.Ge)
    ) {
      const op = this.advance().value;
      const right = this.parseAddSub();
      left = { kind: "binary", op, left, right };
    }
    return left;
  }

  private parseAddSub(): Expr {
    let left = this.parseMulDiv();
    while (this.check(TokenType.Plus) || this.check(TokenType.Minus)) {
      const op = this.advance().value;
      const right = this.parseMulDiv();
      left = { kind: "binary", op, left, right };
    }
    return left;
  }

  private parseMulDiv(): Expr {
    let left = this.parseUnary();
    while (
      this.check(TokenType.Star) ||
      this.check(TokenType.Slash) ||
      this.check(TokenType.Percent)
    ) {
      const op = this.advance().value;
      const right = this.parseUnary();
      left = { kind: "binary", op, left, right };
    }
    return left;
  }

  private parseUnary(): Expr {
    if (this.match(TokenType.Not)) {
      return { kind: "unary", op: "!", operand: this.parseUnary() };
    }
    if (this.match(TokenType.Minus)) {
      return { kind: "unary", op: "-", operand: this.parseUnary() };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): Expr {
    let expr = this.parsePrimary();
    while (true) {
      if (this.match(TokenType.LParen)) {
        // Function call
        const args: Expr[] = [];
        if (!this.check(TokenType.RParen)) {
          do {
            args.push(this.parseExpr());
          } while (this.match(TokenType.Comma));
        }
        this.expect(TokenType.RParen);
        expr = { kind: "call", callee: expr, args };
      } else if (this.match(TokenType.LBracket)) {
        // Index
        const index = this.parseExpr();
        this.expect(TokenType.RBracket);
        expr = { kind: "index", object: expr, index };
      } else if (this.match(TokenType.Dot)) {
        // Field access
        const field = this.expect(TokenType.Ident).value;
        expr = { kind: "field", object: expr, field };
      } else {
        break;
      }
    }
    return expr;
  }

  private parsePrimary(): Expr {
    // Number
    if (this.check(TokenType.Number)) {
      const tok = this.advance();
      const isFloat = tok.value.includes(".");
      return { kind: "number", value: Number(tok.value), isFloat };
    }

    // String
    if (this.check(TokenType.String)) {
      return { kind: "string", value: this.advance().value };
    }

    // Boolean
    if (this.match(TokenType.True)) return { kind: "bool", value: true };
    if (this.match(TokenType.False)) return { kind: "bool", value: false };

    // Null
    if (this.match(TokenType.Null)) return { kind: "null" };

    // Syscall: @name(args)
    if (this.match(TokenType.At)) {
      const name = this.expect(TokenType.Ident).value;
      this.expect(TokenType.LParen);
      const args: Expr[] = [];
      if (!this.check(TokenType.RParen)) {
        do {
          args.push(this.parseExpr());
        } while (this.match(TokenType.Comma));
      }
      this.expect(TokenType.RParen);
      return { kind: "syscall", name, args };
    }

    // Identifier
    if (this.check(TokenType.Ident)) {
      return { kind: "ident", name: this.advance().value };
    }

    // Parenthesized expression
    if (this.match(TokenType.LParen)) {
      const expr = this.parseExpr();
      this.expect(TokenType.RParen);
      return expr;
    }

    // Array literal
    if (this.match(TokenType.LBracket)) {
      const elements: Expr[] = [];
      if (!this.check(TokenType.RBracket)) {
        do {
          elements.push(this.parseExpr());
        } while (this.match(TokenType.Comma));
      }
      this.expect(TokenType.RBracket);
      return { kind: "array", elements };
    }

    // Map literal
    if (this.match(TokenType.LBrace)) {
      const entries: Array<{ key: Expr; value: Expr }> = [];
      if (!this.check(TokenType.RBrace)) {
        do {
          const key = this.parsePrimary();
          this.expect(TokenType.Colon);
          const value = this.parseExpr();
          entries.push({ key, value });
        } while (this.match(TokenType.Comma));
      }
      this.expect(TokenType.RBrace);
      return { kind: "map", entries };
    }

    this.error(`Unexpected token: ${this.peek().value} (${TokenType[this.peek().type]})`);
  }

  // Helpers

  private peek(): Token {
    return this.tokens[this.pos]!;
  }

  private advance(): Token {
    const tok = this.tokens[this.pos]!;
    this.pos++;
    return tok;
  }

  private check(...types: TokenType[]): boolean {
    return types.includes(this.peek().type);
  }

  private match(...types: TokenType[]): boolean {
    if (this.check(...types)) {
      this.advance();
      return true;
    }
    return false;
  }

  private expect(...types: TokenType[]): Token {
    if (this.check(...types)) return this.advance();
    const expected = types.map((t) => TokenType[t]).join(" or ");
    this.error(`Expected ${expected}, got ${TokenType[this.peek().type]} "${this.peek().value}"`);
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private error(msg: string): never {
    const tok = this.peek();
    throw new Error(`Parse error at line ${tok.line}:${tok.col}: ${msg}`);
  }
}
