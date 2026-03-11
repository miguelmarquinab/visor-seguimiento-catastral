import { Chart } from 'chart.js';

const BAR_LABEL_MIN_HEIGHT_PX = 22;
const STACKED_SEGMENT_LABEL_MIN_HEIGHT_PX = 24;

/** Plugin: etiqueta numérica sobre/dentro de cada barra (gráficos de barras simples). */
export const barCountLabelPlugin = {
  id: 'barCountLabel',
  afterDatasetsDraw(chart: Chart) {
    const counts = (chart.options.plugins as Record<string, { counts?: number[] }>)?.['barCountLabel']?.counts;
    if (!counts?.length || !chart.getDatasetMeta(0)) return;
    const ctx = chart.ctx;
    chart.data.datasets?.[0]?.data?.forEach((_, i) => {
      const meta = chart.getDatasetMeta(0).data[i] as unknown as { x: number; y: number; base: number };
      if (!meta) return;
      const count = counts[i] ?? 0;
      const barHeightPx = Math.abs(meta.base - meta.y);
      const topY = Math.min(meta.base, meta.y);
      const centerY = (meta.base + meta.y) / 2;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '600 12px sans-serif';
      ctx.fillStyle = '#333';
      if (barHeightPx < BAR_LABEL_MIN_HEIGHT_PX) {
        ctx.textBaseline = 'middle';
        ctx.fillText(String(count), meta.x, centerY);
      } else {
        ctx.textBaseline = 'top';
        ctx.fillText(String(count), meta.x, topY + 4);
      }
      ctx.restore();
    });
  }
};

/** Plugin: etiqueta numérica en cada segmento del gráfico apilado. */
export const stackedBarSegmentLabelPlugin = {
  id: 'stackedBarSegmentLabel',
  afterDatasetsDraw(chart: Chart) {
    const datasets = chart.data.datasets;
    if (!datasets?.length || datasets.length <= 1) return;
    const ctx = chart.ctx;
    ctx.save();
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < datasets.length; i++) {
      const meta = chart.getDatasetMeta(i);
      const data = datasets[i]?.data ?? [];
      for (let j = 0; j < meta.data.length; j++) {
        const value = data[j];
        const num = typeof value === 'number' ? value : Number(value);
        if (num === 0) continue;
        const el = meta.data[j] as unknown as { x: number; y: number; base: number };
        const segmentHeightPx = Math.abs(el.base - el.y);
        if (segmentHeightPx < STACKED_SEGMENT_LABEL_MIN_HEIGHT_PX) continue;
        const topY = Math.min(el.base, el.y);
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#1a1a1a';
        ctx.fillText(String(num), el.x, topY + 4);
      }
    }
    ctx.restore();
  }
};

/** Registra los plugins de reportes (etiquetas en barras y segmentos) para usar en manzanas y polígonos. */
export function registerReportChartPlugins(): void {
  Chart.register(barCountLabelPlugin, stackedBarSegmentLabelPlugin);
}
