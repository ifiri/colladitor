import ListIcon from '@/assets/icons/editor/list.svg?raw';

import { wrapListItem } from '@/features/CollaborativeEditor/utils/blocks';
import { checkIfNodeIn } from '@/features/CollaborativeEditor/utils/state';
import type { NodeType } from 'prosemirror-model';
import type { InstallableBlock } from '@/features/CollaborativeEditor/types';
import { liftItem, MenuItem } from '../plugins/menu';
import { wrapInList } from 'prosemirror-schema-list';
import { lift } from 'prosemirror-commands';

export const buildBulletList = (node: NodeType): InstallableBlock[] => {
  const listIconNode = new DOMParser().parseFromString(ListIcon, 'text/html').body.firstElementChild;

  const liftItemBullet = new MenuItem({
    ...liftItem,
    isReplaceable: true,
    select(state) {
      const isInPath = checkIfNodeIn('ul', state.selection.$head!.path);
      return isInPath;
    },
    icon: {
      dom: listIconNode as Node,
    },
  });

  const item = wrapListItem(node, {
    isReplaceable: true,
    title: 'Wrap in bullet list',
    icon: { dom: listIconNode as Node },
    select(state) {
      const isInPath = checkIfNodeIn('ul', state.selection.$head!.path);
      return !isInPath;
    },
    enable(state) {
      const isOrderedList = checkIfNodeIn('ol', state.selection.$head!.path);

      if (isOrderedList) {
        return true;
      }

      return wrapInList(node, {})(state);
    },
    run(state, dispatch, view) {
      const isOrderedList = checkIfNodeIn('ol', state.selection.$head!.path);

      if (isOrderedList) {
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
      key: 'wrapBulletList',
      item,
    },
    {
      key: 'liftItemBullet',
      item: liftItemBullet,
    },
  ];
};
