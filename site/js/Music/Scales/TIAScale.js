import { Music } from "../Music.js"
import { MusicScale, MusicNote } from "../Scales/MusicScale.js"

// NoteFrequency = OscillatorRate / ColorClocks / WaveformLength / NoteValue
// https://forums.atariage.com/topic/257526-musicsound-programming-question-atari-2600/

// average color clocks per audio clock is an average of alternating values between 112 and 116
const COLOR_CLOCKS_PER_LINE		 = 228;
const AVG_COLOR_CLOCKS_PER_AUDIO = COLOR_CLOCKS_PER_LINE/2;	// color clocks per audio clock

// Atari 2600 NTSC crystal clock (C015510). This differs slightly from the computed
// NTSC frequency: 315/88*1000*1000 = 3.579545 MHz
const NTSC_FREQ = 3.579575 * 1e6;

// Atari 2600 PAL crystal clock (CO16112). This differs slightly from the computed
// PAL frequency: 283.75*15625*4/5+25 = 3.546900 MHz
const PAL_FREQ = 3.546894 * 1e6;

export class NTSCMode {
    #frequency      = NTSC_FREQ;
    #cpuFrequency   = NTSC_FREQ/3;
    #audioFrequency = NTSC_FREQ/AVG_COLOR_CLOCKS_PER_AUDIO;
    #fps            = 60/1.001; // fields per second

    get Frequency() { return this.#frequency }
    get FPS() { return this.#fps }
    get CpuFrequency() { return this.#cpuFrequency }
    get AudioFrequency () { return this.#audioFrequency }
}

export class PALMode {
    #frequency      = PAL_FREQ;
    #cpuFrequency   = PAL_FREQ/3;
    #audioFrequency = PAL_FREQ/AVG_COLOR_CLOCKS_PER_AUDIO;
    #fps            = 50; // fields per second

    get Frequency() { return this.#frequency }
    get FPS() { return this.#fps }
    get CpuFrequency() { return this.#cpuFrequency }
    get AudioFrequency () { return this.#audioFrequency }
}

export class TIANote extends MusicNote {
	#pitch = 0;
	#tone = 0;
	#cents = 0.0;
    #pianoNote = null;

    constructor(frequency, pitch, tone) {
        super(frequency);
        this.#pitch = pitch;
        this.#tone = tone;
        this.#pianoNote = Music.getNearestNote(frequency);
        this.#cents = Music.Cents(this.#pianoNote.Frequency, frequency);
    }

    clone() {
        return new TIANote(this.Frequency, this.Pitch, this.Tone);
    }

    get Label() {
        return "" + this.Tone + "/" + this.Pitch;
    }

	get Pitch() { return this.#pitch }
	get Tone() { return this.#tone }
	get Cents() { return this.#cents }
    get NearestPianoNote() { return this.#pianoNote }

	get KeyNum() { return this.#pianoNote.KeyNum }
    get MicroNum() { return this.#pianoNote.MicroNum }
    get Letter() { return this.#pianoNote.Letter }

	set Cents(val) { this.#cents = val }

    // old fields
    get microId() { return this.MicroId }
	get pitch() { return this.Pitch }
	get tone() { return this.Tone }
	get frequency() { return this.Frequency }
	get cents() { return this.Cents }

    get midiNote() { return this.MidiNote }
    get keyNum() { return this.KeyNum }
    get microNum() { return this.MicroNum }

	set cents(val) { this.Cents = val }
}

export class TIAScale extends MusicScale {
}
