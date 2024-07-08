import type { InstallableBlock } from '@/features/CollaborativeEditor/types';
import { MenuItem } from '@/features/CollaborativeEditor/plugins/menu';
import { createApp, h, ref } from 'vue';
import EditImageDataModal from '@/features/UploadImage/modals/EditImageDataModal.vue';
import { TextSelection } from 'prosemirror-state';

const modalData = ref<{ src: string; alt: string; node: any }>({
  src: '',
  alt: '',
  node: null,
});

let editImagePromiseResolve: (value: { alt: string }) => void;

const showEditModal = ref<boolean>(false);

export const openEditModal = () => {
  showEditModal.value = true;

  return new Promise<{ alt: string }>((resolve) => {
    editImagePromiseResolve = resolve;
  });
};

export const setEditingImageAttributes = ({ alt, src }: { alt: string; src: string }, node: any) => {
  modalData.value = { alt, src, node };
};

const closeEditModal = () => {
  showEditModal.value = false;
};

export const imagesDataHelper = (): InstallableBlock[] => {
  const itemEdit = new MenuItem({
    title: 'Image edit',
    label: 'Image edit',
    render: () => {
      const template = `<div class="w-0 h-0" id="edit-image-data-button"></div>`;
      return new DOMParser().parseFromString(template, 'text/html').body.firstElementChild as HTMLElement;
    },
    enable() {
      return true;
    },
    run(state, _, view) {
      const { dispatch } = view;
      const { tr, doc, schema, selection } = state;

      const applyAlt = (newAlt: string) => {
        const src = modalData.value.src;
        let found = false;

        doc.descendants((node, pos) => {
          if (node.type === schema.nodes.img && node.attrs.src === src) {
            const newAttrs = { ...node.attrs, alt: newAlt };
            const newNode = node.type.create(newAttrs, node.content, node.marks);

            tr.setNodeMarkup(pos, null, newAttrs);

            found = true;
            return false;
          }
          return true;
        });

        if (found && dispatch) {
          dispatch(tr);
          return true;
        }

        return false;
      };

      openEditModal().then(({ alt }) => {
        applyAlt(alt);
      });
    },
  });

  const itemCaption = new MenuItem({
    title: 'Image caption',
    label: 'Image caption',
    render: () => {
      const template = `<div class="w-0 h-0" id="edit-caption-image-data-button"></div>`;
      return new DOMParser().parseFromString(template, 'text/html').body.firstElementChild as HTMLElement;
    },
    enable() {
      return true;
    },
    run(state, _, view) {
      const { dispatch } = view;
      const { tr, doc, schema, selection } = state;
      const { from } = selection;
      const src = modalData.value.src;

      let foundFigurePos: number | null = null;

      // Check all nodes for finding figure with image
      doc.descendants((node, pos) => {
        if (node.type === schema.nodes.figure) {
          if (node.content?.content.length) {
            const imageNode = node.child(0);
            if (imageNode && imageNode.type === schema.nodes.img && imageNode.attrs.src === src) {
              foundFigurePos = pos;
              return false;
            }
          }
        }
        return true;
      });

      if (foundFigurePos !== null) {
        const figureNode = doc.nodeAt(foundFigurePos);
        if (!figureNode) return false;

        let figcaptionNode: any | null = null;
        let figcaptionPos: number | null = null;

        // Check if figcaption is inside the figure
        figureNode.forEach((child, offset) => {
          if (child.type === schema.nodes.figcaption) {
            figcaptionNode = child;
            figcaptionPos = foundFigurePos! + offset + 1;
          }
        });

        // If figcaption does not exist, create one
        if (!figcaptionNode) {
          const newFigcaptionNode = schema.nodes.figcaption.create(null, schema.text(' '));
          tr.insert(foundFigurePos! + figureNode.nodeSize - 1, newFigcaptionNode);
          figcaptionPos = foundFigurePos! + figureNode.nodeSize; // Update position after inserting new figcaption
          figcaptionNode = newFigcaptionNode; // Assign the newly created figcaption node
        }

        // Set focus
        const pos = tr.doc.resolve(figcaptionPos! + figcaptionNode.content.size); // Position at the end of figcaption content
        const newSelection = TextSelection.create(tr.doc, pos.pos, pos.pos);

        tr.setSelection(newSelection);
        if (dispatch) dispatch(tr.scrollIntoView());
      }
    },
  });

  const editApp = createApp({
    setup() {
      return () =>
        h(EditImageDataModal, {
          isVisible: showEditModal.value,
          onClose: closeEditModal,
          onUpdate: ({ alt }) => {
            closeEditModal();
            editImagePromiseResolve({ alt });
          },
          attrs: { alt: modalData.value.alt },
        });
    },
  });

  editApp.mount('#prosemirror-edit-image-modal');

  return [
    {
      key: 'imageDataHelper',
      item: itemEdit,
    },
    {
      key: 'imageCaptionHelper',
      item: itemCaption,
    },
  ];
};
