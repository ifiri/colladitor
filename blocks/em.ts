import ItalicIcon from '@/assets/icons/editor/italic.svg?raw';

import { markItem } from '@/features/CollaborativeEditor/utils/blocks';
import type { MarkType } from 'prosemirror-model';
import type { InstallableBlock } from '@/features/CollaborativeEditor/types';

export const buildEm = (mark: MarkType): InstallableBlock => {
  const italicIconNode = new DOMParser().parseFromString(ItalicIcon, 'text/html').body.firstElementChild;

  const item = markItem(mark, {
    title: 'Toggle emphasis',
    icon: {
      dom: italicIconNode as Node,
    },
  });

  return {
    key: 'toggleEm',
    item,
  };
};
