# jinge-antd-icons

> ant-design icons for jinge framework

## Usage

### default
```js
const { AntdIconsAlias } = require('jinge-antd-icons/compiler');
// equal as:
const { generateAntdIconsAlias } = require('jinge-antd-icons/compiler');
const AntdIconsAlias = generateAntdIconsAlias('outlined', 'ic');
```

```html
<ic-message> <!-- same as <ic-message-filled> -->
<ic-message-outlined>
<ic-message-filled>
<ic-message-twotone>
```

### custom

```js
const { generateAntdIconsAlias } = require('jinge-antd-icons/compiler');
const AntdIconsAlias = generateAntdIconsAlias('filled', 'custom-prefix');
```
```html
<custom-prefix-message> <!-- same as <custom-prefix-message-filled> -->
<custom-prefix-message-outlined>
<custom-prefix-message-filled>
<custom-prefix-message-twotone>
```


## Develop

1. clone [https://github.com/ant-design/ant-design-icons]() to `.tmp` directory
2. run `scripts/generate.js`