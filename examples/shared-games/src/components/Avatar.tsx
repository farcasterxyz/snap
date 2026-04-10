"use client";

const COLORS = [
  "#907AA9", "#EC4899", "#F59E0B", "#10B981", "#3B82F6",
  "#EF4444", "#6366F1", "#14B8A6", "#F97316", "#907AA9",
];

export default function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const colorIndex = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % COLORS.length;
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: COLORS[colorIndex],
        fontSize: size * 0.38,
      }}
    >
      {initials}
    </div>
  );
}
