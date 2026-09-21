const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_REPORT_DAYS = 366;
const VIETNAM_TIMEZONE = "Asia/Ho_Chi_Minh";
const VIETNAM_DB_OFFSET = "+07:00";

function parseCalendarDate(value, label) {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
    return { error: `${label} phải có định dạng YYYY-MM-DD` };
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    return { error: `${label} không phải là ngày hợp lệ` };
  }

  return { value, date };
}

function formatUtcCalendarDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function validateReportRange(dateFrom, dateTo) {
  const from = parseCalendarDate(dateFrom, "Ngày bắt đầu");
  if (from.error) return { error: from.error };

  const to = parseCalendarDate(dateTo, "Ngày kết thúc");
  if (to.error) return { error: to.error };
  if (from.date > to.date) {
    return { error: "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc" };
  }

  const dayCount = Math.floor((to.date - from.date) / DAY_MS) + 1;
  if (dayCount > MAX_REPORT_DAYS) {
    return { error: `Khoảng thời gian báo cáo không được vượt quá ${MAX_REPORT_DAYS} ngày` };
  }

  const dayAfterTo = new Date(to.date.getTime() + DAY_MS);
  return {
    value: {
      dateFrom: from.value,
      dateTo: to.value,
      start: `${from.value} 00:00:00`,
      endExclusive: `${formatUtcCalendarDate(dayAfterTo)} 00:00:00`,
      dayCount,
    },
  };
}

async function setVietnamTimezone(connection) {
  await connection.query(`SET time_zone = '${VIETNAM_DB_OFFSET}'`);
}

module.exports = {
  MAX_REPORT_DAYS,
  VIETNAM_DB_OFFSET,
  VIETNAM_TIMEZONE,
  setVietnamTimezone,
  validateReportRange,
};
