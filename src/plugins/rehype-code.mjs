// Keep scrollable code, equations and tables keyboard-accessible without JS.
export default function rehypeCode() {
  return function transform(tree) {
    function walk(node) {
      if (
        node.type === 'element' &&
        (node.tagName === 'pre' ||
          node.tagName === 'table' ||
          node.properties?.className?.includes('katex-display'))
      ) {
        node.properties = { ...node.properties, tabIndex: 0 };
      }
      if (node.children) node.children.forEach(walk);
    }
    walk(tree);
  };
}
