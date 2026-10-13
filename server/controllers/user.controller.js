import User from '../models/user.model.js'
import errorHandler from './error.controller.js'
const userFields = (body = {}) => Object.fromEntries(
  ['name', 'email', 'password'].filter((field) => Object.hasOwn(body, field))
    .map((field) => [field, body[field]])
)
const publicUser = (user) => ({
  _id: user._id, name: user.name, email: user.email,
  created: user.created, updated: user.updated
})
const create = async (req, res) => { 
try {
const user = new User(userFields(req.body))
await user.save()
return res.status(200).json({ 
message: "Successfully signed up!"
})
} catch (err) {
return res.status(errorHandler.getStatus(err)).json({
error: errorHandler.getErrorMessage(err) 
})
} 
}
const list = async (req, res) => { 
try {
let users = await User.find().select('name email updated created') 
res.json(users)
} catch (err) {
return res.status(errorHandler.getStatus(err)).json({
error: errorHandler.getErrorMessage(err) 
})
} 
}
const userByID = async (req, res, next, id) => { 
try {
let user = await User.findById(id) 
if (!user)
return res.status(404).json({ 
error: "User not found"
})
req.profile = user 
next()
} catch (err) {
return res.status(errorHandler.getStatus(err)).json({ 
error: errorHandler.getErrorMessage(err)
}) 
}
}
const read = (req, res) => {
return res.json(publicUser(req.profile))
}
const update = async (req, res) => { 
try {
let user = req.profile
Object.assign(user, userFields(req.body))
user.updated = Date.now() 
await user.save()
res.json(publicUser(user))
} catch (err) {
return res.status(errorHandler.getStatus(err)).json({
error: errorHandler.getErrorMessage(err) 
})
} 
}
const remove = async (req, res) => { 
try {
let user = req.profile
await user.deleteOne()
res.json({ message: 'User deleted successfully' })
} catch (err) {
return res.status(errorHandler.getStatus(err)).json({
error: errorHandler.getErrorMessage(err) 
})
} 
}
const removeAll = async (req, res) => {
  try {
    await User.deleteMany({})
    return res.json({ message: 'All users deleted successfully' })
  } catch (err) {
    return res.status(errorHandler.getStatus(err)).json({ error: errorHandler.getErrorMessage(err) })
  }
}
export default { create, userByID, read, list, remove, update, removeAll }


