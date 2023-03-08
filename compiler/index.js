const icons = require('./__icons');
const SvgTypes = ['outlined', 'filled', 'twotone'];
/** 转为大驼峰 */
function toTF(s) {
  return s.replace(/-./g, m => m[1].toUpperCase()).replace(/./, m => m.toUpperCase());
}

function generateAntdIconsAlias(defaultType, defaultPrefix) {
  return Object.fromEntries(icons.map(icon => {
    const name = toTF(icon);
    return [
      `jinge-antd-icons/icons/${name}.js`,
      {
        [`${name}${toTF(defaultType)}`]: `${defaultPrefix}-${icon}`,
        ...Object.fromEntries(SvgTypes.map(iconType => [
          `${name}${toTF(iconType)}`, `${defaultPrefix}-${icon}-${iconType}` 
        ]))
      }
    ]
  }));
}
module.exports = {
  AntdIconsAlias: generateAntdIconsAlias("outlined", "ic"),
  generateAntdIconsAlias
};
