import { Receipt, Utensils, ParkingSquare, Fuel, TrainFront, Plane, Hotel, Package, Route, type LucideIcon } from 'lucide-react'
import type { ExpenseCategory } from '../schemas/expenses'
const icons: Record<string, LucideIcon> = { MEAL: Utensils, PARKING: ParkingSquare, FUEL: Fuel, TRAIN: TrainFront, FLIGHT: Plane, HOTEL: Hotel, EQUIPMENT: Package }
const modes: Record<ExpenseCategory['mode'], LucideIcon> = { general: Receipt, meal: Utensils, travel: Route, fuel: Fuel, purchase: Package }
export function expenseCategoryIcon(category?: Pick<ExpenseCategory, 'code' | 'mode'>) { return category ? icons[category.code] || modes[category.mode] : Receipt }
