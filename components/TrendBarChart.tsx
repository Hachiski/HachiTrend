import React from 'react';

interface TrendBarChartProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

const TrendBarChart: React.FC<TrendBarChartProps> = ({ 
  data, 
  color = '#ef4444', 
  height = 50,
  className = '' 
}) => {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data, 100); 
  // Calculate width for each bar including gap
  // Using percentage for responsiveness
  const gapPercent = 2; 
  const totalGap = gapPercent * (data.length - 1);
  const barWidth = (100 - totalGap) / data.length;

  return (
    <div className={`w-full overflow-hidden ${className}`} style={{ height: `${height}px` }}>
      <svg 
        width="100%" 
        height="100%" 
        preserveAspectRatio="none"
        className="overflow-visible"
      >
         {data.map((val, i) => {
            const barHeightPercent = (val / max) * 100;
            // Ensure at least a small sliver is visible if value is 0
            const displayHeight = Math.max(barHeightPercent, 2); 
            const x = i * (barWidth + gapPercent);
            
            return (
                <g key={i} className="group/bar">
                    <rect 
                        x={`${x}%`} 
                        y={`${100 - displayHeight}%`} 
                        width={`${barWidth}%`} 
                        height={`${displayHeight}%`} 
                        fill={color} 
                        opacity={0.5}
                        rx={2}
                        className="transition-all duration-300 hover:opacity-100 cursor-help"
                    />
                    {/* Tooltip value on top of bar */}
                     <text 
                        x={`${x + barWidth/2}%`} 
                        y={`${100 - displayHeight - 5}%`} 
                        textAnchor="middle" 
                        fill="#fff" 
                        fontSize="10" 
                        fontWeight="bold"
                        className="opacity-0 group-hover/bar:opacity-100 transition-opacity select-none pointer-events-none"
                    >
                        {val}
                    </text>
                </g>
            );
         })}
      </svg>
    </div>
  );
};

export default TrendBarChart;
