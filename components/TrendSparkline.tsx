import React from 'react';

interface TrendSparklineProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

const TrendSparkline: React.FC<TrendSparklineProps> = ({ 
  data, 
  color = '#ef4444', 
  height = 50,
  className = '' 
}) => {
  if (!data || data.length < 2) return null;

  const width = 100; // viewbox width percentage-like
  const max = Math.max(...data, 100);
  const min = 0;
  const range = max - min;

  // Generate path points
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  // Area close path
  const areaPoints = `${points} ${width},${height} 0,${height}`;

  return (
    <div className={`w-full overflow-hidden ${className}`} style={{ height: `${height}px` }}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`} 
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Area Fill */}
        <polygon points={areaPoints} fill={`url(#gradient-${color})`} />
        
        {/* Line */}
        <polyline 
          points={points} 
          fill="none" 
          stroke={color} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
    </div>
  );
};

export default TrendSparkline;
