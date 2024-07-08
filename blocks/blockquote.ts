import BlockquoteIcon from '@/assets/icons/editor/blockquote.svg?raw';

import { wrapItem } from '@/features/CollaborativeEditor/plugins/menu';
import type { NodeType } from 'prosemirror-model';
import type { InstallableBlock } from '@/features/CollaborativeEditor/types';
import { lift, wrapIn } from 'prosemirror-commands';
import { checkIfNodeIn } from '../utils/state';

export const buildBlockquote = (node: NodeType): InstallableBlock => {
  const blockquoteIconNode = new DOMParser().parseFromString(BlockquoteIcon, 'text/html').body.firstElementChild;

  let isBlockquoteApplied = false;

  const item = wrapItem(node, {
    title: 'Wrap in block quote',
    enable(state) {
      const path = state.selection.$head!.path;

      isBlockquoteApplied = checkIfNodeIn('blockquote', path);

      return true;
    },
    active() {
      return isBlockquoteApplied;
    },
    run(state, dispatch) {
      if (isBlockquoteApplied) {
        lift(state, dispatch);
        isBlockquoteApplied = false;
        return;
      }

      return wrapIn(node, {})(state, dispatch);
    },
    icon: {
      dom: blockquoteIconNode as Node,
    },
  });

  return {
    key: 'wrapBlockQuote',
    item,
  };
};
