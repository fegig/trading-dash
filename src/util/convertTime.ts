/** Format unix seconds for login notification emails (legacy parity). */
export function convertTime(timestamp: number) {
  const t = new Date(timestamp * 1000)
  let hours = t.getHours()
  const minutes = t.getMinutes()
  const newformat = t.getHours() >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours || 12
  const minutesStr = minutes < 10 ? `0${minutes}` : String(minutes)
  return (
    t.toString().split(' ')[0] +
    ', ' +
    `0${t.getDate()}`.slice(-2) +
    '/' +
    `0${t.getMonth() + 1}`.slice(-2) +
    '/' +
    t.getFullYear() +
    ' - ' +
    hours +
    ':' +
    minutesStr +
    ' ' +
    newformat
  )
}
