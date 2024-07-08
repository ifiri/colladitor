import crel from 'crelt';
import { lift, joinUp, wrapIn, setBlockType } from 'prosemirror-commands';
import { undo, redo } from 'prosemirror-history';
import { EditorView } from 'prosemirror-view';
import { EditorState, Transaction, NodeSelection } from 'prosemirror-state';
import { NodeType, type Attrs } from 'prosemirror-model';

import { getIcon } from './icons';

export interface MenuElement {
  render(pm: EditorView): { dom: HTMLElement; update: (state: EditorState) => boolean };
}

const prefix = 'ProseMirror-menu';

export class MenuItem implements MenuElement {
  constructor(readonly spec: MenuItemSpec) {}

  render(view: EditorView) {
    const spec = this.spec;
    const dom = spec.render
      ? spec.render(view)
      : spec.icon
        ? getIcon(view.root, spec.icon)
        : spec.label
          ? crel('div', null, spec.label)
          : null;
    if (!dom) throw new RangeError('MenuItem without icon or label property');
    if (spec.title) {
      const title = typeof spec.title === 'function' ? spec.title(view.state) : spec.title;
      (dom as HTMLElement).setAttribute('title', title);
    }
    if (spec.class) dom.classList.add(spec.class);
    if (spec.css) dom.style.cssText += spec.css;

    dom.addEventListener('click', (e) => {
      e.preventDefault();
      if (!dom!.classList.contains(prefix + '-disabled')) spec.run(view.state, view.dispatch, view, e);
    });

    function update(state: EditorState) {
      if (spec.select) {
        const selected = spec.select(state);
        if (spec.isReplaceable) {
          dom!.style.display = selected ? '' : 'none';
          dom!.parentNode.style.display = selected ? '' : 'none';

          if (!selected && spec.replaced) {
            spec.replaced();
          }
        }
        setClass(dom!, prefix + '-selected', selected);
        if (!selected) return false;
      }
      let enabled = true;
      if (spec.enable) {
        enabled = spec.enable(state) || false;
        setClass(dom!, prefix + '-disabled', !enabled);
      }
      if (spec.active) {
        const active = (enabled && spec.active(state)) || false;
        setClass(dom!, prefix + '-active', active);
      }
      return true;
    }

    return { dom, update };
  }
}

export type IconSpec = { path: string; width: number; height: number } | { text: string; css?: string } | { dom: Node };

export interface MenuItemSpec {
  run: (state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView, event: Event) => void;
  select?: (state: EditorState) => boolean;
  enable?: (state: EditorState) => boolean;
  active?: (state: EditorState) => boolean;
  render?: (view: EditorView) => HTMLElement;
  icon?: IconSpec;
  label?: string;
  title?: string | ((state: EditorState) => string);
  class?: string;
  css?: string;

  isReplaceable?: boolean;
  replaced?: () => void;
}

const lastMenuEvent: { time: number; node: null | Node } = { time: 0, node: null };
function markMenuEvent(e: Event) {
  lastMenuEvent.time = Date.now();
  lastMenuEvent.node = e.target as Node;
}
function isMenuEvent(wrapper: HTMLElement) {
  return Date.now() - 100 < lastMenuEvent.time && lastMenuEvent.node && wrapper.contains(lastMenuEvent.node);
}

export class Dropdown implements MenuElement {
  content: readonly MenuElement[];

  constructor(
    content: readonly MenuElement[] | MenuElement,
    readonly options: {
      label?: string;
      title?: string;
      class?: string;
      css?: string;
    } = {},
  ) {
    this.options = options || {};
    this.content = Array.isArray(content) ? content : [content];
  }

  render(view: EditorView) {
    const content = renderDropdownItems(this.content, view);
    const win = view.dom.ownerDocument.defaultView || window;

    const label = crel(
      'div',
      { class: prefix + '-dropdown ' + (this.options.class || ''), style: this.options.css },
      this.options.label,
    );
    if (this.options.title) label.setAttribute('title', this.options.title);
    const wrap = crel('div', { class: prefix + '-dropdown-wrap' }, label);
    let open: { close: () => boolean; node: HTMLElement } | null = null;
    let listeningOnClose: (() => void) | null = null;
    const close = () => {
      if (open && open.close()) {
        open = null;
        win.removeEventListener('click', listeningOnClose!);
      }
    };
    label.addEventListener('click', (e) => {
      e.preventDefault();
      markMenuEvent(e);
      if (open) {
        close();
      } else {
        open = this.expand(wrap, content.dom);
        win.addEventListener(
          'click',
          (listeningOnClose = () => {
            if (!isMenuEvent(wrap)) close();
          }),
        );
      }
    });

    function update(state: EditorState) {
      const inner = content.update(state);
      wrap.style.display = inner ? '' : 'inline';
      return inner;
    }

    return { dom: wrap, update };
  }

  expand(dom: HTMLElement, items: readonly Node[]) {
    const menuDOM = crel('div', { class: prefix + '-dropdown-menu ' + (this.options.class || '') }, items);

    let done = false;
    function close(): boolean {
      if (done) return false;
      done = true;
      dom.removeChild(menuDOM);
      return true;
    }
    dom.appendChild(menuDOM);
    return { close, node: menuDOM };
  }
}

function renderDropdownItems(items: readonly MenuElement[], view: EditorView) {
  const rendered = [],
    updates = [];
  for (let i = 0; i < items.length; i++) {
    const { dom, update } = items[i].render(view);
    rendered.push(crel('div', { class: prefix + '-dropdown-item' }, dom));
    updates.push(update);
  }
  return { dom: rendered, update: combineUpdates(updates, rendered) };
}

function combineUpdates(updates: readonly ((state: EditorState) => boolean)[], nodes: readonly HTMLElement[]) {
  return (state: EditorState) => {
    let something = false;
    for (let i = 0; i < updates.length; i++) {
      const up = updates[i](state);
      if (up) something = true;
    }
    return something;
  };
}

export class DropdownSubmenu implements MenuElement {
  content: readonly MenuElement[];
  constructor(
    content: readonly MenuElement[] | MenuElement,
    readonly options: {
      label?: string;
      iconRaw?: string;
    } = {},
  ) {
    this.content = Array.isArray(content) ? content : [content];
  }

  render(view: EditorView) {
    const items = renderDropdownItems(this.content, view);
    const win = view.dom.ownerDocument.defaultView || window;

    const label = crel('div', { class: prefix + '-submenu-label' }, this.options.label);
    const wrap = crel(
      'div',
      { class: prefix + '-submenu-wrap' },
      label,
      crel('div', { class: prefix + '-submenu' }, items.dom),
    );
    let listeningOnClose: (() => void) | null = null;
    label.addEventListener('click', (e) => {
      e.preventDefault();
      markMenuEvent(e);
      setClass(wrap, prefix + '-submenu-wrap-active', false);
      if (!listeningOnClose)
        win.addEventListener(
          'click',
          (listeningOnClose = () => {
            if (!isMenuEvent(wrap)) {
              wrap.classList.remove(prefix + '-submenu-wrap-active');
              win.removeEventListener('click', listeningOnClose!);
              listeningOnClose = null;
            }
          }),
        );
    });

    if (this.options.iconRaw) {
      label.insertAdjacentHTML('afterbegin', this.options.iconRaw);
    }

    function update(state: EditorState) {
      const inner = items.update(state);
      wrap.style.display = inner ? '' : '';
      return inner;
    }
    return { dom: wrap, update };
  }
}

export function renderGrouped(view: EditorView, content: readonly (readonly MenuElement[])[]) {
  const result = document.createDocumentFragment();
  const updates: ((state: EditorState) => boolean)[] = [],
    separators: HTMLElement[] = [];
  for (let i = 0; i < content.length; i++) {
    const items = content[i],
      localUpdates = [],
      localNodes = [];
    for (let j = 0; j < items.length; j++) {
      const { dom, update } = items[j].render(view);
      const span = crel('span', { class: prefix + 'item' }, dom);
      result.appendChild(span);
      localNodes.push(span);
      localUpdates.push(update);
    }
    if (localUpdates.length) {
      updates.push(combineUpdates(localUpdates, localNodes));
      if (i < content.length - 1) separators.push(result.appendChild(separator()));
    }
  }

  function update(state: EditorState) {
    let something = false,
      needSep = false;
    for (let i = 0; i < updates.length; i++) {
      const hasContent = updates[i](state);
      if (i) separators[i - 1].style.display = needSep && hasContent ? '' : '';
      needSep = hasContent;
      if (hasContent) something = true;
    }
    return something;
  }
  return { dom: result, update };
}

function separator() {
  return crel('span', { class: prefix + 'separator' });
}

export const icons: { [name: string]: IconSpec } = {
  join: {
    width: 800,
    height: 900,
    path: 'M0 75h800v125h-800z M0 825h800v-125h-800z M250 400h100v-100h100v100h100v100h-100v100h-100v-100h-100z',
  },
  lift: {
    width: 1024,
    height: 1024,
    path: 'M219 310v329q0 7-5 12t-12 5q-8 0-13-5l-164-164q-5-5-5-13t5-13l164-164q5-5 13-5 7 0 12 5t5 12zM1024 749v109q0 7-5 12t-12 5h-987q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h987q7 0 12 5t5 12zM1024 530v109q0 7-5 12t-12 5h-621q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h621q7 0 12 5t5 12zM1024 310v109q0 7-5 12t-12 5h-621q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h621q7 0 12 5t5 12zM1024 91v109q0 7-5 12t-12 5h-987q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h987q7 0 12 5t5 12z',
  },
};

/// Menu item for the `joinUp` command.
export const joinUpItem = new MenuItem({
  title: 'Join with above block',
  run: joinUp,
  select: (state) => joinUp(state),
  icon: icons.join,
});

/// Menu item for the `lift` command.
export const liftItem = {
  title: 'Lift out of enclosing block',
  run: lift,
  select: (state) => lift(state),
};

export const undoItem = new MenuItem({
  title: 'Undo last change',
  run: undo,
  enable: (state) => undo(state),
});

export const redoItem = new MenuItem({
  title: 'Redo last undone change',
  run: redo,
  enable: (state) => redo(state),
});

export function wrapItem(nodeType: NodeType, options: Partial<MenuItemSpec> & { attrs?: Attrs | null }) {
  const passedOptions: MenuItemSpec = {
    run(state, dispatch) {
      return wrapIn(nodeType, options.attrs)(state, dispatch);
    },
    select(state) {
      return wrapIn(nodeType, options.attrs)(state);
    },
  };
  for (const prop in options) (passedOptions as any)[prop] = (options as any)[prop];
  return new MenuItem(passedOptions);
}

export function blockTypeItem(nodeType: NodeType, options: Partial<MenuItemSpec> & { attrs?: Attrs | null }) {
  const command = setBlockType(nodeType, options.attrs);
  const passedOptions: MenuItemSpec = {
    run: command,
    enable(state) {
      return command(state);
    },
    active(state) {
      const { $from, to, node } = state.selection as NodeSelection;
      if (node) return node.hasMarkup(nodeType, options.attrs);
      return to <= $from.end() && $from.parent.hasMarkup(nodeType, options.attrs);
    },
  };
  for (const prop in options) (passedOptions as any)[prop] = (options as any)[prop];
  return new MenuItem(passedOptions);
}

function setClass(dom: HTMLElement, cls: string, on: boolean) {
  if (on) dom.classList.add(cls);
  else dom.classList.remove(cls);
}
