import { CalendarDays, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";

interface DateSelectorProps {
  onDateChange: (date: string) => void;
  activeDate: string;
}

interface AttendanceStats {
  total_guests: number;
  checked_in: number;
  date: string;
}

const DateSelector = ({ onDateChange, activeDate }: DateSelectorProps) => {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Parse the active date without timezone conversion
  const selectedDate = activeDate ? new Date(activeDate + 'T00:00:00') : undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatToYYYYMMDD = (date: Date) => {
    return format(date, 'yyyy-MM-dd');
  };

  const displayDate = selectedDate ? format(selectedDate, 'MMMM d, yyyy') : '';

  const fetchAttendanceStats = async () => {
    if (!selectedDate) return;
    
    setLoading(true);
    try {
      const formattedDate = formatToYYYYMMDD(selectedDate);
      console.log('Fetching stats for date:', formattedDate);
      
      const response = await fetch(`https://verifai-199983032721.northamerica-northeast2.run.app/attendance/${formattedDate}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch attendance stats: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Received stats:', data);
      setStats(data);
      
      toast({
        title: "Statistics Loaded",
        description: `Showing attendance for ${format(selectedDate, 'MMMM d, yyyy')}`,
      });
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load attendance statistics. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h2 className="text-lg font-medium mb-3">Select Date</h2>
      <div className="space-y-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`w-full justify-start text-left font-normal ${!selectedDate ? 'text-muted-foreground' : ''}`}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {selectedDate ? (
                <>
                  <span className="mr-2">{displayDate}</span>
                  <span className="text-muted-foreground">({formatToYYYYMMDD(selectedDate)})</span>
                </>
              ) : (
                "Pick a date"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  // Set time to midnight to avoid timezone issues
                  date.setHours(0, 0, 0, 0);
                  // Format date as YYYY-MM-DD
                  onDateChange(formatToYYYYMMDD(date));
                  // Reset stats when date changes
                  setStats(null);
                }
              }}
              disabled={(date) => {
                const oneYearAgo = new Date(today);
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                return date > today || date < oneYearAgo;
              }}
              initialFocus
              fromDate={new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())}
              toDate={today}
            />
          </PopoverContent>
        </Popover>

        {selectedDate && (
          <Button 
            variant="secondary" 
            className="w-full" 
            onClick={fetchAttendanceStats}
            disabled={loading}
          >
            <Users className="mr-2 h-4 w-4" />
            {loading ? 'Loading...' : 'View Attendance Stats'}
          </Button>
        )}

        {stats && (
          <Card className="p-4">
            <h3 className="font-medium mb-2">Attendance Statistics</h3>
            <p className="text-sm text-muted-foreground">
              {stats.checked_in} out of {stats.total_guests} guests checked in
            </p>
            <div className="mt-2 w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-500"
                style={{ 
                  width: `${stats.total_guests > 0 ? (stats.checked_in / stats.total_guests * 100) : 0}%` 
                }}
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DateSelector;
