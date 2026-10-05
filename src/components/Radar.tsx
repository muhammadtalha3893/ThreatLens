export default function Radar({ size = 260 }: { size?: number }) {
  const blips = [
    { x: 68, y: 30, color: "#cf6679", delay: "0s" },
    { x: 26, y: 58, color: "#d9a05b", delay: "0.9s" },
    { x: 76, y: 72, color: "#82c7d4", delay: "1.7s" },
  ];
  return (
    <div
      className="relative rounded-full border border-[#3a3844] bg-[radial-gradient(circle,rgba(130,199,212,0.06),rgba(27,26,31,0.9))] overflow-hidden"
      style={{ width: size, height: size }}
    >
      {/* rings */}
      {[0.78, 0.56, 0.34].map((r) => (
        <div
          key={r}
          className="absolute rounded-full border border-[#34323b]"
          style={{
            left: `${(1 - r) * 50}%`,
            top: `${(1 - r) * 50}%`,
            width: `${r * 100}%`,
            height: `${r * 100}%`,
          }}
        />
      ))}
      {/* crosshair */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#34323b]" />
      <div className="absolute top-1/2 left-0 right-0 h-px bg-[#34323b]" />
      {/* sweep */}
      <div className="absolute inset-0 radar-sweep rounded-full" />
      {/* blips */}
      {blips.map((b, i) => (
        <div key={i} className="absolute" style={{ left: `${b.x}%`, top: `${b.y}%` }}>
          <span
            className="absolute -inset-2 rounded-full border"
            style={{ borderColor: b.color, animation: `ping-ring 2.6s ease-out ${b.delay} infinite` }}
          />
          <span className="block w-1.5 h-1.5 rounded-full" style={{ background: b.color, boxShadow: `0 0 8px ${b.color}` }} />
        </div>
      ))}
      {/* center */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#82c7d4] shadow-[0_0_12px_#82c7d4]" />
    </div>
  );
}
