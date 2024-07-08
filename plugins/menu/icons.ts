const prefix = 'ProseMirror-icon';

export function getIcon(root: Document | ShadowRoot, icon: { dom: Node }): HTMLElement {
  const doc = (root.nodeType == 9 ? (root as Document) : root.ownerDocument) || document;
  const node = doc.createElement('div');
  node.className = prefix;
  node.appendChild((icon as any).dom.cloneNode(true));

  return node;
}
