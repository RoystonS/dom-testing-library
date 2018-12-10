"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getNodeText = getNodeText;

function getNodeText(node) {
  const window = node.ownerDocument.defaultView;
  return Array.from(node.childNodes).filter(child => child.nodeType === window.Node.TEXT_NODE && Boolean(child.textContent)).map(c => c.textContent).join('');
}