"use client";

import * as React from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    addMonths,
    subMonths,
    isWithinInterval
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DateRange } from "react-day-picker";

interface SimpleCalendarProps {
    mode?: "single" | "range";
    selected?: Date | DateRange | undefined;
    onSelect?: (date: any) => void;
    className?: string;
}

export function SimpleCalendar({
    mode = "single",
    selected,
    onSelect,
    className
}: SimpleCalendarProps) {
    // Initialize current month based on selected date or today
    const initialMonth = React.useMemo(() => {
        if (mode === "single" && selected instanceof Date) return selected;
        if (mode === "range" && (selected as DateRange)?.from) return (selected as DateRange).from!;
        return new Date();
    }, []);

    const [currentMonth, setCurrentMonth] = React.useState<Date>(initialMonth);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    // Generate calendar grid
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const handleDateClick = (day: Date) => {
        if (!onSelect) return;

        if (mode === "single") {
            onSelect(day);
        } else {
            // Range logic handled by parent usually, but here we just pass the day?
            // If parent expects DateRange, this component might need internal state or smarter logic.
            // For now, let's assume the parent handles the range logic if we pass the clicked date?
            // Standard DayPicker 'onSelect' for range expects a DateRange object or undefined.
            // But usually range pickers handle 'click' by checking if start exists.

            // SIMPLIFICATION: If mode is range, we assume 'onSelect' expects a DateRange update.
            // But recreating internal logic of DayPicker is complex.
            // Let's rely on the parent logic: parent passes `onSelect(range)`.
            // Wait, standard usage is `onSelect={setRange}`.
            // We need to implement the range selection logic here if we are replacing DayPicker.

            const currentRange = selected as DateRange | undefined;
            if (!currentRange?.from || (currentRange.from && currentRange.to)) {
                onSelect({ from: day, to: undefined });
            } else {
                // If clicked before from, swap
                if (day < currentRange.from) {
                    onSelect({ from: day, to: currentRange.from });
                } else {
                    onSelect({ from: currentRange.from, to: day });
                }
            }
        }
    };

    const isDaySelected = (day: Date) => {
        if (mode === "single") {
            return selected instanceof Date && isSameDay(day, selected);
        } else {
            const range = selected as DateRange | undefined;
            if (!range?.from) return false;
            if (range.to) {
                return isWithinInterval(day, { start: range.from, end: range.to });
            }
            return isSameDay(day, range.from);
        }
    };

    // Helper for visual styling of range ends
    const isRangeStart = (day: Date) => {
        if (mode !== "range") return false;
        const range = selected as DateRange | undefined;
        return range?.from && isSameDay(day, range.from);
    }

    const isRangeEnd = (day: Date) => {
        if (mode !== "range") return false;
        const range = selected as DateRange | undefined;
        return range?.to && isSameDay(day, range.to);
    }

    return (
        <div className={cn("p-3 w-[300px]", className)}>
            <div className="flex items-center justify-between space-y-0 pb-4">
                <div className="text-sm font-semibold ml-2">
                    {format(currentMonth, "MMMM yyyy")}
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 mb-2">
                {weekDays.map((day) => (
                    <div key={day} className="h-8 flex items-center justify-center text-[0.8rem] font-medium text-muted-foreground">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, dayIdx) => {
                    const isSelected = isDaySelected(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isTodayDate = isToday(day);

                    // Range styling nuances
                    const isStart = isRangeStart(day);
                    const isEnd = isRangeEnd(day);
                    const isRangeMiddle = mode === "range" && isSelected && !isStart && !isEnd;

                    return (
                        <button
                            key={day.toString()}
                            onClick={() => handleDateClick(day)}
                            className={cn(
                                "h-9 w-9 p-0 font-normal text-sm flex items-center justify-center rounded-md transition-all relative z-10",
                                !isCurrentMonth && "text-muted-foreground/30 opacity-50",
                                isCurrentMonth && "text-foreground",
                                isTodayDate && !isSelected && "bg-accent text-accent-foreground",
                                isSelected && mode === "single" && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                // Range Styles
                                isStart && "bg-primary text-primary-foreground rounded-r-none",
                                isEnd && "bg-primary text-primary-foreground rounded-l-none",
                                isRangeMiddle && "bg-accent/50 text-accent-foreground rounded-none",
                                (isStart && isEnd) && "rounded-md" // Single day range
                            )}
                        >
                            {format(day, "d")}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
