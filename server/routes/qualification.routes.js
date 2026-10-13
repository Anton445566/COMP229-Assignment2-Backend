
import express from 'express';
import qualificationController from '../controllers/qualification.controller.js';
import authController from '../controllers/auth.controller.js';

const router = express.Router();

// Get all qualifications
router.get('/api/qualifications', qualificationController.getAllQualifications);

// Get qualification by ID
router.get('/api/qualifications/:id', qualificationController.getQualificationById);

// Create a new qualification
router.post('/api/qualifications', authController.requireSignin, qualificationController.createQualification);

// Update a qualification by ID
router.put('/api/qualifications/:id', authController.requireSignin, qualificationController.updateQualification);

// Delete a qualification by ID
router.delete('/api/qualifications/:id', authController.requireSignin, qualificationController.deleteQualification);

// Delete all qualifications
router.delete('/api/qualifications', authController.requireSignin, authController.requireAdmin, qualificationController.deleteAllQualifications);

export default router;
