// Bit, la mascota: un pequeño chip de píxeles. Diseño propio.
interface Props {
  size?: number;
  mood?: 'happy' | 'think' | 'wow' | 'sad';
  className?: string;
}

export function Mascot({ size = 96, mood = 'happy', className = '' }: Props) {
  const eyes =
    mood === 'wow' ? (
      <>
        <rect x="9" y="9" width="3" height="4" fill="#0b1020" />
        <rect x="18" y="9" width="3" height="4" fill="#0b1020" />
      </>
    ) : mood === 'sad' ? (
      <>
        <rect x="9" y="11" width="3" height="1" fill="#0b1020" />
        <rect x="18" y="11" width="3" height="1" fill="#0b1020" />
      </>
    ) : (
      <>
        <rect x="9" y="10" width="3" height="3" fill="#0b1020" />
        <rect x="18" y="10" width="3" height="3" fill="#0b1020" />
        <rect x="10" y="10" width="1" height="1" fill="#fff" />
        <rect x="19" y="10" width="1" height="1" fill="#fff" />
      </>
    );
  const mouth =
    mood === 'happy' ? (
      <>
        <rect x="12" y="15" width="6" height="1" fill="#0b1020" />
        <rect x="11" y="14" width="1" height="1" fill="#0b1020" />
        <rect x="18" y="14" width="1" height="1" fill="#0b1020" />
      </>
    ) : mood === 'wow' ? (
      <rect x="14" y="14" width="2" height="3" fill="#0b1020" />
    ) : mood === 'sad' ? (
      <>
        <rect x="12" y="15" width="6" height="1" fill="#0b1020" />
        <rect x="11" y="16" width="1" height="1" fill="#0b1020" />
        <rect x="18" y="16" width="1" height="1" fill="#0b1020" />
      </>
    ) : (
      <rect x="13" y="15" width="5" height="1" fill="#0b1020" />
    );
  return (
    <svg className={`mascot ${className}`} width={size} height={size} viewBox="0 0 30 30" shapeRendering="crispEdges" aria-hidden="true">
      {/* antena */}
      <rect x="14" y="0" width="2" height="3" fill="#ffd166" />
      <rect x="13" y="0" width="4" height="1" fill="#ffd166" />
      {/* patitas del chip */}
      {[8, 12, 16, 20].map((y) => (
        <g key={y}>
          <rect x="2" y={y} width="3" height="2" fill="#8892c8" />
          <rect x="25" y={y} width="3" height="2" fill="#8892c8" />
        </g>
      ))}
      {/* cuerpo */}
      <rect x="5" y="3" width="20" height="22" fill="#4f8cff" />
      <rect x="5" y="3" width="20" height="2" fill="#7aa8ff" />
      <rect x="5" y="23" width="20" height="2" fill="#2f63d6" />
      <rect x="7" y="7" width="16" height="12" fill="#c9dcff" />
      {eyes}
      {mouth}
      {/* mejillas */}
      <rect x="7" y="13" width="2" height="1" fill="#ff8fab" />
      <rect x="21" y="13" width="2" height="1" fill="#ff8fab" />
      {/* letra C en la panza */}
      <rect x="12" y="20" width="6" height="1" fill="#ffd166" />
      <rect x="11" y="21" width="1" height="1" fill="#ffd166" />
      <rect x="12" y="22" width="6" height="1" fill="#ffd166" />
      {/* pies */}
      <rect x="8" y="25" width="4" height="2" fill="#2f63d6" />
      <rect x="18" y="25" width="4" height="2" fill="#2f63d6" />
      {mood === 'think' && (
        <>
          <rect x="26" y="2" width="2" height="2" fill="#c9dcff" />
          <rect x="28" y="0" width="2" height="1" fill="#c9dcff" />
        </>
      )}
    </svg>
  );
}

export function BitSays({ children, mood = 'happy' }: { children: React.ReactNode; mood?: Props['mood'] }) {
  return (
    <div className="bit-says">
      <Mascot size={48} mood={mood} />
      <div className="bit-bubble">{children}</div>
    </div>
  );
}
