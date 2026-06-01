// placeholder 마스코트 — MFA 테마(방패+말풍선). 추후 실제 마스코트로 교체.
export default function Mascot({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2l7 3v6c0 4.4-3 8.4-7 9-4-0.6-7-4.6-7-9V5l7-3z"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M12 2l7 3v6c0 4.4-3 8.4-7 9-4-0.6-7-4.6-7-9V5l7-3z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M9 11.5h6M9 8.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
