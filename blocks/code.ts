import BracketsIcon from '@/assets/icons/editor/brackets.svg?raw';

import { markItem } from '@/features/CollaborativeEditor/utils/blocks';
import type { MarkType } from 'prosemirror-model';
import type { InstallableBlock } from '@/features/CollaborativeEditor/types';

export const buildCode = (mark: MarkType): InstallableBlock => {
  const bracketsIconNode = new DOMParser().parseFromString(BracketsIcon, 'text/html').body.firstElementChild;
  const item = markItem(mark, {
    title: 'Toggle code font',
    icon: {
      dom: bracketsIconNode as Node,
    },
  });

  return {
    key: 'toggleCode',
    item,
  };
};
