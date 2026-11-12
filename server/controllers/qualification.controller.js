import Model from '../models/qualification.model.js';
import errors from './error.controller.js';
const fields = (body = {}) => Object.fromEntries(["title","firstname","lastname","email","institution","type","completion","description"].filter(key => Object.hasOwn(body, key)).map(key => [key, body[key]]));
const fail = (res, error) => res.status(errors.getStatus(error)).json({ error: errors.getErrorMessage(error) });
const getAllQualifications = async (req, res) => {
 try { return res.json(await Model.find()); } catch (error) { return fail(res, error); }
};
const getQualificationById = async (req, res) => {
 try {
 const record = await Model.findById(req.params.id);
 return record ? res.json(record) : res.status(404).json({ error: 'Qualification not found' });
 } catch (error) { return fail(res, error); }
};
const createQualification = async (req, res) => {
 try { return res.status(201).json(await new Model(fields(req.body)).save()); }
 catch (error) { return fail(res, error); }
};
const updateQualification = async (req, res) => {
 try {
 const record = await Model.findByIdAndUpdate(req.params.id, { $set: fields(req.body) }, { new: true, runValidators: true });
 return record ? res.json(record) : res.status(404).json({ error: 'Qualification not found' });
 } catch (error) { return fail(res, error); }
};
const deleteQualification = async (req, res) => {
 try {
 const record = await Model.findByIdAndDelete(req.params.id);
 return record ? res.json({ message: 'Qualification deleted' }) : res.status(404).json({ error: 'Qualification not found' });
 } catch (error) { return fail(res, error); }
};
const deleteAllQualifications = async (req, res) => {
 try { await Model.deleteMany({}); return res.json({ message: 'All qualifications deleted' }); }
 catch (error) { return fail(res, error); }
};
export default { getAllQualifications, getQualificationById, createQualification, updateQualification, deleteQualification, deleteAllQualifications };
