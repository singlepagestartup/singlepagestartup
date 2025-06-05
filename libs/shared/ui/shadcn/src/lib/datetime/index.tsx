"use client";

import * as React from "react";
import { cn } from "@sps/shared-frontend-client-utils";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

import { Button } from "../button";
import { Calendar } from "../calendar";
import { Input } from "../input";

interface IDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DateTimePicker(props: IDateTimePickerProps) {
  const { value, onChange, placeholder, className } = props;
  const [date, setDate] = React.useState<Date | undefined>(
    value && value !== "" ? new Date(value) : undefined,
  );
  const [inputValue, setInputValue] = React.useState<string>(
    value && value !== "" && dayjs(value).isValid()
      ? dayjs(value).format("DD.MM.YYYY HH:mm")
      : "",
  );

  React.useEffect(() => {
    if (!value) return;
    setDate(new Date(value));
    if (dayjs(value).isValid()) {
      setInputValue(dayjs(value).format("DD.MM.YYYY HH:mm"));
    }
  }, [value]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      if (date) {
        newDate.setHours(date.getHours());
        newDate.setMinutes(date.getMinutes());
      }
      setDate(newDate);
      setInputValue(dayjs(newDate).format("DD.MM.YYYY HH:mm"));
      onChange(dayjs(newDate).toISOString());
    }
  };

  const handleTimeChange = (type: "hour" | "minute", valueStr: string) => {
    if (date) {
      const newDate = new Date(date);
      if (type === "hour") {
        newDate.setHours(parseInt(valueStr));
      } else if (type === "minute") {
        newDate.setMinutes(parseInt(valueStr));
      }
      setDate(newDate);
      setInputValue(dayjs(newDate).format("DD.MM.YYYY HH:mm"));
      onChange(dayjs(newDate).toISOString());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const parsed = dayjs(val, "DD.MM.YYYY HH:mm", true);
    if (parsed.isValid()) {
      setDate(parsed.toDate());
      onChange(parsed.toISOString());
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border border-input rounded-md p-2",
        className,
      )}
    >
      <Input
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder || "ДД.ММ.ГГГГ ЧЧ:мм"}
        type="text"
        className="mb-2"
      />
      <div className="w-full flex gap-2">
        <div className="w-1/3 px-2">
          <Calendar mode="single" selected={date} onSelect={handleDateSelect} />
        </div>
        <div className="w-1/3 p-2 flex flex-col gap-2">
          <p className="text-sm font-medium">Hours</p>
          <div className="grid grid-cols-4 gap-2">
            {hours.map((hour) => (
              <Button
                key={hour}
                variant={date && date.getHours() === hour ? "default" : "ghost"}
                className="w-full h-full border border-input"
                onClick={() => handleTimeChange("hour", hour.toString())}
              >
                {hour.toString().padStart(2, "0")}
              </Button>
            ))}
          </div>
        </div>
        <div className="w-1/3 p-2 flex flex-col gap-2">
          <p className="text-sm font-medium">Minutes</p>
          <div className="grid grid-cols-4 gap-2">
            {minutes.map((minute) => (
              <Button
                key={minute}
                variant={
                  date && date.getMinutes() === minute ? "default" : "ghost"
                }
                className="w-full h-full border border-input"
                onClick={() => handleTimeChange("minute", minute.toString())}
              >
                {minute.toString().padStart(2, "0")}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
