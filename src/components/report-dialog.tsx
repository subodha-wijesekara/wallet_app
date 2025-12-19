"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SimpleCalendar as Calendar } from "@/components/ui/simple-calendar";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Download, FileText, Loader2, CalendarIcon } from "lucide-react";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, setYear, setMonth } from "date-fns";
import { getTransactionsByDate } from "@/app/actions/transaction";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

export function ReportDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reportType, setReportType] = useState<"date" | "month" | "range">("date");

    // State for different modes
    // State for different modes
    const [date, setDate] = useState<Date | undefined>();
    const [range, setRange] = useState<DateRange | undefined>();

    // State for Month mode
    const [currentYear, setCurrentYear] = useState<number>(2024); // Default to avoid hydration mismatch, updated in effect
    const [selectedYear, setSelectedYear] = useState<string>("");
    const [selectedMonth, setSelectedMonth] = useState<string>("");

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setDate(new Date());
        setRange({
            from: new Date(),
            to: new Date(),
        });
        const d = new Date();
        setCurrentYear(d.getFullYear());
        setSelectedYear(d.getFullYear().toString());
        setSelectedMonth(d.getMonth().toString());
    }, []);

    if (!mounted) {
        return (
            <Button variant="outline" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Reports
            </Button>
        );
    }

    const handleDownload = async () => {
        setLoading(true);
        try {
            let startDate: Date;
            let endDate: Date;

            if (reportType === "date") {
                if (!date) return;
                startDate = startOfDay(date);
                endDate = endOfDay(date);
            } else if (reportType === "month") {
                // Construct date from selected year/month
                const d = new Date(parseInt(selectedYear), parseInt(selectedMonth));
                startDate = startOfMonth(d);
                endDate = endOfMonth(d);
            } else {
                if (!range?.from || !range?.to) return;
                startDate = startOfDay(range.from);
                endDate = endOfDay(range.to);
            }

            const transactions = await getTransactionsByDate(startDate, endDate);

            // Generate CSV
            const headers = ["Date", "Type", "Category", "Description", "Amount"];
            const csvContent = [
                headers.join(","),
                ...transactions.map((t: any) =>
                    [
                        format(new Date(t.date), "yyyy-MM-dd"),
                        t.type,
                        `"${t.category}"`, // Quote to handle commas
                        `"${t.description || ""}"`,
                        t.amount,
                    ].join(",")
                ),
            ].join("\n");

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);

            let filename = "report";
            if (reportType === "date") {
                filename = `report-${format(startDate, "yyyy-MM-dd")}`;
            } else if (reportType === "month") {
                filename = `report-${format(startDate, "MMM-yyyy")}`;
            } else {
                filename = `report-${format(startDate, "yyyy-MM-dd")}-to-${format(endDate, "yyyy-MM-dd")}`;
            }

            link.setAttribute("download", `${filename}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setOpen(false);
        } catch (error) {
            console.error("Failed to download report:", error);
        } finally {
            setLoading(false);
        }
    };

    const isDownloadDisabled = () => {
        if (loading) return true;
        if (reportType === "date") return !date;
        if (reportType === "range") return !range?.from || !range?.to;
        if (reportType === "month") return !selectedYear || !selectedMonth;
        return false;
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Reports
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Download Report</DialogTitle>
                    <DialogDescription>
                        Select a date range to download your transaction report in CSV format.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Report Type Selection */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">
                            Type
                        </Label>
                        <div className="col-span-3">
                            <Select
                                value={reportType}
                                onValueChange={(val: "date" | "month" | "range") =>
                                    setReportType(val)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date">Specific Date</SelectItem>
                                    <SelectItem value="month">Entire Month</SelectItem>
                                    <SelectItem value="range">Date Range</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Specific Date Mode */}
                    {reportType === "date" && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Date</Label>
                            <div className="col-span-3">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    )}

                    {/* Date Range Mode */}
                    {reportType === "range" && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Range</Label>
                            <div className="col-span-3">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="date"
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !range && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {range?.from ? (
                                                range.to ? (
                                                    <>
                                                        {format(range.from, "LLL dd, y")} -{" "}
                                                        {format(range.to, "LLL dd, y")}
                                                    </>
                                                ) : (
                                                    format(range.from, "LLL dd, y")
                                                )
                                            ) : (
                                                <span>Pick a date range</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={date?.from}
                                            selected={range}
                                            onSelect={setRange}
                                            numberOfMonths={2}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    )}

                    {/* Month Mode */}
                    {reportType === "month" && (
                        <>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Year</Label>
                                <div className="col-span-3">
                                    <Select
                                        value={selectedYear}
                                        onValueChange={setSelectedYear}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 10 }, (_, i) => currentYear - i).map(
                                                (year) => (
                                                    <SelectItem key={year} value={year.toString()}>
                                                        {year}
                                                    </SelectItem>
                                                )
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Month</Label>
                                <div className="col-span-3">
                                    <Select
                                        value={selectedMonth}
                                        onValueChange={setSelectedMonth}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 12 }, (_, i) => i).map((monthIndex) => (
                                                <SelectItem key={monthIndex} value={monthIndex.toString()}>
                                                    {format(new Date(2000, monthIndex, 1), "MMMM")}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={handleDownload} disabled={isDownloadDisabled()}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Download className="mr-2 h-4 w-4" />
                        Download CSV
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
