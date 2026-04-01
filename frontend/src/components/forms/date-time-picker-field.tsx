"use client";

import { forwardRef, useId } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { ptBR } from "date-fns/locale";

registerLocale("pt-BR", ptBR);

type DateTimePickerFieldProps = {
  label: string;
  value: Date | null;
  onChange: (value: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
};

type DateTimeInputProps = {
  value?: string;
  onClick?: () => void;
  placeholder?: string;
};

const DateTimeInput = forwardRef<HTMLButtonElement, DateTimeInputProps>(function DateTimeInput(
  { value, onClick, placeholder },
  ref
) {
  return (
    <button className="date-time-picker__trigger" onClick={onClick} ref={ref} type="button">
      <span className={value ? "date-time-picker__value" : "date-time-picker__value date-time-picker__value--placeholder"}>
        {value || placeholder}
      </span>
      <span aria-hidden="true" className="date-time-picker__icon">
        <svg fill="none" height="18" viewBox="0 0 24 24" width="18">
          <path
            d="M8 2v3M16 2v3M3.5 9.5h17M6 5.5h12A2.5 2.5 0 0 1 20.5 8v10A2.5 2.5 0 0 1 18 20.5H6A2.5 2.5 0 0 1 3.5 18V8A2.5 2.5 0 0 1 6 5.5Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </svg>
      </span>
    </button>
  );
});

export function DateTimePickerField({
  label,
  value,
  onChange,
  placeholder = "dd/mm/aaaa --:--",
  minDate
}: DateTimePickerFieldProps) {
  const inputId = useId();

  return (
    <label className="field">
      <span>{label}</span>
      <div className="date-time-picker">
        <DatePicker
          calendarClassName="date-time-picker__calendar"
          customInput={<DateTimeInput placeholder={placeholder} />}
          dateFormat="dd/MM/yyyy HH:mm"
          id={inputId}
          locale="pt-BR"
          minDate={minDate}
          onChange={(nextValue: Date | null) => {
            onChange(nextValue instanceof Date ? nextValue : null);
          }}
          placeholderText={placeholder}
          popperClassName="date-time-picker__popper"
          selected={value}
          showPopperArrow={false}
          showTimeSelect
          timeCaption="Hora"
          timeFormat="HH:mm"
          timeIntervals={15}
        />
      </div>
    </label>
  );
}
