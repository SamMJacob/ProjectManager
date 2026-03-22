import { parseISO, isSameDay, startOfDay, format } from 'date-fns'

export const isOverdue    = (d) => parseISO(d) < startOfDay(new Date())
export const isDueToday   = (d) => isSameDay(parseISO(d), new Date())
export const formatDueDate = (d) => format(parseISO(d), 'MMM d, yyyy')
