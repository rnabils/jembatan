import { Search, X } from 'lucide-react'
import { Button } from '../ui/button'
import { Select } from '../ui/select'
import { Input } from '../ui/input'

export function DocumentFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  year,
  onYearChange,
  categoryId,
  onCategoryChange,
  categories = [],
  years = []
}) {
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card lg:grid-cols-[minmax(0,1.5fr)_160px_120px_220px_auto]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search title, number, description, file..."
          className="pl-9"
        />
      </div>

      <Select value={status} onChange={(event) => onStatusChange(event.target.value)}>
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </Select>

      <Select value={year} onChange={(event) => onYearChange(event.target.value)}>
        <option value="all">All Years</option>
        {years.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Select>

      <Select value={categoryId} onChange={(event) => onCategoryChange(event.target.value)}>
        <option value="all">All Categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>

      <Button type="button" variant="outline" onClick={() => onSearchChange('')} className="justify-center">
        <X className="h-4 w-4" /> Clear
      </Button>
    </div>
  )
}
