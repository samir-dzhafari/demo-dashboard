export interface ServiceDirection {
  id: string
  name: string
}

export interface Service {
  id: string
  name: string
  directionId: string
}
