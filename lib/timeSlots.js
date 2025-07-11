import { addMinutes, format, isAfter, isBefore, parseISO, startOfDay } from 'date-fns'

export const CLINIC_HOURS = {
  start: '08:00',
  end: '17:00',
  slotDuration: 90, // 1 hour 30 minutes
  maxCapacity: 5
}

export function generateTimeSlots(date) {
  const slots = []
  const startTime = parseISO(`${date}T${CLINIC_HOURS.start}:00`)
  const endTime = parseISO(`${date}T${CLINIC_HOURS.end}:00`)
  
  let currentTime = startTime
  
  while (isBefore(currentTime, endTime)) {
    const slotEnd = addMinutes(currentTime, CLINIC_HOURS.slotDuration)
    
    if (isBefore(slotEnd, endTime) || slotEnd.getTime() === endTime.getTime()) {
      slots.push({
        start_time: format(currentTime, 'HH:mm:ss'),
        end_time: format(slotEnd, 'HH:mm:ss'),
        display: `${format(currentTime, 'h:mm a')} - ${format(slotEnd, 'h:mm a')}`
      })
    }
    
    currentTime = slotEnd
  }
  
  return slots
}

export function isValidTimeSlot(startTime, endTime) {
  const start = parseISO(`2000-01-01T${startTime}`)
  const end = parseISO(`2000-01-01T${endTime}`)
  const clinicStart = parseISO(`2000-01-01T${CLINIC_HOURS.start}:00`)
  const clinicEnd = parseISO(`2000-01-01T${CLINIC_HOURS.end}:00`)
  
  return !isBefore(start, clinicStart) && !isAfter(end, clinicEnd)
}