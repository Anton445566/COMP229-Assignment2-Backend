export const resources = {
 projects: { title: 'Projects', singular: 'Project', fields: [
  ['title','Title',true], ['firstname','First name',true], ['lastname','Last name',true],
  ['email','Email',true,'email'], ['completion','Completion date',false,'date'], ['description','Description',false,'textarea']
 ] },
 qualifications: { title: 'Education / Qualifications', singular: 'Qualification', fields: [
  ['title','Title',true], ['firstname','First name'], ['lastname','Last name'], ['email','Email',false,'email'],
  ['institution','Institution'], ['type','Type'], ['completion','Completion date',false,'date'], ['description','Description',false,'textarea']
 ] },
 contacts: { title: 'Contact Me', singular: 'Contact', fields: [
  ['firstname','First name',true], ['lastname','Last name',true], ['email','Email',true,'email'],
  ['contactNumber','Contact number',true,'tel'], ['message','Message',true,'textarea']
 ] }
};
export const pagePath = resource => resource === 'qualifications' ? '/education' : resource === 'contacts' ? '/contact' : '/projects';
