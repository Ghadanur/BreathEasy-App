
"use client";

import type { AirQualityReading } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'; // ResponsiveContainer removed as ChartContainer handles it
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface HistoricalDataChartProps {
  data: AirQualityReading[];
  dataKey: keyof AirQualityReading;
  title: string;
  // chartType is no longer used, defaults to line chart
  color?: string; // e.g., "hsl(var(--chart-1))"
  unit?: string;
}

export function HistoricalDataChart({ data, dataKey, title, color = "hsl(var(--chart-1))", unit }: HistoricalDataChartProps) {

  if (!data || data.length === 0) {
    return (
      <Card className="shadow-lg overflow-hidden"> {/* Added overflow-hidden here */}
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No historical data available.</p>
        </CardContent>
      </Card>
    );
  }

  const formattedData = data.map(item => ({
    ...item,
    fullTimestamp: item.timestamp ? format(parseISO(item.timestamp), 'MMM dd, yyyy HH:mm') : 'N/A', 
    timestamp: item.timestamp ? format(parseISO(item.timestamp), 'HH:mm') : 'N/A', 
    value: item[dataKey] ?? 0 // Ensure value is not undefined for the chart
  }));
  
  const chartDisplayConfig: ChartConfig = {
    value: { 
      label: unit ? `${String(dataKey)} (${unit})` : String(dataKey),
      color: color,
    },
  };

  const ChartComponent = LineChart; // Always LineChart now
  const DataComponent = Line;

  const renderChart = (isModal: boolean = false) => (
    <ChartContainer config={chartDisplayConfig} className={cn("w-full", isModal ? "h-[70vh]" : "h-[300px]")}>
      <ChartComponent data={formattedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="timestamp" 
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={isModal && formattedData.length > 10 ? Math.max(1, Math.floor(formattedData.length / 10)) : 'preserveStartEnd'} // Adjusted interval for better readability
          tickFormatter={(value: string) => value} // Already 'HH:mm'
        />
        <YAxis 
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          domain={['auto', 'auto']}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent 
                      indicator={'dot'} 
                      labelFormatter={(_label, payload) => {
                        if (payload && payload.length > 0 && payload[0].payload.fullTimestamp) {
                          return payload[0].payload.fullTimestamp;
                        }
                        return _label;
                      }}
                   />}
        />
        <DataComponent
          dataKey="value"
          type="monotone"
          stroke={color}
          fill={color} // Fill is relevant for Area chart, but harmless for Line
          strokeWidth={2}
          dot={{ r: isModal ? 3 : 2, fill: color, stroke: "hsl(var(--background))", strokeWidth: 1 }} // Smaller dots for card view
          activeDot={{r: isModal ? 5 : 4}} // Slightly larger active dots
          name={chartDisplayConfig.value.label} 
        />
        <ChartLegend content={<ChartLegendContent />} />
      </ChartComponent>
    </ChartContainer>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {/* Added overflow-hidden to the main card trigger */}
        <Card className="shadow-lg col-span-1 md:col-span-2 hover:shadow-xl transition-shadow duration-300 cursor-pointer overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            {renderChart(false)}
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[90vw] h-[85vh] flex flex-col p-4">
        <DialogHeader className="pb-2">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-hidden"> {/* Added overflow-hidden to ensure chart stays within bounds */}
          {renderChart(true)}
        </div>
      </DialogContent>
    </Dialog>
  );
}
