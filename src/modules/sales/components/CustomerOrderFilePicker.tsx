import { HFilePicker } from '../../../shared/ui/HFilePicker'
import type { ComponentProps } from 'react'
export function CustomerOrderFilePicker(props: ComponentProps<typeof HFilePicker>) { return <HFilePicker label="Pièce de commande client" instruction="Déposez les pièces de commande ici ou choisissez des fichiers" {...props} /> }
