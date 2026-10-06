import { ImageSearch } from '../../../shared/images/ImageSearch'

export function LogoSearch(props: { initialQuery: string; disabled: boolean; onChoose: (file: File) => void; inputId: string }) {
  return <ImageSearch {...props} purpose="logo" />
}
