// HR owns eligibility; neither a capacity profile nor an ERP grant activates it.
const eligibility = (app, employee) => {
  if (!employee || employee.getString('status') !== 'active') return { eligible: false, work_type: '', reason: 'Associez votre compte à un employé actif.' }
  if (!employee.getBool('time_reporting_enabled')) return { eligible: false, work_type: '', reason: 'La saisie des heures n’est pas activée sur votre fiche employé.' }
  const team = employee.getString('team') ? app.findRecordById('core_teams', employee.getString('team')) : null
  const workType = team?.getString('time_work_type') || ''
  if (!team?.getBool('active') || !['be', 'production'].includes(workType)) return { eligible: false, work_type: '', reason: 'La saisie est réservée aux employés d’une équipe BE ou Production active.' }
  return { eligible: true, work_type: workType, reason: '' }
}
module.exports = {
  eligibility,
  be(app, employee) { const result = eligibility(app, employee); return result.eligible && result.work_type === 'be' },
  assertBe(app, employee) { const result = eligibility(app, employee); if (!result.eligible) throw new ForbiddenError(result.reason); if (result.work_type !== 'be') throw new ForbiddenError('Les temps Production seront repris depuis OnSite. La saisie Horizon est ouverte au BE.') },
}
