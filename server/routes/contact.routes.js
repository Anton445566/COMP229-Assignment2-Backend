import express from 'express'
    import contactCtrl from '../controllers/contact.controller.js' 
    import authCtrl from '../controllers/auth.controller.js'
    const router = express.Router()
    const loadContact = (req, res, next) => contactCtrl.contactByID(req, res, next, req.params.contactId)
    router.route('/api/contacts').post(contactCtrl.create)
    router.route('/api/contacts').get(authCtrl.requireSignin, contactCtrl.list)
    router.route('/api/contacts').delete(authCtrl.requireSignin, authCtrl.requireAdmin, contactCtrl.deleteAll)
    router.route('/api/contacts/:contactId').get(authCtrl.requireSignin, loadContact, contactCtrl.read)
    router.route('/api/contacts/:contactId').put(authCtrl.requireSignin, loadContact, contactCtrl.update)
    router.route('/api/contacts/:contactId').delete(authCtrl.requireSignin, loadContact, contactCtrl.remove)

    export default router


