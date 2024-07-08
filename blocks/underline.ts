import UnderlineIcon from '@/assets/icons/editor/underline.svg?raw';

import { markItem } from '@/features/CollaborativeEditor/utils/blocks';
import type { MarkType } from 'prosemirror-model';
import type { InstallableBlock } from '@/features/CollaborativeEditor/types';

export const buildUnderline = (mark: MarkType): InstallableBlock => {
  const underlineIconNode = new DOMParser().parseFromString(UnderlineIcon, 'text/html').body.firstElementChild;

  return {
    key: 'toggleUnderline',
    item: markItem(mark, {
      title: 'Toggle underline',
      icon: {
        dom: underlineIconNode as Node,
      },
    }),
  };
};
