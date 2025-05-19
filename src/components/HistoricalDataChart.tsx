"use client";

import type { AirQualityReading } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
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

const chartConfig = {
  value: {
    label: "Value",
  },
} satisfies import("@/components/ui/chart").ChartConfig;


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
    timestamp: format(parseISO(item.timestamp), 'MMM dd, HH:mm'),
    value: item[dataKey]
  }));
  
  chartConfig.value.label = unit ? `${dataKey} (${unit})` : dataKey.toString();
  const dynamicChartConfig = { ...chartConfig, value: { ...chartConfig.value, color } };


  const ChartComponent = chartType === 'line' ? LineChart : BarChart;
  const DataComponent = chartType === 'line' ? Line : Bar;

  return (
    <Card className="shadow-lg col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={dynamicChartConfig} className="h-[300px] w-full">
          <ChartComponent data={formattedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="timestamp" 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0,6)} // Shorten timestamp display
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={['auto', 'auto']}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator={chartType === 'line' ? 'dot' : 'rectangle'} />}
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
            />
            <ChartLegend content={<ChartLegendContent />} />
          </ChartComponent>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
