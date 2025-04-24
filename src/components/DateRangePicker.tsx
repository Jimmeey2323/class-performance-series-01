
import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (date?: DateRange) => void;
  align?: "start" | "center" | "end";
  showPresets?: boolean;
}

export function DateRangePicker({
  value,
  onChange,
  align = "start",
  showPresets = true,
}: DateRangePickerProps) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    value
  );
  
  // Update internal state when prop changes
  React.useEffect(() => {
    setDateRange(value);
  }, [value]);

  // Function to handle range selection and propagate changes
  const handleDateSelect = (range?: DateRange) => {
    setDateRange(range);
    if (onChange) {
      onChange(range);
    }
  };

  // Function to handle preset selection
  const handleSelectPreset = (preset: string) => {
    const today = new Date();
    let from: Date | undefined;
    let to: Date | undefined;
    
    switch (preset) {
      case "today":
        from = today;
        to = today;
        break;
      case "yesterday": {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        from = yesterday;
        to = yesterday;
        break;
      }
      case "week": {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        from = startOfWeek;
        to = today;
        break;
      }
      case "month": {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        from = startOfMonth;
        to = today;
        break;
      }
      case "quarter": {
        const currentMonth = today.getMonth();
        const startMonth = Math.floor(currentMonth / 3) * 3;
        const startOfQuarter = new Date(today.getFullYear(), startMonth, 1);
        from = startOfQuarter;
        to = today;
        break;
      }
      case "year": {
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        from = startOfYear;
        to = today;
        break;
      }
      case "last-month": {
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        from = lastMonth;
        to = endOfLastMonth;
        break;
      }
      case "last-quarter": {
        const currentMonth = today.getMonth();
        const startLastQuarterMonth = Math.floor((currentMonth - 3) / 3) * 3;
        const startOfLastQuarter = new Date(today.getFullYear(), startLastQuarterMonth, 1);
        const endOfLastQuarter = new Date(today.getFullYear(), startLastQuarterMonth + 3, 0);
        from = startOfLastQuarter;
        to = endOfLastQuarter;
        break;
      }
      case "last-year": {
        const lastYear = today.getFullYear() - 1;
        const startOfLastYear = new Date(lastYear, 0, 1);
        const endOfLastYear = new Date(lastYear, 11, 31);
        from = startOfLastYear;
        to = endOfLastYear;
        break;
      }
      case "clear":
        from = undefined;
        to = undefined;
        break;
      default:
        return;
    }

    handleDateSelect({ from, to });
  };

  const formatDate = (date?: Date) => {
    return date ? format(date, "PPP") : "";
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateRange?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
                </>
              ) : (
                formatDate(dateRange.from)
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          {showPresets && (
            <Select
              onValueChange={handleSelectPreset}
              defaultValue="none"
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a preset" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-quarter">Last Quarter</SelectItem>
                <SelectItem value="last-year">Last Year</SelectItem>
                <SelectItem value="clear">Clear Selection</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateSelect}
            numberOfMonths={2}
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
