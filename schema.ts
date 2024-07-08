import { Schema, Node, Mark } from 'prosemirror-model';
import type { Attrs, MarkSpec, NodeSpec, DOMOutputSpec } from 'prosemirror-model';
import { bulletList, orderedList, listItem } from 'prosemirror-schema-list';
import { setEditingImageAttributes } from '@/features/CollaborativeEditor/blocks/imagesDataHelper';
import { setEditingLinkAttributes } from '@/features/CollaborativeEditor/blocks/link';

const brDOM: DOMOutputSpec = ['br'];

const addListNode = (obj: { [prop: string]: any }, props: { [prop: string]: any }) => {
  const copy: { [prop: string]: any } = {};
  for (const prop in obj) copy[prop] = obj[prop];
  for (const prop in props) copy[prop] = props[prop];
  return copy;
};

const calcYchangeDomAttrs = (attrs: Attrs, domAttrs: Record<string, unknown> = {}) => {
  domAttrs = Object.assign({}, domAttrs);
  if (attrs.ychange !== null) {
    domAttrs.ychange_user = attrs.ychange.user;
    domAttrs.ychange_state = attrs.ychange.state;
  }
  return domAttrs;
};

const headingSchema = (level: number): NodeSpec => ({
  attrs: {
    ychange: { default: null },
  },
  content: 'inline*',
  group: 'block',
  defining: true,
  parseDOM: [{ tag: `h${level}` }],
  toDOM(node) {
    return [`h${level}`, calcYchangeDomAttrs(node.attrs), 0];
  },
});

export const nodes: Record<string, NodeSpec> = {
  doc: {
    content: 'block+',
  },
  p: {
    attrs: { ychange: { default: null } },
    content: 'inline*',
    group: 'block',
    parseDOM: [{ tag: 'p' }],
    toDOM(node: Node) {
      return ['p', calcYchangeDomAttrs(node.attrs), 0];
    },
  },

  paragraph: {
    attrs: { ychange: { default: null } },
    content: 'inline*',
    group: 'block',
    parseDOM: [{ tag: 'p' }],
    toDOM(node: Node) {
      return ['p', calcYchangeDomAttrs(node.attrs), 0];
    },
  },

  advertisement: {
    attrs: { ychange: { default: null } },
    content: 'block+',
    group: 'block',
    defining: true,
    parseDOM: [{ tag: 'div', attrs: { class: 'advertisement' } }],
    toDOM(node: Node) {
      return ['div', calcYchangeDomAttrs(node.attrs), 0];
    },
  },

  container: {
    attrs: { ychange: { default: null } },
    content: '(block | li)+',
    group: 'block',
    defining: true,
    parseDOM: [{ tag: 'article', attrs: { class: 'container container--small' } }],
    toDOM(node: Node) {
      const domAttrs = {
        class: 'container container--small',
      };

      return ['article', calcYchangeDomAttrs(node.attrs, domAttrs), 0];
    },
  },

  disclaimer: {
    attrs: { ychange: { default: null } },
    content: '(block | li)+',
    group: 'block',
    defining: true,
    parseDOM: [{ tag: 'div', attrs: { class: 'disclaimer post-content__disclaimer' } }],
    toDOM(node: Node) {
      const domAttrs = {
        class: 'disclaimer post-content__disclaimer',
      };

      return ['div', calcYchangeDomAttrs(node.attrs, domAttrs), 0];
    },
  },

  subscription_form: {
    attrs: {
      ychange: { default: null },
      type: { default: '' },
      label: { default: '' },
    },
    content: 'block*',
    atom: true,
    isolating: true,
    group: 'block',
    selectable: true,
    code: false,
    defining: false,
    parseDOM: [
      { tag: 'template[data-type="law_decoded"]' },
      { tag: 'template[data-type="markets_outlook"]' },
      { tag: 'template[data-type="defi_newsletter"]' },
      { tag: 'template[data-type="consulting_newsletter"]' },
      { tag: 'template[data-type="nifty_newsletter"]' },
      { tag: 'template[data-type="crypto_biz"]' },
    ],
    toDOM(node: Node) {
      const domAttrs = {
        ['data-type']: node.attrs.type,
        ['data-name']: 'subscription_form',
        ['data-label']: node.attrs.label,
      };

      return ['template', calcYchangeDomAttrs(node.attrs, domAttrs), 0];
    },
  },

  blockquote: {
    attrs: { ychange: { default: null } },
    content: 'block+',
    group: 'block',
    defining: true,
    parseDOM: [{ tag: 'blockquote' }],
    toDOM(node: Node) {
      return ['blockquote', calcYchangeDomAttrs(node.attrs), 0];
    },
  },

  h1: headingSchema(1),
  h2: headingSchema(2),
  h3: headingSchema(3),
  h4: headingSchema(4),
  h5: headingSchema(5),
  h6: headingSchema(6),

  code_block: {
    attrs: { ychange: { default: null } },
    content: 'text*',
    marks: '',
    group: 'block',
    code: true,
    defining: true,
    parseDOM: [{ tag: 'pre', preserveWhitespace: 'full' }],
    toDOM(node: Node) {
      return ['pre', calcYchangeDomAttrs(node.attrs), ['code', 0]];
    },
  },

  ol: addListNode(orderedList, { content: 'li+', group: 'block' }),
  ul: addListNode(bulletList, { content: 'li+', group: 'block' }),
  li: addListNode(listItem, { content: 'p*' }),

  text: {
    group: 'inline',
  },

  img: {
    inline: false,
    attrs: { src: {}, alt: { default: '' } },
    group: 'block',
    draggable: true,
    parseDOM: [
      {
        tag: 'img[src]',
        getAttrs(dom) {
          return {
            src: dom.getAttribute('src'),
            alt: dom.getAttribute('alt'),
          };
        },
      },
    ],
    toDOM(node) {
      const dom = document.createElement('div');
      dom.className = 'image-container';

      const img = document.createElement('img');
      img.setAttribute('src', node.attrs.src);
      img.setAttribute('alt', node.attrs.alt);
      dom.appendChild(img);

      const editButton = document.createElement('button');
      editButton.className = 'article-image-edit-button';
      editButton.addEventListener('click', (event) => {
        event.stopPropagation();
        setEditingImageAttributes({ alt: node.attrs.alt, src: node.attrs.src }, node);
        const editMenuButton = document.getElementById('edit-image-data-button');
        editMenuButton?.click();
      });

      dom.appendChild(editButton);

      const captionButton = document.createElement('button');
      captionButton.className = 'article-image-caption-button';
      captionButton.addEventListener('click', (event) => {
        event.stopPropagation();
        setEditingImageAttributes({ alt: node.attrs.alt, src: node.attrs.src }, node);
        const editCaptionMenuButton = document.getElementById('edit-caption-image-data-button');
        editCaptionMenuButton?.click();
      });

      dom.appendChild(captionButton);
      return dom;
    },
  },

  figure: {
    group: 'block',
    content: '(img)? (figcaption)?',
    parseDOM: [
      {
        tag: 'figure',
        contentElement: 'figcaption',
      },
    ],
    toDOM: (node) => ['figure', 0],
  },

  figcaption: {
    group: 'block',
    content: 'block*',
    parseDOM: [{ tag: 'figcaption' }],
    toDOM: () => ['figcaption', { class: 'figcaption' }, 0],
  },

  hard_break: {
    inline: true,
    group: 'inline',
    selectable: false,
    parseDOM: [{ tag: 'br' }],
    toDOM(node: Node) {
      return brDOM;
    },
  },

  // Embeds
  youtube: {
    attrs: {
      ychange: { default: null },
      embed_id: {},
    },
    content: 'block*',
    atom: true,
    isolating: true,
    group: 'block',
    selectable: true,
    code: false,
    defining: false,
    parseDOM: [{ tag: 'template[data-type="youtube"]' }],
    toDOM(node: Node) {
      const domAttrs = {
        ['data-embed-id']: node.attrs.embed_id,
        ['data-type']: 'youtube',
        ['data-label']: `Youtube content with id: ${node.attrs.embed_id}`,
      };

      return ['template', calcYchangeDomAttrs(node.attrs, domAttrs), 0];
    },
  },

  vimeo: {
    attrs: {
      ychange: { default: null },
      embed_id: {},
    },
    content: 'block*',
    atom: true,
    isolating: true,
    group: 'block',
    selectable: true,
    code: false,
    defining: false,
    parseDOM: [{ tag: 'template[data-type="vimeo"]' }],
    toDOM(node: Node) {
      const domAttrs = {
        ['data-embed-id']: node.attrs.embed_id,
        ['data-type']: 'vimeo',
        ['data-label']: `Vimeo content with id: ${node.attrs.embed_id}`,
      };

      return ['template', calcYchangeDomAttrs(node.attrs, domAttrs), 0];
    },
  },

  instagram: {
    attrs: {
      ychange: { default: null },
      embed_id: {},
    },
    content: 'block*',
    atom: true,
    isolating: true,
    group: 'block',
    selectable: true,
    code: false,
    defining: false,
    parseDOM: [{ tag: 'template[data-type="instagram"]' }],
    toDOM(node: Node) {
      const domAttrs = {
        ['data-embed-id']: node.attrs.embed_id,
        ['data-type']: 'instagram',
        ['data-label']: `Instagram content with id: ${node.attrs.embed_id}`,
      };

      return ['template', calcYchangeDomAttrs(node.attrs, domAttrs), 0];
    },
  },

  twitter: {
    attrs: {
      ychange: { default: null },
      embed_id: {},
    },
    content: 'block*',
    atom: true,
    isolating: true,
    group: 'block',
    selectable: true,
    code: false,
    defining: false,
    parseDOM: [{ tag: 'template[data-type="twitter"]' }],
    toDOM(node: Node) {
      const domAttrs = {
        ['data-embed-id']: node.attrs.embed_id,
        ['data-type']: 'twitter',
        ['data-label']: `X.com content with id: ${node.attrs.embed_id}`,
      };

      return ['template', calcYchangeDomAttrs(node.attrs, domAttrs), 0];
    },
  },

  buzzsprout_podcast: {
    attrs: {
      ychange: { default: null },
      embed_id: {},
    },
    content: 'block*',
    atom: true,
    isolating: true,
    group: 'block',
    selectable: true,
    code: false,
    defining: false,
    parseDOM: [{ tag: 'template[data-type="buzzsprout_podcast"]' }],
    toDOM(node: Node) {
      const domAttrs = {
        ['data-embed-id']: node.attrs.embed_id,
        ['data-type']: 'buzzsprout_podcast',
        ['data-label']: `Buzzsprout podcast content with id: ${node.attrs.embed_id}`,
      };

      return ['template', calcYchangeDomAttrs(node.attrs, domAttrs), 0];
    },
  },

  document_cloud: {
    attrs: {
      ychange: { default: null },
      embed_id: {},
    },
    content: 'block*',
    atom: true,
    isolating: true,
    group: 'block',
    selectable: true,
    code: false,
    defining: false,
    parseDOM: [{ tag: 'template[data-type="document_cloud"]' }],
    toDOM(node: Node) {
      const domAttrs = {
        ['data-embed-id']: node.attrs.embed_id,
        ['data-type']: 'document_cloud',
        ['data-label']: `Document cloud content with id: ${node.attrs.embed_id}`,
      };

      return ['template', calcYchangeDomAttrs(node.attrs, domAttrs), 0];
    },
  },
};

const emDOM: DOMOutputSpec = ['em', 0];
const strongDOM: DOMOutputSpec = ['strong', 0];
const codeDOM: DOMOutputSpec = ['code', 0];

export const marks: Record<string, MarkSpec> = {
  a: {
    attrs: {
      href: {},
      title: { default: null },
      text: { default: null },
    },
    inclusive: false,
    parseDOM: [
      {
        tag: 'a[href]',
        getAttrs(dom) {
          if (typeof dom === 'string') {
            return {};
          }

          return { href: dom.getAttribute('href'), title: dom.getAttribute('title') };
        },
      },
    ],
    toDOM(node: Mark) {
      const linkElement = document.createElement('span');
      linkElement.setAttribute('href', node.attrs.href);
      linkElement.innerHTML = node.attrs.text;

      linkElement.addEventListener('click', (event) => {
        event.stopPropagation();
        setEditingLinkAttributes({ text: node.attrs.text, link: node.attrs.href, isEdit: true });
        const editLinkMenuButton = document.querySelector('[title="Insert link"]');
        editLinkMenuButton?.click();
      });

      return linkElement;
    },
  },

  em: {
    parseDOM: [{ tag: 'i' }, { tag: 'em' }, { style: 'font-style=italic' }],
    toDOM(mark: Mark) {
      return emDOM;
    },
  },

  u: {
    parseDOM: [
      {
        tag: 'u',
        getAttrs: () => ({}),
      },
    ],
    toDOM(mark: Mark) {
      const domAttrs = {
        style: 'text-decoration: underline',
      };

      return ['span', domAttrs, 0];
    },
  },
  s: {
    parseDOM: [
      {
        tag: 's',
        getAttrs: () => ({}),
      },
    ],
    toDOM(mark: Mark) {
      const domAttrs = {
        style: 'text-decoration: line-through',
      };

      return ['span', domAttrs, 0];
    },
  },

  strong: {
    parseDOM: [
      { tag: 'strong' },
      // This works around a Google Docs misbehavior where
      // pasted content will be inexplicably wrapped in `<b>`
      // tags with a font-weight normal.
      {
        tag: 'b',
        getAttrs: (node: HTMLElement | string) => {
          if (typeof node === 'string') {
            return null;
          }

          return node.style.fontWeight !== 'normal' && null;
        },
      },
      {
        style: 'font-weight',
        getAttrs: (value: HTMLElement | string) => {
          if (typeof value !== 'string') {
            return null;
          }

          return /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null;
        },
      },
    ],
    toDOM() {
      return strongDOM;
    },
  },

  code: {
    parseDOM: [{ tag: 'code' }],
    toDOM() {
      return codeDOM;
    },
  },

  ychange: {
    attrs: {
      user: { default: null },
      state: { default: null },
    },
    inclusive: false,
    parseDOM: [{ tag: 'ychange' }],
    toDOM(node: Mark) {
      return ['ychange', { ychange_user: node.attrs.user, ychange_state: node.attrs.state }, 0];
    },
  },
};

export const schema = new Schema({
  nodes,
  marks,
});
