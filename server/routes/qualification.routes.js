import express from 'express';
import ctrl from '../controllers/qualification.controller.js';
import auth from '../controllers/auth.controller.js';
const router = express.Router();
const base = '/api/qualifications';

router.get(base, ctrl.getAllQualifications);
router.post(base, auth.requireSignin, auth.requireAdmin, ctrl.createQualification);
router.delete(base, auth.requireSignin, auth.requireAdmin, ctrl.deleteAllQualifications);
router.get(base + '/:id', ctrl.getQualificationById);
router.put(base + '/:id', auth.requireSignin, auth.requireAdmin, ctrl.updateQualification);
router.delete(base + '/:id', auth.requireSignin, auth.requireAdmin, ctrl.deleteQualification);
export default router;
