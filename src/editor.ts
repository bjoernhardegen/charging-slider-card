import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { ChargingSliderCardConfig, Hass } from './types.js';

interface FormData {
  title: string;
  icon: string;
  icon_color: string;
  layout: 'inline' | 'bottom';
  min_entity: string;
  color_min: string;
  ideal_entity: string;
  color_ideal: string;
  max_entity: string;
  color_max: string;
  soc_entity: string;
  color_soc: string;
  show_state: boolean;
  hide_state_when_zero: boolean;
}

interface Translations {
  title: string;
  icon: string;
  icon_color: string;
  layout: string;
  layout_inline: string;
  layout_inline_desc: string;
  layout_bottom: string;
  layout_bottom_desc: string;
  min_entity: string;
  color_min: string;
  ideal_entity: string;
  color_ideal: string;
  max_entity: string;
  color_max: string;
  soc_entity: string;
  color_soc: string;
  show_state: string;
  hide_state_when_zero: string;
}


const TRANSLATIONS: Record<string, Translations> = {
  de: {
    title: 'Titel',
    icon: 'Icon',
    icon_color: 'Icon-Farbe',
    layout: 'Layout',
    layout_inline: 'Inline',
    layout_inline_desc: 'Slider neben dem Titel',
    layout_bottom: 'Unten',
    layout_bottom_desc: 'Slider unter dem Titel mit Legende',
    min_entity: 'Minimum-Entität',
    color_min: 'Farbe Minimum',
    ideal_entity: 'Ideal-Entität (optional)',
    color_ideal: 'Farbe Ideal',
    max_entity: 'Maximum-Entität',
    color_max: 'Farbe Maximum',
    soc_entity: 'Ladestand-Entität (optional)',
    color_soc: 'Farbe Ladestand',
    show_state: 'Ladezustand anzeigen',
    hide_state_when_zero: 'Ausblenden wenn 0',
  },
  en: {
    title: 'Title',
    icon: 'Icon',
    icon_color: 'Icon color',
    layout: 'Layout',
    layout_inline: 'Inline',
    layout_inline_desc: 'Displays slider next to title',
    layout_bottom: 'Bottom',
    layout_bottom_desc: 'Displays slider below title with legend',
    min_entity: 'Minimum entity',
    color_min: 'Minimum color',
    ideal_entity: 'Ideal entity (optional)',
    color_ideal: 'Ideal color',
    max_entity: 'Maximum entity',
    color_max: 'Maximum color',
    soc_entity: 'State of charge entity (optional)',
    color_soc: 'State of charge color',
    show_state: 'Show state',
    hide_state_when_zero: 'Hide when zero',
  },
};

function buildSchema(t: Translations, hasIdeal: boolean) {
  return [
    { name: 'title',      label: t.title,      selector: { text: {} } },
    { name: 'icon',       label: t.icon,       selector: { icon: {} } },
    { name: 'icon_color', label: t.icon_color, selector: { 'ui-color': {} } },
    {
      name: 'layout',
      label: t.layout,
      selector: {
        select: {
          mode: 'list',
          options: [
            { value: 'inline', label: t.layout_inline, description: t.layout_inline_desc },
            { value: 'bottom', label: t.layout_bottom, description: t.layout_bottom_desc },
          ],
        },
      },
    },
    { name: 'min_entity', label: t.min_entity, selector: { entity: { domain: ['number', 'input_number'] } } },
    { name: 'color_min',  label: t.color_min,  selector: { 'ui-color': {} } },
    ...(hasIdeal ? [
      { name: 'ideal_entity', label: t.ideal_entity, selector: { entity: { domain: ['number', 'input_number'] } } },
      { name: 'color_ideal',  label: t.color_ideal,  selector: { 'ui-color': {} } },
    ] : [
      { name: 'ideal_entity', label: t.ideal_entity, selector: { entity: { domain: ['number', 'input_number'] } } },
    ]),
    { name: 'max_entity', label: t.max_entity, selector: { entity: { domain: ['number', 'input_number'] } } },
    { name: 'color_max',  label: t.color_max,  selector: { 'ui-color': {} } },
    { name: 'soc_entity', label: t.soc_entity, selector: { entity: { domain: ['sensor', 'number', 'input_number'] } } },
    { name: 'color_soc',  label: t.color_soc,  selector: { 'ui-color': {} } },
    {
      type: 'grid',
      name: '',
      schema: [
        { name: 'show_state',          label: t.show_state,          selector: { boolean: {} } },
        { name: 'hide_state_when_zero', label: t.hide_state_when_zero, selector: { boolean: {} } },
      ],
    },
  ];
}

@customElement('charging-slider-card-editor')
export class ChargingSliderCardEditor extends LitElement {
  @property({ attribute: false }) hass?: Hass;
  @state() private _config?: ChargingSliderCardConfig;

  setConfig(config: ChargingSliderCardConfig): void {
    this._config = config;
  }

  private get _formData(): FormData {
    return {
      title:        this._config?.title            ?? '',
      icon:         this._config?.icon            ?? '',
      icon_color:   this._config?.icon_color      ?? '',
      layout:       this._config?.layout          ?? 'inline',
      min_entity:   this._config?.entities?.min   ?? '',
      color_min:    this._config?.colors?.min     ?? '',
      ideal_entity: this._config?.entities?.ideal ?? '',
      color_ideal:  this._config?.colors?.ideal   ?? '',
      max_entity:   this._config?.entities?.max   ?? '',
      color_max:    this._config?.colors?.max     ?? '',
      soc_entity:   this._config?.entities?.soc   ?? '',
      color_soc:    this._config?.colors?.soc     ?? '',
      show_state:            this._config?.show_state            ?? false,
      hide_state_when_zero:  this._config?.hide_state_when_zero  ?? false,
    };
  }

  private _valueChanged(ev: CustomEvent<{ value: FormData }>): void {
    ev.stopPropagation();
    if (!this._config) return;
    const d = ev.detail.value;

    const config: ChargingSliderCardConfig = {
      ...this._config,
      layout: d.layout,
      entities: { min: d.min_entity, max: d.max_entity },
    };

    if (d.title)      config.title      = d.title;      else delete config.title;
    if (d.icon)       config.icon       = d.icon;       else delete config.icon;
    if (d.icon_color) config.icon_color = d.icon_color; else delete config.icon_color;
    if (d.ideal_entity) config.entities.ideal = d.ideal_entity;
    if (d.soc_entity)   config.entities.soc   = d.soc_entity;

    const colors: ChargingSliderCardConfig['colors'] = {};
    if (d.color_min)   colors.min   = d.color_min;
    if (d.color_ideal) colors.ideal = d.color_ideal;
    if (d.color_max)   colors.max   = d.color_max;
    if (d.color_soc)   colors.soc   = d.color_soc;

    if (Object.keys(colors).length > 0) config.colors = colors;
    else delete config.colors;

    if (d.show_state) config.show_state = true; else delete config.show_state;
    if (d.hide_state_when_zero) config.hide_state_when_zero = true; else delete config.hide_state_when_zero;

    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config },
        bubbles: true,
        composed: true,
      })
    );
  }

  protected render() {
    if (!this.hass || !this._config) return nothing;

    const lang     = this.hass.language ?? 'en';
    const t        = TRANSLATIONS[lang] ?? TRANSLATIONS.en;
    const hasIdeal = !!this._config.entities?.ideal;
    const schema   = buildSchema(t, hasIdeal);

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._formData}
        .schema=${schema}
        .computeLabel=${(s: { label: string }) => s.label}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }
}
