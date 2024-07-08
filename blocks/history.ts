import UndoIcon from '@/assets/icons/editor/undo.svg?raw';
import RedoIcon from '@/assets/icons/editor/redo.svg?raw';

import { undoItem, redoItem } from '@/features/CollaborativeEditor/plugins/menu';

import type { InstallableBlock } from '@/features/CollaborativeEditor/types';

export const buildHistory = (): InstallableBlock[] => {
  const undoIconNode = new DOMParser().parseFromString(UndoIcon, 'text/html').body.firstElementChild;
  const redoIconNode = new DOMParser().parseFromString(RedoIcon, 'text/html').body.firstElementChild;

  undoItem.spec.icon = { dom: undoIconNode as Node };
  redoItem.spec.icon = { dom: redoIconNode as Node };

  return [
    {
      key: 'undo',
      item: undoItem,
    },
    {
      key: 'redo',
      item: redoItem,
    },
  ];
};
