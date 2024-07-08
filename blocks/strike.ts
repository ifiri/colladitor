import UnderlineIcon from '@/assets/icons/editor/strike.svg?raw';

import { markItem } from '@/features/CollaborativeEditor/utils/blocks';
import type { MarkType } from 'prosemirror-model';
import type { InstallableBlock } from '@/features/CollaborativeEditor/types';

export const buildStrike = (mark: MarkType): InstallableBlock => {
  const strikeIconNode = new DOMParser().parseFromString(UnderlineIcon, 'text/html').body.firstElementChild;

  return {
    key: 'toggleStrike',
    item: markItem(mark, {
      title: 'Toggle strike',
      icon: {
        dom: strikeIconNode as Node,
      },
    }),
  };
};
