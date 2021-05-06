import { lex } from "./lex";

test("parses ops and numbers", () => {
  expect(lex("1 + 2 - 3 * 4 / 5")).toStrictEqual([
    { kind: "NUMBER", content: 1 },
    { kind: "PLUS" },
    { kind: "NUMBER", content: 2 },
    { kind: "MINUS" },
    { kind: "NUMBER", content: 3 },
    { kind: "TIMES" },
    { kind: "NUMBER", content: 4 },
    { kind: "DIVIDE" },
    { kind: "NUMBER", content: 5 },
  ]);
});

test("parses identifiers", () => {
  expect(lex("x + x")).toStrictEqual([
    { kind: "IDENTIFIER", content: "x" },
    { kind: "PLUS" },
    { kind: "IDENTIFIER", content: "x" },
  ]);
});

test("ignores whitespace", () => {
  expect(lex("1 +             2")).toStrictEqual([
    { kind: "NUMBER", content: 1 },
    { kind: "PLUS" },
    { kind: "NUMBER", content: 2 },
  ]);
});

test("ignores parentheses", () => {
  expect(lex("(1 + 2) * 3")).toStrictEqual([
    { kind: "LPAREN" },
    { kind: "NUMBER", content: 1 },
    { kind: "PLUS" },
    { kind: "NUMBER", content: 2 },
    { kind: "RPAREN" },
    { kind: "TIMES" },
    { kind: "NUMBER", content: 3 },
  ]);
});
