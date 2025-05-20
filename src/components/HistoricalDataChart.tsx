
"use client";

import type { AirQualityReading } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, BarChart, Bar, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface HistoricalDataChartProps {
  data: AirQualityReading[];
  dataKey: keyof AirQualityReading;
  title: string;
  chartType?: 'line' | 'bar';
  color?: string; // e.g., "hsl(var(--chart-1))"
  unit?: string;
}

export function HistoricalDataChart({ data, dataKey, title, chartType = 'line', color = "hsl(var(--chart-1))", unit }: HistoricalDataChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="shadow-lg">
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
    // Keep full timestamp for tooltips, original data inspection
    fullTimestamp: format(parseISO(item.timestamp), 'MMM dd, yyyy HH:mm'), 
    // Formatted timestamp for primary display on X-axis (if not overridden by tickFormatter logic)
    timestamp: format(parseISO(item.timestamp), 'MMM dd, HH:mm'), 
    value: item[dataKey]
  }));
  
  const chartDisplayConfig: ChartConfig = {
    value: { // This 'value' matches the dataKey="value" in Line/Bar component
      label: unit ? `${String(dataKey)} (${unit})` : String(dataKey),
      color: color,
    },
  };

  const ChartComponent = chartType === 'line' ? LineChart : BarChart;
  const DataComponent = chartType === 'line' ? Line : Bar;

  return (
    <Card className="shadow-lg col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartDisplayConfig} className="h-[300px] w-full">
          <ChartComponent data={formattedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="timestamp" 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value: string) => {
                // value is expected to be in "MMM dd, HH:mm" format
                const parts = value.split(', ');
                if (parts.length === 2) {
                  return parts[1]; // Returns "HH:mm"
                }
                return value; // Fallback
              }}
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
                          indicator={chartType === 'line' ? 'dot' : 'rectangle'} 
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
              fill={color}
              strokeWidth={2}
              dot={{ r: 4, fill: color, stroke: "hsl(var(--background))", strokeWidth: 2 }}
              activeDot={{r: 6}}
              radius={chartType === 'bar' ? [4, 4, 0, 0] : undefined}
              name={chartDisplayConfig.value.label} // Ensure legend uses the correct label
            />
            <ChartLegend content={<ChartLegendContent />} />
          </ChartComponent>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
