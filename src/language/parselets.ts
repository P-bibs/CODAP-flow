import { Token } from "./lex";
import { Ast, Operator, UnaryOperator, Builtin } from "./ast";
import { getBindingPower, parseExpr } from "./parse";

export interface PrefixParselet {
  parse(tokens: Token[], current_token: Token): Ast;
}

export interface InfixParselet {
  parse(tokens: Token[], left_node: Ast, current_token: Token): Ast;
}

/**
 * Expect that a token of a given kind is at the end of the stream, and pop
 * it off and return it. Error otherwise, possibly with a custom message.
 *
 * @param kind the type of token to expect
 * @param errorMsg a custom error message, if provided
 * @returns the token successfully consumed
 */
function expect_consume(
  tokens: Token[],
  kind: string,
  errorMsg?: string
): Token {
  if (!errorMsg) {
    errorMsg = `Unexpected token, expected ${kind}`;
  }

  const next = tokens.pop();
  if (!next || next.kind !== kind) {
    throw new Error(errorMsg);
  }

  return next;
}

/**
 * Convert an Operator to a Token
 */
function opToToken(op: Operator): Token {
  switch (op) {
    case "+":
      return { kind: "PLUS" };
    case "-":
      return { kind: "MINUS" };
    case "*":
      return { kind: "TIMES" };
    case "/":
      return { kind: "DIVIDE" };
    case "=":
      return { kind: "EQUAL" };
    case "!=":
      return { kind: "NOT_EQUAL" };
    case ">":
      return { kind: "GREATER" };
    case ">=":
      return { kind: "GREATER_EQUAL" };
    case "&&":
      return { kind: "L_AND" };
    case "||":
      return { kind: "L_OR" };
  }
}

export class NumberParselet implements PrefixParselet {
  parse(tokens: Token[], current_token: Token): Ast {
    if (current_token.kind === "NUMBER") {
      return { kind: "Number", content: current_token.content };
    } else {
      throw Error("Tried to use NumberParselet with non-number token");
    }
  }
}

export class StringParselet implements PrefixParselet {
  parse(tokens: Token[], current_token: Token): Ast {
    if (current_token.kind === "STRING") {
      return { kind: "String", content: current_token.content };
    } else {
      throw Error("Tried to use StringParselet with non-string token");
    }
  }
}

export class IdentifierParselet implements PrefixParselet {
  parse(tokens: Token[], current_token: Token): Ast {
    if (current_token.kind === "IDENTIFIER") {
      return { kind: "Identifier", content: current_token.content };
    } else {
      throw Error("Tried to use IdentifierParselet with non-number token");
    }
  }
}

export class ParenthesisParselet implements PrefixParselet {
  parse(tokens: Token[]): Ast {
    const expr = parseExpr(tokens, 0);
    expect_consume(
      tokens,
      "RPAREN",
      "Expected right paren to close expression"
    );
    return expr;
  }
}

export class UnaryOperatorParselet implements PrefixParselet {
  constructor(op: UnaryOperator) {
    this.op = op;
  }
  op: UnaryOperator;

  parse(tokens: Token[]): Ast {
    const expr = parseExpr(tokens, 0);
    return { kind: "Unop", op: this.op, op1: expr };
  }
}

export class OperatorParselet implements InfixParselet {
  constructor(op: Operator, isLeftAssociative: boolean) {
    this.op = op;
    this.isLeftAssociative = isLeftAssociative;
  }
  op: Operator;
  isLeftAssociative: boolean;

  parse(tokens: Token[], left_node: Ast): Ast {
    const bindingPower = getBindingPower(opToToken(this.op));
    const rightNode = parseExpr(
      tokens,
      this.isLeftAssociative ? bindingPower : bindingPower - 1
    );

    return { kind: "Binop", op: this.op, op1: left_node, op2: rightNode };
  }
}

export class BuiltinParselet implements PrefixParselet {
  parse(tokens: Token[], current_token: Token): Ast {
    if (current_token.kind != "IDENTIFIER") {
      throw new Error("Tried to use BuiltinParselet on non-identifier");
    }
    const name = current_token.content as Builtin;
    expect_consume(
      tokens,
      "LPAREN",
      `Expected parenthesis after built-in "${name}"`
    );

    const args = [];
    let next;
    while (true) {
      // peek next token
      next = tokens[tokens.length - 1];

      if (!next) {
        throw new Error(
          `Unexpected end of argument list for built-in "${name}"`
        );
      }
      if (next.kind === "RPAREN") {
        break;
      }

      // parse an argument expression
      args.push(parseExpr(tokens, 0));

      next = tokens[tokens.length - 1];
      if (next.kind !== "COMMA") {
        break;
      }
      tokens.pop(); // consume the comma
    }
    expect_consume(
      tokens,
      "RPAREN",
      `Expected closing parenthesis after arguments to built-in "${name}"`
    );

    return { kind: "Builtin", name, args };
  }
}
