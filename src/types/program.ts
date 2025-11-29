export interface Subject {
    _id: string
    name: string
    code: string
    semester: number
}

export interface Year {
    _id: string
    year: number
    name: string
    subjects: Subject[]
}

export interface Branch {
    _id: string
    name: string
    code: string
    years: Year[]
}

export interface Program {
    _id: string
    name: string
    code: string
    duration: number
    branches: Branch[]
    isActive: boolean
}