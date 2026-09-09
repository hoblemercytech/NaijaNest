export default function Logo({ size = 30, showName = true, tone = 'dark' }) {
  const markSize = Math.round(size * 1.15);

  return (
    <span className="row" style={{ gap: size * 0.28 }}>
      <img
        src="/logo.jpg"
        alt=""
        width={markSize}
        height={markSize}
        style={{ display: 'block',borderRadius: '8px', flex: 'none' }}
      />
      {showName ? (
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: size * 0.62,
            letterSpacing: '-0.022em',
            color: tone === 'light' ? '#FFFFFF' : 'var(--green-800)',
            whiteSpace: 'nowrap',
          }}
        >
          NaijaNest
        </span>
      ) : (
        <span className="sr-only">NaijaNest</span>
      )}
    </span>
  );
}