import { TextSelection } from 'prosemirror-state';

const handleEnter = (state, dispatch) => {
  const { selection, schema } = state;
  const { $from } = selection;

  if ($from.parent.type.name === 'figcaption') {
    let figurePos = null;
    for (let depth = $from.depth; depth > 0; depth--) {
      const node = $from.node(depth);
      if (node.type.name === 'figure') {
        figurePos = $from.after(depth);
        break;
      }
    }

    if (figurePos !== null && dispatch) {
      const paragraphNode = schema.nodes.p.createAndFill();
      const tr = state.tr.insert(figurePos, paragraphNode);
      dispatch(tr.setSelection(TextSelection.near(tr.doc.resolve(figurePos + 1))));
      return true;
    }
  }

  return false;
};

export const enterKeymap = {
  Enter: handleEnter,
};
