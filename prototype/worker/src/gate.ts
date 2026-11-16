export type Gate = { question: string; answer: number };

export function newGate(random: () => number = Math.random): Gate {
  const pick = () => 6 + Math.floor(random() * 4);
  const a = pick();
  const b = pick();
  return { question: `What is ${a} times ${b}?`, answer: a * b };
}

export function passesGate(gate: Gate, answer: unknown): boolean {
  return typeof answer === "number" && answer === gate.answer;
}
