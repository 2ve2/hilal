// Run every test in a time zone far from UTC. Local midnight at UTC+14 is
// the previous day in UTC, so any code that derives a calendar day from a
// UTC timestamp fails the tests instead of passing by accident on a UTC
// machine.
//
// Etc/GMT-14 (the sign is inverted in Etc names) is a fixed UTC+14 offset.
// A real zone such as Pacific/Kiritimati would not work: it skipped
// 1994-12-31 when Kiribati moved across the date line.
module.exports = () => {
  process.env.TZ = 'Etc/GMT-14';
};
