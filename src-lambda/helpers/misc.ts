/**
 * Flattens a nested object structure into a single-level object with dot notation keys.
 * Arrays within the object are preserved intact.
 *
 * @param obj - The nested object to flatten
 * @param prefix - Optional prefix for keys (used in recursive calls)
 * @param result - Optional accumulator object (used in recursive calls)
 * @returns A flattened object with dot notation keys
 *
 * @example
 * // Returns {"hey.there": "world", "hey.people": [1, 2, {dave: true}]}
 * flattenObject({hey: {there: "world", people: [1, 2, {dave: true}]}});
 */

// Define recursive type for nested objects
export type NestedValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | unknown[]
  | Record<string, unknown>
  | DateTimeInfo
  | unknown;
export type NestedObject = Record<string, NestedValue>;

export const flattenObject = (
  obj: NestedObject,
  prefix: string = "",
  result: Record<string, unknown> = {},
): Record<string, unknown> => {
  // Iterate through each key in the object
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      // Create the new key with dot notation
      const newKey = prefix ? `${prefix}.${key}` : key;

      // If the value is an array, add it directly to the result
      if (Array.isArray(value)) {
        result[newKey] = value;
      }
      // If the value is an object but not an array, recursively flatten it
      else if (typeof value === "object" && value !== null) {
        flattenObject(value as NestedObject, newKey, result);
      }
      // Otherwise, add the primitive value directly to the result
      else {
        result[newKey] = value;
      }
    }
  }

  return result;
};

// Example usage:
// const nested = {hey: {there: "world", people: [1, 2, {dave: true}]}};
// const flattened = flattenObject(nested);
// console.log(flattened); // {"hey.there": "world", "hey.people": [1, 2, {dave: true}]}

/**
 * Returns a comprehensive object containing current date and time information
 *
 * @returns {DateTimeInfo} An object with detailed date and time properties
 *
 * Example return value:
 * {
 *   year: 2025,
 *   month: 3,
 *   day: 28,
 *   hour: 17,
 *   minute: 6,
 *   second: 22,
 *   millisecond: 458,
 *   day_of_week: "Friday",
 *   day_of_week_short: "Fri",
 *   day_of_year: 87,
 *   week_of_year: 13,
 *   month_name: "March",
 *   month_name_short: "Mar",
 *   quarter: 1,
 *   is_leap_year: false,
 *   timezone: "UTC-0700",
 *   timezone_name: "Pacific Daylight Time",
 *   timezone_offset: -420, // minutes
 *   is_dst: true,
 *   unix_timestamp: 1743055582, // seconds since Jan 1, 1970
 *   iso_string: "2025-03-28T17:06:22.458Z"
 * }
 */
interface DateTimeInfo {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  day_of_week: string;
  day_of_week_short: string;
  day_of_year: number;
  week_of_year: number;
  month_name: string;
  month_name_short: string;
  quarter: number;
  is_leap_year: boolean;
  timezone: string;
  timezone_name: string;
  timezone_offset: number;
  is_dst: boolean;
  unix_timestamp: number;
  iso_string: string;
}

/**
 * Get comprehensive date and time information
 * @returns {DateTimeInfo} Object containing detailed date and time data
 */
export const getCurrentDateInfo = (): DateTimeInfo => {
  const now = new Date();

  // Get day of week
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Get month names
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthsShort = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Calculate day of year
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  // Calculate week of year (ISO week number)
  const date = new Date(now.getTime());
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  // January 4 is always in week 1
  const week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1
  const weekOfYear =
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    );

  // Check if it's a leap year
  const isLeapYear = new Date(now.getFullYear(), 1, 29).getMonth() === 1;

  // Get timezone information
  const timezoneOffset = now.getTimezoneOffset();
  const offsetHours = Math.abs(Math.floor(timezoneOffset / 60));
  const offsetMinutes = Math.abs(timezoneOffset % 60);
  const timezoneString = `UTC${timezoneOffset <= 0 ? "+" : "-"}${offsetHours.toString().padStart(2, "0")}${offsetMinutes.toString().padStart(2, "0")}`;

  // Determine if daylight saving time is in effect
  // This is a simplification; actual DST logic can be complex
  const jan = new Date(now.getFullYear(), 0, 1);
  const jul = new Date(now.getFullYear(), 6, 1);
  const isDST =
    now.getTimezoneOffset() <
    Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());

  // Get timezone name (simplified approach)
  const timeString = now.toTimeString();
  const timezoneName = timeString.substring(
    timeString.indexOf("(") + 1,
    timeString.indexOf(")"),
  );

  // Calculate quarter
  const quarter = Math.floor((now.getMonth() + 3) / 3);

  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1, // JavaScript months are 0-indexed
    day: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes(),
    second: now.getSeconds(),
    millisecond: now.getMilliseconds(),
    day_of_week: days[now.getDay()],
    day_of_week_short: daysShort[now.getDay()],
    day_of_year: dayOfYear,
    week_of_year: weekOfYear,
    month_name: months[now.getMonth()],
    month_name_short: monthsShort[now.getMonth()],
    quarter: quarter,
    is_leap_year: isLeapYear,
    timezone: timezoneString,
    timezone_name: timezoneName,
    timezone_offset: timezoneOffset,
    is_dst: isDST,
    unix_timestamp: Math.floor(now.getTime() / 1000),
    iso_string: now.toISOString(),
  };
};

// Example usage:
// const dateInfo = getCurrentDateInfo();
// console.log(dateInfo);
