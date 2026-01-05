
import React from 'react';
import { RadarData } from '../types';

interface RadarChartProps {
  data: RadarData[];
}

const RadarChart: React.FC<RadarChartProps> = ({ data }) => {
  const size = 400;
  const center = size / 2;
  const radius = size * 0.35;
  const axes = [
    { key: 'safety', label: 'Sécurité Passive' },
    { key: 'performance', label: 'Performance / Plané' },
    { key: 'handling', label: 'Maniabilité' },
    { key: 'accessibility', label: 'Accessibilité' },
    { key: 'speed', label: 'Vitesse / Pénétration' },
  ];

  const angleStep = (Math.PI * 2) / axes.length;

  const getCoordinates = (index: number, value: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (radius * value) / 10;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const colors = ['#ea580c', '#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-white/5 flex flex-col items-center">
      <h3 className="text-white font-black text-xl mb-8 flex items-center gap-3">
        <i className="fas fa-chart-radar text-orange-500"></i>
        Comparatif des Performances IA
      </h3>
      
      <svg width={size} height={size} className="overflow-visible">
        {/* Cercles de fond */}
        {[2, 4, 6, 8, 10].map((v) => (
          <circle
            key={v}
            cx={center}
            cy={center}
            r={(radius * v) / 10}
            fill="none"
            stroke="#1e293b"
            strokeWidth="1"
          />
        ))}

        {/* Axes */}
        {axes.map((axis, i) => {
          const point = getCoordinates(i, 10);
          const labelPoint = getCoordinates(i, 11.5);
          return (
            <g key={axis.key}>
              <line
                x1={center}
                y1={center}
                x2={point.x}
                y2={point.y}
                stroke="#1e293b"
                strokeWidth="1"
              />
              <text
                x={labelPoint.x}
                y={labelPoint.y}
                fill="#94a3b8"
                fontSize="10"
                fontWeight="900"
                textAnchor="middle"
                className="uppercase tracking-tighter"
              >
                {axis.label}
              </text>
            </g>
          );
        })}

        {/* Polygones de données */}
        {data.map((wing, wingIdx) => {
          const points = axes.map((axis, i) => {
            const val = (wing.metrics as any)[axis.key] || 0;
            const p = getCoordinates(i, val);
            return `${p.x},${p.y}`;
          }).join(' ');

          return (
            <g key={wing.label} className="group cursor-help">
              <polygon
                points={points}
                fill={colors[wingIdx % colors.length]}
                fillOpacity="0.2"
                stroke={colors[wingIdx % colors.length]}
                strokeWidth="3"
                className="transition-all hover:fill-opacity-40"
              />
              {axes.map((axis, i) => {
                const val = (wing.metrics as any)[axis.key] || 0;
                const p = getCoordinates(i, val);
                return (
                  <circle
                    key={`${wing.label}-${axis.key}`}
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill={colors[wingIdx % colors.length]}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>

      <div className="mt-8 flex flex-wrap justify-center gap-6">
        {data.map((wing, i) => (
          <div key={wing.label} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colors[i % colors.length] }}></div>
            <span className="text-white text-xs font-black uppercase tracking-wider">{wing.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RadarChart;
