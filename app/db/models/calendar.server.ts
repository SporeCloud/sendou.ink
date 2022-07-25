import {
  databaseTimestampToDate,
  dateToDatabaseTimestamp,
  dateToWeekNumber,
} from "~/utils/dates";
import { sql } from "../sql";
import type { CalendarEvent, CalendarEventDate, User } from "../types";

const findAllBetweenTwoTimestampsStm = sql.prepare(`
  select
      "CalendarEvent"."name",
      "CalendarEvent"."discordUrl",
      "CalendarEvent"."bracketUrl",
      "CalendarEventDate"."id",
      "CalendarEventDate"."eventId",
      "CalendarEventDate"."startTime",
      "User"."discordName",
      "User"."discordDiscriminator"
    from "CalendarEvent"
    join "CalendarEventDate" on "CalendarEvent"."id" = "CalendarEventDate"."eventId"
    join "User" on "CalendarEvent"."authorId" = "User"."id"
    where "CalendarEventDate"."startTime" between $startTime and $endTime
    order by "CalendarEventDate"."startTime" asc
`);

export function findAllBetweenTwoTimestamps({
  startTime,
  endTime,
}: {
  startTime: Date;
  endTime: Date;
}) {
  return findAllBetweenTwoTimestampsStm.all({
    startTime: dateToDatabaseTimestamp(startTime),
    endTime: dateToDatabaseTimestamp(endTime),
  }) as Array<
    Pick<CalendarEvent, "name" | "discordUrl" | "bracketUrl"> &
      Pick<CalendarEventDate, "id" | "eventId" | "startTime"> &
      Pick<User, "discordName" | "discordDiscriminator">
  >;
}

const findByIdStm = sql.prepare(`
  select
    "CalendarEvent"."name",
    "CalendarEvent"."description",
    "CalendarEvent"."discordUrl",
    "CalendarEvent"."bracketUrl",
    "CalendarEventDate"."startTime",
    "CalendarEventDate"."eventId",
    "User"."discordName",
    "User"."discordDiscriminator",
    "User"."discordId",
    "User"."discordAvatar"
  from "CalendarEvent"
  join "CalendarEventDate" on "CalendarEvent"."id" = "CalendarEventDate"."eventId"
  join "User" on "CalendarEvent"."authorId" = "User"."id"
  where "CalendarEvent"."id" = $id
`);

export function findById(id: CalendarEvent["id"]) {
  return findByIdStm.get({ id }) as Nullable<
    Pick<CalendarEvent, "name" | "description" | "discordUrl" | "bracketUrl"> &
      Pick<CalendarEventDate, "startTime" | "eventId"> &
      Pick<
        User,
        "discordName" | "discordDiscriminator" | "discordId" | "discordAvatar"
      >
  >;
}

const eventsCountPerWeekStm = sql.prepare(`
  select
    "CalendarEventDate"."startTime"
  from "CalendarEventDate"
  where "CalendarEventDate"."startTime" between $startTime and $endTime
`);

export function eventsCountPerWeek({
  startTime,
  endTime,
}: {
  startTime: Date;
  endTime: Date;
}) {
  const startTimes = eventsCountPerWeekStm.all({
    startTime: dateToDatabaseTimestamp(startTime),
    endTime: dateToDatabaseTimestamp(endTime),
  }) as Array<Pick<CalendarEventDate, "startTime">>;

  const result = new Map<number, number>();

  for (const { startTime } of startTimes) {
    const week = dateToWeekNumber(databaseTimestampToDate(startTime));
    const previousCount = result.get(week) ?? 0;
    result.set(week, previousCount + 1);
  }

  return result;
}
