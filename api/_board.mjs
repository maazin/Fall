/* Where the shared board lives in Redis, for every route that touches it.
 *
 * The underscore keeps this file from being deployed as a route of its own;
 * scores.mjs and reset.mjs import it. It exists because those two used to
 * work the key names out separately, and when the board moved to fortnightly
 * seasons only one of them was updated: reset went on deleting the old
 * pre-season keys while the live board sat under a prefix it never looked at.
 * One definition means they cannot drift apart again.
 */

/* Seasons, a fortnight each, rolling on their own.
 *
 * Everything the board reads and writes sits under one prefix, so moving the
 * prefix on is the whole reset: the new season starts empty and the old one is
 * still sitting there untouched. The number comes from the clock rather than
 * from anybody remembering to bump something.
 *
 * EPOCH is a Monday midnight UTC, so a season always turns over at the same
 * time of the same weekday rather than drifting. BOARD_SEASON still overrides
 * everything if you ever need to pin or replay one by hand.
 *
 * Season keys are given a TTL on write. Without one, every fortnight would
 * leave its sorted sets behind for ever; 60 days keeps the last few seasons
 * around to look at and lets the rest fall off on their own. */
export const FORTNIGHT = 14 * 24 * 60 * 60 * 1000;
export const EPOCH = Date.UTC(2026, 0, 5);          // Monday 5 January 2026, 00:00 UTC
export const SEASON_TTL = 60 * 24 * 60 * 60;        // seconds

/* Wipe the board without waiting for the fortnight.
 *
 * Bump this and deploy, and the board is empty from that moment: it becomes
 * part of the prefix, so every read and write moves to fresh keys. Nothing is
 * deleted. The old keys are still in Redis, run out on their TTL, and setting
 * the number back brings them straight back. The fortnightly rollover carries
 * on exactly on schedule either way.
 *
 * POST /api/reset is the other way, and that one does delete. */
export const BOARD_RESET = 1;

export function seasonNumber(now) {
  return Math.max(1, Math.floor(((now === undefined ? Date.now() : now) - EPOCH) / FORTNIGHT) + 1);
}

export function seasonEnds(n) {
  return new Date(EPOCH + n * FORTNIGHT).toISOString();
}

/* The season in force: pinned by BOARD_SEASON if that is set, else the clock. */
export function currentSeason(env, now) {
  const pinned = String((env && env.BOARD_SEASON) || '').replace(/[^0-9]/g, '');
  return pinned ? Number(pinned) : seasonNumber(now);
}

/* The Redis prefix for a season, reset generation included. */
export function namespace(season) {
  return 'fall:s' + season + (BOARD_RESET ? 'r' + BOARD_RESET : '') + ':';
}
