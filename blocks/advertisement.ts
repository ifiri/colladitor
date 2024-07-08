import AdvertisementIcon from '@/assets/icons/editor/advertisement.svg?raw';

import { MenuItem } from '@/features/CollaborativeEditor/plugins/menu';
import type { NodeType } from 'prosemirror-model';
import type { InstallableBlock } from '@/features/CollaborativeEditor/types';
import { canInsert } from '@/features/CollaborativeEditor/utils/blocks';
import { TextField, openPrompt } from '@/features/CollaborativeEditor/plugins/prosemirror/prompt';

export const buildAdvertisement = (node: NodeType): InstallableBlock => {
  const advertisementIconNode = new DOMParser().parseFromString(AdvertisementIcon, 'text/html').body.firstElementChild;

  const item = new MenuItem({
    title: 'Insert Advertisement',
    icon: {
      dom: advertisementIconNode as Node,
    },
    enable(state) {
      return canInsert(state, node);
    },
    run(state, _, view) {
      openPrompt({
        container: document.body,
        title: 'Insert Advertisement',
        fields: {
          title: new TextField({ label: 'Title AD', required: true }),
        },
        callback(attrs) {
          view.dispatch(view.state.tr.replaceSelectionWith(node.createAndFill(attrs)!));
          view.focus();
        },
      });
    },
  });

  return {
    key: 'insertAdvertisement',
    item,
  };
};
