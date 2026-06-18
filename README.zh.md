# tabgroup-sweeper

> [English](README.md)

一个极简的 Chromium（Manifest V3）扩展，**关闭所有属于某个标签组的标签页，保留未分组
的标签页**。点工具栏图标，看它找到的分组，按下按钮即可。

## 构建

```sh
bun install
just build      # 把 src/popup.ts 打包成 public/popup.js
```

## 加载

打开 `chrome://extensions`（或 `brave://extensions`），开启 **开发者模式**，
选择 **加载已解压的扩展程序**，指向 `public/` 目录。

## 使用

点工具栏图标。弹窗会列出每个标签组（颜色、名称、标签页数量）；按钮一次性关闭这些
标签页。不属于任何分组的标签页保持不动。

## 相关项目

[tabgroups](https://github.com/eli-yip/tabgroups) 是配套的命令行工具，可把标签组
**导出**为 Markdown / HTML / JSON / CSV，还能用 LLM 按主题分类——清理前先跑一遍做备份
很方便。

## 许可证

[MIT](LICENSE)
