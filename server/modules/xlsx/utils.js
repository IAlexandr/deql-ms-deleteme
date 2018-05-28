export default {
  validateKeys,
  mergeObjectsBySchema,
};

// проверка запрещ. символов в ключах (для дальнейшей записи в бд)
export function validateKeys(val) {
  const symbols = ['.'];
  symbols.forEach(s => {
    val = val.replace(s, '_');
  });
  return val;
}
/**
 *
 *
 * @export
 * @param {any} input
 * @param {any} spacing
 * @returns
 */
export function splitArray(input, spacing) {
  var output = [];
  for (var i = 0; i < input.length; i += spacing)
    output[output.length] = input.slice(i, i + spacing);
  return output;
}
/**
 *
 *
 * @export
 * @param {string} ns
 * @param {any} obj
 * @returns
 */
export function valBy(ns, obj) {
  const levels = ns.split('.');
  const first = levels.shift();
  if (typeof obj[first] === 'undefined') {
    return undefined;
  }
  if (levels.length) {
    return valBy(levels.join('.'), obj[first]);
  }
  return obj[first];
}
/**
 *
 *
 * @export
 * @param {string} path
 * @param {object} obj
 * @param {any} value
 * @returns
 */
export function setBy(path, obj, value) {
  const pList = path.split('.');
  const key = pList.pop();
  const pointer = pList.reduce((accumulator, currentValue) => {
    if (accumulator[currentValue] === undefined)
      accumulator[currentValue] = {};
    return accumulator[currentValue];
  }, obj);
  pointer[key] = value;
  return obj;
}

/**
 *
 *
 * @export
 * @param {any} o1
 * @param {any} o2
 * @param {any} fieldsSchema
 * @returns
 */
export function mergeObjectsBySchema(o1, o2, fieldsSchema) {
  Object.keys(fieldsSchema).forEach(targetFieldPath => {
    const sourceFieldPath = fieldsSchema[targetFieldPath];
    setBy(targetFieldPath, o1, valBy(sourceFieldPath, o2));
  });
  return o1;
}
