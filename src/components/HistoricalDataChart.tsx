
"use client";

import type { AirQualityReading } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'; 
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface HistoricalDataChartProps {
  data: AirQualityReading[];
  dataKey: keyof AirQualityReading;
  title: string;
  color?: string; 
  unit?: string;
}

export function HistoricalDataChart({ data, dataKey, title, color = "hsl(var(--chart-1))", unit }: HistoricalDataChartProps) {

  if (!data || data.length === 0) {
    return (
      <Card className="shadow-lg overflow-hidden">
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
    value: item[dataKey] ?? 0 
  }));
  
  const chartDisplayConfig: ChartConfig = {
    value: { 
      label: unit ? `${String(dataKey)} (${unit})` : String(dataKey),
      color: color,
    },
  };

  const ChartComponent = LineChart; 
  const DataComponent = Line;

  const renderChart = (isModal: boolean = false) => (
    <ChartContainer 
      config={chartDisplayConfig} 
      className={cn(
        "w-full", 
        isModal ? "h-[70vh]" : "aspect-[16/7]" // Adjusted aspect ratio for non-modal chart
      )}
    >
      <ChartComponent data={formattedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="timestamp" 
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={isModal && formattedData.length > 10 ? Math.max(1, Math.floor(formattedData.length / 10)) : 'preserveStartEnd'} 
          tickFormatter={(value: string) => value} 
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
          fill={color} 
          strokeWidth={2}
          dot={{ r: isModal ? 3 : 2, fill: color, stroke: "hsl(var(--background))", strokeWidth: 1 }} 
          activeDot={{r: isModal ? 5 : 4}} 
          name={chartDisplayConfig.value.label} 
        />
        <ChartLegend content={<ChartLegendContent />} />
      </ChartComponent>
    </ChartContainer>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
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
        <div className="flex-grow overflow-hidden">
          {renderChart(true)}
        </div>
      </DialogContent>
    </Dialog>
  );
}
