import { createApp, h, ref } from 'vue';
import type { NodeType } from 'prosemirror-model';

import { MenuItem } from '@/features/CollaborativeEditor/plugins/menu';
import { EmbedType, type InstallableBlock } from '@/features/CollaborativeEditor/types';
import InsertEmbedModal from '@/features/CollaborativeEditor/components/InsertEmbedModal.vue';

import EmbedAddIcon from '@/assets/icons/editor/embed.svg?raw';
import {
  getBuzzsproutPodcastId,
  getDocumentCloudId,
  getInstagramId,
  getTwitterId,
  getVimeoId,
  getYoutubeId,
} from '@/features/CollaborativeEditor/helpers/embed';
import { useToast } from '@/composables';

const showInsertModal = ref<boolean>(false);

let insertEmbedPromiseResolve: (value: { url: string; type: EmbedType }) => void;

const openInsertModal = async () => {
  showInsertModal.value = true;

  return new Promise<{ url: string; type: EmbedType }>((resolve) => {
    insertEmbedPromiseResolve = resolve;
  });
};

const closeInsertModal = () => {
  showInsertModal.value = false;
};

export const buildEmbed = (node: NodeType): InstallableBlock => {
  const EmbedAddIconNode = new DOMParser().parseFromString(EmbedAddIcon, 'text/html').body.firstElementChild;

  const toast = useToast();

  const item = new MenuItem({
    title: 'Insert embed',
    icon: {
      dom: EmbedAddIconNode as Node,
    },
    enable() {
      return true;
    },
    run(state, _, view) {
      const { dispatch } = view;
      const { schema, selection } = state;
      const { from } = selection;

      const applyTransaction = ({ url, type }: { url: string; type: EmbedType }) => {
        let id;

        switch (type) {
          case EmbedType.TWITTER:
            id = getTwitterId(url);
            break;
          case EmbedType.YOUTUBE:
            id = getYoutubeId(url);
            break;
          case EmbedType.VIMEO:
            id = getVimeoId(url);
            break;
          case EmbedType.DOCUMENT:
            id = getDocumentCloudId(url);
            break;
          case EmbedType.BUZZSPROUT:
            id = getBuzzsproutPodcastId(url);
            break;
          case EmbedType.INSTAGRAM:
            id = getInstagramId(url);
            break;
        }

        if (!id) {
          toast.errorTemporary({
            id: 'ERROR_INSERT_EMBED',
            message: 'Embed link is invalid',
          });
          return;
        }

        // Insert embed
        const embedNode = schema.nodes[type].create({ embed_id: id });
        const paragraphNode = schema.nodes.p.create();
        let transaction = state.tr.insert(from, embedNode);

        const insertPos = from + embedNode.nodeSize;
        transaction = transaction.insert(insertPos, paragraphNode);

        dispatch(transaction);
      };

      openInsertModal().then(({ url, type }) => {
        applyTransaction({ url, type });
      });
    },
  });

  const app = createApp({
    setup() {
      return () =>
        h(InsertEmbedModal, {
          isVisible: showInsertModal.value,
          onClose: closeInsertModal,
          onInsert: ({ url, type }) => {
            closeInsertModal();
            insertEmbedPromiseResolve({ url, type });
          },
        });
    },
  });

  app.mount('#prosemirror-add-embed-modal');

  return {
    key: 'insertEmbed',
    item,
  };
};
