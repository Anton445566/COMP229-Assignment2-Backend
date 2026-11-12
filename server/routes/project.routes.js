import express from 'express';
import ctrl from '../controllers/project.controller.js';
import auth from '../controllers/auth.controller.js';
const router = express.Router();
const base = '/api/projects';

router.get(base, ctrl.getAllProjects);
router.post(base, auth.requireSignin, auth.requireAdmin, ctrl.createProject);
router.delete(base, auth.requireSignin, auth.requireAdmin, ctrl.deleteAllProjects);
router.get(base + '/:id', ctrl.getProjectById);
router.put(base + '/:id', auth.requireSignin, auth.requireAdmin, ctrl.updateProject);
router.delete(base + '/:id', auth.requireSignin, auth.requireAdmin, ctrl.deleteProject);
export default router;
