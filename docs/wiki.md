# Textor - VS Code 文本转换工具

Textor 是一个功能强大的 VS Code 扩展插件，提供多种文本格式化和转换功能。

## 目录

- [使用](#使用)
- [功能列表](#功能列表)
  - [Base64 编解码](#base64-编解码)
  - [JSON 格式化](#json-格式化)
  - [URL 编解码](#url-编解码)
  - [转义处理](#转义处理)
  - [Unicode 编解码](#unicode-编解码)
  - [时间戳转换](#时间戳转换)
  - [IP 地址转换](#ip-地址转换)
  - [SQL 格式化](#sql-格式化)
  - [大小写转换](#大小写转换)
  - [Protobuf 编解码](#protobuf-编解码)
  - [Proto 格式化](#proto-格式化)
  - [Hex/ASCII 转换](#hexascii-转换)
- [侧边栏工具](#侧边栏工具)

---

## 使用

选中文本后，按下快捷键 `Shift+Alt+F` 或打开右键菜单选择 `Textor: Smart Transform`，即可选择文本转换工具。

插件会自动识别文本类型并推荐最合适的转换操作。
**智能识别支持：**
- Base64 编码 → 推荐 Base64 Decode
- URL 编码（%XX）→ 推荐 URL Decode
- 压缩的 JSON → 推荐 JSON Format
- 格式化的 JSON → 推荐 JSON Minify
- Unicode 转义（\uXXXX）→ 推荐 Unicode Decode
- 时间戳（10/13位数字）→ 推荐 Timestamp to Date
- 日期时间 → 推荐 Date to Timestamp
- IP 地址 → 推荐 IP to Integer
- 十六进制字符串 → 推荐 Hex to ASCII / Hex to Protobuf
- 转义字符 → 推荐 Unescape

---

## 功能列表

### Base64 编解码 (Base64 Encode/Decode)

将选中文本进行 Base64 编码或解码。

### JSON 格式化 (JSON Format/Minify)

对 JSON 字符串进行格式化（美化）或压缩。

### URL 编解码 (URL Encode/Decode)

对 URL 进行编码或解码处理。

### 转义处理 (Unescape/Escape)

对特殊字符进行转义或反转义。

### Unicode 编解码 (Unicode Encode/Decode)

将文本转换为 Unicode 编码或从 Unicode 解码。

**示例：**
```
输入: 你好
编码后: \u4f60\u597d
```

### 时间戳转换 (Timestamp to Date/Date to Timestamp)

在 Unix 时间戳和日期字符串之间相互转换。

**输入格式：**
- 时间戳：支持秒级（10位）和毫秒级（13位），自动识别
- 日期：必须为 `YYYY-MM-DD HH:mm:ss` 格式

### IP 地址转换 (IP to Integer)

在 IPv4 地址和整数之间相互转换。

### SQL 格式化 (SQL Format/Minify)

格式化或压缩 SQL 语句。

### 大小写转换

提供多种大小写转换方式。

| 命令 | 说明 |
|------|------|
| `Textor: To Upper Case` | 转为大写 |
| `Textor: To Lower Case` | 转为小写 |
| `Textor: To Title Case` | 转为标题格式（每个单词首字母大写） |
| `Textor: To Camel Case` | 转为驼峰命名 |
| `Textor: To Snake Case` | 转为下划线命名 |

### Protobuf 编解码 (Hex to Protobuf/Protobuf to Hex)

将十六进制字符串按照 Protocol Buffer Wire Format 规则解码，或将解码后的文本重新编码为十六进制。

**示例：**
```
Hex -> Protobuf:
输入: 0a02082a
输出:
1:
  1: 42

修改后 Protobuf -> Hex:
输入:
1:
  1: 100
输出: 0a03086401
```

**支持的值类型：**
- 字符串：用双引号包裹，如 `"Hello"`
- 整数：直接写数字，如 `100`
- bytes：以 `0x` 开头，如 `0x1a2b3c`
- 嵌套消息：使用缩进表示层级

### Proto 格式化 (Proto Format)

格式化 `.proto` 文件内容，自动调整缩进。

### Hex/ASCII 转换 (Hex to ASCII/ASCII to Hex)

十六进制字符串与 ASCII 字符串相互转换。

## 侧边栏工具

点击左侧 Activity Bar 的 **Textor** 图标（🔧）打开侧边栏工具面板。

### 时间工具

### 随机密码生成器

### UUID 生成器

### HMAC-SHA256

---

## 许可证

MIT License
