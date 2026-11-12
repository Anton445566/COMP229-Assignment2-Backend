import mongoose from 'mongoose';
import config from '../../config/config.js';
import User from '../models/user.model.js';
import Project from '../models/project.model.js';
import Qualification from '../models/qualification.model.js';

export async function seed() {
 const email = (process.env.ADMIN_EMAIL || 'admin@portfolio.local').trim().toLowerCase();
 const existing = await User.findOne({ email });
 if (existing) {
  if (existing.role !== 'Admin') throw new Error('Admin email belongs to a User. Choose another ADMIN_EMAIL; this command will not elevate or reset an existing account.');
  console.log('Existing admin kept unchanged.');
 } else {
  if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 12)
   throw new Error('Set ADMIN_PASSWORD to at least 12 characters before creating the admin.');
  await new User({ name: 'Portfolio Admin', email, password: process.env.ADMIN_PASSWORD, role: 'Admin' }).save();
  console.log('Admin created: ' + email);
 }
 const projects = [
  { title: 'Growing Planet', description: 'A team software and web project helping users identify plant conditions and track plant needs. Feature ideas included plant condition checks, watering needs, and plant tracking. My role: idea development, feature discussions, planning, and teamwork. Outcome: helped shape the project concept and planned features with my team.' },
  { title: 'Database / SQL Coursework', description: 'Relational database design, tables, and SQL queries for retrieving and managing data. My role: student practising database design and SQL. Outcome: practice in organising related data and understanding queries across tables.' },
  { title: 'React Portfolio', description: 'My COMP229 portfolio built with React, JavaScript, Vite, and CSS. My role: student developing the portfolio and learning component and route organisation. Outcome: responsive portfolio pages, shared navigation, database forms, and role-based administration.' }
 ];
 for (const project of projects) {
  if (!await Project.exists({ title: project.title }))
   await new Project({ ...project, firstname: 'Anton', lastname: 'Nasr', email: 'anton@example.com' }).save();
 }
 const qualifications = [
  { title: 'Software Engineering Technology', institution: 'Centennial College', type: 'Education', description: 'Started September 2025. Current status: Student.' },
  { title: 'Secondary School', institution: 'St. Joan of Arc Catholic Secondary School', type: 'Education', description: 'Mississauga, Ontario. Graduated approximately 2023.' },
  { title: 'Security Licence', type: 'Professional Qualification' },
  { title: 'First Aid / CPR', type: 'Professional Qualification' }
 ];
 for (const qualification of qualifications) {
  if (!await Qualification.exists({ title: qualification.title }))
   await new Qualification(qualification).save();
 }
 console.log('Portfolio setup complete; existing records were preserved.');
}
if (process.argv[1] && new URL(import.meta.url).pathname.endsWith(process.argv[1].replaceAll('\\','/').split('/').pop())) {
 try {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
  await User.init();
  await seed();
 } catch (error) {
  console.error('Setup failed: ' + error.message); process.exitCode = 1;
 } finally { await mongoose.disconnect(); }
}
