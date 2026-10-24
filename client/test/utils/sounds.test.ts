import type { SoundName } from '@/interfaces/sound'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { playSound, scheduleTones, SOUNDS } from '@/utils/sounds'

const NAMES = Object.keys(SOUNDS) as SoundName[]

// Un contexte audio factice qui enregistre ce qu'on lui demande
function fakeContext (state: AudioContextState = 'running') {
  const oscillators: { type: string, start: number, stop: number, ramps: [number, number][], at: [number, number][] }[] = []
  const gains: { values: [number, number][], ramps: [number, number][] }[] = []
  const resume = vi.fn(() => Promise.resolve())
  const destination = {}

  const context = {
    currentTime: 10,
    state,
    destination,
    resume,
    createOscillator () {
      const record = { type: '', start: 0, stop: 0, ramps: [] as [number, number][], at: [] as [number, number][] }
      oscillators.push(record)
      const node = {
        set type (value: string) {
          record.type = value
        },
        frequency: {
          setValueAtTime: (value: number, time: number) => record.at.push([value, time]),
          exponentialRampToValueAtTime: (value: number, time: number) => record.ramps.push([value, time]),
        },
        connect: (target: unknown) => target,
        start: (time: number) => {
          record.start = time
        },
        stop: (time: number) => {
          record.stop = time
        },
      }
      return node
    },
    createGain () {
      const record = { values: [] as [number, number][], ramps: [] as [number, number][] }
      gains.push(record)
      const node = {
        gain: {
          setValueAtTime: (value: number, time: number) => record.values.push([value, time]),
          exponentialRampToValueAtTime: (value: number, time: number) => record.ramps.push([value, time]),
        },
        connect: (target: unknown) => target,
      }
      return node
    },
  }
  return { context: context as unknown as AudioContext, oscillators, gains, resume }
}

describe('SOUNDS', () => {
  it('décrit un son pour chaque geste', () => {
    expect(new Set(NAMES)).toEqual(new Set(['back', 'create', 'delete', 'launch', 'move', 'open', 'refuse']))
  })

  it('ne contient que des notes valides et brèves', () => {
    for (const name of NAMES) {
      expect(SOUNDS[name].length, name).toBeGreaterThan(0)
      for (const tone of SOUNDS[name]) {
        expect(tone.frequency, name).toBeGreaterThan(0)
        if (tone.slideTo !== undefined) {
          expect(tone.slideTo, name).toBeGreaterThan(0)
        }
        expect(tone.start, name).toBeGreaterThanOrEqual(0)
        expect(tone.duration, name).toBeGreaterThan(0)
        expect(tone.start + tone.duration, name).toBeLessThan(0.6)
        expect(tone.volume, name).toBeGreaterThan(0)
        expect(tone.volume, name).toBeLessThanOrEqual(0.3)
      }
    }
  })
})

describe('scheduleTones', () => {
  it('programme chaque note au bon instant, avec son enveloppe', () => {
    const { context, oscillators, gains } = fakeContext()
    scheduleTones(context, SOUNDS.create)

    expect(oscillators).toHaveLength(SOUNDS.create.length)
    for (const [index, tone] of SOUNDS.create.entries()) {
      expect(oscillators[index]!.type).toBe(tone.type)
      expect(oscillators[index]!.start).toBeCloseTo(10 + tone.start)
      expect(oscillators[index]!.stop).toBeGreaterThan(10 + tone.start + tone.duration - 0.001)
      expect(gains[index]!.values[0]![0]).toBeLessThan(0.001)
      expect(gains[index]!.ramps[0]![0]).toBe(tone.volume)
      expect(gains[index]!.ramps[1]![0]).toBeLessThan(0.001)
    }
  })

  it('fait glisser la fréquence quand la note a une arrivée', () => {
    const { context, oscillators } = fakeContext()
    scheduleTones(context, SOUNDS.open)
    expect(oscillators[0]!.at[0]![0]).toBe(330)
    expect(oscillators[0]!.ramps[0]![0]).toBe(620)

    const flat = fakeContext()
    scheduleTones(flat.context, SOUNDS.launch)
    expect(flat.oscillators[0]!.ramps).toHaveLength(0)
  })

  it('part de l\'instant demandé', () => {
    const { context, oscillators } = fakeContext()
    scheduleTones(context, SOUNDS.move, 50)
    expect(oscillators[0]!.start).toBe(50)
  })
})

describe('playSound', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('ne fait rien, sans erreur, quand le navigateur n\'a pas d\'audio', async () => {
    vi.resetModules()
    const { playSound: play } = await import('@/utils/sounds')
    expect(() => play('open')).not.toThrow()
  })

  it('crée le contexte à la première lecture seulement, et le réutilise', async () => {
    vi.resetModules()
    const fake = fakeContext()
    const Audio = vi.fn(function () {
      return fake.context
    })
    vi.stubGlobal('AudioContext', Audio)
    const { playSound: play } = await import('@/utils/sounds')

    expect(Audio).not.toHaveBeenCalled()
    play('launch')
    play('back')
    expect(Audio).toHaveBeenCalledTimes(1)
    expect(fake.oscillators).toHaveLength(SOUNDS.launch.length + SOUNDS.back.length)
  })

  it('relance un contexte en veille', async () => {
    vi.resetModules()
    const fake = fakeContext('suspended')
    vi.stubGlobal('AudioContext', vi.fn(function () {
      return fake.context
    }))
    const { playSound: play } = await import('@/utils/sounds')
    play('open')
    expect(fake.resume).toHaveBeenCalled()
  })

  it('absorbe une erreur de l\'audio', async () => {
    vi.resetModules()
    vi.stubGlobal('AudioContext', vi.fn(function () {
      throw new Error('refusé')
    }))
    const { playSound: play } = await import('@/utils/sounds')
    expect(() => play('delete')).not.toThrow()
  })

  it('exporte playSound', () => {
    expect(typeof playSound).toBe('function')
  })
})
