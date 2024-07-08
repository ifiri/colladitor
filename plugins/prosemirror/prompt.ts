import { type Attrs } from 'prosemirror-model';
import { freezeBody, unfreezeBody } from '@/utils/dom';
import { modalWrapperTemplate } from './modal';

const prefix = 'ProseMirror-prompt';

export function openPrompt(options: {
  title?: string;
  container: HTMLElement;
  fields: { [name: string]: Field };
  callback: (attrs: Attrs) => void;
}) {
  freezeBody();
  const modalWrapper = new DOMParser().parseFromString(modalWrapperTemplate, 'text/html').body.firstElementChild;
  modalWrapper.classList.add(prefix);

  const wrapper = options.container.appendChild(modalWrapper as Node);

  const mouseOutside = (e: MouseEvent) => {
    if (!wrapper.contains(e.target as HTMLElement)) {
      close();
    }
  };

  setTimeout(() => window.addEventListener('mousedown', mouseOutside), 50);

  const close = () => {
    unfreezeBody();
    window.removeEventListener('mousedown', mouseOutside);
    if (wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
  };

  const domFields: HTMLElement[] = [];

  for (const name in options.fields) {
    domFields.push(options.fields[name].render());
  }

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.className = prefix + '-submit';
  submitButton.textContent = 'Apply';
  submitButton.className =
    'px-2 py-1 h-8 bg-imperium-bg-base rounded-lg text-sm text-imperium-ds-base-black font-semibold text-center w-56';

  const form = wrapper.querySelector('.modal-content').appendChild(document.createElement('form'));

  form.className = 'flex flex-col items-center justify-start p-2 h-13 bg-imperium-bg-sub-base gap-2 w-full';

  domFields.forEach((field) => {
    const fieldWrapper = document.createElement('div');
    fieldWrapper.classList.add('w-full');
    form.appendChild(fieldWrapper).appendChild(field);
  });

  const buttons = form.appendChild(document.createElement('div'));
  buttons.className = prefix + '-buttons w-full text-center';
  buttons.appendChild(submitButton);

  if (options.title) {
    modalWrapper.querySelector('.modal-title').textContent = options.title;
  }

  const submit = () => {
    const params = getValues(options.fields, domFields);
    if (params) {
      close();
      options.callback(params);
    }
  };

  document.body.querySelector('.modal-overlay').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      close();
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submit();
  });

  form.addEventListener('keydown', (e) => {
    if (e.keyCode == 27) {
      e.preventDefault();
      close();
    } else if (e.keyCode == 13 && !(e.ctrlKey || e.metaKey || e.shiftKey)) {
      e.preventDefault();
      submit();
    } else if (e.keyCode == 9) {
      window.setTimeout(() => {
        if (!wrapper.contains(document.activeElement)) close();
      }, 500);
    }
  });

  const input = form.elements[0] as HTMLElement;
  if (input) {
    input.focus();
  }
}

function getValues(fields: { [name: string]: Field }, domFields: readonly HTMLElement[]) {
  const result = Object.create(null);
  let i = 0;

  for (const name in fields) {
    const field = fields[name];
    const dom = domFields[i++];
    const value = field.read(dom);
    const bad = field.validate(value);

    if (bad) {
      reportInvalid(dom, bad);
      return null;
    }

    result[name] = field.clean(value);
  }
  return result;
}

function reportInvalid(dom: HTMLElement, message: string) {
  dom.classList.add('bg-red-50', 'border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
}

export abstract class Field {
  constructor(
    readonly options: {
      value?: any;
      label: string;
      required?: boolean;

      validate?: (value: any) => string | null;

      clean?: (value: any) => any;
    },
  ) {}

  abstract render(): HTMLElement;

  read(dom: HTMLElement) {
    return (dom as any).value;
  }

  validateType(value: any): string | null {
    return null;
  }

  validate(value: any): string | null {
    if (!value && this.options.required) return 'Required field';
    return this.validateType(value) || (this.options.validate ? this.options.validate(value) : null);
  }

  clean(value: any): any {
    return this.options.clean ? this.options.clean(value) : value;
  }
}

export class TextField extends Field {
  render() {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = this.options.label;
    input.value = this.options.value || '';
    input.autocomplete = 'off';
    input.className =
      'flex items-center px-2 py-1 text-imperium-fg-base bg-imperium-bg-sub-base rounded border border-imperium-border-base text-sm focus:ring-imperium-ds-primary-strong focus:border-imperium-ds-primary-strong w-full';
    return input;
  }
}

export class SelectField extends Field {
  render() {
    const select = document.createElement('select');
    select.className =
      'flex items-center px-2 py-1 text-imperium-fg-base bg-imperium-bg-sub-base rounded border border-imperium-border-base text-sm focus:ring-0 focus:border-imperium-ds-primary-strong';
    ((this.options as any).options as { value: string; label: string }[]).forEach((o) => {
      const opt = select.appendChild(document.createElement('option'));
      opt.value = o.value;
      opt.selected = o.value == this.options.value;
      opt.label = o.label;
    });
    return select;
  }
}
