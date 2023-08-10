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

const ModeMap = {
    'ntsc': new NTSCMode(),
    'pal': new PALMode()
};

const Divisors = [
//     AUDC control value (0 and 11 are silent)
//  0   1    2    3  4  5   6   7    8   9  10 11 12 13  14  15
    1, 15, 465, 465, 2, 2, 31, 31, 511, 31, 31, 1, 6, 6, 93, 93
];

export class TIANote extends MusicNote {
	#mode = null;
	#audc = 0;
	#audf = 0;
	#frequency = 0.0;
	#cents = 0.0;

    #tones = [1, 2, 3, 4, 5, 7, 8, 9, 12, 13, 14, 15];
    #allTones = Array(16).fill(0).map((e,i) => { return 15 - i });
    #allPitches = Array(32).fill(0).map((e,i) => { return 31 - i });

    constructor(music, args) {
        if (args.audc < 0 || args.audc >= 16)
            args.audc = 0;
 		if (args.audf < 0 || args.audf >= 32)
			args.audf = 0;

        let tiaFrequency = ModeMap.ntsc.AudioFrequency / Divisors[args.audc] / (args.audf+1);
		let mArgs = { frequency: tiaFrequency};

        super(music, mArgs);

		this.#mode = args.mode;
        this.#audc = args.audc;
        this.#audf = args.audf;
		this.#frequency = tiaFrequency;
        this.#cents = Music.CentsBetween(super.Frequency, tiaFrequency);
    }

	get AUDC() { return this.#audc }
	get AUDF() { return this.#audf }
	get TIAFrequency() { return this.#frequency }
	get Cents() { return this.#cents }
    get TIALabel() { return "" + this.AUDC + "/" + this.AUDF; }

    getTIAFrequencyRounded(precision = null) {
        if (precision === null)
            return Music.Round(this.#frequency, super.Music.FrequencyPrecision);

        return Music.Round(this.#frequency, parseInt(precision));
    }

	getCentsRounded(precision = null) {
        if (precision === null)
            return Music.Round(this.#cents, super.Music.FrequencyPrecision);

        return Music.Round(this.#cents, parseInt(precision));
	}

    clone() {
		let args = { mode: this.#mode, audc: this.AUDC, audf: this.AUDF };
        return new TIANote(super.Music, args);
    }

    computeFrequency(audc, audf) {
        if (audc < 0 || audc >= 16 || audf < 0 || audf >= 32)
            return 0.0;

        return this.#mode.AudioFrequency / Divisors[audc] / (audf+1);
    }
}

export class TIAScale extends MusicScale {
	#mode = ModeMap.ntsc;
	#audc = 0;

    constructor(music, args) {
        super(music);
		this.#audc = args.audc;
		if (args.mode != '')
			this.setModeByString(args.mode);
    }

	get VideoMode() { return this.#mode };
	get AUDC() { return this.#audc }

    setModeByString(str) {
        if (typeof ModeMap[str] != 'undefined')
            this.#mode = ModeMap[str];
	}

    getNoteList() {
        let ary = [];
        for (let audf = 31; audf >= 0; audf--) {
			let args = { 'mode': this.#mode, 'audc': this.AUDC, 'audf': audf };
            let note = new TIANote(super.Music, args);
            ary.push(note);
        }
        return ary;
    }
}
