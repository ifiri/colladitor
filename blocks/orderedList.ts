import ListOrderedIcon from '@/assets/icons/editor/list-ordered.svg?raw';

import { wrapListItem } from '@/features/CollaborativeEditor/utils/blocks';
import { checkIfNodeIn } from '@/features/CollaborativeEditor/utils/state';
import type { NodeType } from 'prosemirror-model';
import type { InstallableBlock } from '@/features/CollaborativeEditor/types';
import { liftItem, MenuItem } from '../plugins/menu';
import { wrapInList } from 'prosemirror-schema-list';
import { lift } from 'prosemirror-commands';

export const buildOrderedList = (node: NodeType): InstallableBlock[] => {
  const listOrderedIconNode = new DOMParser().parseFromString(ListOrderedIcon, 'text/html').body.firstElementChild;

  const liftItemOrdered = new MenuItem({
    ...liftItem,
    isReplaceable: true,
    select(state) {
      const isInPath = checkIfNodeIn('ol', state.selection.$head!.path);
      return isInPath;
    },
    icon: {
      dom: listOrderedIconNode as Node,
    },
  });

  const item = wrapListItem(node, {
    isReplaceable: true,
    title: 'Wrap in ordered list',
    icon: { dom: listOrderedIconNode as Node },
    select(state) {
      const isInPath = checkIfNodeIn('ol', state.selection.$head!.path);
      return !isInPath;
    },
    enable(state) {
      const isBulletList = checkIfNodeIn('ul', state.selection.$head!.path);

      if (isBulletList) {
        return true;
      }

      return wrapInList(node, {})(state);
    },
    run(state, dispatch, view) {
      const isBulletList = checkIfNodeIn('ul', state.selection.$head!.path);

      if (isBulletList) {
        lift(state, dispatch);

        setTimeout(() => {
          view.updateRoot();
          wrapInList(node, {})(view.state, dispatch);
        }, 0);
        return;
      }

      return wrapInList(node, {})(state, dispatch);
    },
  });

  return [
    {
      key: 'wrapOrderedList',
      item,
    },
    {
      key: 'liftItemOrdered',
      item: liftItemOrdered,
    },
  ];
};
