routerAdd('POST', '/api/horizon/contacts/merge/preview', (e) => require(`${__hooks}/lib/contact-merge.js`).preview(e), $apis.requireAuth('core_users'))
routerAdd('POST', '/api/horizon/contacts/merge/apply', (e) => require(`${__hooks}/lib/contact-merge.js`).apply(e), $apis.requireAuth('core_users'))

onRecordCreateRequest((e) => { require(`${__hooks}/lib/contact-merge.js`).requestGuard(e); e.next() }, 'contacts_companies', 'contacts_people')
onRecordUpdateRequest((e) => { require(`${__hooks}/lib/contact-merge.js`).requestGuard(e); e.next() }, 'contacts_companies', 'contacts_people')
onRecordDelete((e) => { if (e.record.getString('merged_into')) throw new BadRequestError('Cette fiche fusionnée conserve son historique et ne peut être supprimée.'); e.next() }, 'contacts_companies', 'contacts_people', 'inventory_products')
onRecordValidate((e) => { require(`${__hooks}/lib/merge-common.js`).validate(e); e.next() })
