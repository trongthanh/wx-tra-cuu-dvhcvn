export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    augmentContent();
  },
});

function augmentContent() {
  const targetText = 'phường Tân Thuận, TP.HCM';
  const tooltipText = 'Quận 12, TP.HCM';

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

  const textNodes: Text[] = [];
  let node: Node | null;

  while ((node = walker.nextNode())) {
    if (node.textContent && node.textContent.includes(targetText)) {
      textNodes.push(node as Text);
    }
  }

  textNodes.forEach((textNode) => {
    const parent = textNode.parentNode;
    if (!parent) return;

    const text = textNode.textContent || '';
    if (text.includes(targetText)) {
      const parts = text.split(targetText);
      const fragment = document.createDocumentFragment();

      parts.forEach((part, index) => {
        if (index > 0) {
          const link = document.createElement('a');
          link.href = '#';
          link.textContent = targetText;
          link.title = tooltipText;
          link.style.cssText =
            'color: currentColor; text-decoration: underline dotted; cursor: pointer;';

          link.addEventListener('click', (e) => {
            e.preventDefault();
          });

          fragment.appendChild(link);
        }
        if (part) {
          fragment.appendChild(document.createTextNode(part));
        }
      });

      parent.replaceChild(fragment, textNode);
    }
  });
}
