
import { useState, useEffect } from 'react';
import { CalendarDays } from 'lucide-react';
import databaseManager from '../lib/database';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';

interface DateSelectorProps {
  onDateChange: (date: string) => void;
  activeDate: string;
}

const DateSelector = ({ onDateChange, activeDate }: DateSelectorProps) => {
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  useEffect(() => {
    updateAvailableDates();
  }, []);

  const updateAvailableDates = () => {
    const dates = databaseManager.getDates();
    setAvailableDates(dates);
  };

  const handleDateChange = (date: string) => {
    onDateChange(date);
    const entriesCount = databaseManager.getData(date).length;
    toast.info(`Selected database for ${date}`, {
      description: `${entriesCount} entries available for verification`
    });
  };

  if (availableDates.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm mb-6">
        <div className="text-center text-gray-500">
          <CalendarDays className="mx-auto mb-2 opacity-50" />
          <p>No data available</p>
          <p className="text-sm">Upload CSV data first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm mb-6">
      <h2 className="text-lg font-medium mb-3">Select Database Date</h2>
      <Select
        value={activeDate || availableDates[0]}
        onValueChange={handleDateChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select date" />
        </SelectTrigger>
        <SelectContent position="popper">
          {availableDates.map(date => (
            <SelectItem key={date} value={date}>
              {date}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default DateSelector;
