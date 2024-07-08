import PictureAddIcon from '@/assets/icons/editor/picture-add.svg?raw';
import { MenuItem } from '@/features/CollaborativeEditor/plugins/menu';
import type { NodeType } from 'prosemirror-model';
import type { InstallableBlock } from '@/features/CollaborativeEditor/types';
import { createApp, h, ref } from 'vue';
import InsertImageModal from '@/features/UploadImage/modals/InsertImageModal.vue';

const showInsertModal = ref<boolean>(false);

let insertImagePromiseResolve: (value: { url: string }) => void;

const openInsertModal = async () => {
  showInsertModal.value = true;

  return new Promise<{ url: string }>((resolve) => {
    insertImagePromiseResolve = resolve;
  });
};

const closeInsertModal = () => {
  showInsertModal.value = false;
};

export const buildPicture = (node: NodeType): InstallableBlock => {
  const pictureAddIconNode = new DOMParser().parseFromString(PictureAddIcon, 'text/html').body.firstElementChild;

  const item = new MenuItem({
    title: 'Insert image',
    icon: {
      dom: pictureAddIconNode as Node,
    },
    enable() {
      return true;
    },
    run(state, _, view) {
      const { dispatch } = view;
      const { schema, selection } = state;
      const { from } = selection;

      const applyTransaction = (url: string) => {
        const imageNode = schema.nodes.img.create({ src: url });
        const figcaptionNode = schema.nodes.figcaption.create(null, schema.text(' '));
        const figureNode = schema.nodes.figure.create(null, [imageNode, figcaptionNode]);
        const paragraphNode = schema.nodes.p.create();
        let transaction = state.tr.insert(from, figureNode);

        const insertPos = from + figureNode.nodeSize;
        transaction = transaction.insert(insertPos, paragraphNode);

        dispatch(transaction);
      };

      openInsertModal().then(({ url }) => {
        applyTransaction(url);
      });
    },
  });

  const app = createApp({
    setup() {
      return () =>
        h(InsertImageModal, {
          isVisible: showInsertModal.value,
          onClose: closeInsertModal,
          onInsert: ({ url }) => {
            closeInsertModal();
            insertImagePromiseResolve({ url });
          },
        });
    },
  });

  app.mount('#prosemirror-add-image-modal');

  return {
    key: 'insertImage',
    item,
  };
};
