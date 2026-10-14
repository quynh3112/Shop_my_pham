import { useMemo } from "react";

const SIZE = 25;

// Hash đơn giản để mỗi mã đơn ra một hình khác nhau (chỉ để minh hoạ, KHÔNG quét được)
const seedFrom = (text: string) => [...text].reduce((hash, ch) => (hash * 31 + ch.charCodeAt(0)) >>> 0, 7);

const isFinder = (x: number, y: number) =>
  [
    [0, 0],
    [SIZE - 7, 0],
    [0, SIZE - 7],
  ].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);

// Ô vuông định vị ở 3 góc giống QR thật
const finderCell = (x: number, y: number) => {
  const corners: [number, number][] = [
    [0, 0],
    [SIZE - 7, 0],
    [0, SIZE - 7],
  ];
  const [fx, fy] = corners.find(([cx, cy]) => x >= cx && x < cx + 7 && y >= cy && y < cy + 7)!;
  const dx = x - fx;
  const dy = y - fy;
  const ring = Math.min(dx, dy, 6 - dx, 6 - dy);
  return ring !== 1; // viền ngoài + lõi đậm, vòng giữa trắng
};

/** Mã QR minh hoạ cho trang thanh toán giả lập */
export default function FakeQrCode({ value, size = 200 }: { value: string; size?: number }) {
  const cells = useMemo(() => {
    let seed = seedFrom(value);
    const next = () => {
      seed = (seed * 1103515245 + 12345) >>> 0;
      return seed / 2 ** 32;
    };
    const result: [number, number][] = [];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const filled = isFinder(x, y) ? finderCell(x, y) : next() > 0.55;
        if (filled) result.push([x, y]);
      }
    }
    return result;
  }, [value]);

  return (
    <svg
      viewBox={`-2 -2 ${SIZE + 4} ${SIZE + 4}`}
      width={size}
      height={size}
      role="img"
      aria-label="Mã QR minh hoạ (không quét được)"
      className="bg-white"
      shapeRendering="crispEdges"
    >
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#1a1a1a" />
      ))}
    </svg>
  );
}
