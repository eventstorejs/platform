export interface CalEvent {
  uid?: string
  sequence?: number
  start: Date
  end?: Date
  timezone?: string
  allDay?: boolean
  summary?: string
  description?: string
  location?: string
  alarms?: Array<CalAlarm>
}

export interface CalAlarm {
  type: 'display' | 'audio'
  trigger: number
}
