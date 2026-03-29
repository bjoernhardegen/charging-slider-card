export interface ChargingSliderCardConfig {
  type: string;
  title?: string;
  icon?: string;
  icon_color?: string;
  show_state?: boolean;
  hide_state_when_zero?: boolean;
  /** "inline" = slider next to title (default), "bottom" = slider below title with legend */
  layout?: 'inline' | 'bottom';
  entities: {
    min: string;
    ideal?: string;
    max: string;
    soc?: string;
  };
  colors?: {
    min?: string;    // ui-color value e.g. "red", "blue", "primary"
    ideal?: string;
    max?: string;
    soc?: string;
  };
}

export interface NumberEntityState {
  entity_id: string;
  state: string;
  attributes: {
    min: number;
    max: number;
    step: number;
    unit_of_measurement?: string;
    friendly_name?: string;
  };
}

export interface Hass {
  language: string;
  states: Record<string, NumberEntityState>;
  callService(
    domain: string,
    service: string,
    serviceData: Record<string, unknown>
  ): Promise<void>;
}

export type HandleKey = 'min' | 'ideal' | 'max';

export interface HandleDef {
  key: HandleKey;
  entityId: string;
  entityMin: number;
  entityMax: number;
  step: number;
  label: string;
  unit: string;
}
