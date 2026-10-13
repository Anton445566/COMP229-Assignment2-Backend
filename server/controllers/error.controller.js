const getStatus = (err) => {
  if (err?.name === 'ValidationError' || err?.name === 'CastError' ||
      err?.code === 11000 || err?.code === 11001 || err?.type === 'entity.parse.failed') {
    return 400;
  }
  if (Number.isInteger(err?.status) && err.status >= 400 && err.status <= 599) {
    return err.status;
  }
  return 500;
};

const getErrorMessage = (err) => {
  if (err?.code === 11000 || err?.code === 11001) {
    const fields = Object.keys(err.keyPattern || {});
    return fields.length ? `${fields.join(', ')} already exists` : 'A unique field already exists';
  }
  if (err?.name === 'ValidationError') {
    return Object.values(err.errors || {}).map((issue) =>
      issue.name === 'CastError' ? `Invalid value for ${issue.path}` : issue.message
    ).join('; ') || 'Validation failed';
  }
  if (err?.name === 'CastError') return 'Invalid identifier or field value';
  if (err?.type === 'entity.parse.failed') return 'Invalid JSON request body';
  if (err?.type === 'entity.too.large') return 'Request body is too large';
  if (err?.expose === true && getStatus(err) < 500) return err.message;
  return 'An unexpected error occurred';
};

const handleError = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  return res.status(getStatus(err)).json({ error: getErrorMessage(err) });
};

export default { getStatus, getErrorMessage, handleError };
