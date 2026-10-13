import Contact from '../models/contact.model.js'
import errorHandler from './error.controller.js'
const contactFields = (body = {}) => Object.fromEntries(
  ['firstname', 'lastname', 'email'].filter((field) => Object.hasOwn(body, field))
    .map((field) => [field, body[field]])
)
const create = async (req, res) => { 
try {
const contact = new Contact(contactFields(req.body))
await contact.save()
return res.status(200).json({ 
message: "Successfully created!"
})
} catch (err) {
return res.status(errorHandler.getStatus(err)).json({
error: errorHandler.getErrorMessage(err) 
})
} 
}
const list = async (req, res) => { 
try {
let contacts = await Contact.find().select('firstname lastname email') 
res.json(contacts)
} catch (err) {
return res.status(errorHandler.getStatus(err)).json({
error: errorHandler.getErrorMessage(err) 
})
} 
}
const contactByID = async (req, res, next, id) => { 
try {
let contact = await Contact.findById(id) 
if (!contact)
return res.status(404).json({ 
error: "Contact not found"
})
req.contact = contact 
next()
} catch (err) {
return res.status(errorHandler.getStatus(err)).json({ 
error: errorHandler.getErrorMessage(err)
}) 
}
}
const read = (req, res) => {
return res.json(req.contact) 
}
const update = async (req, res) => { 
try {
let contact = req.contact
Object.assign(contact, contactFields(req.body))
await contact.save()
//user.hashed_password = undefined 
//user.salt = undefined
res.json(contact) 
} catch (err) {
return res.status(errorHandler.getStatus(err)).json({
error: errorHandler.getErrorMessage(err) 
})
} 
}
const remove = async (req, res) => { 
try {
let contact = req.contact
await contact.deleteOne()
res.json({ message: 'Contact deleted successfully' })
} catch (err) {
return res.status(errorHandler.getStatus(err)).json({
error: errorHandler.getErrorMessage(err) 
})
} 
}
const deleteAll = async (req, res) => {
  try {
    await Contact.deleteMany({})
    return res.json({ message: 'All contacts deleted successfully' })
  } catch (err) {
    return res.status(errorHandler.getStatus(err)).json({ error: errorHandler.getErrorMessage(err) })
  }
}
export default { create, contactByID, read, list, remove, update, deleteAll }


