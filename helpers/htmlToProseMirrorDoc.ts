import { DOMParser as ProseMirrorDOMParser } from 'prosemirror-model';
import { schema } from '@/features/CollaborativeEditor/schema';

export const htmlToProseMirrorDoc = (htmlString: string) => {
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const content = doc.body;

  const figures = content.querySelectorAll('figure');
  figures.forEach((figure) => {
    if (!figure.querySelector('figcaption')) {
      const figcaption = document.createElement('figcaption');
      figcaption.innerText = ' ';
      figure.appendChild(figcaption);
    }
  });

  return ProseMirrorDOMParser.fromSchema(schema).parse(content);
};
