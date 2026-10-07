// Panel markası: giriş ekranındaki logo ve sol menüdeki simge (sitedeki K işaretiyle aynı)
const Mark = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={(size * 226) / 248} viewBox="0 0 248 226" aria-hidden="true">
    <path d="M70 0h112c38 0 64 26 64 58 0 22-11 40-29 50 22 10 31 29 31 52 0 38-30 66-70 66H70z" fill="#24D6E3" />
    <path d="M70 0h104c9 0 14 9 10 16l-62 90c-3 4-3 10 0 14l62 90c4 7-1 16-10 16H70z" fill="#2689DB" />
    <path d="M14 0h56v226H14C6 226 0 220 0 212V14C0 6 6 0 14 0z" fill="#4262F0" />
  </svg>
)

export function Logo() {
  return (
    <div className="kb-logo">
      <Mark size={44} />
      <div>
        <b>KolayBi</b>
        <span>İçerik Yönetimi</span>
      </div>
    </div>
  )
}

export function Icon() {
  return <Mark size={26} />
}
