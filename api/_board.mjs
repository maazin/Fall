/* Where the shared board lives in Redis, for every route that touches it.
 *
 * The underscore keeps this file from being deployed as a route of its own;
 * scores.mjs and reset.mjs import it. It exists because those two used to
 * work the key names out separately, and when the board first moved to
 * seasons only one of them was updated: reset went on deleting the old
 * pre-season keys while the live board sat under a prefix it never looked at.
 * One definition means they cannot drift apart again.
 */

/* Seasons, one calendar month each, rolling on their own.
 *
 * Everything the board reads and writes sits under one prefix, so moving the
 * prefix on is the whole reset: the new season starts empty and the old one is
 * still sitting there untouched. The number comes from the clock rather than
 * from anybody remembering to bump something.
 *
 * A season is a calendar month in UTC, so the board turns over at midnight UTC
 * on the 1st. Season 1 is January 2026, and the number simply counts months
 * from there. BOARD_SEASON still overrides everything if you ever need to pin
 * or replay one by hand.
 *
 * Seasons used to be fortnights counted from 5 January 2026. Monthly ones use
 * the 'm' prefix below so their numbers can never land on an old fortnight's
 * keys.
 *
 * Season keys are given a TTL on write. Without one, every month would leave
 * its sorted sets behind for ever; 75 days keeps last month around to look at
 * and lets the rest fall off on their own. */
export const START_YEAR = 2026;
export const SEASON_TTL = 75 * 24 * 60 * 60;        // seconds

/* Wipe the board without waiting for the month to end.
 *
 * Bump this and deploy, and the board is empty from that moment: it becomes
 * part of the prefix, so every read and write moves to fresh keys. Nothing is
 * deleted. The old keys are still in Redis, run out on their TTL, and setting
 * the number back brings them straight back. The monthly rollover carries
 * on exactly on schedule either way.
 *
 * POST /api/reset is the other way, and that one does delete. */
export const BOARD_RESET = 2;   // 2: the relaunch with starters and tiers

export function seasonNumber(now) {
  const d = new Date(now === undefined ? Date.now() : now);
  return Math.max(1, (d.getUTCFullYear() - START_YEAR) * 12 + d.getUTCMonth() + 1);
}

/* When season n ends: midnight UTC on the 1st of the following month. */
export function seasonEnds(n) {
  return new Date(Date.UTC(START_YEAR, n, 1)).toISOString();
}

/* The season in force: pinned by BOARD_SEASON if that is set, else the clock. */
export function currentSeason(env, now) {
  const pinned = String((env && env.BOARD_SEASON) || '').replace(/[^0-9]/g, '');
  return pinned ? Number(pinned) : seasonNumber(now);
}

/* The Redis prefix for a season, reset generation included. */
export function namespace(season) {
  return 'fall:m' + season + (BOARD_RESET ? 'r' + BOARD_RESET : '') + ':';
}
