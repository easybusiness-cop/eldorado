import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { BarChart3, RefreshCw, CheckCircle2, Clock, ShieldAlert, Sparkles } from 'lucide-react';
import { FleetTask, Agent } from '../../types';

export interface DepartmentTaskData {
  department: string;
  completed: number;
  pending: number;
  total: number;
}

interface DepartmentTaskBarChartProps {
  tasks?: FleetTask[];
  agents?: Agent[];
  title?: string;
  className?: string;
}

export const DepartmentTaskBarChart: React.FC<DepartmentTaskBarChartProps> = ({
  tasks,
  agents,
  title = "Department Task Breakdown (Completed vs. Pending)",
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    department: string;
    key: string;
    value: number;
    completionRate: string;
  } | null>(null);

  const [activeFilter, setActiveFilter] = useState<'all' | 'completed' | 'pending'>('all');

  // Generate fallback/mock departmental data if tasks array is empty or limited
  const processDepartmentData = (): DepartmentTaskData[] => {
    const deptMap: Record<string, { completed: number; pending: number }> = {
      'Engineering': { completed: 28, pending: 12 },
      'Security & Compliance': { completed: 19, pending: 5 },
      'Executive & Legal': { completed: 14, pending: 8 },
      'Operations & HR': { completed: 22, pending: 9 },
      'Sales & Finance': { completed: 16, pending: 11 },
      'AI Research': { completed: 31, pending: 14 },
    };

    if (tasks && tasks.length > 0) {
      // Clear baseline defaults if actual tasks are passed
      const liveDeptMap: Record<string, { completed: number; pending: number }> = {};

      tasks.forEach((task) => {
        let dept = 'General Operations';
        if (agents && task.assignedTo) {
          const matchedAgent = agents.find((a) => a.id === task.assignedTo);
          if (matchedAgent && matchedAgent.department) {
            dept = matchedAgent.department;
          }
        } else if ((task as any).department) {
          dept = (task as any).department;
        }

        if (!liveDeptMap[dept]) {
          liveDeptMap[dept] = { completed: 0, pending: 0 };
        }

        const status = (task.status || '').toLowerCase();
        if (status === 'completed' || status === 'done') {
          liveDeptMap[dept].completed += 1;
        } else {
          liveDeptMap[dept].pending += 1;
        }
      });

      if (Object.keys(liveDeptMap).length > 0) {
        return Object.entries(liveDeptMap).map(([dept, counts]) => ({
          department: dept,
          completed: counts.completed,
          pending: counts.pending,
          total: counts.completed + counts.pending,
        }));
      }
    }

    return Object.entries(deptMap).map(([dept, counts]) => ({
      department: dept,
      completed: counts.completed,
      pending: counts.pending,
      total: counts.completed + counts.pending,
    }));
  };

  const chartData = processDepartmentData();

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Clear previous SVG contents
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = containerRef.current.clientWidth || 600;
    const height = 320;
    const margin = { top: 30, right: 30, bottom: 65, left: 50 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const subgroups = ['completed', 'pending'];
    const groups = chartData.map((d) => d.department);

    // X axis scale for departments
    const x0 = d3
      .scaleBand()
      .domain(groups)
      .rangeRound([0, innerWidth])
      .paddingInner(0.25);

    // X axis scale for subgroups (completed vs pending)
    const x1 = d3
      .scaleBand()
      .domain(subgroups)
      .rangeRound([0, x0.bandwidth()])
      .padding(0.1);

    // Y axis scale
    const maxY = d3.max(chartData, (d) => Math.max(d.completed, d.pending)) || 35;
    const y = d3
      .scaleLinear()
      .domain([0, maxY * 1.15])
      .nice()
      .rangeRound([innerHeight, 0]);

    // Color palette (Gruvbox Green & Amber/Orange)
    const color = d3
      .scaleOrdinal<string>()
      .domain(subgroups)
      .range(['#b8bb26', '#fabd2f']); // Gruvbox Green, Gruvbox Yellow/Amber

    // Background Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(y)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#3c3836')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-opacity', 0.6);

    // Render Grouped Bars
    g.append('g')
      .selectAll('g')
      .data(chartData)
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${x0(d.department) || 0},0)`)
      .selectAll('rect')
      .data((d) =>
        subgroups.map((key) => ({
          key,
          value: d[key as 'completed' | 'pending'],
          department: d.department,
          total: d.total,
        }))
      )
      .enter()
      .append('rect')
      .attr('x', (d) => x1(d.key) || 0)
      .attr('y', innerHeight)
      .attr('width', x1.bandwidth())
      .attr('height', 0)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', (d) => color(d.key))
      .attr('opacity', (d) => {
        if (activeFilter === 'all') return 0.9;
        return activeFilter === d.key ? 1.0 : 0.2;
      })
      .attr('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr('opacity', 1)
          .attr('transform', 'scale(1.02)');

        const completionRate = d.total > 0 ? `${Math.round((d.value / d.total) * 100)}%` : '0%';
        const rectBox = event.currentTarget.getBoundingClientRect();
        const containerBox = containerRef.current?.getBoundingClientRect();

        if (containerBox) {
          setTooltip({
            visible: true,
            x: rectBox.left - containerBox.left + rectBox.width / 2,
            y: rectBox.top - containerBox.top - 10,
            department: d.department,
            key: d.key,
            value: d.value,
            completionRate,
          });
        }
      })
      .on('mouseout', (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr('opacity', activeFilter === 'all' || activeFilter === d.key ? 0.9 : 0.2)
          .attr('transform', 'scale(1)');

        setTooltip(null);
      })
      .transition()
      .duration(750)
      .ease(d3.easeCubicOut)
      .attr('y', (d) => y(d.value))
      .attr('height', (d) => innerHeight - y(d.value));

    // Value Labels on top of bars
    g.append('g')
      .selectAll('g')
      .data(chartData)
      .enter()
      .append('g')
      .attr('transform', (d) => `translate(${x0(d.department) || 0},0)`)
      .selectAll('text')
      .data((d) =>
        subgroups.map((key) => ({
          key,
          value: d[key as 'completed' | 'pending'],
        }))
      )
      .enter()
      .append('text')
      .attr('x', (d) => (x1(d.key) || 0) + x1.bandwidth() / 2)
      .attr('y', (d) => y(d.value) - 6)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fbf1c7')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .attr('opacity', 0)
      .text((d) => d.value)
      .transition()
      .delay(400)
      .duration(350)
      .attr('opacity', 1);

    // X Axis
    const xAxis = d3.axisBottom(x0);
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#a89984')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('transform', 'rotate(-15)')
      .style('text-anchor', 'end')
      .attr('dx', '-0.4em')
      .attr('dy', '0.6em');

    // Y Axis
    const yAxis = d3.axisLeft(y).ticks(5);
    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#a89984')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Axis Line Styling
    g.selectAll('.domain').attr('stroke', '#3c3836').attr('stroke-width', 1.5);
    g.selectAll('.tick line').attr('stroke', '#3c3836');

  }, [chartData, activeFilter]);

  const totalCompleted = chartData.reduce((acc, curr) => acc + curr.completed, 0);
  const totalPending = chartData.reduce((acc, curr) => acc + curr.pending, 0);
  const overallTotal = totalCompleted + totalPending;
  const overallCompletionRate = overallTotal > 0 ? Math.round((totalCompleted / overallTotal) * 100) : 0;

  return (
    <div className={`bg-[#1d2021] border border-[#3c3836] p-5 rounded-2xl shadow-xl space-y-4 font-sans text-[#ebdbb2] ${className}`}>
      
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3c3836] pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#b8bb26]/10 border border-[#b8bb26]/30 flex items-center justify-center text-[#b8bb26]">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#fbf1c7] flex items-center gap-2">
              {title}
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#fabd2f]/10 text-[#fabd2f] border border-[#fabd2f]/30">
                D3.js ENGINE
              </span>
            </h3>
            <p className="text-xs text-[#a89984] mt-0.5">
              Real-time departmental workload completion vs. pending task volume.
            </p>
          </div>
        </div>

        {/* Legend & Filter Controls */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-[#3c3836] text-[#fbf1c7] font-bold border border-[#504945]'
                : 'text-[#a89984] hover:text-[#ebdbb2]'
            }`}
          >
            All ({overallTotal})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('completed')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
              activeFilter === 'completed'
                ? 'bg-[#b8bb26] text-[#1d2021] font-bold shadow'
                : 'text-[#b8bb26] bg-[#b8bb26]/10 hover:bg-[#b8bb26]/20'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#b8bb26]"></span>
            Completed ({totalCompleted})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('pending')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all cursor-pointer ${
              activeFilter === 'pending'
                ? 'bg-[#fabd2f] text-[#1d2021] font-bold shadow'
                : 'text-[#fabd2f] bg-[#fabd2f]/10 hover:bg-[#fabd2f]/20'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#fabd2f]"></span>
            Pending ({totalPending})
          </button>
        </div>
      </div>

      {/* D3 Canvas Container */}
      <div ref={containerRef} className="relative w-full overflow-hidden bg-[#282828] p-2 rounded-xl border border-[#3c3836]">
        <svg ref={svgRef} className="w-full h-[320px] select-none" />

        {/* Interactive Hover Tooltip */}
        {tooltip && tooltip.visible && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full bg-[#1d2021] border border-[#fabd2f] p-2.5 rounded-lg shadow-2xl text-xs font-sans animate-fade-in"
            style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
          >
            <div className="font-bold text-[#fbf1c7]">{tooltip.department}</div>
            <div className="flex items-center gap-2 mt-1 font-mono text-[11px]">
              <span className={tooltip.key === 'completed' ? 'text-[#b8bb26] font-bold' : 'text-[#fabd2f] font-bold'}>
                {tooltip.key === 'completed' ? '✓ Completed' : '⏳ Pending'}: {tooltip.value} tasks
              </span>
            </div>
            <div className="text-[10px] text-[#83a598] font-mono mt-0.5">
              Department Health: {tooltip.completionRate} completed
            </div>
          </div>
        )}
      </div>

      {/* Aggregate Stats Summary Bar */}
      <div className="grid grid-cols-3 gap-3 text-center bg-[#282828] p-3 rounded-xl border border-[#3c3836]">
        <div>
          <div className="text-[10px] font-mono text-[#a89984] uppercase">Total Completed</div>
          <div className="text-lg font-black font-mono text-[#b8bb26] flex items-center justify-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> {totalCompleted}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-mono text-[#a89984] uppercase">Total Pending</div>
          <div className="text-lg font-black font-mono text-[#fabd2f] flex items-center justify-center gap-1">
            <Clock className="w-4 h-4" /> {totalPending}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-mono text-[#a89984] uppercase">Fleet Completion Rate</div>
          <div className="text-lg font-black font-mono text-[#83a598]">
            {overallCompletionRate}%
          </div>
        </div>
      </div>

    </div>
  );
};
