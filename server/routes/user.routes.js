import express from 'express'
    import userCtrl from '../controllers/user.controller.js' 
    import authCtrl from '../controllers/auth.controller.js'
    const router = express.Router()
    const loadUser = (req, res, next) => userCtrl.userByID(req, res, next, req.params.userId)
    router.route('/api/users').post(userCtrl.create)
    router.route('/api/users').get(authCtrl.requireSignin, userCtrl.list)
    router.route('/api/users').delete(authCtrl.requireSignin, authCtrl.requireAdmin, userCtrl.removeAll)
    router.route('/api/users/:userId').get(authCtrl.requireSignin, authCtrl.hasAuthorization, loadUser, userCtrl.read)
    router.route('/api/users/:userId').put(authCtrl.requireSignin, authCtrl.hasAuthorization, loadUser, userCtrl.update)
    router.route('/api/users/:userId').delete(authCtrl.requireSignin, authCtrl.hasAuthorization, loadUser, userCtrl.remove)

    export default router

