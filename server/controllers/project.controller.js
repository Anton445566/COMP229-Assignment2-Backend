import Model from '../models/project.model.js';
import errors from './error.controller.js';
const fields = (body = {}) => Object.fromEntries(["title","firstname","lastname","email","completion","description"].filter(key => Object.hasOwn(body, key)).map(key => [key, body[key]]));
const fail = (res, error) => res.status(errors.getStatus(error)).json({ error: errors.getErrorMessage(error) });
const getAllProjects = async (req, res) => {
 try { return res.json(await Model.find()); } catch (error) { return fail(res, error); }
};
const getProjectById = async (req, res) => {
 try {
 const record = await Model.findById(req.params.id);
 return record ? res.json(record) : res.status(404).json({ error: 'Project not found' });
 } catch (error) { return fail(res, error); }
};
const createProject = async (req, res) => {
 try { return res.status(201).json(await new Model(fields(req.body)).save()); }
 catch (error) { return fail(res, error); }
};
const updateProject = async (req, res) => {
 try {
 const record = await Model.findByIdAndUpdate(req.params.id, { $set: fields(req.body) }, { new: true, runValidators: true });
 return record ? res.json(record) : res.status(404).json({ error: 'Project not found' });
 } catch (error) { return fail(res, error); }
};
const deleteProject = async (req, res) => {
 try {
 const record = await Model.findByIdAndDelete(req.params.id);
 return record ? res.json({ message: 'Project deleted' }) : res.status(404).json({ error: 'Project not found' });
 } catch (error) { return fail(res, error); }
};
const deleteAllProjects = async (req, res) => {
 try { await Model.deleteMany({}); return res.json({ message: 'All projects deleted' }); }
 catch (error) { return fail(res, error); }
};
export default { getAllProjects, getProjectById, createProject, updateProject, deleteProject, deleteAllProjects };
