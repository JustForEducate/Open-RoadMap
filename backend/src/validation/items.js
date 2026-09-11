export function validateItem(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'JSON object required';
  if (partial && !['title', 'description', 'stage'].some((key) => Object.hasOwn(body, key))) return 'No fields to update';
  if (Object.keys(body).some((key) => !['title', 'description', 'stage'].includes(key))) return 'Unknown item field';
  if (typeof body.title === 'string' && body.title.length > 200) return 'title exceeds 200 characters';
  if (typeof body.description === 'string' && body.description.length > 10000) return 'description exceeds 10000 characters';
  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) return 'title must be a non-empty string';
  }
  if (body.description !== undefined && typeof body.description !== 'string') {
    return 'description must be a string';
  }
  if (!partial || body.stage !== undefined) {
    if (!Number.isInteger(body.stage) || body.stage < 1 || body.stage > 4) return 'stage must be an integer from 1 to 4';
  }
  return null;
}
