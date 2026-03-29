import { css } from 'lit';

export const cardStyles = css`
  :host {
    display: block;
  }

  ha-card {
    overflow: visible;
  }

  /* ================================================================
     INLINE layout — slider to the right of the title
     ================================================================ */

  ha-card.layout-inline .card-content {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 16px;
    min-height: 56px;
    box-sizing: border-box;
  }

  ha-card.layout-inline .csc-header-row {
    flex: 0 0 50%;
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    overflow: hidden;
  }

  .csc-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  ha-card.layout-inline .csc-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--paper-font-body1_-_font-size, 14px);
    font-weight: 500;
    color: var(--primary-text-color);
  }

  .csc-state {
    font-size: 12px;
    color: var(--primary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  ha-card.layout-inline .csc-slider-wrap {
    flex: 1 1 0;
    min-width: 0;
    padding: 10px 0;
  }

  /* ================================================================
     FULL layout — slider below the title with legend
     ================================================================ */

  ha-card.layout-bottom .card-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px 4px;
  }

  ha-card.layout-bottom .csc-header-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  ha-card.layout-bottom .csc-title {
    font-size: var(--paper-font-subhead_-_font-size, 14px);
    font-weight: 500;
    color: var(--primary-text-color);
  }

  ha-card.layout-bottom .csc-slider-wrap {
    padding: 8px 0 10px;
  }

  /* ================================================================
     TRACK
     ================================================================ */

  .csc-track-container {
    position: relative;
    width: 100%;
    height: 28px;
    display: flex;
    align-items: center;
    overflow: visible;
  }

  .csc-track {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 6px;
    border-radius: 999px;
    background: var(--secondary-background-color);
    overflow: visible;
  }

  .csc-soc {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    border-radius: 999px;
    background: var(--csc-soc-color, var(--primary-color));
    opacity: 0.5;
    pointer-events: none;
    z-index: 0;
  }

  .csc-fill {
    position: absolute;
    top: 0;
    height: 100%;
    border-radius: 999px;
    background: var(--primary-color);
    opacity: 0.35;
    pointer-events: none;
  }

  /* ================================================================
     HANDLES
     ================================================================ */

  .csc-handle {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 24px;
    height: 24px;
    cursor: grab;
    z-index: 2;
    touch-action: none;
    outline: none;
  }

  /* Extended 44×44 touch target (WCAG) */
  .csc-handle::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 44px;
    height: 44px;
  }

  .csc-handle:active {
    cursor: grabbing;
  }

  .csc-handle-inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: var(--card-background-color, #fff);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
    border: 2.5px solid transparent;
    box-sizing: border-box;
    transition: box-shadow 150ms ease, transform 150ms ease;
    pointer-events: none;
  }

  .csc-handle:focus-visible .csc-handle-inner {
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35), 0 0 0 3px var(--primary-color);
  }

  /* Custom color via --csc-handle-color, falls back to HA theme color */
  .csc-handle[data-handle='min'] .csc-handle-inner {
    border-color: var(--csc-handle-color, var(--info-color, #4fc3f7));
  }

  .csc-handle[data-handle='ideal'] .csc-handle-inner {
    border-color: var(--csc-handle-color, var(--success-color, #4caf50));
  }

  .csc-handle[data-handle='max'] .csc-handle-inner {
    border-color: var(--csc-handle-color, var(--warning-color, #ff9800));
  }

  .csc-icon {
    --mdc-icon-size: 24px;
    color: #44739e;
    flex-shrink: 0;
  }

  .csc-handle.is-dragging {
    z-index: 3;
    cursor: grabbing;
  }

  .csc-handle.is-dragging .csc-handle-inner {
    transform: scale(1.25);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }

  /* ================================================================
     TOOLTIP — only visible while dragging
     ================================================================ */

  .csc-tooltip {
    position: absolute;
    bottom: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%);
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font-size: 12px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 6px;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.2);
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 120ms ease;
    z-index: 10;
  }

  .csc-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: var(--card-background-color, #fff);
  }

  .csc-handle.is-dragging .csc-tooltip {
    opacity: 1;
  }

  /* ================================================================
     LEGEND — only shown in full layout
     ================================================================ */

  .csc-legend {
    position: relative;
    height: 18px;
    margin-top: 4px;
  }

  ha-card.layout-inline .csc-legend {
    display: none;
  }

  .csc-legend-item {
    position: absolute;
    transform: translateX(-50%);
    font-size: 11px;
    white-space: nowrap;
    color: var(--secondary-text-color);
  }

  .csc-legend-item[data-handle='min'] {
    color: var(--info-color, #4fc3f7);
  }

  .csc-legend-item[data-handle='ideal'] {
    color: var(--success-color, #4caf50);
  }

  .csc-legend-item[data-handle='max'] {
    color: var(--warning-color, #ff9800);
  }
`;
