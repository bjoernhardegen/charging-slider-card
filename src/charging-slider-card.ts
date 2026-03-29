import { LitElement, html, PropertyValues } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { cardStyles } from './styles.js';
import type { ChargingSliderCardConfig, Hass, HandleDef, HandleKey } from './types.js';
import './editor.js';

// Register card with HA's card picker
declare global {
  interface Window {
    customCards?: Array<Record<string, unknown>>;
  }
}
window.customCards ??= [];
window.customCards.push({
  type: 'charging-slider-card',
  name: 'Charging Slider Card',
  description: 'Multi-handle slider for min / ideal / max number entities',
  preview: true,
});

function uiColorToCss(color: string | undefined): string | null {
  if (!color || color === 'state-color') return null;
  return `var(--${color}-color)`;
}

@customElement('charging-slider-card')
export class ChargingSliderCard extends LitElement {
  static styles = cardStyles;

  // ─── Private state ────────────────────────────────────────────────────────

  /** HA hass object — NOT reactive, managed manually to avoid drag conflicts */
  private _hass?: Hass;

  @state() private _config?: ChargingSliderCardConfig;

  /** Handle definitions derived from entity attributes */
  private _handles: HandleDef[] = [];
  /** Current values in entity units, parallel to _handles */
  private _values: number[] = [];

  private _globalMin = 0;
  private _globalMax = 100;
  private _globalStep = 1;

  private _socValue: number | null = null;

  private _isDragging = false;
  private _hasBuiltHandles = false;


  // ─── HA Card Interface ────────────────────────────────────────────────────

  set hass(hass: Hass) {
    const old = this._hass;
    this._hass = hass;

    if (!this._config) return;

    if (!this._hasBuiltHandles) {
      // Trigger updated() which will build the slider once the DOM is ready
      this.requestUpdate();
      return;
    }

    if (!this._isDragging) {
      const socId = this._config?.entities?.soc;
      const changed = this._handles.some(
        (h) => old?.states[h.entityId] !== hass.states[h.entityId]
      ) || !!(socId && old?.states[socId] !== hass.states[socId]);
      if (changed) {
        this._syncFromHass();
        this._updateDOM();
      }
    }
  }

  get hass(): Hass | undefined {
    return this._hass;
  }

  setConfig(config: ChargingSliderCardConfig): void {
    if (!config.entities?.min) {
      throw new Error('charging-slider-card: entities.min is required');
    }
    if (!config.entities?.max) {
      throw new Error('charging-slider-card: entities.max is required');
    }
    if (config.layout && !['inline', 'bottom'].includes(config.layout)) {
      throw new Error('charging-slider-card: layout must be "inline" or "bottom"');
    }
    this._hasBuiltHandles = false;
    this._config = { layout: 'inline', ...config };
  }

  getCardSize(): number {
    return this._config?.layout === 'bottom' ? 3 : 1;
  }

  static getConfigElement(): HTMLElement {
    return document.createElement('charging-slider-card-editor');
  }

  static getStubConfig(): Partial<ChargingSliderCardConfig> {
    return {
      entities: { min: 'number.min', max: 'number.max' },
      layout: 'inline',
    };
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  protected updated(changed: PropertyValues): void {
    if (!this._hass || !this._config) return;

    // Rebuild when config changes or on first arrival of hass
    if (!this._hasBuiltHandles || changed.has('_config')) {
      this._syncFromHass();
      this._buildHandles();
      this._updateDOM();
      this._hasBuiltHandles = true;
    }
  }

  // ─── Render (card shell only — slider is built imperatively) ──────────────

  protected render() {
    if (!this._config) return html``;
    const { layout = 'inline', title, icon, icon_color, show_state } = this._config;
    const iconColorCss = uiColorToCss(icon_color);

    return html`
      <ha-card class="layout-${layout}">
        <div class="card-content">
          ${title || icon
            ? html`
                <div class="csc-header-row">
                  ${icon ? html`<ha-icon class="csc-icon" .icon=${icon} style=${iconColorCss ? `color:${iconColorCss}` : ''}></ha-icon>` : ''}
                  <div class="csc-info">
                    ${title ? html`<div class="csc-title">${title}</div>` : ''}
                    ${show_state ? html`<div class="csc-state"></div>` : ''}
                  </div>
                </div>
              `
            : ''}
          <div class="csc-slider-wrap">
            <div class="csc-track-container">
              <div class="csc-track">
                <div class="csc-fill"></div>
              </div>
            </div>
            <div class="csc-legend"></div>
          </div>
        </div>
      </ha-card>
    `;
  }

  // ─── Sync values from HA entity state ────────────────────────────────────

  private _syncFromHass(): void {
    if (!this._hass || !this._config) return;
    const { entities } = this._config;

    const handles: HandleDef[] = [];

    const addHandle = (key: HandleKey, entityId: string): boolean => {
      const st = this._hass!.states[entityId];
      if (!st) return false;
      handles.push({
        key,
        entityId,
        entityMin: st.attributes.min ?? 0,
        entityMax: st.attributes.max ?? 100,
        step: st.attributes.step ?? 1,
        label: st.attributes.friendly_name ?? entityId,
        unit: st.attributes.unit_of_measurement ?? '',
      });
      return true;
    };

    if (!addHandle('min', entities.min)) return;
    if (entities.ideal) addHandle('ideal', entities.ideal);
    if (!addHandle('max', entities.max)) return;

    this._handles = handles;
    this._values = handles.map((h) => parseFloat(this._hass!.states[h.entityId].state));
    this._globalMin = Math.min(...handles.map((h) => h.entityMin));
    this._globalMax = Math.max(...handles.map((h) => h.entityMax));
    this._globalStep = handles.reduce((s, h) => Math.min(s, h.step), handles[0].step);

    const socId = entities.soc;
    if (socId) {
      const st = this._hass!.states[socId];
      this._socValue = st ? parseFloat(st.state) : null;
    } else {
      this._socValue = null;
    }
  }

  // ─── Imperative DOM: build handle elements ────────────────────────────────

  private _buildHandles(): void {
    const container = this.shadowRoot?.querySelector('.csc-track-container');
    if (!container) return;

    // Remove existing handles (keep .csc-track)
    container.querySelectorAll('.csc-handle').forEach((el) => el.remove());

    // SoC element inside the track
    const track = container.querySelector('.csc-track');
    if (track) {
      let socEl = track.querySelector<HTMLElement>('.csc-soc');
      if (!socEl) {
        socEl = document.createElement('div');
        socEl.className = 'csc-soc';
        track.insertBefore(socEl, track.firstChild);
      }
      const socColor = uiColorToCss(this._config?.colors?.soc);
      if (socColor) socEl.style.setProperty('--csc-soc-color', socColor);
      else socEl.style.removeProperty('--csc-soc-color');
    }

    this._handles.forEach((h, i) => {
      const el = document.createElement('div');
      el.className = 'csc-handle';
      el.dataset.handle = h.key;
      el.setAttribute('role', 'slider');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', h.label);
      el.setAttribute('aria-valuemin', String(h.entityMin));
      el.setAttribute('aria-valuemax', String(h.entityMax));
      el.innerHTML =
        '<div class="csc-handle-inner"></div><div class="csc-tooltip"></div>';

      // Apply custom color if configured
      const colorCss = uiColorToCss(this._config?.colors?.[h.key]);
      if (colorCss) {
        el.style.setProperty('--csc-handle-color', colorCss);
      }

      el.addEventListener('pointerdown', (e) =>
        this._onPointerDown(e as PointerEvent, i)
      );
      el.addEventListener('keydown', (e) =>
        this._onKeyDown(e as KeyboardEvent, i)
      );

      container.appendChild(el);
    });

    // Build legend items
    const legend = this.shadowRoot?.querySelector('.csc-legend');
    if (legend) {
      legend.innerHTML = '';
      this._handles.forEach((h) => {
        const item = document.createElement('div');
        item.className = 'csc-legend-item';
        item.dataset.handle = h.key;
        item.textContent = h.label;
        const colorCss = uiColorToCss(this._config?.colors?.[h.key]);
        if (colorCss) item.style.color = colorCss;
        legend.appendChild(item);
      });
    }
  }

  // ─── Imperative DOM: update positions and labels ──────────────────────────

  private _updateDOM(): void {
    if (!this.shadowRoot) return;

    const handles =
      this.shadowRoot.querySelectorAll<HTMLElement>('.csc-handle');
    const fill = this.shadowRoot.querySelector<HTMLElement>('.csc-fill');
    const socEl = this.shadowRoot.querySelector<HTMLElement>('.csc-soc');
    const stateEl = this.shadowRoot.querySelector<HTMLElement>('.csc-state');

    if (socEl) {
      if (this._socValue !== null && !isNaN(this._socValue)) {
        const pct = Math.max(0, Math.min(100, this._valueToPct(this._socValue)));
        socEl.style.width = `${pct}%`;
        socEl.style.display = '';
      } else {
        socEl.style.display = 'none';
      }
    }

    if (stateEl) {
      const hideWhenZero = this._config?.hide_state_when_zero;
      if (this._socValue !== null && !isNaN(this._socValue) && !(hideWhenZero && this._socValue === 0)) {
        const socId = this._config?.entities?.soc;
        const unit = socId ? (this._hass?.states[socId]?.attributes?.unit_of_measurement ?? '') : '';
        stateEl.textContent = unit ? `${this._socValue} ${unit}` : String(this._socValue);
      } else {
        stateEl.textContent = '';
      }
    }

    this._values.forEach((val, i) => {
      const el = handles[i];
      if (!el) return;
      const pct = this._valueToPct(val);
      el.style.left = `${pct}%`;
      el.setAttribute('aria-valuenow', String(val));

      const tooltip = el.querySelector<HTMLElement>('.csc-tooltip');
      if (tooltip) {
        tooltip.textContent = this._formatValue(val, this._handles[i]);
      }
    });

    // Fill spans from first (min) to last (max) handle
    // If SoC is set, fill only starts where SoC ends to avoid color mixing
    if (fill && this._values.length >= 2) {
      const minPct = this._valueToPct(this._values[0]);
      const maxPct = this._valueToPct(this._values[this._values.length - 1]);
      const socPct = this._socValue !== null && !isNaN(this._socValue)
        ? Math.max(0, Math.min(100, this._valueToPct(this._socValue)))
        : null;
      const fillStart = socPct !== null ? Math.min(Math.max(minPct, socPct), maxPct) : minPct;
      fill.style.left = `${fillStart}%`;
      fill.style.width = `${maxPct - fillStart}%`;
    }

    // Update legend positions
    const legend = this.shadowRoot.querySelector('.csc-legend');
    if (legend) {
      const items = legend.querySelectorAll<HTMLElement>('.csc-legend-item');
      items.forEach((item, i) => {
        item.style.left = `${this._valueToPct(this._values[i])}%`;
        item.textContent = this._formatValue(this._values[i], this._handles[i]);
      });
    }
  }

  // ─── Drag logic ───────────────────────────────────────────────────────────

  private _onPointerDown(e: PointerEvent, idx: number): void {
    e.preventDefault();
    const handle = e.currentTarget as HTMLElement;
    const pointerId = e.pointerId;

    this._isDragging = true;
    handle.classList.add('is-dragging');

    const onMove = (moveEvent: PointerEvent): void => {
      if (moveEvent.pointerId !== pointerId) return;
      const newVal = this._pointerToValue(moveEvent);
      const next = [...this._values];
      next[idx] = newVal;
      this._values = this._enforceOrdering(next, idx);
      this._updateDOM();
    };

    const onEnd = (endEvent: PointerEvent): void => {
      if (endEvent.pointerId !== pointerId) return;
      handle.classList.remove('is-dragging');
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onEnd);
      document.removeEventListener('pointercancel', onEnd);
      this._isDragging = false;
      this._persistValues();
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onEnd);
    document.addEventListener('pointercancel', onEnd);
  }

  private _pointerToValue(e: PointerEvent): number {
    const container = this.shadowRoot?.querySelector<HTMLElement>(
      '.csc-track-container'
    );
    if (!container) return this._globalMin;

    const rect = container.getBoundingClientRect();
    const raw = (e.clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, raw));
    const rawValue =
      this._globalMin + clamped * (this._globalMax - this._globalMin);
    // Snap to global step
    return (
      Math.round(rawValue / this._globalStep) * this._globalStep
    );
  }

  // ─── Keyboard support ─────────────────────────────────────────────────────

  private _onKeyDown(e: KeyboardEvent, idx: number): void {
    const step = e.shiftKey ? this._globalStep * 5 : this._globalStep;
    let delta = 0;

    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') delta = step;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') delta = -step;
    else return;

    e.preventDefault();
    const next = [...this._values];
    next[idx] = this._values[idx] + delta;
    this._values = this._enforceOrdering(next, idx);
    this._updateDOM();
    this._persistValues();
  }

  // ─── Constraint algorithm ─────────────────────────────────────────────────

  /**
   * Ensures values[0] < values[1] < ... < values[n-1] with at least
   * _globalStep gap between each pair.
   *
   * Direction-aware: propagates left from the moved handle (so dragging
   * right-handles leftward pushes lower handles left) and right from the
   * moved handle (so dragging left-handles rightward pushes higher handles
   * right).  A final clamp makes sure the moved handle itself is blocked
   * when a neighbour has hit its entity wall.
   */
  private _enforceOrdering(values: number[], movedIdx: number): number[] {
    const result = [...values];
    const n = result.length;
    const step = this._globalStep;

    // Clamp moved handle to its own entity bounds
    result[movedIdx] = Math.max(
      this._handles[movedIdx].entityMin,
      Math.min(this._handles[movedIdx].entityMax, result[movedIdx])
    );

    // Propagate LEFT: each handle must be <= right neighbour - step
    for (let i = movedIdx - 1; i >= 0; i--) {
      result[i] = Math.min(result[i], result[i + 1] - step);
      result[i] = Math.max(result[i], this._handles[i].entityMin);
    }

    // Propagate RIGHT: each handle must be >= left neighbour + step
    for (let i = movedIdx + 1; i < n; i++) {
      result[i] = Math.max(result[i], result[i - 1] + step);
      result[i] = Math.min(result[i], this._handles[i].entityMax);
    }

    // Final clamp: if a neighbour hit a wall, block the moved handle too
    if (movedIdx > 0) {
      result[movedIdx] = Math.max(result[movedIdx], result[movedIdx - 1] + step);
    }
    if (movedIdx < n - 1) {
      result[movedIdx] = Math.min(result[movedIdx], result[movedIdx + 1] - step);
    }

    return result;
  }

  // ─── HA Service call ──────────────────────────────────────────────────────

  private _persistValues(): void {
    if (!this._hass) return;

    this._handles.forEach((h, i) => {
      const newVal = this._values[i];
      const oldVal = parseFloat(this._hass!.states[h.entityId].state);
      if (Math.abs(newVal - oldVal) < 0.001) return;

      // Use the entity's own domain (works for both "number" and "input_number")
      const domain = h.entityId.split('.')[0];
      this._hass?.callService(domain, 'set_value', {
        entity_id: h.entityId,
        value: newVal,
      });
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private _valueToPct(value: number): number {
    const range = this._globalMax - this._globalMin;
    if (range === 0) return 0;
    return ((value - this._globalMin) / range) * 100;
  }

  private _formatValue(value: number, handle: HandleDef): string {
    const decimals =
      handle.step < 1
        ? (String(handle.step).split('.')[1]?.length ?? 0)
        : 0;
    const formatted = value.toFixed(decimals);
    return handle.unit ? `${formatted} ${handle.unit}` : formatted;
  }
}
