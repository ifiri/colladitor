import { XMLParser } from 'fast-xml-parser';
import { schema } from '@/features/CollaborativeEditor/schema';

export const xmlToJsonProseMirror = (xmlString) => {
  const parser = new XMLParser({ ignoreAttributes: false });
  const jsonObj = parser.parse(xmlString);

  function buildProseMirrorDoc(json, schema) {
    if (typeof json === 'string') {
      // Remove empty text blocks because ProseMirror cannot parse them
      if (json.trim() === '') {
        return [];
      }
      return [{ type: 'text', text: json }];
    }

    if (json === null || typeof json !== 'object') {
      return [];
    }

    return Object.entries(json).flatMap(([key, value]) => {
      if (key === 'figure') {
        if (Array.isArray(value)) {
          return value.flatMap((item) => buildProseMirrorDoc({ figure: item }, schema));
        } else {
          const imageNode = {
            type: 'image',
            attrs: {
              src: value?.image?.['@_src'] || '',
              alt: value?.image?.['@_alt'] || '',
            },
          };
          const figcaptionNode = {
            type: 'figcaption',
            content: buildProseMirrorDoc(value?.figcaption || {}, schema),
          };
          return [{ type: 'figure', content: [imageNode, figcaptionNode] }];
        }
      }

      if (key === 'image') {
        return [
          {
            type: 'image',
            attrs: {
              src: value?.['@_src'] || '',
              alt: value?.['@_alt'] || '',
            },
          },
        ];
      }

      if (key === 'figcaption') {
        const content = buildProseMirrorDoc(value || '', schema);
        if (content.length === 0) {
          return [];
        }
        return [
          {
            type: 'figcaption',
            content,
          },
        ];
      }

      if (typeof value === 'string') {
        // Remove empty text blocks because ProseMirror cannot parse them
        if (value.trim() === '') {
          return [];
        }
        return [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: value }],
          },
        ];
      }

      if (Array.isArray(value)) {
        const content = value.flatMap((item) => buildProseMirrorDoc(item, schema));
        if (content.length === 0) {
          return [];
        }
        return [{ type: key, content }];
      }

      const content = buildProseMirrorDoc(value || {}, schema);
      if (content.length === 0) {
        return [];
      }
      return [{ type: key, content }];
    });
  }

  return {
    type: 'doc',
    content: buildProseMirrorDoc(jsonObj, schema),
  };
};
