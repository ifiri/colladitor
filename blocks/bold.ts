import BoldIcon from '@/assets/icons/editor/bold.svg?raw';

import { markItem } from '@/features/CollaborativeEditor/utils/blocks';
import type { MarkType } from 'prosemirror-model';
import type { InstallableBlock } from '@/features/CollaborativeEditor/types';

export const buildBold = (mark: MarkType): InstallableBlock => {
  const boldIconNode = new DOMParser().parseFromString(BoldIcon, 'text/html').body.firstElementChild;
  const item = markItem(mark, {
    title: 'Toggle strong style',
    icon: {
      dom: boldIconNode as Node,
    },
  });

  return {
    key: 'toggleStrong',
    item,
  };
};
