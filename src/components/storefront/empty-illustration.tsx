import type { ReactNode } from "react";

export type EmptyIllustrationKind = "cart" | "favorites" | "orders" | "notifications";

// رنگ‌ها همه از توکن‌های تم سایت می‌آیند (`--color-primary*`)؛ فقط
// خطوط از `--sf-ink` (با Fallback) هستند. هیچ رنگ ثابتی برای برند
// نوشته نشده، پس با تغییر تم سایت خودکار عوض می‌شوند.
const INK = "var(--sf-ink, #18181B)";
const PRIMARY = "var(--color-primary)";
const SOFT = "var(--color-primary-soft)";
const TINT = "color-mix(in srgb, var(--color-primary) 14%, white)";
const MID = "color-mix(in srgb, var(--color-primary) 40%, white)";

function Sprig({ x }: { x: number }) {
  return (
    <g
      transform={`translate(${x},142)`}
      fill="none"
      stroke={INK}
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M0 0V-44" />
      <path d="M0 -10Q-9 -12 -10 -21Q-1 -20 0 -10Z" fill={MID} />
      <path d="M0 -22Q9 -24 10 -33Q1 -32 0 -22Z" fill={MID} />
      <circle cx="0" cy="-53" r="2.4" fill="#fff" />
      <circle cx="5" cy="-48" r="2.4" fill="#fff" />
      <circle cx="-5" cy="-48" r="2.4" fill="#fff" />
      <circle cx="0" cy="-43" r="2.4" fill="#fff" />
      <circle cx="0" cy="-48" r="2.4" fill={PRIMARY} />
    </g>
  );
}

function Spark({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      d="M0 -5Q0 0 5 0Q0 0 0 5Q0 0 -5 0Q0 0 0 -5Z"
      fill={PRIMARY}
      transform={`translate(${x},${y}) scale(${s})`}
    />
  );
}

/** بوم مشترک: ترنج، قالی گرد با ریشه، بوته‌ها و ستاره‌ها. */
function Scene() {
  return (
    <>
      <path
        d="M22 92C14 78 24 66 38 68C36 54 50 44 64 48C80 40 104 52 108 74C110 90 96 104 78 108L44 108C32 108 26 100 22 92Z"
        fill={SOFT}
        transform="translate(-6,-6)"
      />
      <circle cx="100" cy="88" r="38" fill={TINT} />
      <circle cx="100" cy="88" r="31" fill="#fff" stroke={MID} strokeWidth="1" strokeDasharray="2 3" />
      <ellipse cx="100" cy="133" rx="62" ry="14" fill="#fff" stroke={INK} strokeWidth="1.2" />
      <ellipse
        cx="100"
        cy="133"
        rx="52"
        ry="10"
        fill={SOFT}
        stroke={MID}
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      <path
        d="M62 133L66 130.5L70 133L66 135.5Z M80 137L84 134.5L88 137L84 139.5Z M112 137L116 134.5L120 137L116 139.5Z M130 133L134 130.5L138 133L134 135.5Z"
        fill={PRIMARY}
      />
      <path
        d="M80 129L84 126.5L88 129L84 131.5Z M112 129L116 126.5L120 129L116 131.5Z"
        fill={MID}
      />
      <g stroke={INK} strokeWidth="1" strokeLinecap="round" fill="none">
        <path d="M38 128H33M37 131.5H31M37 135H31M38 138.5H33" />
        <path d="M162 128H167M163 131.5H169M163 135H169M162 138.5H167" />
      </g>
      <ellipse cx="100" cy="123" rx="22" ry="3.6" fill={MID} />
      <Sprig x={24} />
      <Sprig x={176} />
      <Spark x={52} y={50} />
      <Spark x={150} y={42} s={0.7} />
      <Spark x={160} y={76} s={0.55} />
      <Spark x={66} y={30} s={0.5} />
    </>
  );
}

const OBJECTS: Record<EmptyIllustrationKind, { dy: number; node: ReactNode; title: string }> = {
  cart: {
    dy: -8,
    title: "سبد خرید خالی",
    node: (
      <>
        <path d="M84 88Q100 64 116 88" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M76 88H124L117 117H83Z" fill={PRIMARY} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
        <path
          d="M88 98L92 94L96 98L92 102Z M104 98L108 94L112 98L108 102Z M96 108L100 104L104 108L100 112Z"
          fill={SOFT}
        />
        <line x1="79" y1="88" x2="121" y2="88" stroke={INK} strokeWidth="1.2" strokeLinecap="round" />
      </>
    ),
  },
  favorites: {
    dy: -8,
    title: "علاقه‌مندی‌های خالی",
    node: (
      <>
        <path
          d="M100 120C75 103 73 82 87 77C94 75 99 79 100 86C101 79 106 75 113 77C127 82 125 103 100 120Z"
          fill={PRIMARY}
          stroke={INK}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path d="M100 82L103 92L113 95L103 98L100 108L97 98L87 95L97 92Z" fill="#fff" transform="translate(0,-1)" />
      </>
    ),
  },
  orders: {
    dy: -8,
    title: "سفارش‌های خالی",
    node: (
      <>
        <path d="M76 86H116A8 13 0 0 1 116 112H76Z" fill={PRIMARY} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
        <ellipse cx="76" cy="99" rx="8" ry="13" fill={MID} stroke={INK} strokeWidth="1.2" />
        <ellipse cx="76" cy="99" rx="4.5" ry="7.5" fill="#fff" stroke={INK} strokeWidth="1" />
        <circle cx="76" cy="99" r="1.6" fill={PRIMARY} />
        <path d="M99 99L103 95L107 99L103 103Z" fill={SOFT} />
        <line x1="90" y1="86" x2="90" y2="112" stroke="#fff" strokeWidth="2.4" />
        <line x1="112" y1="86" x2="112" y2="112" stroke="#fff" strokeWidth="2.4" />
      </>
    ),
  },
  notifications: {
    dy: -12,
    title: "اعلان‌های خالی",
    node: (
      <>
        <path
          d="M100 76C88 76 85 86 85 96V102L79 110H121L115 102V96C115 86 112 76 100 76Z"
          fill={PRIMARY}
          stroke={INK}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <circle cx="100" cy="73" r="2.6" fill="#fff" stroke={INK} strokeWidth="1" />
        <path d="M96 95L100 91L104 95L100 99Z" fill={SOFT} />
        <path d="M96 110Q100 119 104 110" fill="#fff" stroke={INK} strokeWidth="1.2" />
        <line x1="100" y1="118" x2="100" y2="123" stroke={INK} strokeWidth="1.2" />
        <path d="M97 123H103L102 128H98Z" fill={MID} stroke={INK} strokeWidth="1" />
      </>
    ),
  },
};

type EmptyIllustrationProps = {
  kind: EmptyIllustrationKind;
  className?: string;
};

/**
 * تصویر «خالی» مینیاتوری (قالی گرد + ترنج + بوته) برای صفحه‌های
 * سبد خرید، علاقه‌مندی‌ها، سفارش‌ها و اعلان‌ها. فقط SVG ساده است
 * (بدون Hook و بدون `id`)، پس هم در Server Component و هم در Client
 * Component قابل استفاده است و چند نمونه در یک صفحه تداخل نمی‌کنند.
 */
export function EmptyIllustration({ kind, className }: EmptyIllustrationProps) {
  const { dy, node, title } = OBJECTS[kind];
  return (
    <svg viewBox="0 0 200 160" role="img" aria-label={title} className={className}>
      <Scene />
      <g transform={`translate(0,${dy})`}>{node}</g>
    </svg>
  );
}
