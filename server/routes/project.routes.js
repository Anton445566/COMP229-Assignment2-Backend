
import express from 'express';
import projectController from '../controllers/project.controller.js';
import authController from '../controllers/auth.controller.js';

const router = express.Router();

// Get all projects
router.get('/api/projects', projectController.getAllProjects);

// Get project by ID
router.get('/api/projects/:id', projectController.getProjectById);

// Create a new project
router.post('/api/projects', authController.requireSignin, projectController.createProject);

// Update a project by ID
router.put('/api/projects/:id', authController.requireSignin, projectController.updateProject);

// Delete a project by ID
router.delete('/api/projects/:id', authController.requireSignin, projectController.deleteProject);

// Delete all projects
router.delete('/api/projects', authController.requireSignin, authController.requireAdmin, projectController.deleteAllProjects);

export default router;
