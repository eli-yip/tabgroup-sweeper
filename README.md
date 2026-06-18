# tabgroup-sweeper

A tiny Chromium (Manifest V3) extension that **closes every tab belonging to a
tab group, and leaves ungrouped tabs open**. Click the toolbar icon, see the
groups it found, hit the button.

## Build

```sh
bun install
just build      # bundles src/popup.ts -> public/popup.js
```

## Load

Open `chrome://extensions` (or `brave://extensions`), enable **Developer mode**,
choose **Load unpacked**, and select the `public/` directory.

## Use

Click the toolbar icon. The popup lists each tab group (color, name, tab count);
the button closes all of those tabs at once. Tabs that are not in any group are
left untouched.

## Related

[tabgroups](https://github.com/eli-yip/tabgroups) is a companion CLI that
**exports** your tab groups (Markdown / HTML / JSON / CSV) and can LLM-classify
them — a handy backup to run before you sweep.

## License

[MIT](LICENSE)
