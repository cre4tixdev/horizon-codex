import { ClientResponseError } from 'pocketbase'
import { sessionService } from '../auth/services/session'
import { environment } from '../config/environment'
import { createTablePreferencesRepository } from './TablePreferencesRepository'
import { tablePreferenceRecordSchema, type TablePreferenceRecord } from './tablePreferences'

export class TablePreferencesService {
  constructor(private readonly repository: ReturnType<typeof createTablePreferencesRepository> | undefined, private readonly allowed: () => boolean) {}
  private async run<T>(action: (repository: ReturnType<typeof createTablePreferencesRepository>) => Promise<T>) {
    if (!this.allowed()) throw new Error('Connexion nécessaire pour vos préférences de tableaux.')
    if (!this.repository) throw new Error('Les préférences de tableaux ne sont pas configurées.')
    try { return await action(this.repository) }
    catch (error) {
      const status = error instanceof ClientResponseError ? error.status : 0
      console.error('[table-preferences] Request failed', { status })
      if (status === 404) throw new Error('Installez le pack PocketBase Préférences de tableaux puis redémarrez PocketBase.', { cause: error })
      if (status === 409) throw new Error('Affichage modifié dans un autre navigateur. Rechargez les colonnes avant de réessayer.', { cause: error })
      if (status === 403) throw new Error('Vous ne disposez plus de l’accès à ce tableau.', { cause: error })
      throw new Error('Préférences non synchronisées. Rechargez les colonnes puis réessayez.', { cause: error })
    }
  }
  read(context: string) { return this.run((repository) => repository.read(context)) }
  save(context: string, input: TablePreferenceRecord) { return this.run((repository) => repository.save(context, tablePreferenceRecordSchema.parse(input))) }
}
export const tablePreferencesService = new TablePreferencesService(environment.pocketBaseUrl ? createTablePreferencesRepository(environment.pocketBaseUrl) : undefined, () => sessionService.getSnapshot().status === 'authenticated')
