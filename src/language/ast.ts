export type Ast =
  | { kind: "Binop"; op: Operator; op1: Ast; op2: Ast }
  | { kind: "Unop"; op: UnaryOperator; op1: Ast }
  | { kind: "Identifier"; content: string }
  | { kind: "Number"; content: number }
  | { kind: "String"; content: string };

export type Operator =
  | "+"
  | "-"
  | "*"
  | "/"
  | "="
  | "!="
  | ">"
  | ">="
  | "&&"
  | "||";

export type UnaryOperator = 
  | "not"

export type Value =
  | { kind: "Num"; content: number }
  | { kind: "Bool"; content: boolean }
  | { kind: "String"; content: string };
