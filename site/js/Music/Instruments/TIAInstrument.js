import { Music } from "../Music.js"
import { MusicScale, MusicNote } from "../Scales/MusicScale.js"
import { TIAScale, TIANote } from "../Scales/TIAScale.js"
import { SynthInstrument } from "../Synth.js"

export class TIAInstrument extends SynthInstrument {
    #mode = new NTSCMode();
    #tones = [1, 2, 3, 4, 5, 7, 8, 9, 12, 13, 14, 15];
    #allTones = Array(16).fill(0).map((e,i) => { return 15 - i });
    #allPitches = Array(32).fill(0).map((e,i) => { return 31 - i });
    #divisors = [
    //     AUDC control value (0 and 11 are silent)
    //  0   1    2    3  4  5   6   7    8   9  10 11 12 13  14  15
        1, 15, 465, 465, 2, 2, 31, 31, 511, 31, 31, 1, 6, 6, 93, 93
    ];

    constructor(params = { }) {
        params.VideoFormat = params.VideoFormat == null ? 'ntsc': params.VideoFormat;
        params.Tone = params.Tone == null ? 1 : params.Tone;
        super('TIA', params);
        this.setModeByName(params.VideoFormat);
    }

    set Params(params) {
        super.Params = params;
        this.setModeByName(params.VideoFormat);
    }
    get Params() { return super.Params }

    set Mode(videoMode) { this.#mode = videoMode }
    get Mode() { return this.#mode }

    set Tone(tone) { this.Params.Tone = tone }
    get Tone() { return this.Params.Tone }

    get TypeName() { return "Atari TIA" }
    get Mode() { return this.#mode; }
    get Tones() { return this.#tones; }
    get AllTones() { return this.#allTones; }
    get AllPitches() { return this.#allPitches; }
    get Divisors() { return this.#divisors; }

    setModeByName(modeName) {
        const ModeMap = {
            'ntsc': new NTSCMode(),
            'pal': new PALMode()
        };

        if (typeof ModeMap.modeName != 'undefined')
            this.#mode = ModeMap.modeName;
    }

    getNoteList() {
        let ary = [];
        for (let pitch = 31; pitch >= 0; pitch--) {
            let frequency = this.computeFrequency(this.Params.Tone, pitch);
            let note = new TIANote(frequency, pitch, this.Params.Tone);
            ary.push(note);
        }
        ary.sort((a,b) => {
            let c = a.Frequency - b.Frequency;
            if (c != 0) return c;
            return Math.abs(a.Cents) - Math.abs(b.Cents);
        });
        return ary;
    }

	// play midi note (plays nearest note by frequency)
	noteOn(midiNote, velocity = 1.0) { }
    noteOff(midiNote) { }
    
	// play a letter key (A, C#, Db...)
	keyOn(keyNote, octave, microNum, velocity = 1.0) { }
	keyOff(keyNote, octave, microNum) { }

	// play for a limited duration (seconds)
	playNote(midiNote, velocity = 1.0, duration = 1.0) { }
	playKey(keyNote, octave, microNum, velocity = 1.0, duration = 1.0) { }

    // play TIA tone
	toneOn(control, pitch, volume) { }
	toneOff(control, pitch, volume) { }
	playTone(control, pitch, volume, duration = 1.0) { }


    computeFrequency(tone, pitch) {
        if (tone < 0 || tone >= 16 || pitch < 0 || pitch >= 32)
            return 0.0;

        return this.#mode.AudioFrequency / this.#divisors[tone] / (pitch+1);
    }
}

/*
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

export class TIANote extends Note {
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

*/
