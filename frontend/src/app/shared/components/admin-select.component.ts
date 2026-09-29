import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, input, output, signal } from '@angular/core';
import { IconComponent } from './icon.component';

export interface AdminSelectOption {
  value: any;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-admin-select',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="admin-select-wrap" [class.open]="open()" [class.disabled]="disabled()">
      <button
        type="button"
        class="admin-select-trigger"
        [class.open]="open()"
        [class.has-value]="hasValue()"
        [disabled]="disabled()"
        [attr.aria-label]="ariaLabel() || placeholder()"
        [attr.aria-expanded]="open()"
        (click)="toggle($event)">
        <span class="trigger-label">{{ currentLabel() }}</span>
        <span class="trigger-chevron" [class.rotated]="open()">
          <app-icon name="chevron-down" />
        </span>
      </button>

      @if (open()) {
        <div class="admin-select-menu" (click)="$event.stopPropagation()">
          <div class="menu-scroller">
            @for (opt of options(); track opt.value) {
              <button
                type="button"
                class="admin-select-item"
                [class.selected]="isSelected(opt.value)"
                (click)="select(opt.value, $event)">
                <span class="item-text">
                  @if (opt.icon) { <app-icon [name]="opt.icon" class="item-icon" /> }
                  {{ opt.label }}
                </span>
                @if (isSelected(opt.value)) {
                  <span class="item-check"><app-icon name="check" /></span>
                }
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
      vertical-align: middle;
      position: relative;
      z-index: 10;

      &:has(.open) {
        z-index: 1000;
      }
    }

    .admin-select-wrap {
      position: relative;
      display: inline-block;
      width: 100%;
      min-width: 130px;

      &.open {
        z-index: 1000;
      }

      &.disabled {
        opacity: 0.5;
        pointer-events: none;
      }
    }

    .admin-select-trigger {
      width: 100%;
      min-height: 40px;
      padding: 8px 14px;
      border-radius: 12px;
      background: rgba(8, 8, 12, 0.9);
      border: 1px solid rgba(212, 175, 55, 0.22);
      color: #e2e8f0;
      font-family: var(--font-ui);
      font-size: 0.88rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      cursor: pointer;
      outline: none;
      transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

      &:hover {
        border-color: rgba(245, 200, 106, 0.6);
        background: rgba(14, 14, 18, 0.95);
        color: #ffffff;
      }

      &.open {
        border-color: #F5C86A;
        background: #09090c;
        box-shadow: 0 0 0 3px rgba(245, 200, 106, 0.2), 0 6px 18px rgba(0, 0, 0, 0.6);
      }

      .trigger-label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-align: left;
      }

      .trigger-chevron {
        color: #F5C86A;
        font-size: 13px;
        display: flex;
        align-items: center;
        transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);

        &.rotated {
          transform: rotate(180deg);
        }
      }
    }

    .admin-select-menu {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      z-index: 99999;
      min-width: 100%;
      width: max-content;
      max-width: 320px;
      background: #070709;
      border: 1px solid rgba(245, 200, 106, 0.3);
      border-radius: 14px;
      box-shadow: 0 18px 45px rgba(0, 0, 0, 0.92), 0 0 20px rgba(212, 175, 55, 0.08);
      padding: 5px;
      animation: menuFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      backdrop-filter: blur(20px);

      @media (max-width: 768px) {
        max-width: min(290px, calc(100vw - 32px));
      }
    }

    @keyframes menuFadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .menu-scroller {
      max-height: 220px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(245, 200, 106, 0.35) transparent;

      &::-webkit-scrollbar {
        width: 5px;
      }
      &::-webkit-scrollbar-thumb {
        background: rgba(245, 200, 106, 0.35);
        border-radius: 999px;
      }
    }

    .admin-select-item {
      width: 100%;
      padding: 9px 12px;
      border: none;
      background: transparent;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      color: #94a3b8;
      font-family: var(--font-ui);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s ease;

      &:hover {
        background: rgba(245, 200, 106, 0.12);
        color: #FFE699;
      }

      &.selected {
        background: linear-gradient(135deg, rgba(245, 200, 106, 0.2), rgba(180, 120, 20, 0.08));
        color: #F5C86A;
        font-weight: 700;
      }

      .item-text {
        display: flex;
        align-items: center;
        gap: 8px;
        white-space: nowrap;
      }

      .item-icon {
        font-size: 14px;
        color: #F5C86A;
      }

      .item-check {
        color: #F5C86A;
        font-size: 13px;
        display: flex;
        align-items: center;
      }
    }

    :host-context([data-theme='light']) {
      .admin-select-trigger {
        background: #FFFFFF;
        border: 1px solid rgba(158, 116, 18, 0.28);
        color: #0E0F16;
        box-shadow: 0 2px 6px rgba(25, 20, 10, 0.04);

        &:hover {
          background: #FAF8F2;
          border-color: #9E7412;
          color: #0E0F16;
        }

        &.open {
          border-color: #9E7412;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(158, 116, 18, 0.16), 0 4px 12px rgba(25, 20, 10, 0.08);
        }

        .trigger-chevron {
          color: #9E7412;
        }
      }

      .admin-select-menu {
        background: #FFFFFF;
        border: 1px solid rgba(158, 116, 18, 0.28);
        box-shadow: 0 16px 40px rgba(25, 20, 10, 0.12), 0 0 20px rgba(158, 116, 18, 0.06);
      }

      .menu-scroller {
        scrollbar-color: rgba(158, 116, 18, 0.3) transparent;
        &::-webkit-scrollbar-thumb {
          background: rgba(158, 116, 18, 0.3);
        }
      }

      .admin-select-item {
        color: #383B4D;

        &:hover {
          background: rgba(158, 116, 18, 0.08);
          color: #0E0F16;
        }

        &.selected {
          background: rgba(158, 116, 18, 0.14);
          color: #7A5B0B;
          font-weight: 700;

          .item-icon, .item-check {
            color: #9E7412;
          }
        }

        .item-icon, .item-check {
          color: #9E7412;
        }
      }
    }
  `]
})
export class AdminSelectComponent {
  private elementRef = inject(ElementRef);

  readonly options = input<AdminSelectOption[]>([]);
  readonly value = input<any>(null);
  readonly placeholder = input<string>('All');
  readonly ariaLabel = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly valueChange = output<any>();

  readonly open = signal<boolean>(false);

  readonly currentLabel = computed(() => {
    const val = this.value();
    const opts = this.options();
    const found = opts.find(o => String(o.value) === String(val) || (val === '' && o.value === '') || (val === null && o.value === ''));
    if (found) return found.label;
    if (val === null || val === undefined || val === '') return this.placeholder();
    return String(val);
  });

  readonly hasValue = computed(() => {
    const val = this.value();
    return val !== null && val !== undefined && val !== '';
  });

  isSelected(optVal: any): boolean {
    const cur = this.value();
    if (cur === optVal) return true;
    if ((cur === null || cur === undefined || cur === '') && (optVal === null || optVal === undefined || optVal === '')) return true;
    return String(cur) === String(optVal);
  }

  toggle(e: Event): void {
    e.stopPropagation();
    if (!this.disabled()) {
      this.open.set(!this.open());
    }
  }

  select(val: any, e: Event): void {
    e.stopPropagation();
    this.open.set(false);
    this.valueChange.emit(val);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(e: Event): void {
    if (!this.elementRef.nativeElement.contains(e.target)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.open.set(false);
  }
}
