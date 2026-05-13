export interface CharacterAttributes {
  armStrength: number
  agility: number
  constitution: number
}

export interface CharacterState {
  id: string
  name: string
  level: number
  hp: number
  maxHp: number
  qi: number
  maxQi: number
  attributes: CharacterAttributes
  equippedSkillIds: string[]
}
