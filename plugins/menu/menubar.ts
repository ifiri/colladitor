import crel from 'crelt';
import { Plugin, EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { renderGrouped, type MenuElement } from './menu';

const prefix = 'ProseMirror-menubar';

function isIOS() {
  if (typeof navigator == 'undefined') return false;
  const agent = navigator.userAgent;
  return !/Edge\/\d/.test(agent) && /AppleWebKit/.test(agent) && /Mobile\/\w+/.test(agent);
}

export function menuBar(options: { content: readonly (readonly MenuElement[])[]; floating?: boolean }): Plugin {
  return new Plugin({
    view(editorView) {
      return new MenuBarView(editorView, options);
    },
  });
}

class MenuBarView {
  wrapper: HTMLElement;
  menu: HTMLElement;
  spacer: HTMLElement | null = null;
  maxHeight = 0;
  widthForMaxHeight = 0;
  floating = false;
  contentUpdate: (state: EditorState) => boolean;
  scrollHandler: ((event: Event) => void) | null = null;

  constructor(
    readonly editorView: EditorView,
    readonly options: Parameters<typeof menuBar>[0],
  ) {
    this.wrapper = crel('div', { class: prefix + '-wrapper' });
    this.menu = this.wrapper.appendChild(crel('div', { class: prefix }));
    this.menu.className = prefix;

    if (editorView.dom.parentNode) editorView.dom.parentNode.replaceChild(this.wrapper, editorView.dom);
    this.wrapper.appendChild(editorView.dom);

    const { dom, update } = renderGrouped(this.editorView, this.options.content);
    this.contentUpdate = update;
    this.menu.appendChild(dom);
    this.update();

    if (options.floating && !isIOS()) {
      this.updateFloat();
      const potentialScrollers = getAllWrapping(this.wrapper);
      this.scrollHandler = (e: Event) => {
        const root = this.editorView.root;
        if (!((root as Document).body || root).contains(this.wrapper))
          potentialScrollers.forEach((el) => el.removeEventListener('scroll', this.scrollHandler!));
        else this.updateFloat((e.target as HTMLElement).getBoundingClientRect ? (e.target as HTMLElement) : undefined);
      };
      potentialScrollers.forEach((el) => el.addEventListener('scroll', this.scrollHandler!));
    }
  }

  update() {
    this.contentUpdate(this.editorView.state);

    if (this.floating) {
      this.updateScrollCursor();
    } else {
      if (this.menu.offsetWidth != this.widthForMaxHeight) {
        this.widthForMaxHeight = this.menu.offsetWidth;
        this.maxHeight = 0;
      }
      if (this.menu.offsetHeight > this.maxHeight) {
        this.maxHeight = this.menu.offsetHeight;
        this.menu.style.minHeight = this.maxHeight + 'px';
      }
    }
  }

  updateScrollCursor() {
    const selection = (this.editorView.root as Document).getSelection()!;
    if (!selection.focusNode) return;
    const rects = selection.getRangeAt(0).getClientRects();
    const selRect = rects[selectionIsInverted(selection) ? 0 : rects.length - 1];
    if (!selRect) return;
    const menuRect = this.menu.getBoundingClientRect();
    if (selRect.top < menuRect.bottom && selRect.bottom > menuRect.top) {
      const scrollable = findWrappingScrollable(this.wrapper);
      if (scrollable) scrollable.scrollTop -= menuRect.bottom - selRect.top;
    }
  }

  updateFloat(scrollAncestor?: HTMLElement) {
    const parent = this.wrapper,
      editorRect = parent.getBoundingClientRect(),
      top = scrollAncestor ? Math.max(0, scrollAncestor.getBoundingClientRect().top) : 0;

    if (this.floating) {
      if (editorRect.top >= top || editorRect.bottom < this.menu.offsetHeight + 10) {
        this.floating = false;
        this.menu.style.position = this.menu.style.left = this.menu.style.top = this.menu.style.width = '';
        this.menu.style.display = '';
        this.spacer!.parentNode!.removeChild(this.spacer!);
        this.spacer = null;
      } else {
        const border = (parent.offsetWidth - parent.clientWidth) / 2;
        this.menu.style.left = editorRect.left + border + 'px';
        this.menu.style.display =
          editorRect.top > (this.editorView.dom.ownerDocument.defaultView || window).innerHeight ? 'none' : '';
        if (scrollAncestor) this.menu.style.top = top + 'px';
      }
    } else {
      if (editorRect.top < top && editorRect.bottom >= this.menu.offsetHeight + 10) {
        this.floating = true;
        const menuRect = this.menu.getBoundingClientRect();
        this.menu.style.left = menuRect.left + 'px';
        this.menu.style.width = menuRect.width + 'px';
        if (scrollAncestor) this.menu.style.top = top + 'px';
        this.menu.style.position = 'fixed';
        this.spacer = crel('div', { class: prefix + '-spacer', style: `height: ${menuRect.height}px` });
        parent.insertBefore(this.spacer, this.menu);
      }
    }
  }

  destroy() {
    if (this.wrapper.parentNode) this.wrapper.parentNode.replaceChild(this.editorView.dom, this.wrapper);
  }
}

function selectionIsInverted(selection: Selection) {
  if (selection.anchorNode == selection.focusNode) return selection.anchorOffset > selection.focusOffset;
  return selection.anchorNode!.compareDocumentPosition(selection.focusNode!) == Node.DOCUMENT_POSITION_FOLLOWING;
}

function findWrappingScrollable(node: Node) {
  for (let cur = node.parentNode; cur; cur = cur.parentNode)
    if ((cur as HTMLElement).scrollHeight > (cur as HTMLElement).clientHeight) return cur as HTMLElement;
}

function getAllWrapping(node: Node) {
  const res: (Node | Window)[] = [node.ownerDocument!.defaultView || window];
  for (let cur = node.parentNode; cur; cur = cur.parentNode) res.push(cur);
  return res;
}
