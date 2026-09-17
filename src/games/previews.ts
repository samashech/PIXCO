import type { GameDefinition, GameFrame, Pixel } from "./engine/types";
export function previewFrame(game: GameDefinition): GameFrame {
  const engine = game.create();
  engine.init();
  if (game.id === "001") {
    const pixels: Pixel[] = [];
    const rows = [
      "0000000000",
      "0000000000",
      "0000110000",
      "0000110000",
      "0000000000",
      "0000000000",
      "0000000000",
      "0000000000",
      "0000000000",
      "0000000000",
      "0000000000",
      "0000000000",
      "0000000000",
      "0000000000",
      "0000000010",
      "1000000010",
      "1100100110",
      "1110101110",
      "1110111110",
      "1111111110",
    ];
    rows.forEach((row, y) =>
      [...row].forEach((v, x) => {
        if (v === "1") pixels.push({ x, y });
      }),
    );
    return {
      width: 10,
      height: 20,
      pixels,
      next: [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ],
    };
  }
  return engine.render();
}
