import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { SystemTelemetry } from '../types';
import { Activity, Cpu, HardDrive } from 'lucide-react';

interface AdminEngineDashboardProps {
  telemetry?: SystemTelemetry;
}

export const AdminEngineDashboard: React.FC<AdminEngineDashboardProps> = ({ telemetry }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Keep history for D3 visualization
  const historyRef = useRef<{ time: number; heap: number; health: number }[]>([]);

  useEffect(() => {
    if (!svgRef.current) return;
    
    const now = Date.now();
    const heap = telemetry?.heapUsedMB || 45 + Math.random() * 5;
    const health = telemetry?.healthScore || 98;
    
    // Add to history
    historyRef.current.push({ time: now, heap, health });
    if (historyRef.current.length > 40) {
      historyRef.current.shift();
    }
    
    const data = historyRef.current;
    
    // Set up D3
    const width = svgRef.current.clientWidth;
    const height = 120;
    const margin = { top: 10, right: 10, bottom: 20, left: 30 };
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render
    
    const x = d3.scaleTime()
      .domain(d3.extent(data, (d: any) => d.time) as [number, number])
      .range([margin.left, width - margin.right]);
      
    const yHeap = d3.scaleLinear()
      .domain([0, Math.max(100, (d3.max(data, (d: any) => d.heap) as unknown as number) || 100)])
      .range([height - margin.bottom, margin.top]);

    // Draw Grid
    const yAxisGrid = d3.axisLeft(yHeap)
      .tickSize(-(width - margin.left - margin.right))
      .tickFormat(() => '')
      .ticks(4);
      
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .attr('class', 'text-[#d5c4a1] dark:text-[#504945]')
      .style('stroke-dasharray', '2,2')
      .style('opacity', 0.5)
      .call(yAxisGrid)
      .select(".domain").remove();

    // Line for Heap Usage
    const heapLine = d3.line<{ time: number; heap: number }>()
      .x(d => x(d.time))
      .y(d => yHeap(d.heap))
      .curve(d3.curveMonotoneX);
      
    // Area for Heap
    const heapArea = d3.area<{ time: number; heap: number }>()
      .x(d => x(d.time))
      .y0(height - margin.bottom)
      .y1(d => yHeap(d.heap))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('fill', 'url(#heap-gradient)')
      .attr('d', heapArea);

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#fabd2f') // yellow-500
      .attr('stroke-width', 2)
      .attr('d', heapLine);
      
    // Gradient definition
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'heap-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#fabd2f').attr('stop-opacity', 0.4);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#fabd2f').attr('stop-opacity', 0);

    // Axes
    const xAxis = d3.axisBottom(x).ticks(5).tickFormat(d => d3.timeFormat('%H:%M:%S')(d as Date));
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .attr('class', 'text-[9px] font-mono text-[#7c6f64] dark:text-[#a89984]')
      .call(xAxis)
      .select(".domain").remove();

    const yAxis = d3.axisLeft(yHeap).ticks(4);
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .attr('class', 'text-[9px] font-mono text-[#7c6f64] dark:text-[#a89984]')
      .call(yAxis)
      .select(".domain").remove();
      
  }, [telemetry]);

  return (
    <div className="p-3.5 rounded-lg bg-[#ebdbb2]/40 dark:bg-[#282828]/60 border border-[#d5c4a1] dark:border-[#3c3836]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold flex items-center gap-1.5 text-[#b57614] dark:text-[#fabd2f]">
          <Activity className="w-4 h-4" />
          <span>ENGINE LOAD & HEAP TELEMETRY</span>
        </h3>
        <div className="flex gap-4">
           <div className="flex items-center gap-1.5 text-[10px] font-bold">
              <HardDrive className="w-3 h-3 text-[#fabd2f]" />
              <span className="text-[#7c6f64] dark:text-[#a89984]">HEAP:</span>
              <span className="text-[#282828] dark:text-[#ebdbb2]">{telemetry?.heapUsedMB?.toFixed(1) || '45.2'} MB</span>
           </div>
           <div className="flex items-center gap-1.5 text-[10px] font-bold">
              <Cpu className="w-3 h-3 text-[#8ec07c]" />
              <span className="text-[#7c6f64] dark:text-[#a89984]">HEALTH:</span>
              <span className="text-[#282828] dark:text-[#ebdbb2]">{telemetry?.healthScore || 100}%</span>
           </div>
        </div>
      </div>
      
      <div className="w-full h-[120px] relative">
        <svg ref={svgRef} className="w-full h-full overflow-visible" />
      </div>
    </div>
  );
};
