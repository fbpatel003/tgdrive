export function type() { return 'Browser' }
export function platform() { return 'browser' }
export function release() { return '0.0.0' }
export function hostname() { return 'localhost' }
export function arch() { return 'x64' }
export function cpus() { return [] }
export function totalmem() { return 0 }
export function freemem() { return 0 }
export function networkInterfaces() { return {} }
export function userInfo() { return { username: 'user', uid: -1, gid: -1, shell: null, homedir: '/' } }
export function tmpdir() { return '/tmp' }
export function uptime() { return 0 }
export const EOL = '\n'
export default { type, platform, release, hostname, arch, cpus, totalmem, freemem, networkInterfaces, userInfo, tmpdir, uptime, EOL }