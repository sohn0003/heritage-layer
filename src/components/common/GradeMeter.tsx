import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// 자동차 계기판 스타일의 등급 게이지
// 등급별 색상과 점수 위치를 시각화합니다
// angle: 바늘 회전각 (0 = 정중앙 = B 위치, 음수 = 좌측, 양수 = 우측)
// 5개 구간 중심: D=-72°, C=-36°, B=0°, A=+36°, S=+72°
const GRADE_INFO: Record<string, { color: string; angle: number; label: string }> = {
  S: { color: 'hsl(199, 70%, 50%)', angle: 72, label: '최우수' },
  A: { color: 'hsl(150, 60%, 45%)', angle: 36, label: '우수' },
  B: { color: 'hsl(40, 90%, 55%)', angle: 0, label: '양호' },
  C: { color: 'hsl(25, 85%, 55%)', angle: -36, label: '보통' },
  D: { color: 'hsl(0, 75%, 55%)', angle: -72, label: '주의' },
};

interface GradeMeterProps {
  grade: string;
  totalScore?: number;
  size?: number;
  className?: string;
}

const GradeMeter = ({ grade, totalScore, size = 180, className }: GradeMeterProps) => {
  const info = GRADE_INFO[grade] ?? GRADE_INFO.C;
  const [needleAngle, setNeedleAngle] = useState(-72);

  useEffect(() => {
    // 마운트 시 0(D 시작)에서 등급 위치까지 부드럽게 회전
    const t = setTimeout(() => setNeedleAngle(info.angle), 80);
    return () => clearTimeout(t);
  }, [info.angle]);

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 14;

  // 호 path 생성 (180도 반원, -180° ~ 0°)
  const arc = (startDeg: number, endDeg: number, color: string) => {
    const sRad = ((startDeg - 180) * Math.PI) / 180;
    const eRad = ((endDeg - 180) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(sRad);
    const y1 = cy + r * Math.sin(sRad);
    const x2 = cx + r * Math.cos(eRad);
    const y2 = cy + r * Math.sin(eRad);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return (
      <path
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
        stroke={color}
        strokeWidth={size * 0.09}
        fill="none"
        strokeLinecap="butt"
      />
    );
  };

  // 5개 색 구간: D, C, B, A, S (왼쪽→오른쪽)
  const segments = [
    { start: 0, end: 36, color: GRADE_INFO.D.color },
    { start: 36, end: 72, color: GRADE_INFO.C.color },
    { start: 72, end: 108, color: GRADE_INFO.B.color },
    { start: 108, end: 144, color: GRADE_INFO.A.color },
    { start: 144, end: 180, color: GRADE_INFO.S.color },
  ];

  // 바늘 각도: needleAngle 이 이미 0=중앙 기준이므로 그대로 사용
  const needleRotation = needleAngle;

  return (
    <div className={cn('flex flex-col items-center', className)} style={{ width: size }}>
      <svg width={size} height={size * 0.62} viewBox={`0 0 ${size} ${size * 0.62}`}>
        {/* 배경 호 (옅게) */}
        <g opacity={0.15}>
          {segments.map((s, i) => (
            <g key={`bg-${i}`}>{arc(s.start, s.end, 'hsl(var(--muted-foreground))')}</g>
          ))}
        </g>
        {/* 컬러 호 */}
        {segments.map((s, i) => (
          <g key={i}>{arc(s.start, s.end, s.color)}</g>
        ))}

        {/* 눈금 라벨 */}
        {['D', 'C', 'B', 'A', 'S'].map((g, i) => {
          const ang = (18 + i * 36 - 180) * (Math.PI / 180);
          const lr = r + 2;
          const lx = cx + lr * Math.cos(ang);
          const ly = cy + lr * Math.sin(ang);
          return (
            <text
              key={g}
              x={lx}
              y={ly + 4}
              textAnchor="middle"
              fontSize={size * 0.07}
              fontWeight={700}
              fill={g === grade ? GRADE_INFO[g].color : 'hsl(var(--muted-foreground))'}
              opacity={g === grade ? 1 : 0.55}
            >
              {g}
            </text>
          );
        })}

        {/* 바늘 */}
        <g
          style={{
            transform: `rotate(${needleRotation}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transition: 'transform 1.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <line
            x1={cx}
            y1={cy}
            x2={cx}
            y2={cy - r + 6}
            stroke={info.color}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r={size * 0.045} fill={info.color} />
          <circle cx={cx} cy={cy} r={size * 0.02} fill="hsl(var(--background))" />
        </g>
      </svg>

      {/* 등급 + 점수 */}
      <div className="mt-1 flex flex-col items-center">
        <div
          className="text-3xl font-bold leading-none"
          style={{ color: info.color }}
        >
          {grade}
        </div>
        <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {info.label}
          {totalScore != null && <span className="ml-1.5">· {totalScore}점</span>}
        </div>
      </div>
    </div>
  );
};

export default GradeMeter;
