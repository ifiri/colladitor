import LinkIcon from '@/assets/icons/editor/link.svg?raw';
import { MenuItem } from '@/features/CollaborativeEditor/plugins/menu';
import type { MarkType } from 'prosemirror-model';
import type { InstallableBlock } from '@/features/CollaborativeEditor/types';
import { createApp, h, ref } from 'vue';
import LinkModal from '@/features/CollaborativeEditor/components/LinkModal.vue';
import { NodeSelection, TextSelection } from 'prosemirror-state';
import { schema } from '@/features/CollaborativeEditor/schema';

interface LinkData {
  text?: string;
  link: string;
  isEdit?: boolean;
  isReset?: boolean;
}

const linkData = ref<LinkData>({
  text: '',
  link: '',
  isEdit: false,
  isReset: false,
});

const showInsertModal = ref<boolean>(false);
let insertImagePromiseResolve: (value: LinkData) => void;

export const setEditingLinkAttributes = ({ text, link, isEdit }: LinkData) => {
  linkData.value = { text, link, isEdit };
};

const openInsertModal = async () => {
  showInsertModal.value = true;

  return new Promise<LinkData>((resolve) => {
    insertImagePromiseResolve = resolve;
  });
};

const closeInsertModal = () => {
  showInsertModal.value = false;
};

export const buildLink = (mark: MarkType): InstallableBlock => {
  const linkIconNode = new DOMParser().parseFromString(LinkIcon, 'text/html').body.firstElementChild;
  linkIconNode.setAttribute('id', 'add-link-data-button');

  const item = new MenuItem({
    title: 'Insert link',
    icon: {
      dom: linkIconNode as Node,
    },
    enable(state) {
      return !state.selection.empty;
    },
    run(state, _, view) {
      const { selection } = state;
      let selectedText = '';
      let selectedNode = null;

      if (selection instanceof TextSelection) {
        selectedText = state.doc.textBetween(selection.from, selection.to, ' ');
      } else if (selection instanceof NodeSelection) {
        selectedNode = selection.node;
      }

      const { from, to } = state.selection;
      let href = '';
      let markFrom = null;
      let markTo = null;

      state.doc.nodesBetween(from, to, (node, pos) => {
        const markIndex = node.marks.findIndex((mark) => mark.type === schema.marks.a);
        if (markIndex >= 0) {
          href = node.marks[markIndex].attrs.href;
          selectedText = node.text;
          markFrom = pos;
          markTo = pos + node.nodeSize;
          return false;
        }
      });

      linkData.value = {
        link: href,
        text: selectedText,
        isEdit: !!href,
      };

      const { dispatch } = view;

      const applyTransaction = ({ link: newLink, isReset }: LinkData) => {
        if (isReset) {
          dispatch(state.tr.removeMark(markFrom, markTo, schema.marks.a));
          return;
        }
        dispatch(
          state.tr.addMark(
            markFrom || from,
            markTo || to,
            schema.marks.a.create({
              href: newLink,
            }),
          ),
        );
      };

      openInsertModal().then(({ link, isReset }) => {
        applyTransaction({ link, isReset });
      });
    },
  });

  const app = createApp({
    setup() {
      return () =>
        h(LinkModal, {
          isVisible: showInsertModal.value,
          data: linkData.value,
          onClose: closeInsertModal,
          onReset: (data) => {
            closeInsertModal();
            insertImagePromiseResolve({ isReset: true, ...data });
          },
          onInsert: (data) => {
            closeInsertModal();
            insertImagePromiseResolve({ isReset: false, ...data });
          },
        });
    },
  });

  app.mount('#prosemirror-add-link-modal');

  return {
    key: 'toggleLink',
    item,
  };
};
