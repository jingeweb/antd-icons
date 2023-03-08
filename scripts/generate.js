const { promises: fs } = require("fs");
const path = require("path");
const svgo = require("svgo");
const { TemplateParser, ComponentParser } = require("jinge-compiler");
const { execSync, exec } = require("child_process");

TemplateParser.aliasManager.initialize();

const SVG_DIR = path.resolve(
  __dirname,
  "../.tmp/ant-design-icons/packages/icons-svg/svg"
);
const LIB_DIR = path.resolve(__dirname, "../lib");
const ICON_DIR = path.resolve(__dirname, "../icons");
const SRC_DIR = path.resolve(__dirname, "../src");
const ROOT_DIR = path.resolve(__dirname, "../");
const SVG_TYPES = ["outlined", "filled", "twotone"];

execSync(`rm -rf ${LIB_DIR} && mkdir ${LIB_DIR}`);
execSync(`rm -rf ${ICON_DIR} && mkdir ${ICON_DIR}`);
SVG_TYPES.forEach((type) => {
  execSync(`rm -rf ${path.join(ROOT_DIR, type)}`);
});

/** 转为大驼峰 */
function toTF(s) {
  return s.replace(/-./g, m => m[1].toUpperCase()).replace(/./, m => m.toUpperCase());
}

async function handleIcon(iconFile) {
  let jsCode = '';
  let dtsCode = '';
  const iconName = toTF(iconFile);
  for await(const iconType of SVG_TYPES) {
    // if (iconType !== 'outlined') {
    //   continue;
    // }
    const filepath = path.join(SVG_DIR, iconType, iconFile + '.svg');
    let filecnt;
    try {
      filecnt = await fs.readFile(filepath);
    } catch (ex) {
      continue;
    }
    const svg = svgo.optimize(filecnt, {
      plugins: [
        "removeTitle",
        "removeXMLProcInst",
        "removeDoctype",
        "removeUselessDefs",
        "removeXMLNS",
        {
          name: "removeUselessStrokeAndFill",
          params: {
            removeNone: true,
            removeUseless: true,
          },
        },
        "collapseGroups",
        {
          name: "removeAttrs",
          params: {
            attrs: ["class", "p-id", "version", "t", "style", "xmlns"]
          }
        }
      ],
    });
    if (svg.error) {
      throw new Error(`[error] ${file} svgo error: ${svg.error}`);
    }
    const result = await new Promise((resolve, reject) => {
      let error;
      let result = TemplateParser.parse(svg.data.replace(/<g\/>/g, ""), {
        resourcePath: filepath,
        emitErrorFn: (err) => error = err,
      });
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
    const ic = `${iconName}${iconType.replace(/./, m => m.toUpperCase())}`;
    let code =
      result.code
        .replace("export default", `const svg_${ic} =`) +
      `\nexport class ${ic} extends Icon {
  constructor(attrs) {
    attrs[___jg0402].slots = { default: svg_${ic} };
    super(attrs);
  }
}`;
    if (jsCode.length > 0) {
      code = code.replace(/import[^\n]+/g, "");
    }
    jsCode += code + '\n';
    dtsCode += `export class ${ic} extends Icon {}\n`;
  }
  
  await Promise.all([
    fs.writeFile(
      path.join(ICON_DIR, `${iconName}.js`),
      jsCode
    ),
    fs.writeFile(
      path.join(ICON_DIR, `${iconName}.d.ts`),
      dtsCode
    ),
  ]);
}

async function handleLib(name) {
  let cnt = await fs.readFile(path.join(SRC_DIR, name + ".js"), "utf-8");
  let result = ComponentParser.parse(cnt, undefined, {
    resourcePath: name + ".js",
  });
  await fs.writeFile(
    path.join(LIB_DIR, name + ".js"),
    result.code.replace(`'./${name}.html'`, `'./${name}.tpl.js'`)
  );

  cnt = await fs.readFile(path.join(SRC_DIR, name + ".html"), "utf-8");
  result = TemplateParser.parse(cnt, { resourcePath: name + ".html", emitErrorFn: (err) => console.error(err) });
  await fs.writeFile(path.join(LIB_DIR, name + ".tpl.js"), result.code);
}

(async () => {
  console.log("start generating...");
  
  execSync(`cp ${SRC_DIR}/icon.css ${SRC_DIR}/index.d.ts ${SRC_DIR}/index.js ${LIB_DIR}`);
  await handleLib('icon');
  await handleLib('icon_set');

  let icons = [];
  for await(const iconType of SVG_TYPES) {
    const ics = (await fs.readdir(path.join(SVG_DIR, iconType)))
      .filter(f => f.endsWith('.svg'))
      .map(f => f.split('.')[0]);
    icons = icons.concat(ics);
  }
  icons = [...(new Set(icons).values())]; // 去重

  await fs.writeFile(
    path.resolve(__dirname, `../compiler/__icons.js`),
    `/** auto generated file **/
module.exports = ${JSON.stringify(icons)};`
  );

  let finished = 0;
  const total = icons.length;
  const N = 1;
  for (let i = 0; i < total; i += N) {
    await handleIcon(icons[i]);
    // const ics = icons.slice(i, i + N);
    // await Promise.all(ics.map(icon => handleIcon(icon)));
    // finished += ics.length;
    finished++;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(finished === total ? 'finished' : `progress: ${finished}/${total}`);
  }
})().catch((err) => {
  console.error(err);
});
