const fs = require('fs');
let css = fs.readFileSync('src/styles.css', 'utf-8');

css = css.replace(
  /html,\s*body,\s*#root\s*\{\s*width: 100%;\s*min-width: 320px;\s*min-height: 100%;\s*margin: 0;\s*\}/,
  "html,\nbody,\n#root {\n  width: 100%;\n  min-width: 320px;\n  min-height: 100%;\n  margin: 0;\n  overflow-y: scroll !important;\n}"
);

css = css.replace(
  /\.modal-content,\s*\.drawer-content,\s*\.modal-window,\s*\.modal-body\s*\{\s*max-height: calc\(100vh - 40px\) !important;/,
  ".modal-content,\n.drawer-content,\n.modal-window,\n.modal-body {\n  max-height: calc(100vh - 40px) !important;\n  overflow-y: auto !important;"
);

fs.writeFileSync('src/styles.css', css);
console.log('done');
