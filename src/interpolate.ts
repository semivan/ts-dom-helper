/**
 * Get a template from a string
 * @see https://stackoverflow.com/a/41015840
 * @param  {String} str    The string to interpolate
 * @param  {Object} params The parameters
 * @return {String}        The interpolated string
 */
export function interpolate(str: string, params: object = {}) {
    const names = Object.keys(params);
    const vals = Object.values(params);

    // eslint-disable-next-line no-new-func
    return new Function(...names, `return \`${str}\`;`)(...vals);
}
