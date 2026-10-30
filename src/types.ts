export type Pledge = {
  id: string
  countryCode: string
  countryName: string
  shortName: string
  amountMillion: number
  at: number
}

export type TrackerSnapshot = {
  startMillion: number
  targetMillion: number
  pledges: Pledge[]
}

export type ServerMessage =
  | { type: 'state'; snapshot: TrackerSnapshot }
  | { type: 'pledge'; pledge: Pledge; snapshot: TrackerSnapshot }
  | { type: 'reset'; snapshot: TrackerSnapshot }
