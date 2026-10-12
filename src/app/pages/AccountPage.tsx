import { useEffect, useId, useState, useSyncExternalStore } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { Camera, KeyRound, Mail, ShieldCheck, Undo2, UserRound, X } from 'lucide-react'
import { sessionService } from '../../core/auth/services/session'
import { accountService } from '../../core/auth/services/AccountService'
import { accountInputSchema, passwordInputSchema, type Account, type AccountInput, type PasswordInput, presenceLabels, presenceSchema } from '../../core/auth/schemas/account'
import { UserAvatar } from '../../core/auth/components/UserAvatar'
import { HPageHeader } from '../../shared/ui/HPageHeader'
import { HPageBreadcrumb } from '../../shared/ui/HPageBreadcrumb'
import { HRecordPageActions } from '../../shared/ui/HRecordPageActions'
import { HSectionHeading } from '../../shared/ui/HSectionHeading'
import { HFieldLabel } from '../../shared/ui/HFieldLabel'
import { HCombobox } from '../../shared/ui/HCombobox'
import { HInput } from '../../shared/ui/HInput'
import { HButton } from '../../shared/ui/HButton'
import { HSaveButton } from '../../shared/ui/HSaveButton'
import { HLoadingIndicator } from '../../shared/ui/HLoadingIndicator'
import { HDialog } from '../../shared/ui/HDialog'
import { HDialogFooter } from '../../shared/ui/HDialogFooter'

export function AccountPage() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const profile = useQuery({ queryKey: ['account', 'profile', session.status === 'authenticated' ? session.user.id : ''], queryFn: accountService.read, enabled: session.status === 'authenticated', retry: false })
  const [notice, setNotice] = useState('')
  return <div className="contact-directory account-page">
    <HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Mon compte' }]} />
    <HPageHeader title="Mon compte" description="Votre identité, votre photo et la sécurité de votre connexion." />
    {notice && <p role="status" className="account-saved">{notice}</p>}
    {profile.isPending && <HLoadingIndicator label="Chargement du compte" />}
    {profile.error && <p role="alert" className="field-error">{profile.error.message}<HButton onClick={() => void profile.refetch()}>Réessayer</HButton></p>}
    {profile.data && <AccountEditor key={profile.data.updated} account={profile.data} onSaved={() => setNotice('Votre profil est enregistré.')} />}
  </div>
}

function AccountEditor({ account, onSaved }: { account: Account; onSaved: () => void }) {
  const client = useQueryClient(), formId = useId(), uploadId = useId()
  const initial: AccountInput = { presence: account.presence, name: account.name, first_name: account.first_name, last_name: account.last_name, public_email: account.public_email }
  const form = useForm<AccountInput>({ defaultValues: initial })
  const presence = useWatch({ control: form.control, name: 'presence' })
  const [file, setFile] = useState<File>(), [preview, setPreview] = useState(''), [removeAvatar, setRemoveAvatar] = useState(false), [fileError, setFileError] = useState(''), [passwordOpen, setPasswordOpen] = useState(false)
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  const dirty = form.formState.isDirty || Boolean(file) || removeAvatar
  const save = useMutation({ mutationFn: (input: AccountInput) => accountService.save(input, account.updated, file, removeAvatar), onSuccess: (saved) => { client.setQueryData(['account', 'profile', saved.id], saved); onSaved() } })
  function reset() { form.reset(initial); setFile(undefined); setPreview(''); setRemoveAvatar(false); setFileError(''); save.reset() }
  function photo(selected?: File) {
    if (!selected) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(selected.type) || selected.size > 2097152) { setFileError('Choisissez une image PNG, JPEG ou WebP de 2 Mo maximum.'); return }
    setFileError(''); setFile(selected); setPreview(URL.createObjectURL(selected)); setRemoveAvatar(false)
  }
  async function submit(input: AccountInput) {
    const parsed = accountInputSchema.safeParse(input)
    if (!parsed.success) { for (const issue of parsed.error.issues) { const key = issue.path[0]; if (key === 'first_name' || key === 'last_name' || key === 'name' || key === 'public_email') form.setError(key, { message: issue.message }, { shouldFocus: true }) }; return }
    save.mutate(parsed.data)
  }
  return <>
    <HRecordPageActions><HButton variant="ghost" disabled={!dirty || save.isPending} onClick={reset}><Undo2 size={14} />Annuler</HButton><HSaveButton form={formId} type="submit" hasChanges={dirty} pending={save.isPending} /></HRecordPageActions>
    <form id={formId} className="account-form" onSubmit={form.handleSubmit(submit)} noValidate>
      <section className="contact-panel account-profile"><HSectionHeading title="Identité et photo" icon={UserRound} />
        <div className="account-profile-grid">
          <div className="account-photo-editor">
            <div className="account-photo">{preview ? <img src={preview} alt="Aperçu de votre photo" /> : <UserAvatar user={{ ...account, avatar: removeAvatar ? '' : account.avatar }} />}</div>
            <div className="account-photo-actions"><HButton asChild variant="ghost" size="small" disabled={save.isPending}><label htmlFor={uploadId}><Camera size={14} />Changer la photo</label></HButton>{(file || account.avatar && !removeAvatar) && <HButton variant="ghost" size="icon" disabled={save.isPending} aria-label="Retirer la photo" onClick={() => { setFile(undefined); setPreview(''); setRemoveAvatar(Boolean(account.avatar)) }}><X size={14} /></HButton>}</div>
            <HInput id={uploadId} hidden type="file" accept="image/png,image/jpeg,image/webp" aria-label="Photo de profil" disabled={save.isPending} onChange={(event) => { photo(event.target.files?.[0]); event.target.value = '' }} />
            <p className="contact-muted">PNG, JPEG ou WebP · 2 Mo max.</p>{fileError && <p role="alert" className="field-error">{fileError}</p>}
          </div>
          <div className="account-fields">
            {(['first_name', 'last_name', 'name', 'public_email'] as const).map((key) => <label key={key} className="h-form-field"><HFieldLabel required={key !== 'public_email'}>{({ first_name: 'Prénom', last_name: 'Nom', name: 'Nom affiché', public_email: 'E-mail de contact' })[key]}</HFieldLabel><HInput aria-label={({ first_name: 'Prénom', last_name: 'Nom', name: 'Nom affiché', public_email: 'E-mail de contact' })[key]} type={key === 'public_email' ? 'email' : 'text'} autoComplete={({ first_name: 'given-name', last_name: 'family-name', name: 'nickname', public_email: 'email' })[key]} maxLength={key === 'name' ? 160 : key === 'public_email' ? 254 : 80} disabled={save.isPending} aria-invalid={Boolean(form.formState.errors[key])} aria-describedby={form.formState.errors[key] ? `${formId}-${key}-error` : undefined} {...form.register(key)} />{form.formState.errors[key] && <span id={`${formId}-${key}-error`} className="field-error">{form.formState.errors[key]?.message}</span>}</label>)}
            <label className="h-form-field"><HFieldLabel>Disponibilité</HFieldLabel><HCombobox label="Disponibilité" showCodes={false} clearable={false} required disabled={save.isPending} value={presence} options={Object.entries(presenceLabels).map(([value, label]) => ({ value, label }))} onChange={(value) => form.setValue('presence', presenceSchema.parse(value), { shouldDirty: true })} /></label><p className="contact-muted account-field-help">Le nom affiché apparaît dans Horizon. L’e-mail de contact ne change pas votre identifiant de connexion.</p>
          </div>
        </div>{save.error && <p role="alert" className="field-error">{save.error.message}</p>}
      </section>
    </form>
    <div className="account-secondary">
      <section className="contact-panel"><HSectionHeading title="Connexion et sécurité" icon={KeyRound} /><dl className="account-info"><div><dt><Mail size={14} />Adresse de connexion</dt><dd>{account.email}</dd></div></dl><HButton disabled={save.isPending || dirty} onClick={() => setPasswordOpen(true)}><KeyRound size={14} />Changer mon mot de passe</HButton>{dirty && <p className="contact-muted">Enregistrez vos modifications avant de changer le mot de passe.</p>}</section>
      <section className="contact-panel"><HSectionHeading title="Mes accès" icon={ShieldCheck} /><dl className="account-info"><div><dt>Profil</dt><dd>{({ admin: 'Admin', superuser: 'Superuser', user: 'User', viewer: 'Viewer' } as Record<string, string>)[account.erp_profile] || account.erp_profile}</dd></div><div><dt>Rôle</dt><dd>{account.role_label}</dd></div></dl><p className="contact-muted">Pour modifier vos accès, contactez votre administrateur.</p></section>
    </div>
    {passwordOpen && <PasswordEditor onClose={() => setPasswordOpen(false)} />}
  </>
}

function PasswordEditor({ onClose }: { onClose: () => void }) {
  const form = useForm<PasswordInput>({ defaultValues: { current_password: '', password: '', password_confirm: '' } }), formId = useId()
  const change = useMutation({ mutationFn: accountService.password })
  function submit(input: PasswordInput) {
    const parsed = passwordInputSchema.safeParse(input)
    if (!parsed.success) { for (const issue of parsed.error.issues) { const key = issue.path[0]; if (key === 'current_password' || key === 'password' || key === 'password_confirm') form.setError(key, { message: issue.message }, { shouldFocus: true }) }; return }
    change.mutate(parsed.data)
  }
  return <HDialog open title="Changer mon mot de passe" description="Après enregistrement, reconnectez-vous avec votre nouveau mot de passe." onOpenChange={(open) => { if (!open && !change.isPending) onClose() }}><form id={formId} className="dialog-form" onSubmit={form.handleSubmit(submit)} noValidate>{(['current_password', 'password', 'password_confirm'] as const).map((key) => <label key={key} className="h-form-field"><HFieldLabel required>{({ current_password: 'Mot de passe actuel', password: 'Nouveau mot de passe', password_confirm: 'Confirmer le nouveau mot de passe' })[key]}</HFieldLabel><HInput aria-label={({ current_password: 'Mot de passe actuel', password: 'Nouveau mot de passe', password_confirm: 'Confirmer le nouveau mot de passe' })[key]} type="password" autoComplete={key === 'current_password' ? 'current-password' : 'new-password'} disabled={change.isPending} aria-invalid={Boolean(form.formState.errors[key])} aria-describedby={form.formState.errors[key] ? `${formId}-${key}-error` : undefined} {...form.register(key)} />{form.formState.errors[key] && <span id={`${formId}-${key}-error`} className="field-error">{form.formState.errors[key]?.message}</span>}</label>)}<p className="contact-muted">Au moins 12 caractères.</p>{change.error && <p role="alert" className="field-error">{change.error.message}</p>}</form><HDialogFooter><HButton disabled={change.isPending} onClick={onClose}>Annuler</HButton><HSaveButton form={formId} type="submit" hasChanges pending={change.isPending} /></HDialogFooter></HDialog>
}
