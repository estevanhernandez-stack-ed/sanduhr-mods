// Windows PowerShell 5.1 scripts over the system media session (the feed behind the Windows
// media flyout), so Chrome's YouTube Music tab shows up without any extension or adapter.
// Single quotes only, so each script survives being passed as one argv entry.

const PREAMBLE = [
  'Add-Type -AssemblyName System.Runtime.WindowsRuntime',
  '$null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime]',
  "$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]",
  'function Await($op, $t) { $m = $asTask.MakeGenericMethod($t); $x = $m.Invoke($null, @($op)); $x.Wait(-1) | Out-Null; $x.Result }',
  '$mgr = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])',
]

// Prints the current session as one JSON line every 2s; `{}` when nothing plays.
const WATCH = [
  ...PREAMBLE,
  'while ($true) {',
  "  $line = '{}'",
  '  try {',
  '    $s = $mgr.GetCurrentSession()',
  '    if ($null -ne $s) {',
  '      $p = Await ($s.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])',
  '      $t = $s.GetTimelineProperties()',
  '      $line = [pscustomobject]@{ app = $s.SourceAppUserModelId; status = [string]$s.GetPlaybackInfo().PlaybackStatus; artist = $p.Artist; title = $p.Title; posMs = [long]$t.Position.TotalMilliseconds; endMs = [long]$t.EndTime.TotalMilliseconds; stampMs = $t.LastUpdatedTime.ToUnixTimeMilliseconds() } | ConvertTo-Json -Compress',
  '    }',
  '  } catch { }',
  '  [Console]::Out.WriteLine($line)',
  '  [Console]::Out.Flush()',
  '  Start-Sleep -Seconds 2',
  '}',
]

export type Control = 'toggle' | 'next' | 'prev'

const CALLS: Record<Control, string> = {
  toggle: 'TryTogglePlayPauseAsync',
  next: 'TrySkipNextAsync',
  prev: 'TrySkipPreviousAsync',
}

const PS = ['powershell.exe', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command']

export const WATCHER_ARGV: readonly string[] = [...PS, WATCH.join('\n')]

// Prints `ok` when the player accepted the command, `no` when it refused, `none` with no session.
export function controlArgv(action: Control): string[] {
  const script = [
    ...PREAMBLE,
    '$s = $mgr.GetCurrentSession()',
    "if ($null -eq $s) { 'none'; return }",
    `$ok = Await ($s.${CALLS[action]}()) ([bool])`,
    "if ($ok) { 'ok' } else { 'no' }",
  ]

  return [...PS, script.join('\n')]
}

// macOS: Sanduhr's bundled mediaremote-adapter when Sanduhr is installed (every app that
// publishes now playing, browsers included), else AppleScript to Music and Spotify. Both print the
// Windows watcher's line, so the band reads them the same way.

// Where Sanduhr.app keeps the adapter, under its Contents folder.
export type Adapter = { script: string; framework: string }

export function adapterIn(contents: string): Adapter {
  return {
    script: `${contents}/Resources/NowPlaying/mediaremote-adapter.pl`,
    framework: `${contents}/Frameworks/MediaRemoteAdapter.framework`,
  }
}

// Sanduhr.app's Contents folders to look in, in order.
export function sanduhrContents(home: string | undefined): string[] {
  const roots = ['/Applications/Sanduhr.app/Contents']

  return home ? [...roots, `${home}/Applications/Sanduhr.app/Contents`] : roots
}

// The adapter's `get` once every 2s, turned into the watcher's line. MediaRemote answers Apple-signed
// hosts only, so the adapter runs under /usr/bin/perl. The paths come in as arguments, never as code.
const ADAPTER_WATCH = [
  'use strict; use JSON::PP; $| = 1;',
  'my ($pl, $fw) = @ARGV; my $j = JSON::PP->new->canonical;',
  'sub ms { my ($us, $s) = @_; defined $us ? int($us / 1000) : defined $s ? int($s * 1000) : 0 }',
  'while (1) {',
  "  my $line = '{}';",
  "  if (open(my $fh, '-|', '/usr/bin/perl', $pl, $fw, 'get', '--no-artwork', '--micros')) {",
  '    my $out = do { local $/; <$fh> }; close $fh;',
  '    my $d = eval { JSON::PP->new->allow_nonref->decode($out) };',
  "    if (ref $d eq 'HASH' && defined $d->{title} && length $d->{title}) {",
  "      $line = $j->encode({ app => $d->{bundleIdentifier} // '', status => ($d->{playing} ? 'Playing' : 'Paused'),",
  "        artist => $d->{artist} // '', title => $d->{title},",
  '        posMs => ms($d->{elapsedTimeMicros}, $d->{elapsedTime}), endMs => ms($d->{durationMicros}, $d->{duration}),',
  '        stampMs => ms($d->{timestampEpochMicros}, time) });',
  '    }',
  '  }',
  '  print "$line\\n"; sleep 2;',
  '}',
]

// MRCommand ids the adapter sends: kMRTogglePlayPause, kMRNextTrack, kMRPreviousTrack.
const MR: Record<Control, string> = { toggle: '2', next: '4', prev: '5' }

const ADAPTER_CONTROL = [
  'use strict;',
  'my ($pl, $fw, $cmd) = @ARGV;',
  "open(my $fh, '-|', '/usr/bin/perl', $pl, $fw, 'get', '--no-artwork') or do { print \"no\\n\"; exit };",
  'my $out = do { local $/; <$fh> }; close $fh;',
  'if ($out !~ /"title"/) { print "none\\n"; exit }',
  "system('/usr/bin/perl', $pl, $fw, 'send', $cmd);",
  'print $? == 0 ? "ok\\n" : "no\\n";',
]

// Without Sanduhr: Music or Spotify, whichever is playing (else paused), read every 2s. Never
// launches either app: `running()` asks without starting it. macOS asks once to allow the control.
const SCRIPTED = [
  "ObjC.import('Foundation')",
  "function say(s) { $.NSFileHandle.fileHandleWithStandardOutput.writeData($(s + '\\n').dataUsingEncoding($.NSUTF8StringEncoding)) }",
  'function look(name) {',
  '  try {',
  '    const a = Application(name)',
  '    if (!a.running()) return null',
  '    const st = a.playerState()',
  "    if (st !== 'playing' && st !== 'paused') return null",
  '    const t = a.currentTrack()',
  "    const end = name === 'Spotify' ? t.duration() : t.duration() * 1000",
  "    return { app: name, status: st === 'playing' ? 'Playing' : 'Paused', artist: t.artist(), title: t.name(),",
  '      posMs: Math.round(a.playerPosition() * 1000), endMs: Math.round(end), stampMs: Date.now() }',
  '  } catch (e) { return null }',
  '}',
  "function pick() { const all = ['Music', 'Spotify'].map(look).filter(Boolean); return all.find(t => t.status === 'Playing') || all[0] || null }",
]

const SCRIPTED_WATCH = [...SCRIPTED, 'while (true) { const t = pick(); say(t ? JSON.stringify(t) : \'{}\'); delay(2) }']

const SCRIPTED_CALLS: Record<Control, string> = { toggle: 'playpause', next: 'nextTrack', prev: 'previousTrack' }

function scriptedControl(action: Control): string[] {
  return [
    ...SCRIPTED,
    'const t = pick()',
    `if (!t) { say('none') } else { try { Application(t.app).${SCRIPTED_CALLS[action]}(); say('ok') } catch (e) { say('no') } }`,
  ]
}

const OSA = ['/usr/bin/osascript', '-l', 'JavaScript', '-e']

// The Mac watcher's argv: the adapter's when found, else the scripted one.
export function macWatcherArgv(adapter: Adapter | null): string[] {
  return adapter
    ? ['/usr/bin/perl', '-e', ADAPTER_WATCH.join('\n'), adapter.script, adapter.framework]
    : [...OSA, SCRIPTED_WATCH.join('\n')]
}

// Prints `ok`, `no` or `none`, as the Windows control does.
export function macControlArgv(action: Control, adapter: Adapter | null): string[] {
  return adapter
    ? ['/usr/bin/perl', '-e', ADAPTER_CONTROL.join('\n'), adapter.script, adapter.framework, MR[action]]
    : [...OSA, scriptedControl(action).join('\n')]
}

// What `/np <word>` means. Undefined for a word it doesn't know.
export function parseControl(word: string): Control | undefined {
  const w = word.trim().toLowerCase()

  if (['', 'pause', 'play', 'toggle', 'pp'].includes(w)) {
    return 'toggle'
  }

  if (['next', 'skip', 'n', '>'].includes(w)) {
    return 'next'
  }

  if (['prev', 'previous', 'back', 'p', '<'].includes(w)) {
    return 'prev'
  }

  return undefined
}
