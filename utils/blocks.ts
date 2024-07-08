import { MenuItem, type MenuItemSpec } from '@/features/CollaborativeEditor/plugins/menu';
import { EditorState, type Command, type TextSelection } from 'prosemirror-state';
import { NodeType, MarkType, type Attrs } from 'prosemirror-model';
import { wrapInList } from 'prosemirror-schema-list';
import { toggleMark } from './commands';

export const cmdItem = (cmd: Command, options: Partial<MenuItemSpec>) => {
  const passedOptions: MenuItemSpec = {
    label: options.title as string | undefined,
    run: cmd,
  };

  for (const prop in options) {
    (passedOptions as any)[prop] = (options as any)[prop];
  }

  if (!options.enable && !options.select) {
    passedOptions[options.enable ? 'enable' : 'select'] = (state) => cmd(state);
  }

  return new MenuItem(passedOptions);
};

export const markActive = (state: EditorState, type: MarkType) => {
  const { from, $from, to, empty } = state.selection;

  if (empty) {
    return !!type.isInSet(state.storedMarks || $from.marks());
  } else {
    return state.doc.rangeHasMark(from, to, type);
  }
};

export const markItem = (markType: MarkType, options: Partial<MenuItemSpec>) => {
  const passedOptions: Partial<MenuItemSpec> = {
    active(state) {
      return markActive(state, markType);
    },
  };
  for (const prop in options) {
    (passedOptions as any)[prop] = (options as any)[prop];
  }

  return cmdItem(toggleMark(markType), passedOptions);
};

export const wrapListItem = (nodeType: NodeType, options: Partial<MenuItemSpec>) => {
  return cmdItem(wrapInList(nodeType, (options as any).attrs), options);
};

export const canInsert = (state: EditorState, nodeType: NodeType): boolean => {
  const $from = state.selection.$from;

  for (let d = $from.depth; d >= 0; d--) {
    const index = $from.index(d);
    if ($from.node(d).canReplaceWith(index, index, nodeType)) return true;
  }

  return false;
};
