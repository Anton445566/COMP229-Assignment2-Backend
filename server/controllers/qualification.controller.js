
import Qualification from '../models/qualification.model.js';

// GET all qualifications
const getAllQualifications = async (req, res) => {
  try {
    const qualifications = await Qualification.find();
    res.status(200).json(qualifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET a qualification by ID
const getQualificationById = async (req, res) => {
  try {
    const qualification = await Qualification.findById(req.params.id);

    if (!qualification) {
      return res.status(404).json({ message: 'Qualification not found' });
    }

    res.status(200).json(qualification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// POST a new qualification
const createQualification = async (req, res) => {
  try {
    const qualification = new Qualification(req.body);
    const savedQualification = await qualification.save();
    res.status(201).json(savedQualification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT update a qualification
const updateQualification = async (req, res) => {
  try {
    const qualification = await Qualification.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!qualification) {
      return res.status(404).json({ message: 'Qualification not found' });
    }

    res.status(200).json(qualification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE a qualification by ID
const deleteQualification = async (req, res) => {
  try {
    const qualification = await Qualification.findByIdAndDelete(req.params.id);

    if (!qualification) {
      return res.status(404).json({ message: 'Qualification not found' });
    }

    res.status(200).json({
      message: 'Qualification deleted successfully'
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE all qualifications
const deleteAllQualifications = async (req, res) => {
  try {
    await Qualification.deleteMany({});
    res.status(200).json({
      message: 'All qualifications deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  getAllQualifications,
  getQualificationById,
  createQualification,
  updateQualification,
  deleteQualification,
  deleteAllQualifications
};
