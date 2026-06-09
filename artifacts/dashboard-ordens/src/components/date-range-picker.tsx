
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DateRange {
  start: Date | null
  end: Date | null
}

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange) => void
  label?: string
  placeholder?: string
}

export function DateRangePicker({
  value = { start: null, end: null },
  onChange,
  label = 'Período',
  placeholder = 'Selecione o período',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [tempRange, setTempRange] = useState<DateRange>(value)

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)

    if (!tempRange.start) {
      // Primeiro clique: definir data inicial
      setTempRange({ start: selectedDate, end: null })
    } else if (!tempRange.end) {
      // Segundo clique: definir data final
      if (selectedDate < tempRange.start) {
        // Se data final for menor que inicial, trocar
        setTempRange({ start: selectedDate, end: tempRange.start })
      } else {
        setTempRange({ ...tempRange, end: selectedDate })
      }
    } else {
      // Terceiro clique: reiniciar seleção
      setTempRange({ start: selectedDate, end: null })
    }
  }

  const handleConfirm = () => {
    if (tempRange.start && tempRange.end) {
      onChange?.(tempRange)
      setIsOpen(false)
    }
  }

  const handleClear = () => {
    setTempRange({ start: null, end: null })
    onChange?.({ start: null, end: null })
    setIsOpen(false)
  }

  const formatDateDisplay = () => {
    if (!value.start || !value.end) return placeholder

    const start = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(value.start)

    const end = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(value.end)

    return `${start} até ${end}`
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const isDateInRange = (day: number): boolean => {
    if (!tempRange.start || !tempRange.end) return false
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return date >= tempRange.start && date <= tempRange.end
  }

  const isDateStart = (day: number): boolean => {
    if (!tempRange.start) return false
    return (
      day === tempRange.start.getDate() &&
      currentMonth.getMonth() === tempRange.start.getMonth() &&
      currentMonth.getFullYear() === tempRange.start.getFullYear()
    )
  }

  const isDateEnd = (day: number): boolean => {
    if (!tempRange.end) return false
    return (
      day === tempRange.end.getDate() &&
      currentMonth.getMonth() === tempRange.end.getMonth() &&
      currentMonth.getFullYear() === tempRange.end.getFullYear()
    )
  }

  const monthName = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(currentMonth)

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i)

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="justify-start gap-2 text-left font-normal"
      >
        <Calendar className="size-4" />
        {formatDateDisplay()}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Selecione o Período</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Month/Year Header */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="size-4" />
              </Button>
              <h3 className="text-sm font-semibold capitalize">{monthName}</h3>
              <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="size-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day labels */}
              {daysOfWeek.map((day) => (
                <div key={day} className="h-8 text-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}

              {/* Empty cells */}
              {emptyDays.map((_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}

              {/* Days */}
              {days.map((day) => {
                const isStart = isDateStart(day)
                const isEnd = isDateEnd(day)
                const isIn = isDateInRange(day)

                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      'h-8 rounded-md text-xs font-medium transition-colors',
                      'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isStart || isEnd
                        ? 'bg-primary text-primary-foreground'
                        : isIn
                          ? 'bg-primary/20 text-primary'
                          : 'text-foreground hover:bg-muted'
                    )}
                  >
                    {day}
                  </button>
                )
              })}
            </div>

            {/* Selected range display */}
            <Card className="bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                {tempRange.start && tempRange.end
                  ? `${new Intl.DateTimeFormat('pt-BR').format(tempRange.start)} até ${new Intl.DateTimeFormat('pt-BR').format(tempRange.end)}`
                  : tempRange.start
                    ? `Início: ${new Intl.DateTimeFormat('pt-BR').format(tempRange.start)}`
                    : 'Clique em duas datas para selecionar o período'}
              </p>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClear}>
              Limpar
            </Button>
            <Button onClick={handleConfirm} disabled={!tempRange.start || !tempRange.end}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
