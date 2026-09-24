import { CalendarDays, ChevronDownIcon } from 'lucide-react'
import { Button } from '../ui/button'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

interface DateFieldProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  disabled?: boolean
  placeholder?: string
  iconOnly?: boolean
  id?: string
  'aria-invalid'?: boolean
}

function DateField({
  value,
  onChange,
  disabled,
  placeholder = 'Pick a date',
  iconOnly = false,
  id,
  ...rest
}: DateFieldProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant={iconOnly ? 'ghost' : 'outline'}
          size={iconOnly ? 'icon-sm' : 'default'}
          aria-label={
            iconOnly
              ? value
                ? `Change date: ${value.toLocaleDateString()}`
                : placeholder
              : undefined
          }
          title={
            iconOnly
              ? value
                ? value.toLocaleDateString()
                : placeholder
              : undefined
          }
          disabled={disabled}
          data-empty={!value}
          className={
            iconOnly
              ? 'shrink-0 data-[empty=true]:text-muted-foreground'
              : 'w-full justify-between text-left font-normal data-[empty=true]:text-muted-foreground'
          }
          {...rest}
        >
          {iconOnly ? (
            <CalendarDays className="size-4" />
          ) : (
            <>
              {value ? (
                value.toLocaleDateString(undefined, { dateStyle: 'long' })
              ) : (
                <span>{placeholder}</span>
              )}
              <ChevronDownIcon className="size-4 opacity-50" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={disabled}
          // initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export default DateField
