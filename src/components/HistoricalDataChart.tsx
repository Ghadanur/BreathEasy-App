
"use client";

import type { AirQualityReading } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, BarChart, Bar, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Maximize2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface HistoricalDataChartProps {
  data: AirQualityReading[];
  dataKey: keyof AirQualityReading;
  title: string;
  chartType?: 'line' | 'bar';
  color?: string; // e.g., "hsl(var(--chart-1))"
  unit?: string;
}

export function HistoricalDataChart({ data, dataKey, title, chartType = 'line', color = "hsl(var(--chart-1))", unit }: HistoricalDataChartProps) {
  const isMobile = useIsMobile();

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
    fullTimestamp: format(parseISO(item.timestamp), 'MMM dd, yyyy HH:mm'), 
    timestamp: format(parseISO(item.timestamp), 'HH:mm'), 
    value: item[dataKey]
  }));
  
  const chartDisplayConfig: ChartConfig = {
    value: { 
      label: unit ? `${String(dataKey)} (${unit})` : String(dataKey),
      color: color,
    },
  };

  const ChartComponent = chartType === 'line' ? LineChart : BarChart;
  const DataComponent = chartType === 'line' ? Line : Bar;

  const renderChart = (isModal: boolean = false) => (
    <ChartContainer config={chartDisplayConfig} className={cn("w-full", isModal ? "h-[70vh]" : "h-[300px]")}>
      <ChartComponent data={formattedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="timestamp" 
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          // Show fewer ticks in modal view to "expand" the line segments
          interval={isModal && formattedData.length > 10 ? Math.max(1, Math.floor(formattedData.length / 6)) : 'preserveStartEnd'}
          tickFormatter={(value: string) => value} // Already formatted to HH:mm
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
                        return _label; // Fallback to the already formatted HH:mm timestamp if fullTimestamp isn't there
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
          name={chartDisplayConfig.value.label} 
        />
        <ChartLegend content={<ChartLegendContent />} />
      </ChartComponent>
    </ChartContainer>
  );

  return (
    <Card className="shadow-lg col-span-1 md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {isMobile && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Maximize2 className="h-5 w-5" />
                <span className="sr-only">Expand chart</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[90vw] h-[85vh] flex flex-col p-4">
              <DialogHeader className="pb-2">
                <DialogTitle>{title}</DialogTitle>
              </DialogHeader>
              <div className="flex-grow">
                {renderChart(true)}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {renderChart(false)}
      </CardContent>
    </Card>
  );
}

