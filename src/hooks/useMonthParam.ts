import { useSearchParams } from 'react-router'
import { currentMonth, parseMonth, type MonthKey } from '../lib/month'

// The selected month lives in the URL (?mes=YYYY-MM) so it survives reloads
// and can be shared between screens.
export function useMonthParam() {
  const [searchParams, setSearchParams] = useSearchParams()
  const month = parseMonth(searchParams.get('mes'))

  function setMonth(next: MonthKey) {
    setSearchParams(next === currentMonth() ? {} : { mes: next })
  }

  return { month, setMonth, isCurrentMonth: month === currentMonth() }
}
