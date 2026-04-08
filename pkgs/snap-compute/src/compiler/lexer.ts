export enum TokenType {
  // Literals
  Number,
  String,
  True,
  False,
  Null,

  // Identifiers and keywords
  Ident,
  Let,
  Var,
  Fn,
  Export,
  If,
  Else,
  Match,
  For,
  In,
  While,
  Return,

  // Operators
  Plus,
  Minus,
  Star,
  Slash,
  Percent,
  Eq,
  Neq,
  Lt,
  Gt,
  Le,
  Ge,
  And,
  Or,
  Not,
  Assign,
  Arrow, // =>

  // Delimiters
  LParen,
  RParen,
  LBrace,
  RBrace,
  LBracket,
  RBracket,
  Comma,
  Colon,
  Dot,
  Semicolon,
  QuestionQuestion, // ??

  // Special
  At, // @ for syscalls
  Underscore, // _ for match wildcard

  // Types (used in annotations)
  TypeI64,
  TypeF64,
  TypeString,
  TypeBool,
  TypeMap,
  TypeArray,

  EOF,
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

const KEYWORDS: Record<string, TokenType> = {
  let: TokenType.Let,
  var: TokenType.Var,
  fn: TokenType.Fn,
  export: TokenType.Export,
  if: TokenType.If,
  else: TokenType.Else,
  match: TokenType.Match,
  for: TokenType.For,
  in: TokenType.In,
  while: TokenType.While,
  return: TokenType.Return,
  true: TokenType.True,
  false: TokenType.False,
  null: TokenType.Null,
  i64: TokenType.TypeI64,
  f64: TokenType.TypeF64,
  string: TokenType.TypeString,
  bool: TokenType.TypeBool,
  map: TokenType.TypeMap,
  array: TokenType.TypeArray,
};

export function lex(source: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  let line = 1;
  let col = 1;

  function peek(): string {
    return source[pos] ?? "\0";
  }
  function advance(): string {
    const ch = source[pos] ?? "\0";
    pos++;
    if (ch === "\n") {
      line++;
      col = 1;
    } else {
      col++;
    }
    return ch;
  }
  function emit(type: TokenType, value: string, l: number, c: number) {
    tokens.push({ type, value, line: l, col: c });
  }

  while (pos < source.length) {
    const ch = peek();
    const startLine = line;
    const startCol = col;

    // Whitespace
    if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
      advance();
      continue;
    }

    // Line comment
    if (ch === "/" && source[pos + 1] === "/") {
      while (pos < source.length && peek() !== "\n") advance();
      continue;
    }

    // Block comment
    if (ch === "/" && source[pos + 1] === "*") {
      advance();
      advance();
      while (pos < source.length) {
        if (peek() === "*" && source[pos + 1] === "/") {
          advance();
          advance();
          break;
        }
        advance();
      }
      continue;
    }

    // String literal
    if (ch === '"') {
      advance();
      let str = "";
      while (pos < source.length && peek() !== '"') {
        if (peek() === "\\") {
          advance();
          const esc = advance();
          if (esc === "n") str += "\n";
          else if (esc === "t") str += "\t";
          else if (esc === "\\") str += "\\";
          else if (esc === '"') str += '"';
          else str += esc;
        } else {
          str += advance();
        }
      }
      if (pos < source.length) advance(); // closing "
      emit(TokenType.String, str, startLine, startCol);
      continue;
    }

    // Number
    if ((ch >= "0" && ch <= "9") || (ch === "." && source[pos + 1]! >= "0" && source[pos + 1]! <= "9")) {
      let num = "";
      let isFloat = false;
      while (pos < source.length && ((peek() >= "0" && peek() <= "9") || peek() === "." || peek() === "_")) {
        if (peek() === ".") {
          if (isFloat) break;
          isFloat = true;
        }
        if (peek() !== "_") num += peek();
        advance();
      }
      emit(TokenType.Number, num, startLine, startCol);
      continue;
    }

    // Identifier / keyword
    if ((ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_") {
      let ident = "";
      while (
        pos < source.length &&
        ((peek() >= "a" && peek() <= "z") ||
          (peek() >= "A" && peek() <= "Z") ||
          (peek() >= "0" && peek() <= "9") ||
          peek() === "_")
      ) {
        ident += advance();
      }
      if (ident === "_" && !(peek() >= "a" && peek() <= "z") && !(peek() >= "0" && peek() <= "9")) {
        emit(TokenType.Underscore, ident, startLine, startCol);
      } else {
        emit(KEYWORDS[ident] ?? TokenType.Ident, ident, startLine, startCol);
      }
      continue;
    }

    // Operators and delimiters
    advance();
    switch (ch) {
      case "@":
        emit(TokenType.At, ch, startLine, startCol);
        break;
      case "+":
        emit(TokenType.Plus, ch, startLine, startCol);
        break;
      case "-":
        if (peek() === ">") {
          advance();
          emit(TokenType.Arrow, "->", startLine, startCol);
        } else {
          emit(TokenType.Minus, ch, startLine, startCol);
        }
        break;
      case "*":
        emit(TokenType.Star, ch, startLine, startCol);
        break;
      case "/":
        emit(TokenType.Slash, ch, startLine, startCol);
        break;
      case "%":
        emit(TokenType.Percent, ch, startLine, startCol);
        break;
      case "=":
        if (peek() === "=") {
          advance();
          emit(TokenType.Eq, "==", startLine, startCol);
        } else if (peek() === ">") {
          advance();
          emit(TokenType.Arrow, "=>", startLine, startCol);
        } else {
          emit(TokenType.Assign, "=", startLine, startCol);
        }
        break;
      case "!":
        if (peek() === "=") {
          advance();
          emit(TokenType.Neq, "!=", startLine, startCol);
        } else {
          emit(TokenType.Not, "!", startLine, startCol);
        }
        break;
      case "<":
        if (peek() === "=") {
          advance();
          emit(TokenType.Le, "<=", startLine, startCol);
        } else {
          emit(TokenType.Lt, "<", startLine, startCol);
        }
        break;
      case ">":
        if (peek() === "=") {
          advance();
          emit(TokenType.Ge, ">=", startLine, startCol);
        } else {
          emit(TokenType.Gt, ">", startLine, startCol);
        }
        break;
      case "&":
        if (peek() === "&") {
          advance();
          emit(TokenType.And, "&&", startLine, startCol);
        }
        break;
      case "|":
        if (peek() === "|") {
          advance();
          emit(TokenType.Or, "||", startLine, startCol);
        }
        break;
      case "?":
        if (peek() === "?") {
          advance();
          emit(TokenType.QuestionQuestion, "??", startLine, startCol);
        }
        break;
      case "(":
        emit(TokenType.LParen, ch, startLine, startCol);
        break;
      case ")":
        emit(TokenType.RParen, ch, startLine, startCol);
        break;
      case "{":
        emit(TokenType.LBrace, ch, startLine, startCol);
        break;
      case "}":
        emit(TokenType.RBrace, ch, startLine, startCol);
        break;
      case "[":
        emit(TokenType.LBracket, ch, startLine, startCol);
        break;
      case "]":
        emit(TokenType.RBracket, ch, startLine, startCol);
        break;
      case ",":
        emit(TokenType.Comma, ch, startLine, startCol);
        break;
      case ":":
        emit(TokenType.Colon, ch, startLine, startCol);
        break;
      case ".":
        emit(TokenType.Dot, ch, startLine, startCol);
        break;
      case ";":
        emit(TokenType.Semicolon, ch, startLine, startCol);
        break;
      default:
        // Skip unknown characters
        break;
    }
  }

  emit(TokenType.EOF, "", line, col);
  return tokens;
}
