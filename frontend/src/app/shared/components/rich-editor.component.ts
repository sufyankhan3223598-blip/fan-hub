import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, forwardRef, input, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-rich-editor',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RichEditorComponent), multi: true }],
  template: `
    <div class="editor" [class.focus]="focused()">
      <div class="toolbar" role="toolbar" aria-label="Formatting">
        <button type="button" (mousedown)="cmd($event, 'bold')" title="Bold"><b>B</b></button>
        <button type="button" (mousedown)="cmd($event, 'italic')" title="Italic"><i>I</i></button>
        <button type="button" (mousedown)="cmd($event, 'formatBlock', 'h3')" title="Heading">H</button>
        <button type="button" (mousedown)="cmd($event, 'formatBlock', 'p')" title="Paragraph">P</button>
        <button type="button" (mousedown)="cmd($event, 'insertUnorderedList')" title="Bullet list"><app-icon name="list" /></button>
        <button type="button" (mousedown)="cmd($event, 'formatBlock', 'blockquote')" title="Quote">&ldquo;</button>
        <button type="button" (mousedown)="link($event)" title="Link"><app-icon name="link" /></button>
        <button type="button" (mousedown)="image($event)" title="Embed image by URL"><app-icon name="image" /></button>
        <button type="button" (mousedown)="cmd($event, 'removeFormat')" title="Clear formatting"><app-icon name="x" /></button>
      </div>
      <div #area class="area rich-text" contenteditable="true" role="textbox" aria-multiline="true" [attr.aria-label]="label()" [attr.data-placeholder]="placeholder()"
        (input)="emit()" (blur)="focused.set(false); touched()" (focus)="focused.set(true)"></div>
    </div>`,
  styles: [`
    .editor { border: 1px solid var(--border-strong); border-radius: var(--r-md); background: var(--bg-1); overflow: hidden; transition: border-color .25s, box-shadow .25s;
      &.focus { border-color: var(--gold); box-shadow: 0 0 0 4px rgba(212,175,55,.14); } }
    .toolbar { display: flex; flex-wrap: wrap; gap: 4px; padding: 6px; border-bottom: 1px solid var(--border); background: var(--bg-2);
      button { min-width: 34px; height: 32px; border-radius: 8px; border: 1px solid transparent; background: none; color: var(--text-2); cursor: pointer; font-family: var(--font-ui); font-weight: 700; display: grid; place-items: center; }
      button:hover { border-color: var(--border-strong); color: var(--gold-2); } }
    .area { min-height: 220px; max-height: 520px; overflow-y: auto; padding: 14px 16px; outline: none; font-size: 1rem;
      &:empty::before { content: attr(data-placeholder); color: var(--muted); } }
  `]
})
export class RichEditorComponent implements ControlValueAccessor, AfterViewInit {
  readonly placeholder = input<string>('Write something amazing...');
  readonly label = input<string>('Rich text editor');
  readonly area = viewChild.required<ElementRef<HTMLDivElement>>('area');
  readonly focused = signal(false);
  private value = '';
  private onChange: (v: string) => void = () => undefined;
  touched: () => void = () => undefined;

  ngAfterViewInit(): void { this.area().nativeElement.innerHTML = this.value; }
  writeValue(v: string | null): void { this.value = v ?? ''; const el = this.area?.()?.nativeElement; if (el && el.innerHTML !== this.value) el.innerHTML = this.value; }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.touched = fn; }

  emit(): void { this.value = this.area().nativeElement.innerHTML; this.onChange(this.value === '<br>' ? '' : this.value); }
  cmd(e: Event, command: string, arg?: string): void { e.preventDefault(); document.execCommand(command, false, arg); this.emit(); }
  link(e: Event): void { e.preventDefault(); const url = prompt('Link URL (https://...)'); if (url) document.execCommand('createLink', false, url); this.emit(); }
  image(e: Event): void { e.preventDefault(); const url = prompt('Image URL (https://...)'); if (url) document.execCommand('insertImage', false, url); this.emit(); }
}
