// Shared Chart.js look. Series colours carry meaning (income green, expense rust);
// the accent is only used to highlight a single point of interest, never money direction.
export const COLORS = {
  forest: '#0B3326',
  deep: '#06241B',
  brand: '#11694B',
  brandSoft: 'rgba(17,105,75,0.14)',
  signal: '#B8361A',
  signalSoft: 'rgba(184,54,26,0.10)',
  accent: '#FFB400',
  line: '#E4DAC4',
  mute: '#5C6C63',
  paper: '#F5EFE0',
};

// Categorical palette for slices (distinct lightness so it survives colour-blindness).
export const CATEGORY_PALETTE = ['#0B3326', '#11694B', '#FFB400', '#7FB89A', '#C9B98F', '#C8702A', '#3A5148', '#E4DAC4'];

export const applyChartDefaults = (ChartJS) => {
  ChartJS.defaults.font.family = '"Geist", ui-sans-serif, system-ui, sans-serif';
  ChartJS.defaults.font.size = 12;
  ChartJS.defaults.color = COLORS.mute;
  ChartJS.defaults.borderColor = COLORS.line;
  ChartJS.defaults.plugins.legend.labels.usePointStyle = true;
  ChartJS.defaults.plugins.legend.labels.boxWidth = 8;
  ChartJS.defaults.plugins.legend.labels.boxHeight = 8;
  ChartJS.defaults.plugins.legend.labels.padding = 16;
  ChartJS.defaults.plugins.tooltip.backgroundColor = COLORS.deep;
  ChartJS.defaults.plugins.tooltip.titleColor = COLORS.paper;
  ChartJS.defaults.plugins.tooltip.bodyColor = COLORS.paper;
  ChartJS.defaults.plugins.tooltip.padding = 12;
  ChartJS.defaults.plugins.tooltip.cornerRadius = 10;
  ChartJS.defaults.plugins.tooltip.displayColors = true;
};

export const gridOptions = {
  grid: { color: 'rgba(228,218,196,0.7)', drawTicks: false },
  border: { display: false },
};
