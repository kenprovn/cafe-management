const currency = (value) => `${Number(value).toLocaleString("vi-VN", { maximumFractionDigits: 0 })} ₫`;

function shortDate(value) {
  const [, month, day] = value.split("-");
  return `${day}/${month}`;
}

function DailyRevenueChart({ data }) {
  const width = 760;
  const height = 250;
  const padding = { top: 22, right: 18, bottom: 38, left: 58 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxRevenue = Math.max(...data.map((item) => Number(item.revenue)), 1);
  const xFor = (index) => padding.left + (data.length === 1 ? chartWidth / 2 : (index / (data.length - 1)) * chartWidth);
  const yFor = (revenue) => padding.top + chartHeight - (Number(revenue) / maxRevenue) * chartHeight;
  const points = data.map((item, index) => `${xFor(index)},${yFor(item.revenue)}`).join(" ");
  const areaPoints = `${padding.left},${padding.top + chartHeight} ${points} ${padding.left + chartWidth},${padding.top + chartHeight}`;
  const labelStep = Math.max(1, Math.ceil(data.length / 6));

  return (
    <div className="report-chart-wrap">
      <svg
        aria-label="Biểu đồ doanh thu theo ngày"
        className="report-line-chart"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          <linearGradient id="reportAreaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#b9783f" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#b9783f" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((ratio) => {
          const y = padding.top + chartHeight * ratio;
          const value = maxRevenue * (1 - ratio);
          return (
            <g key={ratio}>
              <line className="report-grid-line" x1={padding.left} x2={padding.left + chartWidth} y1={y} y2={y} />
              <text className="report-axis-text" textAnchor="end" x={padding.left - 10} y={y + 4}>{`${Math.round(value / 1000).toLocaleString("vi-VN")}k`}</text>
            </g>
          );
        })}
        <polygon fill="url(#reportAreaGradient)" points={areaPoints} />
        <polyline className="report-trend-line" points={points} />
        {data.map((item, index) => (
          <g key={item.date}>
            <circle className="report-chart-point" cx={xFor(index)} cy={yFor(item.revenue)} r={data.length <= 31 ? 3.5 : 2.5}>
              <title>{`${item.date}: ${currency(item.revenue)} · ${item.paid_order_count} hóa đơn`}</title>
            </circle>
            {(index % labelStep === 0 || index === data.length - 1) && (
              <text className="report-axis-text" textAnchor="middle" x={xFor(index)} y={height - 12}>{shortDate(item.date)}</text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

export default DailyRevenueChart;
