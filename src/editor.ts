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
  charging_time_entity: string;
  charging_time_color: string;
  show_state: boolean;
  hide_state_when_zero: boolean;
  charging_power_entity: string;
  charging_power_max: string;
  override_entity: string;
  override_ignore: 'ideal' | 'min' | 'min_ideal' | '';
  color_override: string;
  icon_min: string;
  icon_ideal: string;
  icon_max: string;
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
  section_handles: string;
  min_entity: string;
  color_min: string;
  ideal_entity: string;
  color_ideal: string;
  max_entity: string;
  color_max: string;
  icon_min: string;
  icon_ideal: string;
  icon_max: string;
  section_soc: string;
  soc_entity: string;
  color_soc: string;
  show_state: string;
  hide_state_when_zero: string;
  section_charging_time: string;
  charging_time_entity: string;
  charging_time_color: string;
  section_charging_power: string;
  charging_power_entity: string;
  charging_power_max: string;
  section_override: string;
  override_entity: string;
  override_ignore: string;
  override_ignore_ideal: string;
  override_ignore_min: string;
  override_ignore_min_ideal: string;
  color_override: string;
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
    section_handles: 'Handles',
    min_entity: 'Minimum-Entität',
    color_min: 'Farbe',
    ideal_entity: 'Ideal-Entität (optional)',
    color_ideal: 'Farbe',
    max_entity: 'Maximum-Entität',
    color_max: 'Farbe',
    icon_min: 'Icon',
    icon_ideal: 'Icon',
    icon_max: 'Icon',
    section_soc: 'Ladestand',
    soc_entity: 'Ladestand-Entität (optional)',
    color_soc: 'Farbe Ladestand',
    show_state: 'Ladezustand anzeigen',
    hide_state_when_zero: 'Ausblenden wenn 0',
    section_charging_time: 'Ladezeit',
    charging_time_entity: 'Ladezeit-Entität (optional)',
    charging_time_color: 'Textfarbe',
    section_charging_power: 'Ladeleistung',
    charging_power_entity: 'Ladeleistungs-Entität (optional)',
    charging_power_max: 'Maximale Ladeleistung (W)',
    section_override: 'Override / Sperre',
    override_entity: 'Override-Entität (optional)',
    override_ignore: 'Ignorierte Handles',
    override_ignore_ideal: 'Nur Ideal',
    override_ignore_min: 'Nur Minimum',
    override_ignore_min_ideal: 'Min + Ideal',
    color_override: 'Farbe Override-Icon',
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
    section_handles: 'Handles',
    min_entity: 'Minimum entity',
    color_min: 'Color',
    ideal_entity: 'Ideal entity (optional)',
    color_ideal: 'Color',
    max_entity: 'Maximum entity',
    color_max: 'Color',
    icon_min: 'Icon',
    icon_ideal: 'Icon',
    icon_max: 'Icon',
    section_soc: 'State of Charge',
    soc_entity: 'State of charge entity (optional)',
    color_soc: 'State of charge color',
    show_state: 'Show state',
    hide_state_when_zero: 'Hide when zero',
    section_charging_time: 'Charging Time',
    charging_time_entity: 'Charging time entity (optional)',
    charging_time_color: 'Text color',
    section_charging_power: 'Charging Power',
    charging_power_entity: 'Charging power entity (optional)',
    charging_power_max: 'Maximum charging power (W)',
    section_override: 'Override',
    override_entity: 'Override entity (optional)',
    override_ignore: 'Ignored handles',
    override_ignore_ideal: 'Ideal only',
    override_ignore_min: 'Min only',
    override_ignore_min_ideal: 'Min + Ideal',
    color_override: 'Override icon color',
  },
};

function buildSchema(t: Translations, hasIdeal: boolean, hasOverride: boolean) {
  return [
    { name: 'title', label: t.title, selector: { text: {} } },
    { type: 'grid', name: '', column_min_width: '100px', schema: [
      { name: 'icon',       label: t.icon,       selector: { icon: {} } },
      { name: 'icon_color', label: t.icon_color, selector: { 'ui-color': {} } },
    ]},
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
    {
      type: 'expandable',
      name: '',
      title: t.section_handles,
      icon: 'mdi:tune',
      schema: [
        { name: 'min_entity', label: t.min_entity, selector: { entity: { domain: ['number', 'input_number'] } } },
        { type: 'grid', name: '', column_min_width: '100px', schema: [
          { name: 'color_min', label: t.color_min, selector: { 'ui-color': {} } },
          { name: 'icon_min',  label: t.icon_min,  selector: { icon: {} } },
        ]},
        ...(hasIdeal ? [
          { name: 'ideal_entity', label: t.ideal_entity, selector: { entity: { domain: ['number', 'input_number'] } } },
          { type: 'grid', name: '', column_min_width: '100px', schema: [
            { name: 'color_ideal', label: t.color_ideal, selector: { 'ui-color': {} } },
            { name: 'icon_ideal',  label: t.icon_ideal,  selector: { icon: {} } },
          ]},
        ] : [
          { name: 'ideal_entity', label: t.ideal_entity, selector: { entity: { domain: ['number', 'input_number'] } } },
        ]),
        { name: 'max_entity', label: t.max_entity, selector: { entity: { domain: ['number', 'input_number'] } } },
        { type: 'grid', name: '', column_min_width: '100px', schema: [
          { name: 'color_max', label: t.color_max, selector: { 'ui-color': {} } },
          { name: 'icon_max',  label: t.icon_max,  selector: { icon: {} } },
        ]},
      ],
    },
    {
      type: 'expandable',
      name: '',
      title: t.section_soc,
      icon: 'mdi:battery-charging',
      schema: [
        { name: 'soc_entity', label: t.soc_entity, selector: { entity: { domain: ['sensor', 'number', 'input_number'] } } },
        { name: 'color_soc',  label: t.color_soc,  selector: { 'ui-color': {} } },
        { type: 'grid', name: '', schema: [
          { name: 'show_state',           label: t.show_state,           selector: { boolean: {} } },
          { name: 'hide_state_when_zero', label: t.hide_state_when_zero, selector: { boolean: {} } },
        ]},
      ],
    },
    {
      type: 'expandable',
      name: '',
      title: t.section_charging_time,
      icon: 'mdi:timer-outline',
      schema: [
        { name: 'charging_time_entity', label: t.charging_time_entity, selector: { entity: { domain: ['sensor', 'input_text'] } } },
        { name: 'charging_time_color',  label: t.charging_time_color,  selector: { 'ui-color': {} } },
      ],
    },
    {
      type: 'expandable',
      name: '',
      title: t.section_charging_power,
      icon: 'mdi:lightning-bolt',
      schema: [
        { name: 'charging_power_entity', label: t.charging_power_entity, selector: { entity: { domain: ['sensor', 'number', 'input_number'] } } },
        { name: 'charging_power_max',    label: t.charging_power_max,    selector: { text: {} } },
      ],
    },
    {
      type: 'expandable',
      name: '',
      title: t.section_override,
      icon: 'mdi:lock-outline',
      schema: [
        { name: 'override_entity', label: t.override_entity, selector: { entity: { domain: ['binary_sensor', 'switch', 'input_boolean'] } } },
        ...(hasOverride ? [
          { type: 'grid', name: '', column_min_width: '100px', schema: [
            {
              name: 'override_ignore',
              label: t.override_ignore,
              selector: {
                select: {
                  mode: 'list',
                  options: [
                    { value: 'ideal',     label: t.override_ignore_ideal },
                    { value: 'min',       label: t.override_ignore_min },
                    { value: 'min_ideal', label: t.override_ignore_min_ideal },
                  ],
                },
              },
            },
            { name: 'color_override', label: t.color_override, selector: { 'ui-color': {} } },
          ]},
        ] : []),
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
      charging_time_entity: this._config?.entities?.charging_time ?? '',
      charging_time_color: this._config?.charging_time_color ?? 'primary',
      charging_power_entity: this._config?.entities?.charging_power ?? '',
      charging_power_max:    this._config?.charging_power_max != null ? String(this._config.charging_power_max) : '',
      show_state:            this._config?.show_state            ?? false,
      hide_state_when_zero:  this._config?.hide_state_when_zero  ?? false,
      override_entity: this._config?.entities?.override_entity ?? '',
      override_ignore: this._config?.override_ignore ?? 'ideal',
      color_override:  this._config?.colors?.override ?? '',
      icon_min:   this._config?.handle_icons?.min   ?? '',
      icon_ideal: this._config?.handle_icons?.ideal ?? '',
      icon_max:   this._config?.handle_icons?.max   ?? '',
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
    if (d.charging_time_entity) config.entities.charging_time = d.charging_time_entity;
    if (d.charging_time_color) config.charging_time_color = d.charging_time_color;
    else delete config.charging_time_color;
    if (d.charging_power_entity) config.entities.charging_power = d.charging_power_entity;
    else delete config.entities.charging_power;
    const parsedMax = parseInt(d.charging_power_max, 10);
    if (!isNaN(parsedMax) && parsedMax > 0) config.charging_power_max = parsedMax;
    else delete config.charging_power_max;
    if (d.override_entity) config.entities.override_entity = d.override_entity;
    else delete config.entities.override_entity;
    if (d.override_ignore) config.override_ignore = d.override_ignore as ChargingSliderCardConfig['override_ignore'];
    else delete config.override_ignore;

    const colors: ChargingSliderCardConfig['colors'] = {};
    if (d.color_min)      colors.min      = d.color_min;
    if (d.color_ideal)    colors.ideal    = d.color_ideal;
    if (d.color_max)      colors.max      = d.color_max;
    if (d.color_soc)      colors.soc      = d.color_soc;
    if (d.color_override) colors.override = d.color_override;

    if (Object.keys(colors).length > 0) config.colors = colors;
    else delete config.colors;

    const handle_icons: ChargingSliderCardConfig['handle_icons'] = {};
    if (d.icon_min)   handle_icons.min   = d.icon_min;
    if (d.icon_ideal) handle_icons.ideal = d.icon_ideal;
    if (d.icon_max)   handle_icons.max   = d.icon_max;
    if (Object.keys(handle_icons).length > 0) config.handle_icons = handle_icons;
    else delete config.handle_icons;

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

    const lang        = this.hass.language ?? 'en';
    const t           = TRANSLATIONS[lang] ?? TRANSLATIONS.en;
    const hasIdeal    = !!this._config.entities?.ideal;
    const hasOverride = !!this._config.entities?.override_entity;
    const schema      = buildSchema(t, hasIdeal, hasOverride);

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
