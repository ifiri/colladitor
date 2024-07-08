import { EditorState, NodeSelection, Plugin, PluginKey, Transaction } from 'prosemirror-state';
import { Schema, type ResolvedPos, type NodeType } from 'prosemirror-model';
import { schema } from '@/features/CollaborativeEditor/schema';

const findParentNodeOfType = (pos: ResolvedPos, nodeType: NodeType) => {
  for (let i = pos.depth; i > 0; i--) {
    const node = pos.node(i);
    if (node.type === nodeType) {
      return { node, pos: pos.before(i) };
    }
  }
  return null;
};

const handleBackspaceDelete = (schema: Schema) => (state: EditorState, dispatch: any) => {
  const { selection, tr } = state;
  const { $from } = selection;

  // Check if the cursor is inside figcaption
  const figcaptionNode = findParentNodeOfType($from, schema.nodes.figcaption);
  if (figcaptionNode) {
    // If the cursor is inside figcaption, just delete the character
    return false;
  }

  // Check if the cursor is immediately after the figure or on the image inside image-container
  const figureNode = findParentNodeOfType($from, schema.nodes.figure);
  if (figureNode) {
    const imageNode = figureNode.node.firstChild;
    if (imageNode && imageNode.type === schema.nodes.img) {
      const figureStartPos = $from.before(figureNode.depth);
      const figureEndPos = $from.after(figureNode.depth);

      // If the cursor is on the image, delete the entire figure
      if ($from.pos === figureStartPos + 1 || selection instanceof NodeSelection) {
        tr.delete(figureStartPos, figureEndPos);
        if (dispatch) dispatch(tr);
        return true;
      }

      // If the cursor is immediately after the figure
      if ($from.pos === figureEndPos) {
        tr.delete(figureStartPos, figureEndPos);
        if (dispatch) dispatch(tr);
        return true;
      }
    }
  }

  return false;
};

const removeEmptyFigures = (tr: Transaction, doc: any) => {
  let modified = false;

  doc.descendants((node: any, pos: any) => {
    if (node.type === schema.nodes.figure) {
      let hasImage = false;

      node.descendants((child: any) => {
        if (child.type === schema.nodes.img) {
          hasImage = true;
          return false;
        }
        return true;
      });

      if (!hasImage) {
        tr.delete(pos, pos + node.nodeSize);
        modified = true;
      }
    }
  });

  return modified;
};

export const backspaceDeletePlugin = new Plugin({
  key: new PluginKey('backspaceDeletePlugin'),
  props: {
    handleKeyDown(view, event) {
      const { state, dispatch } = view;

      if (event.key === 'Backspace' || event.key === 'Delete') {
        return handleBackspaceDelete(schema)(state, dispatch);
      }

      return false;
    },
  },
  appendTransaction(transactions, oldState, newState) {
    let tr = newState.tr;
    let modified = false;

    // Check for empty figure nodes and remove them
    if (removeEmptyFigures(tr, newState.doc)) {
      modified = true;
    }

    return modified ? tr : undefined;
  },
});
