import charterUrl from '../../../docs/assets/horizon-brand-charter.png'

/** Variante principale officielle, affichée sans redessin ni recoloration. */
export function HorizonLogo() {
  return <svg viewBox="306 98 454 320" width="235" height="160" role="img" aria-label="Horizon" focusable="false"><defs><clipPath id="horizon-main-logo"><rect x="330" y="98" width="430" height="240" /><rect x="306" y="338" width="454" height="80" /></clipPath></defs><image clipPath="url(#horizon-main-logo)" href={charterUrl} width="1055" height="1491" /></svg>
}
